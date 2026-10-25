import { compressImage } from './images';

// Production uses the Vercel proxy; local development may target a custom API.
const API_BASE = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
const TOKEN_KEY = 'baobab_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchApi(path: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez dans quelques instants.');
  }
}

async function readResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    throw new ApiError(res.status, 'Le serveur a renvoyé une réponse invalide. Veuillez réessayer plus tard.');
  }
  if (!res.ok) {
    const detail = body?.message;
    const message = typeof detail === 'object' && detail !== null && !Array.isArray(detail)
      ? detail.message : detail;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ')
      : typeof message === 'string' ? message : 'Le serveur est temporairement indisponible.');
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

async function uploadRequest<T>(path: string, file: File): Promise<T> {
  const token = getToken();
  const optimizedFile = await compressImage(file);
  const formData = new FormData();
  formData.append('file', optimizedFile);

  const res = await fetchApi(path, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  return readResponse<T>(res);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
  upload: <T>(path: string, file: File) => uploadRequest<T>(path, file),
};
