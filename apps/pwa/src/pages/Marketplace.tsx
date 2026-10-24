import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  call,
  date,
  getDeviceActiveConversation,
  money,
  requestKey,
  saved,
  save,
  setDeviceActiveConversation,
  stages,
  universes,
} from "../lib/concierge";
import { estimateFreight, ShippingMode } from "../lib/freight";
import { fallbackPhoto } from "../lib/photos";
import { BaobabPromises, DiscoverySearch, LiveActivityTicker } from "./DiscoveryMotion";
import "./marketplace.css";
import "./marketplace-premium.css";
import "./marketplace-motion.css";

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7v11H3Z" />
        <path d="M9 21v-8h6v8" />
      </>
    ),
    car: (
      <>
        <path d="m4 10 2-6h12l2 6M3 10h18v9H3zM6 19v2m12-2v2M6 14h2m8 0h2" />
      </>
    ),
    phone: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="3" />
        <path d="M10 5h4m-3 14h2" />
      </>
    ),
    tool: (
      <>
        <path d="m4 20 10-10M14 3a6 6 0 0 0 7 7l-5-1-1-5Z" />
        <circle cx="4" cy="20" r="2" />
      </>
    ),
    heart: <path d="M12 21 3 12C-3 4 8-1 12 6c4-7 15-2 9 6Z" />,
    chat: (
      <path d="M21 15a3 3 0 0 1-3 3H9l-6 4V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z" />
    ),
    box: (
      <>
        <path d="m3 7 9-5 9 5v11l-9 5-9-5Z M3 7l9 5 9-5M12 12v11M7 4l10 6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M3 22v-4c0-7 18-7 18 0v4" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    pin: (
      <>
        <path d="M19 9c0 6-7 13-7 13S5 15 5 9a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="9" r="2" />
      </>
    ),
    shield: (
      <>
        <path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z" />
        <path d="m7 12 3 3 7-7" />
      </>
    ),
    tree: (
      <>
        <path d="M12 14v8m0-5-5 5m5-5 5 5" />
        <path d="M7 14a4 4 0 0 1-2-7 5 5 0 0 1 10-3 5 5 0 0 1 3 10Z" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
    check: <path d="m5 12 5 5 9-10" />,
    plane: <path d="M2 16l20-8-6 14-4-6-6-2Zm10 0 10-8" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.box}
    </svg>
  );
}

