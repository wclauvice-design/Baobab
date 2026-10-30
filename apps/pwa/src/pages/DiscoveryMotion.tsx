import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Trending search queries cycling in the search bar
export const POPULAR_SEARCHES = [
  "Toyota Land Cruiser V8 Dubaï",
  "Kit Solaire Complet 5 kVA",
  "iPhone 15 Pro Max 256 Go",
  "Jetour Dashing 1.5T 2024",
  "Climatiseur Inverter Gree 1.5 CV",
  "Groupe Électrogène Diesel 7 kW",
  "Robes & Tissus Dubaï Gold Souk",
  "Toyota Hilux Double Cabine 4x4",
  "Panneaux Solaires 550W Jinko",
  "Motos & Tricycles de livraison",
  "Ordinateurs Portables & Écrans",
];

// Reassurance guarantees highlighted in the interactive trust bar
export const CORE_GUARANTEES = [
  {
    icon: "💳",
    title: "Paiement à la livraison*",
    badge: "Confiance",
    summary: "Réglez un acompte logistique, payez le solde après vérification chez vous.",
    detail:
      "Selon le type de marchandise et votre ville de destination, sécurisez votre commande avec un acompte logistique et réglez le solde en main propre à la livraison après vérification.",
  },
  {
    icon: "🛡️",
    title: "Sécurité & Transparence 100%",
    badge: "Paiement Protégé",
    summary: "Fonds sécurisés jusqu'à validation et réception conforme.",
    detail:
      "Vos paiements restent protégés par Westzone. Le commerçant n'est crédité qu'une fois votre marchandise inspectée, vérifiée et validée conforme à votre commande.",
  },
  {
    icon: "📹",
    title: "Inspection vidéo en direct de Dubaï",
    badge: "Zéro surprise",
    summary: "Vidéo et photos réelles de vos colis au garage avant tout départ.",
    detail:
      "Notre équipe à Jebel Ali et Deira déballe, teste et filme vos articles avec votre nom et numéro de commande avant la fermeture du carton ou conteneur.",
  },
  {
    icon: "✈️",
    title: "Fret Express & Maritime Dédouané",
    badge: "Douane incluse",
    summary: "Express 3–6 jours ou Maritime groupé sans aucun frais caché.",
    detail:
      "Deux modes logistiques transparents : Fret Aérien Express (3 à 6 jours) pour vos besoins urgents ou Maritime au m³ (45 à 50 jours) pour les gros volumes, sans frais cachés.",
  },
];

// Combined stream of live social proof and key guarantees
export const STREAM_FOCAL_POINTS = [
  { icon: "🚗", city: "Ouagadougou", text: "Toyota Hilux inspectée au showroom Dubaï & validée", time: "il y a 2 min", tag: "LIVE" },
  { icon: "🛡️", city: "Sécurité", text: "Paiement protégé · Solde réglé après vérification", time: "Garantie", tag: "CONFIANCE" },
  { icon: "⚡", city: "Abidjan", text: "10 kits solaires 5 kVA Hybride expédiés en fret express", time: "il y a 5 min", tag: "LIVE" },
  { icon: "📹", city: "Zéro surprise", text: "Inspection vidéo en direct de votre colis avant départ", time: "Audit", tag: "GARANTIE" },
  { icon: "🚢", city: "Lomé", text: "Arrivage conteneur Jetour Dashing au port de transit", time: "il y a 11 min", tag: "LIVE" },
  { icon: "📦", city: "Cotonou", text: "Colis électronique remis en main propre au destinataire", time: "il y a 28 min", tag: "LIVE" },
  { icon: "✈️", city: "Douane 100% gérée", text: "Fret maritime & aérien régulier chaque semaine", time: "Transit", tag: "LOGISTIQUE" },
  { icon: "🔧", city: "Bamako", text: "Commande confirmée · Pièces détachées Toyota d'origine", time: "il y a 39 min", tag: "LIVE" },
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
