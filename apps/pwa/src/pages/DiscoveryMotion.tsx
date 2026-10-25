import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Trending search queries cycling in the search bar like Temu / AliExpress
export const POPULAR_SEARCHES = [
  "Toyota Land Cruiser V8 Dubaï",
  "Kit Solaire Complet 5 kVA",
  "iPhone 15 Pro Max 256 Go",
  "Climatiseur Inverter Gree 1.5 CV",
  "Groupe Électrogène Diesel 7 kW",
  "Robes & Tissus Dubaï Gold Souk",
  "Outillage & Machines d'atelier",
  "Panneaux Solaires 550W Jinko",
  "Motos & Tricycles de livraison",
  "Ordinateurs Portables & Écrans",
];

// Reassurance guarantees highlighted in the interactive trust bar
export const CORE_GUARANTEES = [
  {
    icon: "💳",
    title: "Paiement à la livraison possible*",
    badge: "Confiance",
    summary: "Réglez un acompte logistique, payez le solde à réception chez vous.",
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
    summary: "Vidéo et photos réelles de vos colis avant tout départ.",
    detail:
      "Notre équipe à Jebel Ali et Deira déballe, teste et filme vos articles avec votre nom et numéro de commande avant la fermeture du carton ou conteneur.",
  },
  {
    icon: "✈️",
    title: "Transport Aérien Express & Maritime CBM",
    badge: "Suivi pas-à-pas",
    summary: "Express 3–6 jours ou Maritime groupé avec dédouanement inclus.",
    detail:
      "Deux modes logistiques transparents : Fret Aérien Express (3 à 6 jours) pour vos besoins urgents ou Maritime au m³ (45 à 50 jours) pour les gros volumes, sans frais cachés.",
  },
];

// Live social proof ticker simulating real verified logistics activities
export const LIVE_ACTIVITIES = [
  { icon: "🟢", city: "Ouagadougou", text: "Devis validé · Kit Solaire 5 kVA Hybride", time: "il y a 3 min" },
  { icon: "✈️", city: "Abidjan", text: "Fret Express pris en charge à Dubaï · Lot Électronique", time: "il y a 7 min" },
  { icon: "🚢", city: "Lomé", text: "Conteneur maritime en cours de chargement à Jebel Ali", time: "il y a 14 min" },
  { icon: "📹", city: "Bamako", text: "Inspection vidéo validée pour un commerçant partenaire", time: "il y a 22 min" },
  { icon: "📦", city: "Cotonou", text: "Colis remis en main propre au destinataire avec succès", time: "il y a 35 min" },
  { icon: "🟢", city: "Niamey", text: "Commande confirmée · Pièces détachées Toyota Land Cruiser", time: "il y a 48 min" },
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

  // Rotate every 2.6 seconds with smooth roll animation
  const { index, running } = useRotation(
    POPULAR_SEARCHES.length,
    2600,
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
          placeholder={focused ? "Rechercher parmi 5 700+ articles..." : ""}
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
 * Live Activity Stream Ticker (Real-Time Social Proof)
 */
export function LiveActivityTicker({ paused }: { paused: boolean }) {
  const { index, running } = useRotation(LIVE_ACTIVITIES.length, 3600, paused);
  const current = LIVE_ACTIVITIES[index];

  return (
    <div className="live-activity-stream" aria-label="Flux des commandes en direct">
      <div className="stream-badge">
        <span className="pulse-dot" /> EN DIRECT
      </div>
      <div className="stream-content" key={`${index}-${running}`}>
        <span className="stream-icon">{current.icon}</span>
        <strong className="stream-city">{current.city}</strong>
        <span className="stream-sep">·</span>
        <span className="stream-text">{current.text}</span>
        <span className="stream-time">{current.time}</span>
      </div>
    </div>
  );
}

/**
 * High-Trust Reassurance Module: "Pourquoi choisir Baobab ?"
 * Features: Paiement à la livraison, Sécurité garantie, Inspection vidéo, Transport transparent
 */
export function BaobabPromises({
  paused,
  onPause,
}: {
  paused: boolean;
  onPause: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { index, running } = useRotation(
    CORE_GUARANTEES.length,
    3000,
    paused || hovered || expanded,
  );

  return (
    <section
      className="baobab-promises"
      aria-label="Pourquoi choisir Baobab ?"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="promise-bar">
        <button
          type="button"
          className="promise-toggle"
          aria-expanded={expanded}
          aria-controls="baobab-promise-details"
          onClick={() => setExpanded(!expanded)}
          title="Cliquez pour voir toutes nos garanties certifiées"
        >
          <span className="promise-seal" aria-hidden="true">
            🛡️
          </span>
          <div className="promise-title-block">
            <strong>Pourquoi choisir Baobab ?</strong>
            <small className="promise-subtitle">4 garanties certifiées Dubaï ❯</small>
          </div>
        </button>

        <span className="promise-ticker" aria-hidden="true">
          <span key={`${index}-${running}`} className={running ? "discovery-roll" : ""}>
            <span className="ticker-badge">{CORE_GUARANTEES[index].badge}</span>
            <span className="ticker-label">{CORE_GUARANTEES[index].title}</span>
          </span>
        </span>

        <div className="promise-actions">
          <button
            type="button"
            className="expand-guarantees-btn"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Réduire les garanties" : "Découvrir toutes les garanties"}
          >
            {expanded ? "Fermer ✕" : "Détails ▾"}
          </button>
          <button
            type="button"
            className="motion-toggle"
            aria-label={paused ? "Reprendre les animations" : "Mettre les animations en pause"}
            aria-pressed={paused}
            onClick={onPause}
            title={paused ? "Reprendre le défilement" : "Mettre en pause"}
          >
            {paused ? "▶" : "⏸"}
          </button>
        </div>
      </div>

      <div id="baobab-promise-details" className="promise-details" hidden={!expanded}>
        <div className="promise-cards-grid">
          {CORE_GUARANTEES.map((g, i) => (
            <div key={i} className="promise-card">
              <div className="promise-card-head">
                <span className="card-icon">{g.icon}</span>
                <div>
                  <span className="card-badge">{g.badge}</span>
                  <strong>{g.title}</strong>
                </div>
              </div>
              <p className="card-summary">{g.summary}</p>
              <p className="card-detail">{g.detail}</p>
            </div>
          ))}
        </div>

        <div className="promise-footer">
          <p className="promise-conditions">
            * <strong>Paiement à la livraison :</strong> Sous réserve d'éligibilité selon la ville de livraison et la catégorie d'articles. Acompte de réservation logistique requis, solde à la remise en main propre.
          </p>
          <Link className="promise-cta-btn" to="/messages">
            💬 Parler avec un conseiller Baobab →
          </Link>
        </div>
      </div>
    </section>
  );
}
