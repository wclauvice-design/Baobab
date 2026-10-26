import { compressImage } from './images';
import { isVideoFile } from './media';

const TOKEN_KEY = 'baobab_admin_token';
const DEFAULT_API_RENDER_URL = 'https://baobab-api-7w7h.onrender.com';
const SUPABASE_STORAGE_URL = 'https://jptymtzrfahlhjcqpttg.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdHltdHpyZmFobGhqY3FwdHRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA0MDQ0NCwiZXhwIjoyMTAzNjE2NDQ0fQ.Pt2xVt29tobsaqEjG6EKZ7sG6unZ9OpdoG3pd9wjBDs';
const SUPABASE_BUCKET = 'product-images';

/**
 * Préchauffe silencieusement le backend Render en arrière-plan
 * pour éviter les délais de démarrage à froid (spin-down Render).
 */
export function warmUpBackend(): void {
  try {
    fetch(`${DEFAULT_API_RENDER_URL}/health`, { method: 'GET', keepalive: true }).catch(() => {});
  } catch {
    // Échec silencieux
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  // Ignorer tout résidu d'ancien domaine Railway ou localhost hors développement local
  if (envUrl && !envUrl.includes('railway.app')) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && envUrl.includes('localhost')) {
      return '/api';
    }
    return envUrl.replace(/\/$/, '');
  }
  return '/api';
}

async function fetchApi(path: string, init: RequestInit = {}): Promise<Response> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getBaseUrl();
  const primaryUrl = `${base}${cleanPath}`;
  const directRenderUrl = `${DEFAULT_API_RENDER_URL}${cleanPath}`;

  try {
    const res = await fetch(primaryUrl, init);
    // Si le proxy Vercel (/api) renvoie 502/504 à cause d'un délai de réveil de Render,
    // on bascule directement sur l'URL Render ouverte en CORS
    if ((res.status === 502 || res.status === 504) && base === '/api') {
      console.warn(`[API] Proxy ${res.status} sur ${primaryUrl}, bascule directe Render...`);
      return await fetch(directRenderUrl, init);
    }
    return res;
  } catch (err) {
    // Si la requête vers /api échoue au niveau réseau, basculer sur Render direct
    if (base === '/api') {
      console.warn(`[API] Erreur réseau proxy sur ${primaryUrl}, bascule directe Render:`, err);
      return await fetch(directRenderUrl, init);
    }
    throw err;
  }
}

async function readResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    let errorMsg: string = res.statusText || `Erreur HTTP ${res.status}`;
    if (body && typeof body === 'object' && 'message' in body) {
      const raw = (body as { message: unknown }).message;
      if (typeof raw === 'string') {
        errorMsg = raw;
      } else if (raw && typeof raw === 'object' && 'message' in raw) {
        errorMsg = String((raw as any).message);
      } else if (raw) {
        errorMsg = JSON.stringify(raw);
      }
    }
    throw new ApiError(res.status, errorMsg, body);
  }

  return body as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetchApi(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  return readResponse<T>(res);
}

/**
 * Téléverse directement un fichier d'image vers le bucket Supabase public
 * et renvoie son URL publique pérenne.
 */
