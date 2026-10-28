import { amount, minor } from "../commerce/rules";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, Role, SellerStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async register(userId: string, shopName: string, city: string) {
    const existing = await this.prisma.seller.findUnique({ where: { userId } });
    if (existing)
      throw new BadRequestException("Ce compte est déjà un vendeur");

    return this.prisma.$transaction(async (tx) => {
      const seller = await tx.seller.create({
        data: { userId, shopName, city, status: SellerStatus.PENDING },
      });
      await tx.user.update({
        where: { id: userId },
        data: { role: Role.SELLER },
      });
      return seller;
    });
  }

  async getAdminDetail(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: { select: { id: true, phone: true, country: true, language: true, createdAt: true } },
      },
    });
    if (!seller) throw new NotFoundException("Commerçant introuvable");

    // 1. Annonces (Adds)
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    const productIds = products.map((p) => p.id);

    // 2. Renseignements (Demandes d'informations / Leads clients)
    const inquiries = await this.prisma.conversation.findMany({
      where: {
        productId: { in: productIds },
      },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        tradeOrders: { select: { id: true, reference: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 3. Commandes & Ventes liées aux produits de ce vendeur
    const allTradeOrders = await this.prisma.tradeOrder.findMany({
      include: {
        customer: true,
        quotes: { orderBy: { revision: "desc" } },
        entries: true,
        conversation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const relatedOrders = allTradeOrders.filter((o) => {
      if (o.conversation?.productId && productIds.includes(o.conversation.productId)) {
        return true;
      }
      const hasLine = o.quotes.some((q) => {
        const lines = (q.lines as any[]) || [];
        return lines.some(
          (l) => productIds.includes(l.productId) || l.supplierId === seller.id,
        );
      });
      if (hasLine) return true;
      return o.entries.some((e) => e.supplierId === seller.id);
    });

    // Pipeline split:
    // Commandes: Devis en préparation (DRAFT, QUOTED)
    const commandList = relatedOrders.filter(
      (o) =>
        o.status === "DRAFT" ||
        o.status === "QUOTED" ||
        (!o.acceptedRevision && o.status !== "CANCELLED"),
    );

    // Ventes: Commandes confirmées
    const salesList = relatedOrders.filter(
      (o) =>
        o.acceptedRevision !== null ||
        [
          "CONFIRMED",
          "PREPARING",
          "HANDED_TO_CARRIER",
          "IN_TRANSIT",
          "ARRIVED",
          "CUSTOMS",
          "LOCAL_DELIVERY",
          "DELIVERED",
        ].includes(o.status),
    );

    // Calculs financiers intelligents
    let totalSalesVolume = 0;
    let totalSupplierRevenue = 0;
    let totalPaidToSeller = 0;

    for (const o of salesList) {
      const q =
        o.quotes.find((q) => q.revision === o.acceptedRevision) || o.quotes[0];
      if (q) {
        const lines = ((q.lines as any[]) || []).filter(
          (l) => productIds.includes(l.productId) || l.supplierId === seller.id,
        );
        for (const l of lines) {
          totalSalesVolume += minor(l.unitPrice) * l.quantity;
          totalSupplierRevenue += minor(l.supplierUnitPrice || l.unitPrice) * l.quantity;
        }
      }
      const payments = o.entries.filter(
        (e) =>
          e.supplierId === seller.id &&
          e.kind === "SUPPLIER_PAYMENT" &&
          e.state === "CONFIRMED",
      );
      for (const p of payments) {
        totalPaidToSeller += minor(p.amount);
      }
    }

    const dueToSeller = Math.max(0, totalSupplierRevenue - totalPaidToSeller);
    const totalWestzoneCommission = Math.max(0, totalSalesVolume - totalSupplierRevenue);

    // Taux de conversion intelligents
    const totalInquiries = inquiries.length;
    const totalCommands = commandList.length + salesList.length;
    const totalSales = salesList.length;

    const conversionInquiryToCommand =
      totalInquiries > 0 ? Math.round((totalCommands / totalInquiries) * 100) : 0;
    const conversionCommandToSale =
      totalCommands > 0 ? Math.round((totalSales / totalCommands) * 100) : 0;

    return {
      seller,
      metrics: {
        totalProducts: products.length,
        publishedProducts: products.filter((p) => p.moderation === "PUBLISHED").length,
        pendingProducts: products.filter((p) => p.moderation === "PENDING").length,
        totalInquiries,
        totalCommands,
        totalSales,
        conversionInquiryToCommand,
        conversionCommandToSale,
        totalSalesVolume: amount(totalSalesVolume),
        totalSupplierRevenue: amount(totalSupplierRevenue),
        totalWestzoneCommission: amount(totalWestzoneCommission),
        totalPaidToSeller: amount(totalPaidToSeller),
        dueToSeller: amount(dueToSeller),
      },
      products,
      inquiries,
      commandes: commandList,
      ventes: salesList,
    };
  }

  listAll(status?: SellerStatus) {
    return this.prisma.seller.findMany({
      where: status ? { status } : undefined,
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async setStatus(sellerId: string, status: SellerStatus) {
    if (!Object.values(SellerStatus).includes(status))
      throw new BadRequestException("Statut invalide");
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
    });
    if (!seller) throw new NotFoundException("Vendeur introuvable");
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: { status },
    });
  }

  async dashboard(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException("Profil vendeur introuvable");

    const products = await this.prisma.product.findMany({
      where: { sellerId: seller.id },
    });
    const orders = await this.prisma.tradeOrder.findMany({
      where: { acceptedRevision: { not: null } },
      include: { quotes: true, entries: true },
    });
    const settlements = orders.flatMap((o) => {
      const q = o.quotes.find((q) => q.revision === o.acceptedRevision);
      const lines = ((q?.lines as any[]) || []).filter(
        (l) => l.supplierId === seller.id,
      );
      if (!lines.length) return [];
      const total = lines.reduce(
        (n, l) => n + minor(l.supplierUnitPrice) * l.quantity,
        0,
      );
      const payments = o.entries.filter(
        (e) =>
          e.supplierId === seller.id &&
          e.kind === "SUPPLIER_PAYMENT" &&
          e.state === "CONFIRMED",
      );
      const paid = payments.reduce((n, e) => n + minor(e.amount), 0);
      return [
        {
          reference: o.reference,
          status: o.status,
          lines: lines.map((l) => ({
            name: l.name,
            quantity: l.quantity,
            unitPrice: l.supplierUnitPrice,
          })),
          total: amount(total),
          paid: amount(paid),
          due: amount(o.status === "CANCELLED" ? 0 : Math.max(0, total - paid)),
          payments: payments.map((e) => ({
            amount: e.amount,
            reference: e.reference,
            createdAt: e.createdAt,
          })),
        },
      ];
    });
    return {
      seller,
      activeProducts: products.filter((p) => p.moderation === "PUBLISHED")
        .length,
      pendingListings: products.filter((p) => p.moderation === "PENDING")
        .length,
      paid: amount(settlements.reduce((n, o) => n + minor(o.paid), 0)),
      due: amount(settlements.reduce((n, o) => n + minor(o.due), 0)),
      settlements,
    };
  }

  async follow(buyerId: string, sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
    });
    if (!seller) throw new NotFoundException("Vendeur introuvable");

    return this.prisma.follow.upsert({
      where: { buyerId_sellerId: { buyerId, sellerId } },
      update: {},
      create: { buyerId, sellerId },
    });
  }

  async unfollow(buyerId: string, sellerId: string) {
    await this.prisma.follow.deleteMany({ where: { buyerId, sellerId } });
  }

  listFollowing(buyerId: string) {
    return this.prisma.follow.findMany({
      where: { buyerId },
      include: { seller: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