export const DESTINATIONS = [
  { id: "CI", flag: "🇨🇮", name: "Côte d'Ivoire (Abidjan)", cbmRate: 185000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "SN", flag: "🇸🇳", name: "Sénégal (Dakar)", cbmRate: 190000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "CM", flag: "🇨🇲", name: "Cameroun (Douala)", cbmRate: 195000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "CD", flag: "🇨🇩", name: "RD Congo (Kinshasa)", cbmRate: 275000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "TG", flag: "🇹🇬", name: "Togo (Lomé)", cbmRate: 175000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "BJ", flag: "🇧🇯", name: "Bénin (Cotonou)", cbmRate: 180000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "BF", flag: "🇧🇫", name: "Burkina Faso (Ouagadougou)", cbmRate: 230000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "ML", flag: "🇲🇱", name: "Mali (Bamako)", cbmRate: 240000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "NE", flag: "🇳🇪", name: "Niger (Niamey)", cbmRate: 245000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "GN", flag: "🇬🇳", name: "Guinée (Conakry)", cbmRate: 210000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "GA", flag: "🇬🇦", name: "Gabon (Libreville)", cbmRate: 220000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
];

const DEST_KEY = "baobab_selected_destination";
const DEST_EVENT = "baobab:destination";

export function useUserDestination() {
  const [destId, setDestId] = useState<string>(() => saved<string>(DEST_KEY, "CI"));
  useEffect(() => {
    const sync = () => setDestId(saved<string>(DEST_KEY, "CI"));
    window.addEventListener(DEST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const select = (id: string) => {
    save(DEST_KEY, id);
    setDestId(id);
    window.dispatchEvent(new Event(DEST_EVENT));
  };
  const current = DESTINATIONS.find((d) => d.id === destId) || DESTINATIONS[0];
  return { current, select, all: DESTINATIONS };
}

export const STORY_CATEGORIES = [
  { id: "all", label: "Tout voir", emoji: "✨", universe: "", subcategory: "" },
  { id: "motors", label: "Véhicules", emoji: "🚗", universe: "motors", subcategory: "" },
  { id: "solar", label: "Solaire", emoji: "⚡", universe: "classifieds", subcategory: "Énergie Solaire & Batteries" },
  { id: "ac", label: "Climatiseurs", emoji: "❄️", universe: "classifieds", subcategory: "Électroménager" },
  { id: "phones", label: "Smartphones", emoji: "📱", universe: "classifieds", subcategory: "Téléphones & Tablettes" },
  { id: "laptops", label: "Ordinateurs", emoji: "💻", universe: "classifieds", subcategory: "Informatique & PC" },
  { id: "trade", label: "Outillage", emoji: "🛠️", universe: "trade", subcategory: "" },
  { id: "home", label: "Mobilier", emoji: "🛋️", universe: "home", subcategory: "" },
];

const FAVORITES_KEY = "baobab_favorites";
const FAVORITES_EVENT = "baobab:favorites";

/** Favoris partagés entre l'accueil, la navigation et les fiches, synchronisés entre onglets. */
function useFavorites() {
  const [ids, setIds] = useState<string[]>(() =>
    saved<string[]>(FAVORITES_KEY, []),
  );
  useEffect(() => {
    const sync = () => setIds(saved<string[]>(FAVORITES_KEY, []));
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const toggle = (id: string) => {
    const current = saved<string[]>(FAVORITES_KEY, []);
    save(
      FAVORITES_KEY,
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  };
  return { ids, toggle };
}

export function MarketShell({ children }: { children: React.ReactNode }) {
  const { ids: favoriteIds } = useFavorites();
  const { current: userDest } = useUserDestination();
  return (
    <div className="market">
      <div className="top-note">
        <span className="gold-badge-live">DUBAÏ ➔ AFRIQUE</span>
        <span className="dest-quick-wrap">
          Expédition vers : <strong>{userDest.flag} {userDest.name}</strong>
        </span>
        <span className="transit-quick-info">Express 3–6j · Cargo 14–16j · Maritime 45–50j</span>
      </div>
      <header className="market-header">
        <Link to="/" className="brand">
          <Icon name="tree" size={30} />
          baobab<span>Le bon achat, bien accompagné.</span>
        </Link>
        <nav>
          <NavLink to="/" end>Explorer</NavLink>
          <NavLink to="/favorites">
            Favoris
            {favoriteIds.length > 0 && (
              <em className="nav-count" data-testid="nav-favorites-count">
                {favoriteIds.length}
              </em>
            )}
          </NavLink>
          <NavLink to="/messages">Messages</NavLink>
          <NavLink to="/orders">Mes commandes</NavLink>
        </nav>
        <Link className="account-link" to="/account">
          <Icon name="user" />
          <span>Mon espace</span>
        </Link>
      </header>
      <main className="market-main">{children}</main>
      <footer className="market-footer">
        <Link to="/" className="brand">
          <Icon name="tree" />
          baobab
        </Link>
        <p>
          Des découvertes à Dubaï. Un accompagnement jusqu’à votre destination.
        </p>
        <Link to="/messages">Contacter Baobab</Link>
      </footer>
      <nav className="mobile-nav">
        {[
          ["/", "home", "Explorer"],
          ["/favorites", "heart", "Favoris"],
          ["/messages", "chat", "Messages"],
          ["/orders", "box", "Commandes"],
          ["/account", "user", "Compte"],
        ].map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>
            <span className="mobile-nav-icon">
              <Icon name={icon} size={21} />
              {to === "/favorites" && favoriteIds.length > 0 && (
                <b className="mobile-nav-badge" data-testid="mobile-favorites-count">
                  {favoriteIds.length}
                </b>
              )}
            </span>
            <span className="mobile-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
export function Notice({ children }: { children: React.ReactNode }) {
  return children ? (
    <div className="market-notice" role="status">
      {children}
    </div>
  ) : null;
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="market-empty">
      <Icon name="box" size={40} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
function ProductTile({ p, index = 0 }: { p: any; index?: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { ids, toggle } = useFavorites();
  const favorite = ids.includes(p.id);
  const isRealPhoto = Boolean(p.images?.[0]);

  return (
    <article
      className="listing-tile"
      data-testid="product-tile"
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
    >
      <div className="listing-picture">
        <Link to={`/products/${p.id}`}>
          <img
            src={
              imageFailed ? "/photos/placeholder.svg" : p.images?.[0] ||
              fallbackPhoto(p.subcategory, p.category?.name, p.category?.universe, p.name)
            }
            alt={p.name}
            onError={() => setImageFailed(true)}
            loading="lazy"
            decoding="async"
            className={isRealPhoto ? "is-real" : "is-sample"}
          />
        </Link>
        <button
          className={`favorite ${favorite ? "selected" : ""}`}
          aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={favorite}
          data-testid="favorite-button"
          onClick={() => toggle(p.id)}
        >
          <Icon name="heart" size={19} />
        </button>
        <div className="picture-badges">
          <span className="picture-tag">
            {p.condition === "NEW"
              ? "Neuf"
              : p.condition === "REFURBISHED"
                ? "Reconditionné"
                : "Occasion"}
          </span>
          {isRealPhoto && !imageFailed && (
            <span className="picture-tag is-real">
              <Icon name="check" size={10} /> Photo réelle
            </span>
          )}
          {!isRealPhoto && !imageFailed && <span className="picture-tag is-sample-label">Illustration</span>}
        </div>
      </div>
      <div className="listing-copy">
        <div className="listing-header-line">
          <p className="eyebrow">{p.subcategory && p.subcategory !== "Autres" ? p.subcategory : p.category?.name}</p>
          <span className="origin-tag">🇦🇪 Dubaï</span>
        </div>
        <Link to={`/products/${p.id}`}>
          <h3 title={p.name}>{p.name}</h3>
        </Link>
        <strong>
          {money(p.price)} <small>/ {p.unit || "pièce"}</small>
        </strong>
        <p className="listing-meta">
          <span className="meta-moq">
            {p.minimumOrder > 1
              ? `Min. ${p.minimumOrder} ${p.unit || "pièces"}`
              : "À l’unité"}
          </span>
          <span className="meta-place">
            <Icon name="pin" size={12} />
            {p.location || "Dubaï"}
          </span>
        </p>
        {p.shippingIncluded && (
          <p className="shipping-note">
            Livraison incluse{p.shippingDestination ? ` · ${p.shippingDestination}` : ""}
          </p>
        )}
      </div>
    </article>
  );
}
export function Marketplace({ favorites = false }: { favorites?: boolean }) {
  const [motionPaused, setMotionPaused] = useState(false);
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]),
    [config, setConfig] = useState<any>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const { ids: favoriteIds } = useFavorites();
  const { current: currentDest, select: selectDest, all: allDests } = useUserDestination();
  const universe = params.get("universe") || "",
    search = params.get("search") || "";
  useEffect(() => {
    let active = true;
    setLoading(true);
    call(`/products?${params}`)
      .then((p) => {
        if (active) {
          setProducts(p);
          setError("");
        }
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.toString()]);
  useEffect(() => {
    call("/concierge/config")
      .then(setConfig)
      .catch(() => {});
  }, []);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key === "universe") next.delete("subcategory");
    setParams(next);
  }
  const shown = favorites
    ? products.filter((p) => favoriteIds.includes(p.id))
    : products;
  const conditionLabels: Record<string, string> = {
    NEW: "Neuf",
    USED: "Occasion",
    REFURBISHED: "Reconditionné",
  };
  const sortLabels: Record<string, string> = {
    "price-asc": "Prix croissant",
    "price-desc": "Prix décroissant",
  };
  const activeFilters: { key: string; label: string }[] = [
    universe && {
      key: "universe",
      label: universes.find((u) => u.id === universe)?.name || universe,
    },
    params.get("subcategory") && {
      key: "subcategory",
      label: params.get("subcategory") as string,
    },
    params.get("condition") && {
      key: "condition",
      label: conditionLabels[params.get("condition") as string] || "État",
    },
    params.get("minPrice") && {
      key: "minPrice",
      label: `Dès ${Number(params.get("minPrice")).toLocaleString("fr-FR")} FCFA`,
    },
    params.get("maxPrice") && {
      key: "maxPrice",
      label: `Jusqu’à ${Number(params.get("maxPrice")).toLocaleString("fr-FR")} FCFA`,
    },
    params.get("sort") && {
      key: "sort",
      label: sortLabels[params.get("sort") as string] || "Tri",
    },
    search && { key: "search", label: `« ${search} »` },
  ].filter(Boolean) as { key: string; label: string }[];
  const subs =
    config?.universes?.find((u: any) => u.id === universe)?.categories || [];
  return (
    <>
      {/* 1. Header Compact & Sticky : Recherche, Destination & Catégories (Style Temu / Farfetch Premium) */}
      <section className="app-sticky-header" role="banner">
        <div className="app-top-nav-row">
          <Link
            to="/"
            className="app-brand-badge"
            onClick={() => setParams(new URLSearchParams())}
            title="Accueil Baobab"
          >
            <span className="app-brand-icon">🌳</span>
            <span className="app-brand-text">baobab</span>
          </Link>

          <DiscoverySearch search={search} onSearch={(value) => filter("search", value)} paused={motionPaused} />

          <div className="app-dest-pill" title="Destination de livraison">
            <span className="dest-flag">{currentDest.flag}</span>
            <select
              value={currentDest.id}
              onChange={(e) => selectDest(e.target.value)}
              className="app-dest-select"
              aria-label="Pays de destination"
            >
              {allDests.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.flag} {d.name.split(" ")[0]}
                </option>
              ))}
            </select>
            <span className="dest-chevron">▾</span>
          </div>
        </div>

        {/* Barre de Catégories Défilante avec Glissement Or (Tabs) */}
        <nav className="app-category-strip" aria-label="Catégories">
          {STORY_CATEGORIES.map((cat) => {
            const isSelected =
              cat.universe === "" && cat.subcategory === ""
                ? !universe && !params.get("subcategory")
                : cat.subcategory
                  ? params.get("subcategory") === cat.subcategory
                  : universe === cat.universe;
            return (
              <button
                key={cat.id}
                type="button"
                className={`app-cat-tab ${isSelected ? "active" : ""}`}
                aria-pressed={isSelected}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (cat.universe) next.set("universe", cat.universe);
                  else next.delete("universe");
                  if (cat.subcategory) next.set("subcategory", cat.subcategory);
                  else next.delete("subcategory");
                  setParams(next);
                }}
              >
                <span className="tab-emoji">{cat.emoji}</span>
                <span className="tab-label">{cat.label}</span>
                {isSelected && <span className="tab-gold-indicator" />}
              </button>
            );
          })}
        </nav>
      </section>

      {/* 2. Hero Card Compacte & Dynamique (Sourcing Dubaï) */}
      {!search && (
        <section className="app-hero-strip">
          <div className="hero-strip-badge">
            <span className="live-sparkle">✨</span>
            <span>LA SÉLECTION BAOBAB · DUBAÏ</span>
          </div>
          <div className="hero-strip-main">
            <h1>Vos envies. De Dubaï à chez vous.</h1>
            <p>À l’unité ou en gros · Destination : {currentDest.name}</p>
          </div>
          <div className="hero-strip-pills">
            <span className="pill-item">Aérien & maritime</span>
            <Link className="pill-item highlight" to="/messages">Un projet ? Parlons-en ↗</Link>
          </div>
        </section>
      )}

      <BaobabPromises paused={motionPaused} onPause={() => setMotionPaused((value) => !value)} />
      <LiveActivityTicker paused={motionPaused} />

      {/* 3. Vitrine Flash 2 Colonnes (comme Temu Clearance & Lightning Deals) */}
      {!search && !universe && (
        <section className="app-flash-showcase">
          <button type="button"
            className="flash-card card-motors"
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set("universe", "motors");
              setParams(next);
            }}
          >
            <div className="flash-card-head">
              <span className="flash-label">L’UNIVERS AUTO ↗</span>
              <h3>Véhicules & 4×4</h3>
              <p>4×4, utilitaires & accessoires</p>
            </div>
            <div className="flash-card-foot">
              <span className="flash-badge">Explorer les véhicules →</span>
            </div>
          </button>

          <button type="button"
            className="flash-card card-solar"
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set("universe", "classifieds");
              next.set("subcategory", "Énergie Solaire & Batteries");
              setParams(next);
            }}
          >
            <div className="flash-card-head">
              <span className="flash-label">ÉNERGIE SOLAIRE ↗</span>
              <h3>Solaire & batteries</h3>
              <p>Panneaux, batteries & onduleurs</p>
            </div>
            <div className="flash-card-foot">
              <span className="flash-badge">Découvrir la sélection →</span>
            </div>
          </button>
        </section>
      )}

      {/* 4. Barre de Filtres Rapides & Décompte */}
      <section className="listings">
        <div className="app-feed-header">
          <div className="app-feed-chips">
            <button
              type="button"
              className={`feed-chip ${!params.get("sort") ? "active" : ""}`}
              onClick={() => filter("sort", "")}
            >
              Nouveautés
            </button>
            <button
              type="button"
              className={`feed-chip ${params.get("sort") === "price-asc" ? "active" : ""}`}
              onClick={() => filter("sort", "price-asc")}
            >
              Petits prix
            </button>
            <button
              type="button"
              className={`feed-chip ${params.get("sort") === "price-desc" ? "active" : ""}`}
              onClick={() => filter("sort", "price-desc")}
            >
              Prix décroissants
            </button>
          </div>
          <span className="feed-counter">
            {loading ? "..." : `${shown.length} offres`}
          </span>
        </div>
        <details className="feed-filters">
        <summary>Affiner la sélection <span>État, budget, catégorie</span></summary>
        <div className="filter-bar">
          {subs.length > 0 && (
            <select
              aria-label="Sous-catégorie"
              value={params.get("subcategory") || ""}
              onChange={(e) => filter("subcategory", e.target.value)}
            >
              <option value="">Toutes les sous-catégories</option>
              {subs.map((s: string) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
          <select
            aria-label="État"
            value={params.get("condition") || ""}
            onChange={(e) => filter("condition", e.target.value)}
          >
            <option value="">Tous les états</option>
            <option value="NEW">Neuf</option>
            <option value="USED">Occasion</option>
            <option value="REFURBISHED">Reconditionné</option>
          </select>
          <input
            type="number"
            min="0"
            placeholder="Prix min."
            aria-label="Prix minimum"
            key={`min-${params.get("minPrice") || ""}`}
            defaultValue={params.get("minPrice") || ""}
            onBlur={(e) => e.target.value !== (params.get("minPrice") || "") && filter("minPrice", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          <input
            type="number"
            min="0"
            placeholder="Prix max."
            aria-label="Prix maximum"
            key={`max-${params.get("maxPrice") || ""}`}
            defaultValue={params.get("maxPrice") || ""}
            onBlur={(e) => e.target.value !== (params.get("maxPrice") || "") && filter("maxPrice", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          <select
            aria-label="Tri"
            value={params.get("sort") || ""}
            onChange={(e) => filter("sort", e.target.value)}
          >
            <option value="">Les plus récentes</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
          {params.size > 0 && (
            <button className="text-button" onClick={() => setParams({})}>
              Effacer les filtres
            </button>
          )}
        </div>
        </details>
        {activeFilters.length > 0 && (
          <div className="active-filters" aria-label="Filtres actifs">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                className="filter-chip"
                data-testid="filter-chip"
                aria-label={`Retirer le filtre ${f.label}`}
                onClick={() => filter(f.key, "")}
              >
                {f.label} <Icon name="close" size={13} />
              </button>
            ))}
          </div>
        )}
        <Notice>{error}</Notice>
        {loading ? (
          <div className="listing-grid">
            {[1, 2, 3, 4].map((x) => (
              <div key={x} className="loading-card" />
            ))}
          </div>
        ) : shown.length ? (
          <div className="listing-grid">
            {shown.map((p, i) => (
              <ProductTile key={p.id} p={p} index={i} />
            ))}
          </div>
        ) : (
          <Empty title="Aucune annonce pour le moment">
            <p>
              {favorites
                ? "Enregistrez vos annonces préférées avec le cœur."
                : "Essayez une autre catégorie ou contactez-nous pour votre recherche."}
            </p>
            <Link className="market-button" to="/messages">
              Parler à Baobab
            </Link>
          </Empty>
        )}
      </section>
      <section className="concierge-banner">
        <div>
          <p className="eyebrow">VOTRE ACHAT, ACCOMPAGNÉ</p>
          <h2>
            Vous choisissez.
            <br />
            Nous organisons la suite.
          </h2>
        </div>
        <p>
          Un devis clair, une logistique adaptée à votre destination et un suivi
          jusqu’à la livraison.
        </p>
        <Link className="market-button" to="/messages">
          Discuter de mon projet <Icon name="arrow" size={18} />
        </Link>
      </section>
    </>
  );
}

export function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { current: dest, select: selectDest } = useUserDestination();
  const [p, setP] = useState<any>(null),
    [config, setConfig] = useState<any>(null),
    [image, setImage] = useState(0),
    [qty, setQty] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [shippingMode, setShippingMode] = useState<ShippingMode>("EXPRESS");
  useEffect(() => {
    setP(null);
    call(`/products/${id}`)
      .then((p) => {
        setP(p);
        setQty(Math.ceil((p.minimumOrder || 1) / (p.packSize || 1)) * (p.packSize || 1));
      })
      .catch((e) => setError(e.message));
    call("/concierge/config")
      .then(setConfig)
      .catch(() => {});
  }, [id]);

  const freight = estimateFreight({
    mode: shippingMode,
    destination: dest,
    quantity: qty,
    unitWeightKg: p?.weightKg,
    dimensions: p?.dimensions,
  });
  const totalWeight = freight.realWeightKg;
  const estimatedFreight = freight.cost;
  const productSubtotal = p ? Math.round(Number(p.price) * qty) : 0;
  const estimatedGrandTotal = p?.shippingIncluded ? productSubtotal : productSubtotal + estimatedFreight;

  // Synchronisation automatique si le mode actuel n'est pas autorisé pour ce poids
  useEffect(() => {
    if (freight.availableModes.length > 0 && !freight.availableModes.includes(shippingMode)) {
      setShippingMode(freight.availableModes[0]);
    }
  }, [freight.availableModes, shippingMode]);

  async function discuss() {
    setBusy(true);
    try {
      const modeDescription = freight.mode === "EXPRESS"
        ? "Fret Aérien Express (3 à 6 jours, 12 500 F/kg)"
        : freight.mode === "CARGO"
          ? "Fret Aérien Cargo (14 à 16 jours, 8 600 F/kg)"
          : `Fret Maritime / Conteneur (45 à 50 jours, ${money(dest.cbmRate)}/m³)`;
      const bodyText = `Bonjour Baobab, je souhaite un devis pour ${qty} ${p.unit || "pièce(s)"} : ${p.name}. Destination : ${dest.name} en ${modeDescription}. Poids estimé : ${totalWeight} kg. Total estimé : ${money(estimatedGrandTotal)}.`;
      const active = getDeviceActiveConversation();
      if (active) {
        try {
          await call(
            `/concierge/conversations/${active.id}/messages`,
            { body: bodyText, requestKey: requestKey() },
            active.token,
          );
          navigate(`/messages/${active.id}`);
          return;
        } catch {
          // If active conversation expired or invalid on server, fall through to create a new one
        }
      }

      const c = await call("/concierge/conversations", {
        productId: id,
        body: bodyText,
        requestKey: requestKey(),
      });
      setDeviceActiveConversation(c);
      navigate(`/messages/${c.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!p)
    return (
      <>
        <Notice>{error}</Notice>
        <Empty
          title={error ? "Annonce indisponible" : "Chargement de l’annonce…"}
        />
      </>
    );
  const message = `Bonjour Baobab, je souhaite un devis pour ${qty} ${p.unit || "pièce(s)"} de "${p.name}" vers ${dest.name} en ${freight.modeLabel}. Référence ${p.id}. ${window.location.href}`;
  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Explorer</Link>
        <span>/</span>
        <Link to={`/?universe=${p.category?.universe}`}>
          {p.category?.name}
        </Link>
        <span>/</span>
        {p.name}
      </div>
      <div className="detail-grid">
        <section>
          <div className="detail-photo">
            <img
              src={
                p.images?.[image] ||
                fallbackPhoto(p.subcategory, p.category?.name, p.category?.universe, p.name)
              }
              alt={p.name}
              decoding="async"
              className={p.images?.[image] ? "" : "is-sample"}
            />
            {!p.images?.length && (
              <span className="sample-note">Photo d’illustration</span>
            )}
          </div>
          <div className="thumbnails">
            {p.images?.map((url: string, i: number) => (
              <button
                key={url}
                onClick={() => setImage(i)}
                aria-label={`Photo ${i + 1}`}
              >
                <img src={url} alt="" />
              </button>
            ))}
          </div>
          <div className="detail-description">
            <h2>À propos de cette annonce</h2>
            <p>{p.description}</p>
            <div className="specs">
              {Object.entries({
                Vendeur: p.seller?.shopName || "Baobab Dubaï Officiel",
                État:
                  p.condition === "NEW"
                    ? "Neuf"
                    : p.condition === "USED"
                      ? "Occasion"
                      : "Reconditionné",
                Localisation: p.location,
                Conditionnement: `${p.packSize} ${p.unit}`,
                ...(p.weightKg ? { "Poids (kg)": p.weightKg } : {}),
                ...(p.dimensions ? { Dimensions: p.dimensions } : {}),
                ...p.attributes,
              }).map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <strong>{String(v)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
        <aside className="detail-panel">
          <p className="eyebrow">{p.subcategory}</p>
          <h1>{p.name}</h1>
          <div className="detail-price">
            {money(p.price)}
            <small>par {p.unit}</small>
          </div>
          <div className="seller-trust-badge">
            <span className="seller-badge-icon">👑</span>
            <span className="seller-badge-text">
              Vendu par <strong>{p.seller?.shopName || "Baobab Dubaï Officiel"}</strong>
              <em className="seller-verified-tag">✓ Vérifié</em>
            </span>
          </div>
          <p className="delivery-label">
            {p.shippingIncluded
              ? `Livraison incluse à ${p.shippingDestination}`
              : "Hors transport et frais d’importation — devis sur demande"}
          </p>
          <div className="market-divider" />
          <p>
            <Icon name="pin" size={17} /> Disponible à {p.location}
          </p>
          <label>
            Quantité souhaitée
            <input
              type="number"
              min={p.packSize || 1}
              step={p.packSize || 1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            />
          </label>
          <p className="muted">
            Minimum : {Math.ceil((p.minimumOrder || 1) / (p.packSize || 1)) * (p.packSize || 1)} {p.unit}. Commande par multiples de{" "}
            {p.packSize}. Une exception peut être discutée avec Baobab.
          </p>
          <p className="muted">
            Minimum produits : {money(Math.round(Number(p.price) * 100) * Math.ceil((p.minimumOrder || 1) / (p.packSize || 1)) * (p.packSize || 1) / 100)}.
            {" "}{p.shippingIncluded ? "Frais d’importation éventuels à confirmer au devis." : "Hors transport et frais d’importation."}
          </p>
          <div className="freight-calculator">
            <div className="freight-header">
              <Icon name="shield" size={17} />
              <strong>Simulateur Fret & Transit Dubaï ➔ Afrique</strong>
            </div>
            <label>
              Destination d’arrivée
              <select
                value={dest.id}
                onChange={(e) => selectDest(e.target.value)}
              >
                {DESTINATIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="shipping-mode-selector">
              {freight.availableModes.includes("EXPRESS") && (
                <button
                  type="button"
                  className={`mode-btn ${freight.mode === "EXPRESS" ? "active" : ""}`}
                  onClick={() => setShippingMode("EXPRESS")}
                >
                  <span className="mode-btn-title">✈️ Express (3–6 j)</span>
                  <small>12 500 F/kg</small>
                </button>
              )}
              {freight.availableModes.includes("CARGO") && (
                <button
                  type="button"
                  className={`mode-btn ${freight.mode === "CARGO" ? "active" : ""}`}
                  onClick={() => setShippingMode("CARGO")}
                >
                  <span className="mode-btn-title">✈️ Cargo (14–16 j)</span>
                  <small>8 600 F/kg</small>
                </button>
              )}
              {freight.availableModes.includes("SEA") && (
                <button
                  type="button"
                  className={`mode-btn ${freight.mode === "SEA" ? "active" : ""}`}
                  onClick={() => setShippingMode("SEA")}
                >
                  <span className="mode-btn-title">🚢 Maritime (45–50 j)</span>
                  <small>{money(dest.cbmRate)}/m³</small>
                </button>
              )}
            </div>
            {freight.restrictionNote && (
              <div className="shipping-restriction-badge">
                <Icon name="shield" size={13} />
                <span>{freight.restrictionNote}</span>
              </div>
            )}
            <div className="freight-breakdown">
              <div>
                <span>Marchandise ({qty} {p.unit || "pcs"})</span>
                <b>{money(productSubtotal)}</b>
              </div>
              <div>
                <span>
                  {freight.modeLabel}
                  <br />
                  <small style={{ color: "#94a3b8" }}>
                    Poids total : ~{totalWeight.toFixed(1)} kg
                    {freight.mode === "SEA" ? ` · Volume : ${freight.volumeCbm.toFixed(2)} m³` : ""}
                    {freight.basis === "volumetric" ? " (poids volumétrique)" : ""}
                  </small>
                </span>
                <b>{p.shippingIncluded ? "Inclus" : money(estimatedFreight)}</b>
              </div>
              <div className="freight-total">
                <span>Total estimé rendu {dest.name.split(" ")[0]}</span>
                <strong>{money(estimatedGrandTotal)}</strong>
              </div>
            </div>
          </div>
          <Notice>{error}</Notice>
          <button
            className="market-button full"
            onClick={discuss}
            disabled={busy}
          >
            <Icon name="chat" />
            {busy ? "Ouverture…" : "Discuter avec Baobab"}
          </button>
          {config?.whatsapp && (
            <a
              className="market-button secondary full"
              href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
            >
              Contacter Baobab sur WhatsApp
            </a>
          )}
          <div className="reassurance">
            <Icon name="shield" />
            <div>
              <strong>Un interlocuteur unique</strong>
              <p>
                Baobab confirme la disponibilité, prépare votre devis et
                organise votre livraison. Aucun paiement avant accord sur le
                montant définitif.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
function MessageBody({ body }: { body: string }) {
  return (
    <>
      {body.split(/(https:\/\/[^\s]+)/).map((s, i) => {
        try {
          const url = new URL(s);
          if (
            url.origin === window.location.origin ||
            url.hostname === "baobab-kohl.vercel.app"
          )
            return (
              <a key={i} href={url.pathname + url.hash}>
                Ouvrir mon suivi privé →
              </a>
            );
        } catch {}
        return <span key={i}>{s}</span>;
      })}
    </>
  );
}
export function Inbox() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<any>(null),
    [error, setError] = useState(""),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false);
  const contacts = saved<any[]>("baobab_conversations", []),
    selected = contacts.find((c) => c.id === id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-route device to its active conversation if /messages opened directly
  useEffect(() => {
    if (!id) {
      const active = getDeviceActiveConversation();
      if (active) {
        navigate(`/messages/${active.id}`, { replace: true });
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    let active = true;
    setConversation(null);
    if (!id) return;
    if (!selected) {
      setError(
        "Ce navigateur ne possède pas l’accès privé à cette conversation.",
      );
      return;
    }
    const refresh = () =>
      call(`/concierge/conversations/${id}`, undefined, selected.token)
        .then((c) => {
          if (active) {
            setConversation(c);
            setError("");
          }
        })
        .catch((e) => active && setError(e.message));
    refresh();

    // Fast 1.2s polling for instantaneous admin reply updates
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 1200);

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages?.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;
    setBusy(true);
    const reqKey = requestKey();
    const activeConv = selected || getDeviceActiveConversation();

    // Optimistic UI update: display sent message immediately!
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      role: "CLIENT",
      body: cleanText,
      createdAt: new Date().toISOString(),
    };
    setText("");
    if (activeConv) {
      setConversation((prev: any) =>
        prev
          ? { ...prev, messages: [...(prev.messages || []), optimisticMsg] }
          : { id: activeConv.id, subject: activeConv.subject, messages: [optimisticMsg] }
      );
    }

    try {
      if (activeConv) {
        await call(
          `/concierge/conversations/${activeConv.id}/messages`,
          { body: cleanText, requestKey: reqKey },
          activeConv.token,
        );
        const updated = await call(
          `/concierge/conversations/${activeConv.id}`,
          undefined,
          activeConv.token,
        );
        setConversation(updated);
        setDeviceActiveConversation({
          id: activeConv.id,
          token: activeConv.token,
          subject: updated.subject || activeConv.subject,
        });
        if (!id || id !== activeConv.id) {
          navigate(`/messages/${activeConv.id}`, { replace: true });
        }
      } else {
        const c = await call("/concierge/conversations", {
          body: cleanText,
          requestKey: reqKey,
        });
        setDeviceActiveConversation(c);
        navigate(`/messages/${c.id}`);
      }
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="inbox-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">VOTRE INTERLOCUTEUR</p>
          <h1>Parlons de votre projet.</h1>
        </div>
        <span className="service-label">Équipe Baobab</span>
      </div>
      <div className="inbox-grid">
        <aside>
          <Link className="market-button secondary full" to="/messages">
            Nouvelle conversation
          </Link>
          {contacts.map((c) => (
            <NavLink key={c.id} to={`/messages/${c.id}`}>
              <Icon name="chat" />
              <div>
                <strong>{c.subject}</strong>
                <small>Conversation privée avec Baobab</small>
              </div>
            </NavLink>
          ))}
          <p className="muted">
            Vos conversations invitées sont accessibles depuis ce navigateur.
            Conservez votre lien de suivi reçu lors de la commande.
          </p>
        </aside>
        <div className="chat-panel">
          <div className="chat-title">
            <Icon name="tree" />
            <div>
              <strong>
                {conversation?.subject || "Bienvenue chez Baobab"}
              </strong>
              <small className="chat-live-badge">
                <span className="live-dot" /> En direct · Réponse instantanée
              </small>
            </div>
          </div>
          <div className="chat-messages" aria-live="polite">
            {!id && (
              <div className="chat-intro">
                <Icon name="chat" size={40} />
                <h2>Comment pouvons-nous vous aider ?</h2>
                <p>
                  Indiquez ce que vous recherchez, les quantités et votre
                  destination. Pour votre première commande, notre équipe vous
                  demandera vos coordonnées.
                </p>
              </div>
            )}
            {conversation?.messages.map((m: any) => (
              <div
                key={m.id}
                className={`chat-message ${m.role === "CLIENT" ? "mine" : ""}`}
              >
                <small>{m.role === "CLIENT" ? "Vous" : "Baobab"}</small>
                <p>
                  <MessageBody body={m.body} />
                </p>
                <time>{date(m.createdAt)}</time>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <Notice>{error}</Notice>
          <form className="chat-compose" onSubmit={send}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={4000}
              required
              placeholder="Écrivez à Baobab…"
              aria-label="Votre message"
            />
            <button
              className="market-button"
              disabled={busy || (Boolean(id) && !selected)}
            >
              {busy ? "Envoi…" : "Envoyer"}
              <Icon name="arrow" size={18} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
export function Tracking({ account = false }: { account?: boolean }) {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [agreed, setAgreed] = useState(false),
    [paymentKey, setPaymentKey] = useState(() => requestKey());
  const token =
    window.location.hash.slice(1) ||
    saved<Record<string, string>>("baobab_tracking", {})[id!];
  const path = account ? `/concierge/mine/${id}` : `/concierge/tracking/${id}`;
  const refresh = () =>
    call(path, undefined, account ? undefined : token)
      .then((o) => {
        setOrder(o);
        setError("");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (!account && token) {
      const links = saved<Record<string, string>>("baobab_tracking", {});
      links[id!] = token;
      save("baobab_tracking", links);
    }
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [id, token, account]);
  async function accept() {
    setBusy(true);
    try {
      await call(
        `/concierge/tracking/${id}/accept`,
        { revision: order.currentRevision },
        token,
      );
      setAgreed(false);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function declare(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      fd = new FormData(form);
    setBusy(true);
    try {
      await call(
        `/concierge/tracking/${id}/payment`,
        {
          amount: fd.get("amount"),
          reference: fd.get("reference"),
          requestKey: paymentKey,
        },
        token,
      );
      form.reset();
      setPaymentKey(requestKey());
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!order)
    return (
      <>
        <Notice>{error}</Notice>
        <Empty
          title={error ? "Suivi inaccessible" : "Chargement de votre suivi…"}
        >
          <p>Utilisez le lien privé transmis par Baobab.</p>
        </Empty>
      </>
    );
  const q = order.quote,
    f = order.finance;
  return (
    <section className="tracking-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">VOTRE SUIVI PRIVÉ</p>
          <h1>{order.reference}</h1>
          <p>
            Bonjour {order.firstName}, retrouvez ici chaque étape de votre
            achat.
          </p>
        </div>
        <span className="status-pill">{stages[order.status]}</span>
      </div>
      <Notice>{error}</Notice>
      <div className="tracking-grid">
        <section>
          <div className="tracking-card">
            <h2>
              {order.status === "QUOTED"
                ? "Votre devis à confirmer"
                : "Votre commande"}
            </h2>
            {q ? (
              <>
                <p className="muted">
                  <span className="print-only">
                    BAOBAB · FACTURE PROFORMA · Réf. {order.reference || id}
                  </span>
                  Version {q.revision} ·{" "}
                  {order.acceptedRevision === q.revision
                    ? `Acceptée le ${date(order.acceptedAt)}`
                    : `Valable jusqu’au ${date(q.expiresAt)}`}
                </p>
                {q.lines.map((l: any) => (
                  <div className="order-line" key={l.productId}>
                    <div>
                      <strong>{l.name}</strong>
                      <small>
                        {l.quantity} × {money(l.unitPrice)}
                      </small>
                    </div>
                    <b>{money(l.lineTotal)}</b>
                  </div>
                ))}
                <dl className="amount-list">
                  <div>
                    <dt>Produits</dt>
                    <dd>{money(q.productTotal)}</dd>
                  </div>
                  <div>
                    <dt>Transport & frais convenus</dt>
                    <dd>{money(q.logisticsCharge)}</dd>
                  </div>
                  {Number(q.discount) > 0 && (
                    <div>
                      <dt>Remise</dt>
                      <dd>− {money(q.discount)}</dd>
                    </div>
                  )}
                  <div className="total">
                    <dt>Total du devis</dt>
                    <dd>{money(q.total)}</dd>
                  </div>
                </dl>
                <p>
                  <strong>Destination</strong>
                  <br />
                  {q.destination}
                </p>
                <p className="quote-terms">{q.terms}</p>
                <p className="muted">
                  {q.paymentMode === "COD"
                    ? "Paiement à la livraison"
                    : q.paymentMode === "DEPOSIT"
                      ? "Acompte puis solde selon les conditions du devis"
                      : "Paiement avant expédition"}
                  {q.dueDate && ` · Échéance : ${date(q.dueDate)}`}
                </p>
                {order.status === "QUOTED" && !account && (
                  <>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                      />
                      J’accepte le montant, les frais inclus ou exclus et les
                      conditions de ce devis.
                    </label>
                    <button
                      className="market-button full"
                      disabled={
                        !agreed || busy || new Date(q.expiresAt) < new Date()
                      }
                      onClick={accept}
                    >
                      Confirmer ce devis · {money(q.total)}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="market-button secondary full"
                  style={{ marginTop: "12px" }}
                  onClick={() => window.print()}
                >
                  <Icon name="box" size={17} /> Télécharger / Imprimer la Proforma (PDF)
                </button>
              </>
            ) : (
              <p>
                Baobab prépare votre devis. Vous pourrez vérifier le montant
                définitif avant de confirmer.
              </p>
            )}
          </div>
          <div className="tracking-card">
            <h2>Historique de votre commande</h2>
            {order.events.map((e: any, i: number) => (
              <div className="timeline-event" key={i}>
                <span className="timeline-dot" />
                <div>
                  <strong>{stages[e.status] || e.status}</strong>
                  <p>{e.message}</p>
                  <time>{date(e.createdAt)}</time>
                </div>
              </div>
            ))}
            {q?.estimatedDelivery && (
              <p className="delivery-label">
                Livraison estimée : {q.estimatedDelivery}
              </p>
            )}
          </div>
        </section>
        <aside>
          <div className="tracking-card payment-summary">
            <Icon name="shield" size={30} />
            <p>Montant restant à régler</p>
            <h2>{money(f.due)}</h2>
            <p>
              Déjà payé : <strong>{money(f.paid)}</strong>
            </p>
            {Number(f.refundDue) > 0 && (
              <Notice>Remboursement à traiter : {money(f.refundDue)}</Notice>
            )}
            {f.pendingPayments > 0 && (
              <Notice>
                Un paiement est déclaré et en cours de vérification. Il n’est
                pas encore déduit du solde.
              </Notice>
            )}
            {Number(f.due) === 0 &&
              order.acceptedAt &&
              order.status !== "CANCELLED" && (
                <span className="status-pill">Paiement intégral reçu</span>
              )}
          </div>
          {!account &&
            token &&
            order.acceptedAt &&
            Number(f.due) > 0 &&
            order.status !== "QUOTED" && (
              <div className="tracking-card">
                <h3>Vous avez effectué un paiement ?</h3>
                <p className="muted">
                  Déclarez sa référence. Baobab vérifiera la réception avant de
                  mettre à jour votre solde.
                </p>
                <form
                  className="stack-form"
                  onChange={() => setPaymentKey(requestKey())}
                  onSubmit={declare}
                >
                  <label>
                    Montant versé (FCFA)
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={f.due}
                      required
                    />
                  </label>
                  <label>
                    Référence du paiement
                    <input
                      name="reference"
                      minLength={2}
                      maxLength={300}
                      required
                    />
                  </label>
                  <button className="market-button secondary" disabled={busy}>
                    Déclarer le paiement
                  </button>
                </form>
              </div>
            )}
          <div className="tracking-card">
            <h3>Vos paiements</h3>
            {order.payments.length ? (
              order.payments.map((p: any) => (
                <div className="order-line" key={p.id}>
                  <div>
                    <strong>
                      {p.kind === "CUSTOMER_REFUND"
                        ? "Remboursement"
                        : "Paiement"}
                    </strong>
                    <small>
                      {p.state === "CONFIRMED"
                        ? "Confirmé"
                        : p.state === "REJECTED"
                          ? "Non validé"
                          : "En vérification"}{" "}
                      · {date(p.createdAt)}
                    </small>
                  </div>
                  <b>{money(p.amount)}</b>
                </div>
              ))
            ) : (
              <p className="muted">Aucun paiement enregistré.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
export function Purchases() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (user)
      call("/concierge/mine")
        .then(setData)
        .catch((e) => setError(e.message));
  }, [user]);
  const links = saved<Record<string, string>>("baobab_tracking", {});
  return (
    <section className="narrow-page">
      <p className="eyebrow">TOUJOURS À VOS CÔTÉS</p>
      <h1>Mes commandes</h1>
      <Notice>{error}</Notice>
      {data?.verificationRequired && (
        <Notice>
          La connexion de test ne vérifie pas votre téléphone. Utilisez vos
          liens privés pour consulter vos commandes. Le rattachement de
          l’historique nécessite un contact vérifié.
        </Notice>
      )}
      {data?.orders?.map((o: any) => (
        <Link
          className="tracking-card order-link"
          to={`/my-orders/${o.id}`}
          key={o.id}
        >
          <strong>{o.reference}</strong>
          <span>{stages[o.status]}</span>
          <b>{money(o.finance.due)} à régler</b>
        </Link>
      ))}
      {Object.keys(links).map((id, i) => (
        <Link
          className="tracking-card order-link"
          to={`/tracking/${id}#${links[id]}`}
          key={id}
        >
          <Icon name="box" />
          <strong>Suivi privé enregistré {i + 1}</strong>
          <Icon name="arrow" />
        </Link>
      ))}
      {!Object.keys(links).length && !data?.orders?.length && (
        <Empty title="Votre prochain achat commence ici">
          <p>
            Votre suivi sera accessible depuis le lien privé transmis par
            Baobab, même sans compte.
          </p>
          <Link className="market-button" to="/">
            Explorer les annonces
          </Link>
        </Empty>
      )}
      {user && (
        <Link className="text-button" to="/legacy-orders">
          Consulter mes anciennes commandes
        </Link>
      )}
    </section>
  );
}
export function MarketAccount() {
  const { user, logout } = useAuth();
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function register(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await call("/sellers/register", {
        shopName: fd.get("shopName"),
        city: fd.get("city"),
      });
      setSuccess(
        "Votre demande a été envoyée à Baobab. Vos annonces seront disponibles après approbation.",
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="narrow-page">
      <p className="eyebrow">BIENVENUE CHEZ BAOBAB</p>
      <h1>Votre espace</h1>
      <div className="tracking-card">
        {user ? (
          <>
            <h2>{user.phone}</h2>
            <p>
              Compte{" "}
              {user.role === "BUYER"
                ? "client"
                : user.role === "SELLER"
                  ? "commerçant"
                  : "partenaire Baobab"}
            </p>
            <button className="market-button secondary" onClick={logout}>
              Se déconnecter
            </button>
          </>
        ) : (
          <>
            <h2>Explorez librement, avec ou sans compte.</h2>
            <p>
              Un compte est facultatif pour discuter et commander avec Baobab.
            </p>
            <Link className="market-button" to="/login">
              Se connecter
            </Link>
          </>
        )}
      </div>
      <Link className="tracking-card order-link" to="/orders">
        <Icon name="box" />
        <strong>Mes commandes et suivis</strong>
        <Icon name="arrow" />
      </Link>
      <Link className="tracking-card order-link" to="/messages">
        <Icon name="chat" />
        <strong>Mes échanges avec Baobab</strong>
        <Icon name="arrow" />
      </Link>
      <div className="tracking-card">
        <h2>Vous êtes commerçant ?</h2>
        <p>
          Présentez vos produits. Baobab gère les échanges clients, les devis et
          l’acheminement.
        </p>
        <Notice>{error || success}</Notice>
        {user?.role === "BUYER" && !success ? (
          <form className="stack-form" onSubmit={register}>
            <label>
              Nom de votre commerce
              <input name="shopName" required minLength={2} />
            </label>
            <label>
              Ville
              <input name="city" required minLength={2} />
            </label>
            <button className="market-button" disabled={busy}>
              Demander un espace commerçant
            </button>
          </form>
        ) : user?.role === "SELLER" || user?.role === "ADMIN" ? (
          <a
            className="market-button secondary"
            href="https://baobab-admin-psi.vercel.app/"
          >
            Ouvrir mon espace professionnel
          </a>
        ) : !user ? (
          <Link to="/login" className="text-button">
            Connectez-vous pour faire une demande →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
