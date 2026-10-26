/**
 * Cache produit côté client.
 *
 * Objectif : quand un visiteur clique sur une annonce déjà affichée dans le
 * fil, la fiche détail s'ouvre instantanément avec les données connues, puis
 * se rafraîchit silencieusement en arrière-plan. Aucun écran « chargement »
 * n'est nécessaire.
 *
 * - Mémoire : accès synchrone immédiat pendant la navigation (source
 *   principale, non plafonnée à quelques dizaines d'annonces).
 * - sessionStorage : survit à un rechargement de page (retour arrière, PWA),
 *   limité aux annonces les plus récemment consultées et écrit de façon
 *   différée pour ne jamais bloquer le rendu.
 */

const STORAGE_KEY = "baobab:product-cache:v1";
const MEMORY_LIMIT = 400;
const PERSIST_LIMIT = 40;
const PERSIST_DELAY_MS = 250;

const memory = new Map<string, any>();
let hydrated = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function isProduct(value: any): boolean {
  return Boolean(value && typeof value === "object" && value.id && value.name);
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const entry of parsed) {
      if (isProduct(entry)) memory.set(String(entry.id), entry);
    }
  } catch {
    // Stockage indisponible ou corrompu : le cache mémoire suffit.
  }
}

function persistNow() {
  persistTimer = null;
  try {
    const entries = Array.from(memory.values()).slice(-PERSIST_LIMIT);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota dépassé : on garde uniquement le cache mémoire.
  }
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(persistNow, PERSIST_DELAY_MS);
}

function trim() {
  while (memory.size > MEMORY_LIMIT) {
    const oldest = memory.keys().next().value;
    if (oldest === undefined) break;
    memory.delete(oldest);
  }
}

/** Mémorise un produit pour un affichage instantané ultérieur. */
export function rememberProduct(product: any) {
  if (!isProduct(product)) return;
  hydrate();
  const id = String(product.id);
  memory.delete(id);
  memory.set(id, product);
  trim();
  schedulePersist();
}

/** Mémorise une liste de produits (fil, boutique, suggestions…). */
export function rememberProducts(products: any) {
  if (!Array.isArray(products) || !products.length) return;
  hydrate();
  let changed = false;
  for (const product of products) {
    if (!isProduct(product)) continue;
    const id = String(product.id);
    memory.delete(id);
    memory.set(id, product);
    changed = true;
  }
  trim();
  if (changed) schedulePersist();
}

/** Récupère un produit en cache, sans requête réseau. */
export function peekProduct(id: string | null | undefined): any | null {
  if (!id) return null;
  hydrate();
  return memory.get(String(id)) || null;
}
