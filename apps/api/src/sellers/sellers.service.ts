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
