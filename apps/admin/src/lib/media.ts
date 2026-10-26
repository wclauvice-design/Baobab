/**
 * Helpers médias partagés par le back-office : images ET vidéos.
 * Les commerçants peuvent sélectionner, glisser-déposer ou coller (Ctrl+V)
 * leurs photos/vidéos. Les fichiers sont envoyés tels quels à Supabase
 * (les images sont compressées en WebP avant l'envoi).
 */

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

export const MEDIA_ACCEPT = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES].join(',');

export const MAX_IMAGE_MB = 8;
export const MAX_VIDEO_MB = 50;
export const MAX_MEDIA_PER_PRODUCT = 20;

const IMAGE_URL_RE = /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i;
const VIDEO_URL_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

export function isVideoFile(file: File): boolean {
  return (file.type || '').toLowerCase().startsWith('video/');
}

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = String(url).split('?')[0].split('#')[0];
  if (VIDEO_URL_RE.test(clean)) return true;
  return /\/video\//i.test(clean);
}

export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return IMAGE_URL_RE.test(String(url));
}

export function isMediaUrl(url: string | null | undefined): boolean {
  return isVideoUrl(url) || isImageUrl(url);
}

/** Renvoie un message d'erreur lisible, ou null si le fichier est accepté. */
export function validateMediaFile(file: File): string | null {
  const type = (file.type || '').toLowerCase();
  const video = type.startsWith('video/');
  const image = type.startsWith('image/');
  if (!video && !image) {
    return `« ${file.name} » n'est ni une image ni une vidéo.`;
  }
  const maxMb = video ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (file.size > maxMb * 1024 * 1024) {
    return `« ${file.name} » dépasse ${maxMb} Mo.`;
  }
  return null;
}

/**
 * Extrait les médias d'un presse-papiers (copie d'image/vidéo ou URL).
 */
export function extractMediaFromClipboard(
  data: DataTransfer | null,
): { files: File[]; urls: string[] } {
  const files: File[] = [];
  const urls: string[] = [];
  if (!data) return { files, urls };

  const seen = new Set<string>();
  const pushFile = (file: File | null) => {
    if (!file) return;
    const type = (file.type || '').toLowerCase();
    if (!type.startsWith('image/') && !type.startsWith('video/')) return;
    const key = `${file.name}:${file.size}:${file.type}`;
    if (seen.has(key)) return;
    seen.add(key);
    files.push(file);
  };

  if (data.items && data.items.length) {
    for (const item of Array.from(data.items)) {
      if (item.kind === 'file') pushFile(item.getAsFile());
    }
  }
  if (!files.length && data.files) {
    for (const file of Array.from(data.files)) pushFile(file);
  }

  const text = (data.getData('text/plain') || data.getData('text/uri-list') || '').trim();
  if (text) {
    for (const line of text.split(/[\r\n\s]+/)) {
      const candidate = line.trim();
      if (!/^https?:\/\//i.test(candidate)) continue;
      if (!isMediaUrl(candidate)) continue;
      if (!urls.includes(candidate)) urls.push(candidate);
    }
  }

  return { files, urls };
}
