const STORAGE_KEY = 'baobab_browsing_history';
const MAX_ENTRIES = 30;

export function recordView(productId: string) {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage indisponible (navigation privée, quota) — on ignore silencieusement.
  }
}

export function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
