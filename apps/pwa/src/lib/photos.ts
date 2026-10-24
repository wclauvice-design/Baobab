/**
 * Photos de remplacement (licence CC0 / domaine public, voir public/photos/CREDITS.md).
 * Affichées uniquement quand un produit n'a pas encore de photo téléversée.
 */
const PHOTO_BY_KEY: Record<string, string> = {
  vehicule: "/photos/vehicule.jpg",
  telephone: "/photos/telephone.jpg",
  informatique: "/photos/informatique.jpg",
  audio: "/photos/audio.jpg",
  maison: "/photos/maison.jpg",
  cuisine: "/photos/cuisine.jpg",
  electromenager: "/photos/electromenager.jpg",
  outils: "/photos/outils.jpg",
};

const RULES: [RegExp, keyof typeof PHOTO_BY_KEY][] = [
  [/voiture|v[ée]hicule|auto|moto|toyota|jetour|suv|pick-?up|pneu|jante|motors/i, "vehicule"],
  [/t[ée]l[ée]phon|smartphone|tablette|mobile/i, "telephone"],
  [/ordinateur|informatique|laptop|r[ée]seau|imprimante|pc\b/i, "informatique"],
  [/[ée]lectromenager|r[ée]frig|frigo|lave|climatis|four\b|micro-?onde|congelateur|cong[ée]lateur/i, "electromenager"],
  [/audio|casque|enceinte|[ée]couteur|t[ée]l[ée]vis|projecteur|home|[ée]lectronique/i, "audio"],
  [/cuisine|blender|bouilloire|vaisselle/i, "cuisine"],
  [/outil|bricolage|travaux|artisan|[ée]lectricit|industriel|trade/i, "outils"],
  [/maison|meuble|jardin|d[ée]co|ameublement/i, "maison"],
];

export function fallbackPhoto(...hints: Array<string | null | undefined>): string {
  const text = hints.filter(Boolean).join(" ");
  for (const [re, key] of RULES) if (re.test(text)) return PHOTO_BY_KEY[key];
  return PHOTO_BY_KEY.maison;
}
