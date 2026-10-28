/**
 * Helpers médias côté PWA : certaines annonces contiennent des vidéos
 * (MP4/WebM/MOV) en plus des photos. On détecte le type à partir de l'URL
 * pour afficher le bon élément HTML avec un remplissage `object-fit: cover`.
 */

const VIDEO_URL_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = String(url).split('?')[0].split('#')[0];
  if (VIDEO_URL_RE.test(clean)) return true;
  return /\/video\//i.test(clean);
}

export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(String(url));
}

export function isMediaUrl(url: string | null | undefined): boolean {
  return isVideoUrl(url) || isImageUrl(url);
}

/** Use a real product photo when playback is blocked or still loading. */
export function videoPoster(images: string[] = []): string {
  return images.find((url) => Boolean(url) && !isVideoUrl(url)) || '/photos/placeholder.svg';
}
