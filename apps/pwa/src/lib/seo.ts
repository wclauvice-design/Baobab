/**
 * SEO runtime de la marketplace WESTZONE.
 *
 * Les métadonnées statiques de `index.html` couvrent l'accueil. Une fiche
 * produit doit exposer son propre titre et sa propre description, sans quoi
 * tous les partages et toutes les pages indexées portent le même texte.
 */

export const SITE_TITLE =
  "WESTZONE — Marketplace & conciergerie pour l'Afrique de l'Ouest";

export const SITE_DESCRIPTION =
  "WESTZONE connecte les acheteurs d'Afrique de l'Ouest aux marchés mondiaux : électronique, mode, maison, véhicules et équipements, avec devis concierge, fret maîtrisé et paiement protégé.";

type MetaTarget = { attr: "name" | "property"; key: string };

function upsertMeta({ attr, key }: MetaTarget, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function truncate(value: string, max: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function absoluteImage(images: unknown): string | null {
  const first = Array.isArray(images) ? images[0] : images;
  if (typeof first !== "string" || !/^https?:\/\//i.test(first)) return null;
  return first;
}

export interface ListingSeoInput {
  name?: string | null;
  description?: string | null;
  images?: unknown;
  price?: number | string | null;
  currency?: string | null;
  seller?: { shopName?: string | null } | null;
}

export function applyListingSeo(listing: ListingSeoInput) {
  const name = (listing.name || "").trim();
  if (!name) return;

  const title = `${name} — WESTZONE`;
  const description = truncate(
    listing.description ||
      `${name} disponible sur WESTZONE, la marketplace et conciergerie d'achat de l'Afrique de l'Ouest. Devis transparent, fret maîtrisé et paiement protégé.`,
    158,
  );
  const image = absoluteImage(listing.images);

  document.title = title;
  upsertMeta({ attr: "name", key: "description" }, description);
  upsertMeta({ attr: "property", key: "og:type" }, "product");
  upsertMeta({ attr: "property", key: "og:title" }, title);
  upsertMeta({ attr: "property", key: "og:description" }, description);
  upsertMeta({ attr: "name", key: "twitter:title" }, title);
  upsertMeta({ attr: "name", key: "twitter:description" }, description);
  upsertMeta({ attr: "name", key: "twitter:card" }, image ? "summary_large_image" : "summary");
  if (image) {
    upsertMeta({ attr: "property", key: "og:image" }, image);
    upsertMeta({ attr: "name", key: "twitter:image" }, image);
  }

  if (typeof listing.price === "number" || typeof listing.price === "string") {
    const amount = Number(listing.price);
    if (Number.isFinite(amount) && amount > 0) {
      upsertMeta(
        { attr: "property", key: "product:price:amount" },
        String(Math.round(amount)),
      );
      upsertMeta(
        { attr: "property", key: "product:price:currency" },
        listing.currency || "XOF",
      );
    }
  }
}

export function resetSeo() {
  document.title = SITE_TITLE;
  upsertMeta({ attr: "name", key: "description" }, SITE_DESCRIPTION);
  upsertMeta({ attr: "property", key: "og:type" }, "website");
  upsertMeta({ attr: "property", key: "og:title" }, SITE_TITLE);
  upsertMeta({ attr: "property", key: "og:description" }, SITE_DESCRIPTION);
  upsertMeta({ attr: "name", key: "twitter:card" }, "summary");
  upsertMeta({ attr: "name", key: "twitter:title" }, SITE_TITLE);
  upsertMeta({ attr: "name", key: "twitter:description" }, SITE_DESCRIPTION);
}
