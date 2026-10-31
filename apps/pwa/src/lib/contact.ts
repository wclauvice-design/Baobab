/**
 * Coordonnées publiques de WESTZONE — source unique côté PWA.
 *
 * Un seul numéro doit être affiché partout (fiches, boutique, compte, CGUV).
 * La valeur peut être surchargée par `BusinessSetting.whatsapp` (API), mais ce
 * module fournit le repli commun afin qu'aucun écran n'affiche un numéro
 * différent des autres.
 */
export const SUPPORT_WHATSAPP = "22676950089";
export const SUPPORT_WHATSAPP_LABEL = "+226 76 95 00 89";

/** Numéro utilisable dans un lien `wa.me` (chiffres uniquement). */
export function whatsappNumber(override?: string | null): string {
  const digits = String(override || "").replace(/\D/g, "");
  return digits.length >= 8 ? digits : SUPPORT_WHATSAPP;
}

/** Lien WhatsApp prêt à l'emploi, avec message pré-rempli facultatif. */
export function whatsappHref(message?: string, override?: string | null): string {
  const base = `https://wa.me/${whatsappNumber(override)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
