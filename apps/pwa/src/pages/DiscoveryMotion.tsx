import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Trending search queries cycling in the search bar like Temu / AliExpress
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
      "Vos paiements restent protégés par Baobab. Le commerçant n'est crédité qu'une fois votre marchandise inspectée, vérifiée et validée conforme à votre commande.",
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
 * Animated Search Bar with Vertical Rolling Suggestions (Temu-style)
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
 * Dynamic Trust Ribbon (Compact, Space-saving, High-Conversion Temu-inspired Motion)
 * Replaces bulky stacked boxes with a single unified 42px interactive ribbon.
 */
export function DynamicTrustRibbon({
  paused = false,
}: {
  paused?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { index, running } = useRotation(STREAM_FOCAL_POINTS.length, 3200, paused || expanded);
  const current = STREAM_FOCAL_POINTS[index];

  return (
    <div className="dynamic-trust-container mb-3">
      {/* 1-Line Compact Rotating Ribbon */}
      <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-white border border-[#E2E8F0] px-3.5 py-2.5 shadow-[0_1px_3px_rgba(11,30,23,0.04)]">
        {/* Radar green pulse badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800 tracking-wider">
            {current.tag}
          </span>
        </div>

        {/* Rolling Focal Point (Temu slot-machine transition) */}
        <div className="flex-1 min-w-0 overflow-hidden text-xs">
          <div
            key={`${index}-${running}`}
            className={`flex items-center gap-1.5 whitespace-nowrap text-slate-800 ${
              running ? "discovery-roll" : ""
            }`}
          >
            <span className="text-sm shrink-0">{current.icon}</span>
            <strong className="font-bold text-[#0B1E17] shrink-0">{current.city}</strong>
            <span className="text-slate-400">·</span>
            <span className="truncate text-slate-600 font-medium">{current.text}</span>
            <span className="text-[10px] text-slate-400 shrink-0 ml-auto hidden sm:inline">
              {current.time}
            </span>
          </div>
        </div>

        {/* Bouton d'extension des garanties complètes */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2 py-1 text-[11px] font-bold text-slate-700 transition-colors flex items-center gap-1"
          aria-expanded={expanded}
          aria-controls="baobab-trust-details"
        >
          <span>{expanded ? "Fermer ✕" : "4 Garanties ▾"}</span>
        </button>
      </div>

      {/* Accordéon déroulant à la demande (sans encombrer la page par défaut) */}
      {expanded && (
        <div id="baobab-trust-details" className="mt-2 rounded-2xl bg-white border border-[#E2E8F0] p-4 sm:p-5 shadow-lg animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CORE_GUARANTEES.map((g, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-2xl shrink-0">{g.icon}</span>
                <div className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#0B1E17] text-sm">{g.title}</span>
                    <span className="rounded bg-emerald-100/70 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                      {g.badge}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-normal">{g.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 text-[11px]">
              * Contrôle certifié à Dubaï avant embarquement maritime ou aérien.
            </span>
            <Link to="/messages" className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1">
              💬 Parler à un conseiller Baobab →
            </Link>
          </div>
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
  "Garanti & livré chez vous.",
  "Véhicules certifiés Dubaï.",
  "Énergie solaire & batteries.",
  "Inspection vidéo en direct.",
  "Fret sécurisé & dédouané.",
];

export function HeroAnimatedHeadline() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_DYNAMIC_HOOKS.length);
        setFade(true);
      }, 220);
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  return (
    <h1 className="bb-hero-title">
      <span className="bb-hero-fixed">Achetez au prix source.</span>{" "}
      <span
        className={`bb-hero-rotating inline-block transition-all duration-300 ${
          fade ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
      >
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
export const BaobabPromises = () => null;
