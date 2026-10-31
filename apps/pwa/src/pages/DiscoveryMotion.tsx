import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Recherches populaires : uniquement des produits réellement en boutique.
export const POPULAR_SEARCHES = [
  "iPhone 13",
  "Samsung Galaxy S23",
  "PlayStation 5 Slim",
  "Kit solaire 200 W",
  "Mini projecteur 1080p",
  "PC portable HP",
  "Fer à repasser",
];

// Réassurance : uniquement des engagements réellement tenus par WESTZONE.
export const CORE_GUARANTEES = [
  {
    icon: "💳",
    title: "Acompte Orange Money",
    badge: "Paiement",
    summary: "Réservez avec un acompte Orange Money, réglez le solde à la réception.",
    detail:
      "La commande est confirmée dès réception de l'acompte Orange Money (frais opérateur 1,5 %). Le solde se règle à la réception, après vérification du colis.",
  },
  {
    icon: "🛡️",
    title: "Prix rendu, sans frais caché",
    badge: "Transparence",
    summary: "Fret aérien Dubaï → Ouagadougou et dédouanement inclus dans le prix.",
    detail:
      "Le prix affiché est le prix rendu à Ouagadougou : produit, fret aérien, douane et livraison. Pour une autre ville, le supplément éventuel est confirmé par devis avant commande.",
  },
  {
    icon: "📷",
    title: "Photos et vidéo avant départ",
    badge: "Zéro surprise",
    summary: "Les images de l'article réel vous sont envoyées avant l'expédition.",
    detail:
      "Sur simple demande WhatsApp, nous envoyons photos et vidéo de l'article exact avant emballage. Les visuels de la boutique sont des illustrations, jamais des photos de fournisseur.",
  },
  {
    icon: "✈️",
    title: "Fret express Dubaï → Ouaga",
    badge: "Logistique",
    summary: "12 500 FCFA/kg, 3 à 6 jours ouvrés, dédouanement inclus.",
    detail:
      "Deux options : aérien express (3 à 6 jours) ou groupage cargo (14 à 16 jours). Le poids retenu et le mode choisi figurent sur le devis, sans frais ajouté à la livraison.",
  },
];

function useRotation(count: number, intervalMs: number, paused: boolean) {
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;

    const sync = () => {
      clearInterval(timer);
      const animate = !paused && !preference.matches && !document.hidden;
      setRunning(animate);
      if (animate) {
        timer = setInterval(() => {
          setIndex((prev) => (prev + 1) % count);
        }, intervalMs);
      }
    };

    sync();
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      clearInterval(timer);
      preference.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [count, intervalMs, paused]);

  return { index, running };
}

/**
 * Animated Search Bar with Vertical Rolling Suggestions
 */
export function DiscoverySearch({
  search,
  onSearch,
  paused,
}: {
  search: string;
  onSearch: (value: string) => void;
  paused: boolean;
}) {
  const [draft, setDraft] = useState(search);
  const [focused, setFocused] = useState(false);

  useEffect(() => setDraft(search), [search]);

  // Rotate every 2.4 seconds with smooth roll animation
  const { index, running } = useRotation(
    POPULAR_SEARCHES.length,
    2400,
    paused || focused || Boolean(draft),
  );

  const currentSuggestion = POPULAR_SEARCHES[index];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = draft.trim() || (!focused ? currentSuggestion : "");
    if (query) {
      setDraft(query);
      onSearch(query);
    } else {
      onSearch("");
    }
  };

  return (
    <form className="app-search-pill discovery-search" role="search" onSubmit={submit}>
      <div className="discovery-search-field">
        <input
          name="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? "Rechercher parmi nos sélections Dubaï..." : ""}
          aria-label="Rechercher une annonce à Dubaï"
          autoComplete="off"
        />
        {!draft && !focused && (
          <span className="search-ideas" aria-hidden="true">
            <span className="search-trending-fire">🔥</span>
            <span
              key={`${index}-${running}`}
              className={running ? "discovery-roll" : ""}
            >
              {currentSuggestion}
            </span>
          </span>
        )}
      </div>

      {draft && (
        <button
          type="button"
          className="search-clear-btn"
          aria-label="Effacer la recherche"
          onClick={() => {
            setDraft("");
            onSearch("");
          }}
        >
          ✕
        </button>
      )}

      <button type="submit" className="search-submit" aria-label="Lancer la recherche">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      </button>
    </form>
  );
}

/**
 * Dynamic Trust Ribbon (Compact, Space-saving, High-Conversion Motion)
 * Replaces bulky stacked boxes with a single unified 42px interactive ribbon.
 */
export function DynamicTrustRibbon({ paused = false }: { paused?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const { index, running } = useRotation(CORE_GUARANTEES.length, 5500, paused || expanded || userPaused);
  const current = CORE_GUARANTEES[index];
  return (
    <div className="bb-integrated-trust">
      <div className="bb-trust-line">
        <span className="bb-trust-dot" aria-hidden="true" />
        <div className="bb-trust-message">
          <span key={index} className={running ? "bb-trust-enter" : ""}>{current.title}</span>
        </div>
        <button type="button" className="bb-trust-pause" onClick={() => setUserPaused(!userPaused)} aria-label={userPaused ? "Reprendre le défilement" : "Mettre le défilement en pause"} aria-pressed={userPaused}>{userPaused ? "▷" : "Ⅱ"}</button>
        <button type="button" className="bb-trust-toggle" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="westzone-trust-details">Pourquoi Westzone <span aria-hidden="true">{expanded ? "−" : "+"}</span></button>
      </div>
      <div className="bb-trust-steps" aria-hidden="true">{CORE_GUARANTEES.map((g, i) => <span key={g.title} className={i === index ? "active" : ""} />)}</div>
      {expanded && (
        <div id="westzone-trust-details" className="bb-trust-details">
          {CORE_GUARANTEES.map(g => <div key={g.title}><h3>{g.icon} {g.title}</h3><p>{g.detail}</p></div>)}
          <Link to="/messages">Parler à un conseiller →</Link>
        </div>
      )}
    </div>
  );
}

/**
 * Dynamic Kinetic Headline Hooks
 * Captivating, space-saving typography animation that cycles key value propositions.
 */
export const HERO_DYNAMIC_HOOKS = [
  "Auto & mobilité.",
  "Solaire & énergie.",
  "High-tech au quotidien.",
  "Maison & électroménager.",
];

export function HeroAnimatedHeadline() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let transition: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      if (preference.matches || document.hidden) return;
      setFade(false);
      transition = setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_DYNAMIC_HOOKS.length);
        setFade(true);
      }, 220);
    }, 4200);
    return () => { clearInterval(timer); clearTimeout(transition); };
  }, []);

  return (
    <h1 className="bb-hero-title">
      <span className="bb-hero-fixed">Le monde à votre portée.</span>{" "}
      <span className={`bb-hero-rotating ${fade ? "is-visible" : "is-changing"}`}>
        <span className="bb-hero-gradient">{HERO_DYNAMIC_HOOKS[index]}</span>
      </span>
    </h1>
  );
}

// LiveFloatingToast removed per user request (unprofessional / intrusive)
export function LiveFloatingToast() {
  return null;
}

// Backward-compatible exports
export const LiveActivityTicker = DynamicTrustRibbon;
export const WestzonePromises = () => null;
