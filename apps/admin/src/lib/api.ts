import { compressImage } from './images';

const TOKEN_KEY = 'baobab_admin_token';
const SUPABASE_STORAGE_URL = 'https://jptymtzrfahlhjcqpttg.supabase.co';
const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdHltdHpyZmFobGhqY3FwdHRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA0MDQ0NCwiZXhwIjoyMTAzNjE2NDQ0fQ.Pt2xVt29tobsaqEjG6EKZ7sG6unZ9OpdoG3pd9wjBDs';
const SUPABASE_BUCKET = 'product-images';

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
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return '/api';
}

async function fetchApi(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, init);
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

async function fallbackDirectSupabaseUpload<T>(productId: string, file: File): Promise<T> {
  const ext = (file.name.split('.').pop() || 'webp').toLowerCase().replace(/[^a-z0-9]/g, '');
  const objectPath = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // 1. Direct upload to Supabase storage
  const uploadRes = await fetch(`${SUPABASE_STORAGE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': file.type || 'image/webp',
    },
    body: file,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '');
    throw new Error(`Échec envoi Supabase (${uploadRes.status}): ${errText}`);
  }

  const publicUrl = `${SUPABASE_STORAGE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`;

  // 2. Fetch current product to append image
  const currentProduct = await api.get<any>(`/products/${productId}`);
  const currentImages = Array.isArray(currentProduct.images) ? currentProduct.images : [];
  const updatedImages = [...currentImages, publicUrl];

  // 3. Update product via PATCH /products/:id
  return await api.patch<T>(`/products/${productId}`, {
    images: updatedImages,
  });
}

async function uploadRequest<T>(path: string, file: File): Promise<T> {
  const token = getToken();
  const optimizedFile = await compressImage(file);
  const matchProduct = path.match(/\/products\/([^/]+)\/images/);

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
    // Si l'endpoint backend échoue (ex: stockage non configuré sur Render), bascule immédiate vers Supabase direct
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
};