export async function uploadFileToStorage(productId: string, file: File): Promise<string> {
  const optimizedFile = await compressImage(file);
  const ext = (file.name.split('.').pop() || 'webp').toLowerCase().replace(/[^a-z0-9]/g, '');
  const objectPath = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const uploadRes = await fetch(`${SUPABASE_STORAGE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': optimizedFile.type || 'image/webp',
    },
    body: optimizedFile,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '');
    throw new Error(`Échec envoi Supabase (${uploadRes.status}): ${errText}`);
  }

  return `${SUPABASE_STORAGE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`;
}

/**
 * Remplace une image précise d'un produit par une nouvelle photo (par fichier ou URL)
 */
export async function replaceProductImage(productId: string, oldUrl: string, fileOrUrl: File | string): Promise<string[]> {
  let newUrl: string;
  if (typeof fileOrUrl === 'string') {
    newUrl = fileOrUrl.trim();
  } else {
    newUrl = await uploadFileToStorage(productId, fileOrUrl);
  }

  const currentProduct = await api.get<any>(`/products/${productId}`);
  const currentImages: string[] = Array.isArray(currentProduct.images) ? [...currentProduct.images] : [];
  const idx = currentImages.indexOf(oldUrl);

  if (idx !== -1) {
    currentImages[idx] = newUrl;
  } else {
    currentImages.push(newUrl);
  }

  const updated = await api.patch<any>(`/products/${productId}`, { images: currentImages });
  return updated.images || currentImages;
}

/**
 * Ajoute une ou plusieurs images au même produit (fichiers ou URLs directes)
 */
export async function addProductImages(productId: string, items: Array<File | string>): Promise<string[]> {
  const newUrls: string[] = [];
  for (const item of items) {
    if (typeof item === 'string') {
      const clean = item.trim();
      if (clean) newUrls.push(clean);
    } else if (item instanceof File) {
      const uploaded = await uploadFileToStorage(productId, item);
      newUrls.push(uploaded);
    }
  }

  const currentProduct = await api.get<any>(`/products/${productId}`);
  const currentImages: string[] = Array.isArray(currentProduct.images) ? [...currentProduct.images] : [];
  const updatedImages = [...currentImages, ...newUrls];

  const updated = await api.patch<any>(`/products/${productId}`, { images: updatedImages });
  return updated.images || updatedImages;
}

/**
 * Supprime une image d'un produit
 */
export async function removeProductImage(productId: string, urlToRemove: string): Promise<string[]> {
  const currentProduct = await api.get<any>(`/products/${productId}`);
  const currentImages: string[] = Array.isArray(currentProduct.images) ? [...currentProduct.images] : [];
  const updatedImages = currentImages.filter((u) => u !== urlToRemove);

  const updated = await api.patch<any>(`/products/${productId}`, { images: updatedImages });
  return updated.images || updatedImages;
}

/**
 * Définit une image comme image principale (index 0)
 */
export async function setProductMainImage(productId: string, mainUrl: string): Promise<string[]> {
  const currentProduct = await api.get<any>(`/products/${productId}`);
  const currentImages: string[] = Array.isArray(currentProduct.images) ? [...currentProduct.images] : [];
  const otherImages = currentImages.filter((u) => u !== mainUrl);
  const updatedImages = [mainUrl, ...otherImages];

  const updated = await api.patch<any>(`/products/${productId}`, { images: updatedImages });
  return updated.images || updatedImages;
}

async function fallbackDirectSupabaseUpload<T>(productId: string, file: File): Promise<T> {
  const publicUrl = await uploadFileToStorage(productId, file);
  const currentProduct = await api.get<any>(`/products/${productId}`);
  const currentImages = Array.isArray(currentProduct.images) ? currentProduct.images : [];
  const updatedImages = [...currentImages, publicUrl];

  return await api.patch<T>(`/products/${productId}`, {
    images: updatedImages,
  });
}

async function uploadRequest<T>(path: string, file: File): Promise<T> {
  const token = getToken();
  const optimizedFile = await compressImage(file);
  const matchProduct = path.match(/\/products\/([^/]+)\/images/);

  // Les vidéos ne passent pas par l'API (limitée aux images) :
  // envoi direct vers le stockage Supabase puis mise à jour de l'annonce.
  if (isVideoFile(file) && matchProduct) {
    return await fallbackDirectSupabaseUpload<T>(matchProduct[1], file);
  }

  try {
    const formData = new FormData();
    formData.append('file', optimizedFile);

    const res = await fetchApi(path, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    return await readResponse<T>(res);
  } catch (err: any) {
    if (matchProduct) {
      return await fallbackDirectSupabaseUpload<T>(matchProduct[1], optimizedFile);
    }
    throw err;
  }
}

async function deleteImageWithFallback<T>(path: string, body?: any): Promise<T> {
  try {
    return await request<T>(path, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    const matchProduct = path.match(/\/products\/([^/]+)\/images/);
    if (matchProduct && body?.url) {
      const productId = matchProduct[1];
      const currentProduct = await api.get<any>(`/products/${productId}`);
      const currentImages = Array.isArray(currentProduct.images) ? currentProduct.images : [];
      const updatedImages = currentImages.filter((i: string) => i !== body.url);
      return await api.patch<T>(`/products/${productId}`, { images: updatedImages });
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) => deleteImageWithFallback<T>(path, body),
  upload: <T>(path: string, file: File) => uploadRequest<T>(path, file),
  uploadFileToStorage,
  replaceProductImage,
  addProductImages,
  removeProductImage,
  setProductMainImage,
};
