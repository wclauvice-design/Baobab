import { getToken } from "./api";
import { formatPrice } from "./currency";

export const money = (v: any) => formatPrice(v);
export const date = (v: string) =>
  v
    ? new Date(v).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
export const requestKey = () => crypto.randomUUID();
export async function call(
  path: string,
  body?: unknown,
  access?: string,
  method?: string,
) {
  const base = import.meta.env.PROD
    ? "/api"
    : (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: method || (body ? "POST" : "GET"),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(access ? { "X-Westzone-Access": access } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Le serveur est momentanément indisponible. Réessayez dans quelques instants.",
    );
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || data == null) {
    const m = data?.message?.message || data?.message;
    throw new Error(
      typeof m === "string"
        ? m
        : Array.isArray(m)
          ? m.join(", ")
          : "Cette demande ne peut pas être traitée.",
    );
  }
  return data;
}
export function saved<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export const save = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value));

export interface ActiveConversation {
  id: string;
  token: string;
  subject?: string;
}

export function getDeviceActiveConversation(): ActiveConversation | null {
  const active = saved<ActiveConversation | null>("westzone_active_conversation", null);
  if (active && active.id && active.token) return active;
  const list = saved<any[]>("westzone_conversations", []);
  if (list && list.length > 0) {
    const last = list[list.length - 1];
    if (last && last.id && last.token) {
      save("westzone_active_conversation", last);
      return last;
    }
  }
  return null;
}

export function setDeviceActiveConversation(c: ActiveConversation) {
  save("westzone_active_conversation", c);
  const list = saved<any[]>("westzone_conversations", []);
  const filtered = list.filter((item) => item.id !== c.id);
  save("westzone_conversations", [c, ...filtered].slice(0, 10));
}
export const universes = [
  { id: "motors", name: "Véhicules", subtitle: "Motors", icon: "car" },
  {
    id: "classifieds",
    name: "Objets & équipements",
    subtitle: "Tech, sport & quotidien",
    icon: "phone",
  },
  {
    id: "home",
    name: "Maison & jardin",
    subtitle: "Un intérieur à votre image",
    icon: "home",
  },
  {
    id: "trade",
    name: "Travaux & artisans",
    subtitle: "Pour tous vos projets",
    icon: "tool",
  },
];
export const stages: Record<string, string> = {
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
