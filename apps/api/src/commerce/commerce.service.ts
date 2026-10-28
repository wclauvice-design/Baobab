import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { createHash, randomBytes, randomUUID } from "crypto";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  AcceptQuoteDto,
  CreateTradeDto,
  CustomerDto,
  EntryDto,
  MessageDto,
  QuoteDto,
  StartConversationDto,
  StatusDto,
} from "./dto";
import {
  amount,
  financials,
  minor,
  phone,
  quantity,
  STAGES,
  STAGE_NAMES,
  UNIVERSES,
} from "./rules";
import { buildRuntimeTaxonomy } from "../catalog/taxonomy";
import { ListingVariant, variantLabel } from "@baobab/shared";

const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const secret = () => randomBytes(32).toString("base64url");
const include = {
  customer: true,
  quotes: { orderBy: { revision: "desc" as const } },
  entries: { orderBy: { createdAt: "asc" as const } },
  events: { orderBy: { createdAt: "asc" as const } },
  notices: { orderBy: { createdAt: "desc" as const } },
};

@Injectable()
export class CommerceService {
  constructor(
    private db: PrismaService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}
  async configPublic() {
    const [setting, categories] = await Promise.all([
      this.db.businessSetting.findUnique({ where: { key: "whatsapp" } }),
      this.db.category.findMany({
        select: { id: true, name: true, slug: true, universe: true },
        orderBy: [{ universe: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      }),
    ]);
    return {
      universes: UNIVERSES,
      taxonomy: buildRuntimeTaxonomy(categories),
      stages: STAGE_NAMES,
      whatsapp: setting?.value || this.config.get("BAOBAB_WHATSAPP") || null,
    };
  }
  async settings() {
    return {
      ...(await this.configPublic()),
      emailConfigured:
        !!this.config.get("RESEND_API_KEY") &&
        !!this.config.get("NOTIFICATION_FROM"),
    };
  }
  async updateSettings(whatsapp: string, actor: string) {
    await this.db.businessSetting.upsert({
      where: { key: "whatsapp" },
      create: { key: "whatsapp", value: phone(whatsapp), updatedBy: actor },
      update: { value: phone(whatsapp), updatedBy: actor },
    });
    return this.settings();
  }
  private site() {
    return (
      this.config.get<string>("PUBLIC_APP_URL") ||
      "https://baobab-kohl.vercel.app"
    ).replace(/\/$/, "");
  }
  private async order(tx: any, id: string) {
    await tx.$queryRaw`SELECT id FROM "TradeOrder" WHERE id = ${id} FOR UPDATE`;
    const result = await tx.tradeOrder.findUnique({ where: { id }, include });
    if (!result) throw new NotFoundException("Commande introuvable");
    return result;
  }
  private async tokenOrder(id: string, token: string) {
    if (!token || token.length < 40)
      throw new NotFoundException("Lien invalide ou révoqué");
    const result = await this.db.tradeOrder.findFirst({
      where: { id, trackingHash: hash(token) },
      include,
    });
    if (!result) throw new NotFoundException("Lien invalide ou révoqué");
    return result;
  }
  private async conversation(id: string, token: string) {
    if (!token || token.length < 40)
      throw new NotFoundException("Conversation inaccessible");
    const c = await this.db.conversation.findFirst({
      where: { id, tokenHash: hash(token) },
    });
    if (!c) throw new NotFoundException("Conversation inaccessible");
    return c;
  }
  async startConversation(dto: StartConversationDto, existingToken?: string) {
    // If device already has an existing active conversation, append message to avoid duplicate conversations
    if (existingToken && dto.conversationId) {
      try {
        const existing = await this.conversation(dto.conversationId, existingToken);
        if (existing && existing.state !== "CLOSED") {
          await this.message(
            existing.id,
            { body: dto.body, requestKey: dto.requestKey },
            "CLIENT",
            existingToken,
          );
          return { id: existing.id, token: existingToken, subject: existing.subject };
        }
      } catch {
        // Fall back to creating a new conversation
      }
    }
    const product = dto.productId
      ? await this.db.product.findFirst({
          where: {
            id: dto.productId,
            moderation: "PUBLISHED",
            OR: [{ sellerId: null }, { seller: { status: "APPROVED" } }],
          },
        })
      : null;
    if (dto.productId && !product)
      throw new NotFoundException("Annonce indisponible");
    const createdToken = secret();
    const c = await this.db.conversation.create({
      data: {
        tokenHash: hash(createdToken),
        productId: product?.id,
        subject: product?.name || "Demande à Baobab",
        messages: {
          create: {
            role: "CLIENT",
            body: dto.body.trim(),
            requestKey: dto.requestKey,
          },
        },
      },
    });
    try {
      const admins = await this.db.user.findMany({
        where: { role: Role.ADMIN },
        select: { id: true, phone: true },
      });
      for (const admin of admins) {
        await this.notifications.notifyUser(
          admin.id,
          admin.phone,
          `[Baobab Concierge] Nouvelle demande de devis : "${dto.body.slice(0, 100)}..."`,
        );
      }
    } catch {
      // Non-blocking notification dispatch
    }
    return { id: c.id, token: createdToken, subject: c.subject };
  }
  async readConversation(id: string, token: string) {
    const c = await this.conversation(id, token || "");
    return {
      id: c.id,
      subject: c.subject,
      state: c.state,
      messages: await this.db.chatMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
        take: 500,
      }),
    };
  }
  async message(id: string, dto: MessageDto, role: string, token?: string) {
    if (role === "CLIENT") await this.conversation(id, token || "");
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Conversation" WHERE id = ${id} FOR UPDATE`;
      const c = await tx.conversation.findUnique({ where: { id } });
      if (!c) throw new NotFoundException("Conversation introuvable");
      if (c.state === "CLOSED")
        throw new BadRequestException("Cette conversation est clôturée");
      const existing = await tx.chatMessage.findUnique({
        where: {
          conversationId_requestKey: {
            conversationId: id,
            requestKey: dto.requestKey,
          },
        },
      });
      if (existing) {
        if (existing.body !== dto.body.trim() || existing.role !== role)
          throw new ConflictException("Référence de message déjà utilisée");
        return existing;
      }
      const m = await tx.chatMessage.upsert({
        where: {
          conversationId_requestKey: {
            conversationId: id,
            requestKey: dto.requestKey,
          },
        },
        create: {
          conversationId: id,
          role,
          body: dto.body.trim(),
          requestKey: dto.requestKey,
        },
        update: {},
      });
      if (m.body !== dto.body.trim() || m.role !== role)
        throw new ConflictException("Référence de message déjà utilisée");
      await tx.conversation.update({
        where: { id },
        data: { needsReply: role === "CLIENT" },
      });
      try {
        if (role === "CLIENT") {
          const admins = await tx.user.findMany({
            where: { role: Role.ADMIN },
            select: { id: true, phone: true },
          });
          for (const admin of admins) {
            await this.notifications.notifyUser(
              admin.id,
              admin.phone,
              `[Baobab Message] Nouveau message d'un client : "${dto.body.slice(0, 100)}..."`,
            );
          }
        } else if (role === "BAOBAB" && c.customerId) {
          const cust = await tx.customer.findUnique({
            where: { id: c.customerId },
          });
          if (cust && cust.phone) {
            await this.notifications.notifyUser(
              cust.userId || cust.id,
              cust.phone,
              `[Baobab Dubaï] L'équipe vous a répondu : "${dto.body.slice(0, 100)}..."`,
            );
          }
        }
      } catch {
        // Non-blocking notification dispatch
      }
      return m;
    });
  }
  conversations() {
    return this.db.conversation.findMany({
      include: {
        customer: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ needsReply: "desc" }, { updatedAt: "desc" }],
      take: 200,
    });
  }
  async adminConversation(id: string) {
    const c = await this.db.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: "asc" }, take: 500 },
        tradeOrders: { select: { id: true, reference: true, status: true } },
      },
    });
    if (!c) throw new NotFoundException();
    const { tokenHash, ...safe } = c;
    return safe;
  }
  customers(search?: string) {
    return this.db.customer.findMany({
      where: search
        ? {
            OR: ["firstName", "lastName", "phone", "email"].map((key) => ({
              [key]: { contains: search, mode: "insensitive" },
            })),
          }
        : {},
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
  }
  async createCustomer(dto: CustomerDto) {
    const normalized = phone(dto.phone);
    const existing = await this.db.customer.findUnique({
      where: { phone: normalized },
    });
    if (existing)
      throw new ConflictException(
        "Ce téléphone possède déjà une fiche client. Sélectionnez-la pour le rattachement.",
      );
    return this.db.customer.create({
      data: {
        ...dto,
        phone: normalized,
        whatsapp: dto.whatsapp ? phone(dto.whatsapp) : null,
        email: dto.email?.toLowerCase() || null,
      },
    });
  }
  async link(id: string, customerId: string) {
    if (!(await this.db.customer.findUnique({ where: { id: customerId } })))
      throw new NotFoundException("Client introuvable");
    // Rattachement administratif de la conversation uniquement : aucun accès compte n'est accordé.
    const c = await this.db.conversation.update({
      where: { id },
      data: { customerId },
    });
    return { id: c.id, customerId: c.customerId };
  }
  async mine(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user?.verifiedPhoneAt)
      return { verificationRequired: true, orders: [] };
    const customer = await this.db.customer.findUnique({
      where: { phone: phone(user.phone) },
    });
    if (!customer) return { verificationRequired: false, orders: [] };
    if (customer.userId && customer.userId !== userId)
      throw new ForbiddenException("Fiche déjà rattachée à un autre compte");
    await this.db.customer.update({
      where: { id: customer.id },
      data: { userId },
    });
    const orders = await this.db.tradeOrder.findMany({
      where: { customerId: customer.id },
      include,
      orderBy: { createdAt: "desc" },
    });
    return {
      verificationRequired: false,
      orders: orders.map((o) => this.publicOrder(o)),
    };
  }
  async mineOne(userId: string, id: string) {
    const result = await this.mine(userId);
    const order = result.orders.find((o) => o.id === id);
    if (!order)
      throw new NotFoundException(
        "Commande inaccessible. Utilisez votre lien privé ou vérifiez votre téléphone.",
      );
    return order;
  }
  private publicOrder(o: any) {
    const q = o.quotes.find((q: any) => q.revision === o.currentRevision);
    const f = financials(o);
    return {
      id: o.id,
      reference: o.reference,
      status: o.status,
      firstName: o.customer.firstName,
      currentRevision: o.currentRevision,
      acceptedRevision: o.acceptedRevision,
      acceptedAt: o.acceptedAt,
      quote: q
        ? {
            revision: q.revision,
            lines: q.lines.map(
              ({
                supplierId,
                supplierUnitPrice,
                minimumException,
                ...line
              }: any) => line,
            ),
            productTotal: q.productTotal,
            logisticsCharge: q.logisticsCharge,
            discount: q.discount,
            total: q.total,
            terms: q.terms,
            destination: q.destination,
            paymentMode: q.paymentMode,
            dueDate: q.dueDate,
            estimatedDelivery: q.estimatedDelivery,
            expiresAt: q.expiresAt,
          }
        : null,
      finance: {
        total: f.total,
        paid: f.paid,
        due: f.due,
        refundDue: f.refundDue,
        pendingPayments: f.pendingPayments,
      },
      events: o.events.map(({ status, message, createdAt }: any) => ({
        status,
        message,
        createdAt,
      })),
      payments: o.entries
        .filter((e: any) =>
          ["CLIENT_PAYMENT", "COD_COLLECTION", "CUSTOMER_REFUND"].includes(
            e.kind,
          ),
        )
        .map(({ id, kind, amount, state, createdAt, confirmedAt }: any) => ({
          id,
          kind,
          amount,
          state,
          createdAt,
          confirmedAt,
        })),
    };
  }
  async track(id: string, token: string) {
    return this.publicOrder(await this.tokenOrder(id, token));
  }
  async all() {
    const orders = await this.db.tradeOrder.findMany({
      include,
      orderBy: { updatedAt: "desc" },
    });
    return orders.map(({ trackingHash, ...o }) => ({
      ...o,
      finance: financials(o),
    }));
  }
  async one(id: string) {
    const o = await this.db.tradeOrder.findUnique({ where: { id }, include });
    if (!o) throw new NotFoundException();
    const { trackingHash, ...safe } = o;
    return { ...safe, finance: financials(o) };
  }
  async create(dto: CreateTradeDto, actor: string) {
    const token = secret();
    const result = await this.db.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) throw new NotFoundException("Client introuvable");
      if (dto.conversationId) {
        const c = await tx.conversation.findUnique({
          where: { id: dto.conversationId },
        });
        if (c && !c.customerId) {
          await tx.conversation.update({
            where: { id: c.id },
            data: { customerId: customer.id },
          });
        } else if (!c || c.customerId !== customer.id) {
          throw new BadRequestException(
            "Rattachez d’abord la conversation à ce client",
          );
        }
      }
      const o = await tx.tradeOrder.create({
        data: {
          customerId: customer.id,
          conversationId: dto.conversationId,
          trackingHash: hash(token),
          reference: `BA-${randomBytes(5).toString("hex").toUpperCase()}`,
          events: {
            create: {
              status: "DRAFT",
              message: "Votre demande est prise en charge par Baobab.",
              createdBy: actor,
            },
          },
        },
        include,
      });
      await this.notify(
        tx,
        o,
        `Votre suivi privé : ${this.site()}/tracking/${o.id}#${token}`,
      );
      return o;
    });
    return {
      id: result.id,
      reference: result.reference,
      trackingUrl: `${this.site()}/tracking/${result.id}#${token}`,
    };
  }
  async rotate(id: string, actor: string) {
    const token = secret();
    await this.db.$transaction(async (tx) => {
      const o = await this.order(tx, id);
      await tx.tradeOrder.update({
        where: { id },
        data: { trackingHash: hash(token) },
      });
      await tx.tradeEvent.create({
        data: {
          orderId: id,
          status: o.status,
          message:
            "Un nouveau lien privé de suivi a été créé. Le précédent est révoqué.",
          createdBy: actor,
        },
      });
      await this.notify(
        tx,
        o,
        `Nouveau lien de suivi : ${this.site()}/tracking/${id}#${token}`,
      );
    });
    return { trackingUrl: `${this.site()}/tracking/${id}#${token}` };
  }
  async quote(id: string, dto: QuoteDto, actor: string) {
    return this.db.$transaction(async (tx) => {
      const o = await this.order(tx, id);
      if (!["DRAFT", "QUOTED", "CONFIRMED"].includes(o.status))
        throw new BadRequestException(
          "Le devis ne peut plus être modifié à cette étape",
        );
      if (o.currentRevision !== dto.expectedRevision)
        throw new ConflictException(
          "Le devis a changé. Actualisez la commande.",
        );
      if (
        new Set(dto.lines.map((l) => `${l.productId}::${l.variantId || ""}`))
          .size !== dto.lines.length
      )
        throw new BadRequestException(
          "Un article et sa variante ne peuvent apparaître qu’une fois",
        );
      const products = await tx.product.findMany({
        where: { id: { in: dto.lines.map((l) => l.productId) } },
        include: { seller: true },
      });
      let productTotal = 0,
        supplierTotal = 0;
      const lines = dto.lines.map((l) => {
        const p = products.find((p) => p.id === l.productId);
        if (
          !p ||
          p.moderation !== "PUBLISHED" ||
          (p.seller && p.seller.status !== "APPROVED")
        )
          throw new BadRequestException(
            "Annonce non publiée ou fournisseur non approuvé",
          );
        const variants = this.variantList(p);
        const activeVariants = variants.filter((variant) => variant.active);
        let variant: ListingVariant | undefined;
        if (activeVariants.length) {
          if (!l.variantId)
            throw new BadRequestException(
              `Choisissez une variante pour « ${p.name} »`,
            );
          variant = activeVariants.find(
            (candidate) => candidate.id === l.variantId,
          );
          if (!variant)
            throw new BadRequestException(
              `Variante indisponible pour « ${p.name} »`,
            );
        } else if (l.variantId) {
          throw new BadRequestException(
            `« ${p.name} » ne possède pas de variante`,
          );
        }
        const qty = quantity(
          l.quantity,
          l.minimumException?.trim() ? 1 : p.minimumOrder,
          p.packSize,
        );
        const unitPrice = minor(l.unitPrice),
          supplierPrice = minor(
            variant
              ? variant.supplierPrice ?? variant.price
              : p.supplierPrice ?? p.price,
          );
        if (unitPrice < supplierPrice)
          throw new BadRequestException(
            "Le prix ne peut pas réduire le montant promis au fournisseur",
          );
        productTotal += unitPrice * qty;
        supplierTotal += supplierPrice * qty;
        return {
          productId: p.id,
          variantId: variant?.id ?? null,
          variantLabel: variant ? variantLabel(variant) : null,
          variantSku: variant?.sku ?? null,
          name: p.name,
          quantity: qty,
          unit: p.unit,
          minimumOrder: p.minimumOrder,
          packSize: p.packSize,
          minimumException: l.minimumException || null,
          unitPrice: amount(unitPrice),
          supplierUnitPrice: amount(supplierPrice),
          supplierId: p.sellerId,
          lineTotal: amount(unitPrice * qty),
        };
      });
      const logistics = minor(dto.logisticsCharge),
        estimate = minor(dto.logisticsEstimate),
        discount = minor(dto.discount);
      const total = productTotal + logistics - discount;
      if (
        total < 0 ||
        total > 999999999999 ||
        discount > productTotal - supplierTotal
      )
        throw new BadRequestException(
          "Remise excessive : le montant fournisseur doit être préservé",
        );
      if (total < minor(financials(o).paid))
        throw new BadRequestException(
          "Le devis ne peut être inférieur aux encaissements nets",
        );
      const expiresAt = new Date(dto.expiresAt),
        dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
      if (
        !Number.isFinite(+expiresAt) ||
        expiresAt <= new Date() ||
        (dueDate && !Number.isFinite(+dueDate))
      )
        throw new BadRequestException("Dates du devis invalides");
      const revision = o.currentRevision + 1;
      await tx.tradeQuote.create({
        data: {
          orderId: id,
          revision,
          lines,
          productTotal: amount(productTotal),
          supplierTotal: amount(supplierTotal),
          logisticsCharge: amount(logistics),
          logisticsEstimate: amount(estimate),
          discount: amount(discount),
          total: amount(total),
          terms: dto.terms,
          destination: dto.destination,
          paymentMode: dto.paymentMode,
          dueDate,
          estimatedDelivery: dto.estimatedDelivery,
          expiresAt,
          createdBy: actor,
        },
      });
      await tx.tradeOrder.update({
        where: { id },
        data: { currentRevision: revision, status: "QUOTED" },
      });
      await tx.tradeEvent.create({
        data: {
          orderId: id,
          status: "QUOTED",
          message: `Devis n°${revision} disponible : ${amount(total)} FCFA. Votre confirmation est requise.`,
          createdBy: actor,
        },
      });
      await this.notify(
        tx,
        o,
        `Devis n°${revision} : ${amount(total)} FCFA. Consultez votre lien privé pour vérifier les frais et confirmer.`,
      );
      return { revision, total: amount(total) };
    });
  }
  async accept(id: string, token: string, dto: AcceptQuoteDto) {
    await this.tokenOrder(id, token);
    return this.db.$transaction(async (tx) => {
      const o = await this.order(tx, id);
      if (o.trackingHash !== hash(token))
        throw new NotFoundException("Lien révoqué");
      if (o.status === "CONFIRMED" && o.acceptedRevision === dto.revision)
        return { accepted: true };
      const q = o.quotes.find((q) => q.revision === dto.revision);
      if (
        o.status !== "QUOTED" ||
        dto.revision !== o.currentRevision ||
        !q ||
        q.expiresAt <= new Date()
      )
        throw new ConflictException("Ce devis a expiré ou a été remplacé");
      const previous =
        (o.quotes.find((q) => q.revision === o.acceptedRevision)
          ?.lines as any[]) || [];
      const lines = q.lines as any[];
      await this.applyQuoteStock(tx, lines, previous);
      await tx.tradeOrder.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          acceptedRevision: q.revision,
          acceptedAt: new Date(),
        },
      });
      await tx.tradeEvent.create({
        data: {
          orderId: id,
          status: "CONFIRMED",
          message: `Devis n°${q.revision} accepté par le client. Total : ${q.total} FCFA.`,
          createdBy: "CLIENT",
        },
      });
      await this.notify(
        tx,
        o,
        `Votre commande ${o.reference} est confirmée. Total convenu : ${q.total} FCFA.`,
      );
      return { accepted: true };
    });
  }
  async status(id: string, dto: StatusDto, actor: string) {
    await this.db.$transaction(async (tx) => {
      const o = await this.order(tx, id);
      if (o.status === dto.status) return;
      if (["CANCELLED", "DELIVERED"].includes(o.status))
        throw new BadRequestException("Commande clôturée");
      if (
        dto.status !== "CANCELLED" &&
        (!o.acceptedAt ||
          o.status === "QUOTED" ||
          STAGES.indexOf(dto.status) !== STAGES.indexOf(o.status) + 1)
      )
        throw new BadRequestException(
          "Étape suivante attendue après acceptation du devis",
        );
      if (dto.status === "CANCELLED" && o.acceptedRevision) {
        if (!["CONFIRMED", "QUOTED", "PREPARING"].includes(o.status))
          throw new BadRequestException(
            "Un retour logistique doit être traité avant annulation après expédition",
          );
        const q = o.quotes.find((q) => q.revision === o.acceptedRevision);
        await this.applyQuoteStock(tx, [], (q.lines as any[]) || []);
      }
      await tx.tradeOrder.update({
        where: { id },
        data: { status: dto.status },
      });
      await tx.tradeEvent.create({
        data: {
          orderId: id,
          status: dto.status,
          message: dto.message,
          createdBy: actor,
        },
      });
      await this.notify(tx, o, `${STAGE_NAMES[dto.status]} : ${dto.message}`);
    });
    return this.one(id);
  }
  /** Copie sûre des variantes stockées en JSON. */
  private variantList(product: any): ListingVariant[] {
    const raw = Array.isArray(product?.variants) ? product.variants : [];
    return raw.map((variant: any) => ({
      ...variant,
      values: variant?.values || {},
      images: Array.isArray(variant?.images) ? variant.images : [],
      active: Boolean(variant?.active),
    }));
  }

  /**
   * Réserve (ou restitue) le stock des lignes d'un devis.
   * `next` correspond à la nouvelle version, `previous` à la version déjà
   * acceptée. Le verrou optimiste protège contre les modifications
   * concurrentes de stock.
   */
  private async applyQuoteStock(
    tx: any,
    next: any[],
    previous: any[],
  ) {
    const keyOf = (line: any) =>
      `${line.productId}::${line.variantId || ""}`;
    const keys = [
      ...new Set([...next, ...previous].map((line) => keyOf(line))),
    ];

    for (const key of keys) {
      const [productId, variantId = ""] = key.split("::");
      const sum = (lines: any[]) =>
        lines
          .filter((line) => keyOf(line) === key)
          .reduce((total, line) => total + Number(line.quantity || 0), 0);
      const delta = sum(next) - sum(previous);
      if (!delta) continue;

      const product = await tx.product.findUnique({
        where: { id: productId },
      });
      if (!product) throw new NotFoundException("Produit introuvable");
      const variants = this.variantList(product);
      const hasActiveVariants = variants.some((variant) => variant.active);

      if (delta > 0) {
        if (!variantId && hasActiveVariants) {
          throw new ConflictException(
            `Choisissez une variante pour « ${product.name} »`,
          );
        }
        const variant = variantId
          ? variants.find(
              (candidate) => candidate.id === variantId && candidate.active,
            )
          : undefined;
        if (variantId && !variant) {
          throw new ConflictException(
            `Variante indisponible pour « ${product.name} »`,
          );
        }
        if (Number(product.stock) < delta) {
          throw new ConflictException(
            `Stock insuffisant pour « ${product.name} »`,
          );
        }
        if (variant) {
          if (variant.stock < delta) {
            throw new ConflictException(
              `Stock insuffisant pour « ${product.name} » (${variantLabel(variant)})`,
            );
          }
          variant.stock -= delta;
        }
        const reserved = await tx.product.updateMany({
          where: {
            id: productId,
            catalogVersion: product.catalogVersion,
            moderation: "PUBLISHED",
            stock: { gte: delta },
          },
          data: {
            stock: { decrement: delta },
            ...(variant ? { variants: variants as any } : {}),
            catalogVersion: { increment: 1 },
          },
        });
        if (!reserved.count) {
          throw new ConflictException(
            "Stock indisponible : contactez Baobab pour actualiser le devis",
          );
        }
      } else {
        const quantityToRelease = -delta;
        const variant = variantId
          ? variants.find((candidate) => candidate.id === variantId)
          : undefined;
        if (variant) variant.stock += quantityToRelease;
        const released = await tx.product.updateMany({
          where: {
            id: productId,
            catalogVersion: product.catalogVersion,
          },
          data: {
            stock: { increment: quantityToRelease },
            ...(variant ? { variants: variants as any } : {}),
            catalogVersion: { increment: 1 },
          },
        });
        if (!released.count) {
          throw new ConflictException(
            "Stock modifié entre-temps. Actualisez le devis.",
          );
        }
      }
    }
  }

  private validateEntry(o: any, dto: EntryDto) {
    const value = minor(dto.amount),
      f = financials(o);
    if (!value || !o.acceptedRevision)
      throw new BadRequestException("Montant positif et devis accepté requis");
    if (
      ["CLIENT_PAYMENT", "COD_COLLECTION"].includes(dto.kind) &&
      (o.status === "QUOTED" ||
        o.status === "CANCELLED" ||
        value > minor(f.due))
    )
      throw new BadRequestException(
        "Encaissement supérieur au solde ou commande non payable",
      );
    if (dto.kind === "COURIER_REMITTANCE" && value > minor(f.courierDue))
      throw new BadRequestException(
        "Reversement supérieur aux fonds détenus par le livreur",
      );
    if (
      dto.kind === "CUSTOMER_REFUND" &&
      (value > minor(f.paid) ||
        value > minor(f.cashReceived) - minor(f.refunded))
    )
      throw new BadRequestException(
        "Remboursement supérieur aux fonds clients reçus par Baobab",
      );
    if (dto.kind === "SUPPLIER_PAYMENT") {
      const q = o.quotes.find((q: any) => q.revision === o.acceptedRevision);
      const owed = q.lines
        .filter(
          (l: any) =>
            (l.supplierId || "BAOBAB") === (dto.supplierId || "BAOBAB"),
        )
        .reduce(
          (s: number, l: any) => s + minor(l.supplierUnitPrice) * l.quantity,
          0,
        );
      const paid = o.entries
        .filter(
          (e: any) =>
            e.kind === dto.kind &&
            e.state === "CONFIRMED" &&
            (e.supplierId || "BAOBAB") === (dto.supplierId || "BAOBAB"),
        )
        .reduce((s: number, e: any) => s + minor(e.amount), 0);
      if (o.status === "CANCELLED" || value > owed - paid)
        throw new BadRequestException(
          "Règlement supérieur au montant dû à ce fournisseur",
        );
    }
    if (dto.kind === "LOGISTICS_COST" && o.logisticsFinalized)
      throw new BadRequestException("Les coûts logistiques sont clôturés");
  }
  async entry(id: string, dto: EntryDto, actor: string, token?: string) {
    await this.db.$transaction(async (tx) => {
      const o = await this.order(tx, id);
      if (token && o.trackingHash !== hash(token))
        throw new NotFoundException("Lien révoqué");
      const previous = o.entries.find((e) => e.requestKey === dto.requestKey);
      if (previous) {
        if (
          previous.kind !== dto.kind ||
          minor(previous.amount) !== minor(dto.amount) ||
          previous.reference !== dto.reference ||
          (previous.supplierId || "") !== (dto.supplierId || "")
        )
          throw new ConflictException(
            "Référence déjà utilisée pour une autre opération",
          );
        return;
      }
      if (
        dto.pending &&
        !["CLIENT_PAYMENT", "COD_COLLECTION"].includes(dto.kind)
      )
        throw new BadRequestException(
          "Seuls les encaissements peuvent être déclarés en attente",
        );
      this.validateEntry(o, dto);
      await tx.tradeEntry.create({
        data: {
          orderId: id,
          kind: dto.kind,
          amount: amount(minor(dto.amount)),
          reference: dto.reference,
          note: dto.note,
          supplierId: dto.supplierId,
          requestKey: dto.requestKey,
          state: dto.pending ? "PENDING" : "CONFIRMED",
          createdBy: actor,
          confirmedBy: dto.pending ? null : actor,
          confirmedAt: dto.pending ? null : new Date(),
        },
      });
      await tx.tradeEvent.create({
        data: {
          orderId: id,
          status: o.status,
          message: [
            "CLIENT_PAYMENT",
            "COD_COLLECTION",
            "CUSTOMER_REFUND",
          ].includes(dto.kind)
            ? `${dto.kind === "CUSTOMER_REFUND" ? "Remboursement" : "Paiement"} de ${dto.amount} FCFA ${dto.pending ? "déclaré, en vérification" : "confirmé"}.`
            : "Suivi administratif actualisé.",
          createdBy: actor,
        },
      });
      if (
        !dto.pending &&
        ["CLIENT_PAYMENT", "COD_COLLECTION", "CUSTOMER_REFUND"].includes(
          dto.kind,
        )
      ) {
        const fresh = await tx.tradeOrder.findUnique({
          where: { id },
          include,
        });
        await this.notify(
          tx,
          fresh,
          `Paiement actualisé. Montant payé : ${financials(fresh).paid} FCFA. Reste à payer : ${financials(fresh).due} FCFA.`,
        );
      }
    });
    return this.one(id);
  }
  async confirmEntry(
    id: string,
    entryId: string,
    accepted: boolean,
    actor: string,
  ) {
    await this.db.$transaction(async (tx) => {
      const o = await this.order(tx, id),
        e = o.entries.find((e) => e.id === entryId);
      if (!e) throw new NotFoundException();
      if (e.state !== "PENDING") {
        if (e.state === (accepted ? "CONFIRMED" : "REJECTED")) return;
        throw new ConflictException("Écriture déjà traitée");
      }
      if (accepted) this.validateEntry(o, { ...e, amount: String(e.amount) });
      await tx.tradeEntry.update({
        where: { id: entryId },
        data: {
          state: accepted ? "CONFIRMED" : "REJECTED",
          confirmedBy: actor,
          confirmedAt: new Date(),
        },
      });
      const fresh = await tx.tradeOrder.findUnique({ where: { id }, include });
      const body = accepted
        ? `Paiement de ${e.amount} FCFA confirmé. Reste à payer : ${financials(fresh).due} FCFA.`
        : `Votre déclaration de paiement n’a pas pu être validée. Contactez Baobab.`;
      await tx.tradeEvent.create({
        data: {
          orderId: id,
          status: o.status,
          message: body,
          createdBy: actor,
        },
      });
      await this.notify(tx, fresh, body);
    });
    return this.one(id);
  }
  async declare(id: string, token: string, dto: any) {
    await this.tokenOrder(id, token);
    await this.entry(
      id,
      { ...dto, kind: "CLIENT_PAYMENT", pending: true },
      "CLIENT",
      token,
    );
    return { declared: true };
  }
  async closeCosts(id: string, actor: string) {
    return this.db.$transaction(async (tx) => {
      const o = await this.order(tx, id);
      if (o.logisticsFinalized) return { closed: true };
      if (o.status !== "DELIVERED")
        throw new BadRequestException(
          "Livraison requise avant clôture des coûts",
        );
      await tx.tradeOrder.update({
        where: { id },
        data: { logisticsFinalized: true },
      });
      await tx.tradeEvent.create({
        data: {
          orderId: id,
          status: o.status,
          message: "Dossier logistique clôturé.",
          createdBy: actor,
        },
      });
      return { closed: true };
    });
  }
  private async notify(tx: any, order: any, body: string) {
    if (order.conversationId)
      await tx.chatMessage.create({
        data: {
          conversationId: order.conversationId,
          role: "BAOBAB",
          body,
          requestKey: randomUUID(),
        },
      });
    if (order.customer.email && order.customer.messagingOptIn)
      await tx.tradeNotice.create({
        data: {
          orderId: order.id,
          body: `${order.reference} — ${body}`,
          channel: "EMAIL",
        },
      });
  }
  async reminder(id: string, channel: string) {
    return this.db.$transaction(async (tx) => {
      const o = await this.order(tx, id),
        f = financials(o);
      if (minor(f.due) <= 0 || f.pendingPayments > 0 || o.status === "QUOTED")
        throw new BadRequestException(
          "Aucun rappel : solde réglé, devis à confirmer ou paiement en vérification",
        );
      const q = o.quotes.find((q) => q.revision === o.acceptedRevision);
      const body = `Bonjour ${o.customer.firstName}, commande ${o.reference} : reste à payer ${f.due} FCFA${q.paymentMode === "COD" ? " à la livraison" : ""}${q.dueDate ? `, échéance ${q.dueDate.toISOString().slice(0, 10)}` : ""}. Merci de contacter Baobab pour le règlement.`;
      if (
        channel === "EMAIL" &&
        (!o.customer.email || !o.customer.messagingOptIn)
      )
        throw new BadRequestException("Email et accord de notification requis");
      const n = await tx.tradeNotice.create({
        data: {
          orderId: id,
          channel,
          body,
          state: channel === "WHATSAPP" ? "MANUAL" : "PENDING",
        },
      });
      return {
        notice: n,
        whatsappUrl:
          channel === "WHATSAPP"
            ? `https://wa.me/${(o.customer.whatsapp || o.customer.phone).replace(/\D/g, "")}?text=${encodeURIComponent(body)}`
            : null,
      };
    });
  }
  @Cron("*/30 * * * * *")
  async deliverEmails() {
    const key = this.config.get<string>("RESEND_API_KEY"),
      from = this.config.get<string>("NOTIFICATION_FROM");
    if (!key || !from) return;
    // Recover an interrupted claim only inside the provider's 24-hour idempotency window.
    await this.db.tradeNotice.updateMany({
      where: {
        state: "SENDING",
        processingAt: { lt: new Date(Date.now() - 120000) },
        createdAt: { gt: new Date(Date.now() - 23 * 3600000) },
        attempts: { lt: 3 },
      },
      data: { state: "PENDING" },
    });
    const notices = await this.db.tradeNotice.findMany({
      where: { channel: "EMAIL", state: "PENDING", attempts: { lt: 3 } },
      include: { order: { include: { customer: true } } },
      take: 10,
      orderBy: { createdAt: "asc" },
    });
    for (const n of notices) {
      const claim = await this.db.tradeNotice.updateMany({
        where: { id: n.id, state: "PENDING" },
        data: {
          state: "SENDING",
          processingAt: new Date(),
          attempts: { increment: 1 },
        },
      });
      if (!claim.count) continue;
      try {
        if (!n.order.customer.messagingOptIn || !n.order.customer.email)
          throw new Error("Consentement ou email absent");
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "Idempotency-Key": n.id,
          },
          body: JSON.stringify({
            from,
            to: [n.order.customer.email],
            subject: `Baobab — ${n.order.reference}`,
            text: n.body,
          }),
        });
        if (!response.ok)
          throw new Error(`Prestataire email HTTP ${response.status}`);
        await this.db.tradeNotice.update({
          where: { id: n.id },
          data: { state: "SENT", sentAt: new Date(), lastError: null },
        });
      } catch (e) {
        await this.db.tradeNotice.update({
          where: { id: n.id },
          data: {
            state: "FAILED",
            lastError:
              e instanceof Error ? e.message.slice(0, 200) : "Envoi impossible",
          },
        });
      }
    }
  }
  /**
   * Compteurs légers pour les pastilles rouges du back-office.
   * Chaque valeur retombe à 0 dès que l'élément est traité, sans cache.
   */
  async adminCounts() {
    const [unreadMessages, pendingSellers, pendingListings, pendingPayments, pendingQuotes] =
      await Promise.all([
        this.db.conversation.count({ where: { needsReply: true, state: "OPEN" } }),
        this.db.seller.count({ where: { status: "PENDING" } }),
        this.db.product.count({ where: { moderation: "PENDING" } }),
        this.db.tradeEntry.count({ where: { state: "PENDING" } }),
        this.db.tradeOrder.count({ where: { status: { in: ["DRAFT", "QUOTED"] } } }),
      ]);
    return {
      unreadMessages,
      pendingSellers,
      pendingListings,
      pendingPayments,
      pendingQuotes,
    };
  }

  async overview() {
    const orders = await this.all();
    const sum = (key: string) =>
      amount(orders.reduce((n, o) => n + minor(o.finance[key]), 0));
    return {
      counts: {
        conversations: await this.db.conversation.count({
          where: { needsReply: true },
        }),
        listings: await this.db.product.count({
          where: { moderation: "PENDING" },
        }),
        sellers: await this.db.seller.count({ where: { status: "PENDING" } }),
        payments: await this.db.tradeEntry.count({
          where: { state: "PENDING" },
        }),
        quotes: orders.filter((o) => ["DRAFT", "QUOTED"].includes(o.status))
          .length,
      },
      totals: {
        cashReceived: sum("cashReceived"),
        due: sum("due"),
        courierDue: sum("courierDue"),
        supplierDue: sum("supplierDue"),
        logisticsPaid: sum("logisticsPaid"),
        refundDue: sum("refundDue"),
      },
      emailConfigured:
        !!this.config.get("RESEND_API_KEY") &&
        !!this.config.get("NOTIFICATION_FROM"),
      orders,
    };
  }
}
