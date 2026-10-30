import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import {
  MEDIA_ACCEPT,
  MAX_MEDIA_PER_PRODUCT,
  extractMediaFromClipboard,
  isVideoFile,
  isVideoUrl,
  validateMediaFile,
} from '../lib/media';

interface MediaDropzoneProps {
  /** Fichiers sélectionnés / collés, pas encore envoyés. */
  files: File[];
  onChangeFiles: (files: File[]) => void;
  /** Médias déjà enregistrés sur l'annonce (URLs). */
  existing?: string[];
  /** Ajout d'une URL collée (image ou vidéo distante). */
  onAddUrl?: (url: string) => void;
  /** Suppression d'un média déjà enregistré. */
  onRemoveExisting?: (url: string) => void;
  max?: number;
  disabled?: boolean;
  /** Thème sombre (formulaire admin) ou clair (fiche commerçant). */
  dark?: boolean;
  label?: string;
  hint?: string;
}

export function MediaDropzone({
  files,
  onChangeFiles,
  existing = [],
  onAddUrl,
  onRemoveExisting,
  max = MAX_MEDIA_PER_PRODUCT,
  disabled = false,
  dark = false,
  label = 'Photos & vidéos du produit',
  hint,
}: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const palette = dark
    ? {
        text: '#e2e8f0',
        muted: 'rgba(226,232,240,0.62)',
        border: 'rgba(255,255,255,0.22)',
        borderActive: '#f2c35e',
        zoneBg: 'rgba(255,255,255,0.04)',
        tileBg: 'rgba(255,255,255,0.06)',
        error: '#fca5a5',
        accent: '#f2c35e',
      }
    : {
        text: '#0f172a',
        muted: '#64748b',
        border: '#cbd5e1',
        borderActive: '#059669',
        zoneBg: '#f8fafc',
        tileBg: '#f1f5f9',
        error: '#dc2626',
        accent: '#059669',
      };

  const total = existing.length + files.length;

  // Aperçus locaux des fichiers sélectionnés (images + vidéos)
  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const file of files) {
      const key = fileKey(file);
      urls[key] = URL.createObjectURL(file);
    }
    setPreviewUrls(urls);
    return () => {
      for (const url of Object.values(urls)) URL.revokeObjectURL(url);
    };
  }, [files]);

  function acceptFiles(incoming: File[]) {
    if (disabled || !incoming.length) return;
    const accepted: File[] = [];
    const problems: string[] = [];

    for (const file of incoming) {
      const problem = validateMediaFile(file);
      if (problem) problems.push(problem);
      else accepted.push(file);
    }

    const room = Math.max(0, max - existing.length - files.length);
    const kept = accepted.slice(0, room);
    if (accepted.length > kept.length) {
      problems.push(`Maximum ${max} médias par annonce.`);
    }

    setError(problems.length ? problems.join(' ') : null);
    if (kept.length) onChangeFiles([...files, ...kept]);
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    acceptFiles(selected);
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    acceptFiles(Array.from(e.dataTransfer?.files || []));
  }

  // Collage global (Ctrl+V) : une image copiée depuis un site/WhatsApp
  // est ajoutée directement, sans passer par la boîte de dialogue.
  useEffect(() => {
    if (disabled) return;
    function onPaste(event: ClipboardEvent) {
      const target = event.target as HTMLElement | null;
      const { files: pasted, urls } = extractMediaFromClipboard(event.clipboardData);
      if (!pasted.length && !urls.length) return;

      const isEditingText =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const insideZone = !!zoneRef.current && !!target && zoneRef.current.contains(target);

      // Un texte collé dans un champ ne doit pas être détourné, sauf si
      // l'utilisateur colle directement dans la zone média.
      if (isEditingText && !insideZone) return;

      event.preventDefault();
      if (pasted.length) acceptFiles(pasted);
      if (urls.length && onAddUrl) {
        urls.forEach((url) => onAddUrl(url));
        setError(null);
      } else if (urls.length) {
        setError('Collez plutôt le fichier image/vidéo, ou utilisez le champ de lien.');
      }
    }
    window.addEventListener('paste', onPaste as EventListener);
    return () => window.removeEventListener('paste', onPaste as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, existing, disabled, max, onAddUrl]);

  function removeFile(index: number) {
    onChangeFiles(files.filter((_, i) => i !== index));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: palette.muted }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: total > 0 ? palette.accent : palette.muted }}>
          {total} / {max}
        </span>
      </div>

      <div
        ref={zoneRef}
        tabIndex={0}
        role="button"
        aria-label="Ajouter des photos ou vidéos : cliquez, glissez-déposez ou collez avec Ctrl+V"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? palette.borderActive : palette.border}`,
          borderRadius: 12,
          padding: 10,
          background: dragOver ? (dark ? 'rgba(242,195,94,0.10)' : 'rgba(5,150,105,0.06)') : palette.zoneBg,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s ease, background 0.15s ease',
        }}
      >
        {total > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8 }}>
            {existing.map((url) => (
              <MediaTile
                key={url}
                url={url}
                dark={dark}
                palette={palette}
                onRemove={onRemoveExisting ? () => onRemoveExisting(url) : undefined}
              />
            ))}
            {files.map((file, index) => (
              <MediaTile
                key={fileKey(file)}
                url={previewUrls[fileKey(file)] || ''}
                isVideo={isVideoFile(file)}
                dark={dark}
                palette={palette}
                onRemove={() => removeFile(index)}
              />
            ))}
            {total < max && <AddTile dark={dark} palette={palette} />}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '14px 8px', textAlign: 'center' }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>🖼️</span>
            <strong style={{ fontSize: 12.5, color: palette.text }}>
              Cliquez, glissez-déposez ou collez (Ctrl+V)
            </strong>
            <span style={{ fontSize: 11, color: palette.muted }}>
              Images JPG/PNG/WebP · Vidéos MP4/WebM/MOV · 20 médias max
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        multiple
        disabled={disabled}
        onChange={handleInput}
        style={{ display: 'none' }}
      />

      <span style={{ fontSize: 11, color: palette.muted }}>
        {hint ||
          'Astuce : copiez une image (site, WhatsApp) puis Ctrl+V ici. Les médias remplissent automatiquement toute la zone.'}
      </span>
      {error && <span style={{ fontSize: 11, fontWeight: 700, color: palette.error }}>{error}</span>}
    </div>
  );
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function MediaTile({
  url,
  isVideo,
  onRemove,
  dark,
  palette,
}: {
  url: string;
  isVideo?: boolean;
  onRemove?: () => void;
  dark: boolean;
  palette: { tileBg: string; border: string };
}) {
  const video = isVideo ?? isVideoUrl(url);
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 10,
        overflow: 'hidden',
        background: dark ? '#0b1220' : '#e2e8f0',
        border: `1px solid ${palette.border}`,
      }}
    >
      {video ? (
        <video
          src={url}
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <img
          src={url}
          alt=""
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
      {video && (
        <span
          style={{
            position: 'absolute',
            left: 4,
            bottom: 4,
            background: 'rgba(2,6,23,0.75)',
            color: '#fff',
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.05em',
            padding: '2px 5px',
            borderRadius: 4,
          }}
        >
          VIDÉO
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          title="Retirer ce média"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            borderRadius: 6,
            border: 'none',
            background: '#dc2626',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function AddTile({
  dark,
  palette,
}: {
  dark: boolean;
  palette: { muted: string; border: string };
}) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 10,
        border: `1px dashed ${palette.border}`,
        background: dark ? 'rgba(255,255,255,0.03)' : '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        color: palette.muted,
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
      <span>Ajouter</span>
    </div>
  );
}
