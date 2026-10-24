import { BadRequestException } from "@nestjs/common";

export const UNIVERSES = [
  {
    id: "motors",
    name: "Véhicules",
    subtitle: "Motors",
    icon: "car",
    categories: [
      "Voitures",
      "Motos & tricycles",
      "Utilitaires",
      "Pièces & accessoires",
    ],
  },
  {
    id: "classifieds",
    name: "Objets & équipements",
    subtitle: "Classifieds",
    icon: "phone",
    categories: [
      "Téléphones & tablettes",
      "Électronique & informatique",
      "Électroménager",
      "Sport & fitness",
      "Musculation & gym",
      "Mode & accessoires",
    ],
  },
  {
    id: "home",
    name: "Maison & jardin",
    subtitle: "Furniture & Garden",
    icon: "home",
    categories: ["Meubles", "Décoration", "Literie", "Cuisine", "Jardin"],
  },
  {
    id: "trade",
    name: "Travaux & artisans",
    subtitle: "Matériel & services",
    icon: "tool",
    categories: [
      "Plomberie & sanitaire",
      "Électricité & énergie",
      "Construction & rénovation",
      "Outillage",
      "Services & artisans",
    ],
  },
];
export const STAGES = [
  "CONFIRMED",
  "PREPARING",
  "HANDED_TO_CARRIER",
  "IN_TRANSIT",
  "ARRIVED",
  "CUSTOMS",
  "LOCAL_DELIVERY",
  "DELIVERED",
];
export const STAGE_NAMES: Record<string, string> = {
  DRAFT: "Devis en préparation",
  QUOTED: "Devis à confirmer",
  CONFIRMED: "Commande confirmée",
  PREPARING: "Préparation à Dubaï",
  HANDED_TO_CARRIER: "Remise au transporteur",
  IN_TRANSIT: "En transit",
  ARRIVED: "Arrivée au pays",
  CUSTOMS: "Dédouanement",
  LOCAL_DELIVERY: "Livraison locale",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};
export const ENTRY_KINDS = [
  "CLIENT_PAYMENT",
  "COD_COLLECTION",
  "COURIER_REMITTANCE",
  "SUPPLIER_PAYMENT",
  "LOGISTICS_COST",
  "CUSTOMER_REFUND",
];

export function minor(value: unknown): number {
  const text = String(value ?? "");
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text))
    throw new BadRequestException(
      "Montant invalide (positif, deux décimales maximum)",
    );
  const [whole, fraction = ""] = text.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result > 999999999999)
    throw new BadRequestException("Montant trop élevé");
  return result;
}
export const amount = (value: number) => (value / 100).toFixed(2);
export function quantity(value: unknown, minimum = 1, pack = 1) {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < minimum ||
    Number(value) > 1000000 ||
    Number(value) % pack !== 0
  )
    throw new BadRequestException(
      `Quantité minimale : ${minimum}, par multiples de ${pack}`,
    );
  return Number(value);
}
export function phone(value: string) {
  const result = String(value ?? "").replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(result))
    throw new BadRequestException(
      "Téléphone international requis, avec indicatif +",
    );
  return result;
}
export function financials(order: any) {
  const quote = order.quotes?.find(
    (q: any) =>
      q.revision === (order.acceptedRevision ?? order.currentRevision),
  );
  const entries = (order.entries ?? []).filter(
    (e: any) => e.state === "CONFIRMED",
  );
  const sum = (kind: string) =>
    entries
      .filter((e: any) => e.kind === kind)
      .reduce((s: number, e: any) => s + minor(e.amount), 0);
  const direct = sum("CLIENT_PAYMENT"),
    cod = sum("COD_COLLECTION"),
    remitted = sum("COURIER_REMITTANCE");
  const refunds = sum("CUSTOMER_REFUND"),
    supplierPaid = sum("SUPPLIER_PAYMENT"),
    logisticsPaid = sum("LOGISTICS_COST");
  const total = quote ? minor(quote.total) : 0,
    supplier = quote ? minor(quote.supplierTotal) : 0;
  const accepted = order.acceptedRevision != null;
  return {
    total: amount(total),
    paid: amount(direct + cod - refunds),
    due: amount(
      accepted && order.status !== "CANCELLED"
        ? Math.max(0, total - direct - cod + refunds)
        : 0,
    ),
    refundDue: amount(
      order.status === "CANCELLED" ? direct + cod - refunds : 0,
    ),
    courierDue: amount(cod - remitted),
    cashReceived: amount(direct + remitted),
    supplierDue: amount(
      accepted && order.status !== "CANCELLED"
        ? Math.max(0, supplier - supplierPaid)
        : 0,
    ),
    supplierPaid: amount(supplierPaid),
    logisticsPaid: amount(logisticsPaid),
    refunded: amount(refunds),
    cashBalance: (
      (direct + remitted - refunds - supplierPaid - logisticsPaid) /
      100
    ).toFixed(2),
    estimatedMargin: quote
      ? ((total - supplier - minor(quote.logisticsEstimate)) / 100).toFixed(2)
      : "0.00",
    actualMargin:
      accepted && order.status === "DELIVERED" && order.logisticsFinalized
        ? ((direct + cod - refunds - supplier - logisticsPaid) / 100).toFixed(2)
        : null,
    pendingPayments: (order.entries ?? []).filter(
      (e: any) => e.state === "PENDING",
    ).length,
  };
}
