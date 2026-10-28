import { useEffect, useRef, useState } from 'react';
import './product-video.css';

interface Props {
  src: string;
  poster?: string;
  label: string;
  className?: string;
  active?: boolean;
  /** Cards already live inside a link: no nested interactive controls. */
  preview?: boolean;
}

/** A blocked autoplay must leave a useful product photo, never a black tile. */
export function ProductVideo(props: Props) {
  return <VideoPlayer key={props.src} {...props} />;
}

function VideoPlayer({ src, poster, label, className = '', active = true, preview = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(false);
  const [failed, setFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [requested, setRequested] = useState(false);
  const image = !posterFailed && poster ? poster : '/photos/placeholder.svg';

  useEffect(() => {
    if (!host.current) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el || !visible || !active || failed) { el?.pause(); return; }
    let cancelled = false;
    el.defaultMuted = true;
    el.muted = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const play = () => {
      if (document.hidden) { el.pause(); return; }
      if (reducedMotion.matches || connection?.saveData) return;
      el.play()?.catch(() => { if (!cancelled) setPlaying(false); });
    };
    play();
    document.addEventListener('visibilitychange', play);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', play); el.pause(); };
  }, [visible, active, failed]);

  const start = () => {
    const el = video.current;
    if (!el) return;
    setRequested(true);
    // Keep play() in the user gesture for Safari / low-power mode.
    el.play()?.catch(() => { setRequested(false); setPlaying(false); });
  };

  return (
    <div ref={host} className={`product-video ${className}`} aria-label={label}>
      {!frame && <img className="product-video-poster" src={image} alt={label} onError={() => setPosterFailed(true)} />}
      {!failed && (
        <video
          ref={video}
          src={visible && active ? src : undefined}
          poster={image}
          muted playsInline loop
          preload={visible && active ? 'metadata' : 'none'}
          controls={!preview && (frame || requested)}
          aria-label={label}
          style={{ opacity: frame ? 1 : 0 }}
          onLoadStart={() => { setFrame(false); setPlaying(false); }}
          onEmptied={() => { setFrame(false); setPlaying(false); }}
          onPlaying={() => { setPlaying(true); setFrame(true); setRequested(false); }}
          onPause={() => setPlaying(false)}
          onError={() => { setFailed(true); setFrame(false); setPlaying(false); setRequested(false); }}
        />
      )}
      {!playing && !preview && !failed && !frame && (
        <button className="product-video-play" type="button" onClick={start} aria-label={`Lire la vidéo : ${label}`}>
          <span aria-hidden="true">▶</span> {requested ? 'Chargement…' : 'Lire la vidéo'}
        </button>
      )}
      {preview && !playing && <span className="product-video-badge">▶ Vidéo</span>}
      {failed && !preview && (
        <div className="product-video-error" role="status">
          Vidéo indisponible sur cet appareil. Les photos restent accessibles.
          <button type="button" onClick={() => { setFailed(false); setRequested(false); }}>Réessayer</button>
        </div>
      )}
    </div>
  );
}
