import { FormEvent, useEffect, useState } from "react";
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
  money,
  requestKey,
  saved,
  save,
  stages,
  universes,
} from "../lib/concierge";
import { estimateFreight } from "../lib/freight";
import { fallbackPhoto } from "../lib/photos";
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
  { id: "CI", flag: "🇨🇮", name: "Côte d'Ivoire (Abidjan)", airRate: 8500, seaRate: 180000, daysAir: "5–8 j", daysSea: "25–30 j" },
  { id: "SN", flag: "🇸🇳", name: "Sénégal (Dakar)", airRate: 8500, seaRate: 180000, daysAir: "5–8 j", daysSea: "24–28 j" },
  { id: "BF", flag: "🇧🇫", name: "Burkina Faso (Ouagadougou)", airRate: 9000, seaRate: 210000, daysAir: "6–9 j", daysSea: "30–35 j" },
  { id: "TG", flag: "🇹🇬", name: "Togo (Lomé)", airRate: 8000, seaRate: 175000, daysAir: "5–8 j", daysSea: "22–28 j" },
  { id: "BJ", flag: "🇧🇯", name: "Bénin (Cotonou)", airRate: 8200, seaRate: 175000, daysAir: "5–8 j", daysSea: "22–28 j" },
  { id: "ML", flag: "🇲🇱", name: "Mali (Bamako)", airRate: 9200, seaRate: 220000, daysAir: "7–10 j", daysSea: "32–38 j" },
  { id: "NE", flag: "🇳🇪", name: "Niger (Niamey)", airRate: 9500, seaRate: 230000, daysAir: "7–10 j", daysSea: "35–40 j" },
  { id: "GN", flag: "🇬🇳", name: "Guinée (Conakry)", airRate: 8800, seaRate: 195000, daysAir: "6–9 j", daysSea: "25–30 j" },
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
  { id: "motors", label: "Véhicules GCC", emoji: "🚗", universe: "motors", subcategory: "" },
  { id: "solar", label: "Solaire 5-10kW", emoji: "⚡", universe: "classifieds", subcategory: "Énergie Solaire & Batteries" },
  { id: "ac", label: "Clim Tropicale", emoji: "❄️", universe: "classifieds", subcategory: "Électroménager" },
  { id: "phones", label: "iPhones & Tech", emoji: "📱", universe: "classifieds", subcategory: "Téléphones & Tablettes" },
  { id: "laptops", label: "PC & Laptops", emoji: "💻", universe: "classifieds", subcategory: "Informatique & PC" },
  { id: "trade", label: "Groupes & Chantier", emoji: "🛠️", universe: "trade", subcategory: "" },
  { id: "home", label: "Mobilier Bureau", emoji: "🛋️", universe: "home", subcategory: "" },
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
          Livraison & Dédouanement : <strong>{userDest.flag} {userDest.name}</strong>
        </span>
        <span className="transit-quick-info">Aérien {userDest.daysAir} · Maritime {userDest.daysSea}</span>
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
  const { ids, toggle } = useFavorites();
  const favorite = ids.includes(p.id);
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
              p.images?.[0] ||
              fallbackPhoto(p.subcategory, p.category?.name, p.category?.universe, p.name)
            }
            alt={p.name}
            loading="lazy"
            decoding="async"
            className={p.images?.[0] ? "" : "is-sample"}
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
        <span className="picture-tag">
          {p.condition === "NEW"
            ? "Neuf"
            : p.condition === "REFURBISHED"
              ? "Reconditionné"
              : "Occasion"}
        </span>
      </div>
      <div className="listing-copy">
        <p className="eyebrow">{p.subcategory && p.subcategory !== "Autres" ? p.subcategory : p.category?.name}</p>
        <Link to={`/products/${p.id}`}>
          <h3>{p.name}</h3>
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
      <section className="discovery-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="hero-dot" /> DUBAÏ → AFRIQUE · LE COMMERCE, ACCOMPAGNÉ</p>
          <h1>
            {favorites ? (
              "Vos belles trouvailles."
            ) : (
              <>
                Vos envies, ici.
                <br />
                <em>Le meilleur de Dubaï, à portée.</em>
              </>
            )}
          </h1>
          <p>
            Pour vous, votre maison ou votre activité. Explorez les annonces,
            échangez avec notre équipe et recevez un devis adapté à votre destination.
          </p>
          <form
            className="market-search"
            onSubmit={(e) => {
              e.preventDefault();
              const value = new FormData(e.currentTarget).get("search");
              filter("search", String(value || ""));
            }}
          >
            <Icon name="search" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Quel sera votre prochain achat ?"
              aria-label="Rechercher une annonce"
            />
            <button type="submit">
              Rechercher <Icon name="arrow" size={18} />
            </button>
          </form>
          <div className="hero-promises">
            <span>
              <Icon name="shield" size={17} /> Annonces validées
            </span>
            <span>
              <Icon name="chat" size={17} /> Équipe Baobab à vos côtés
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-sun" />
          <svg viewBox="0 0 420 260">
            <path
              d="M0 240h420M25 240V150h45v90m20 0V95h50v145m25 0V130h45v110m25 0V70h22V35h7V8h4v27h7v35h22v170m20 0V120h60v120m15 0V180h35v60"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              d="M100 110v110m15-110v110m210-80v80m20-80v80"
              stroke="currentColor"
              opacity=".35"
            />
          </svg>
          <div className="art-caption">
            SÉLECTION À DUBAÏ<span>Accompagnement Baobab</span>
          </div>
          <div className="hero-passport">
            <span className="passport-label">VOTRE ACHAT, EN TOUTE CLARTÉ</span>
            <div className="passport-route"><strong>Dubaï</strong><Icon name="arrow" size={24} /><strong>Chez vous</strong></div>
            <div className="passport-divider" />
            <div className="passport-service"><Icon name="shield" size={25} /><div><strong>Un devis avant de décider.</strong><span>Un interlocuteur à chaque étape.</span></div></div>
          </div>
        </div>
      </section>

      {/* Barre de destination et de fret interactif */}
      <div className="dest-destination-bar" role="region" aria-label="Destination et délais">
        <div className="dest-selector-box">
          <Icon name="pin" size={16} />
          <span className="dest-lead">Destination :</span>
          <select
            value={currentDest.id}
            onChange={(e) => selectDest(e.target.value)}
            className="dest-select-native"
            aria-label="Changer le pays de destination"
          >
            {allDests.map((d) => (
              <option key={d.id} value={d.id}>
                {d.flag} {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="dest-modes-tags">
          <span className="mode-pill air"><Icon name="plane" size={13} /> Aérien {currentDest.daysAir}</span>
          <span className="mode-pill sea">🚢 Maritime {currentDest.daysSea}</span>
          <span className="mode-pill customs"><Icon name="check" size={13} /> Dédouanement garanti</span>
        </div>
      </div>

      {/* Story Circles tactiles : Catégories à forte désirabilité */}
      <section className="story-circles-bar" aria-label="Catégories vedettes">
        <div className="story-circles-track">
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
                className={`story-circle-btn ${isSelected ? "active" : ""}`}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (cat.universe) next.set("universe", cat.universe);
                  else next.delete("universe");
                  if (cat.subcategory) next.set("subcategory", cat.subcategory);
                  else next.delete("subcategory");
                  setParams(next);
                }}
              >
                <div className="story-circle-glow">
                  <span className="story-emoji">{cat.emoji}</span>
                </div>
                <span className="story-label">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="listings">
        <div className="section-heading">
          <div>
            <p className="eyebrow">À EXPLORER</p>
            <h2>
              {favorites
                ? "Mes favoris"
                : universe
                  ? universes.find((u) => u.id === universe)?.name
                  : "Les dernières annonces"}
            </h2>
          </div>
          <span>
            {loading
              ? "Chargement…"
              : `${shown.length} annonce${shown.length > 1 ? "s" : ""} à découvrir`}
          </span>
        </div>
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
    [shippingMode, setShippingMode] = useState<"AIR" | "SEA">("AIR");
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
  const totalWeight = freight.chargeableWeightKg;
  const estimatedFreight = freight.cost;
  const productSubtotal = p ? Math.round(Number(p.price) * qty) : 0;
  const estimatedGrandTotal = p?.shippingIncluded ? productSubtotal : productSubtotal + estimatedFreight;

  async function discuss() {
    setBusy(true);
    try {
      const modeLabel = shippingMode === "AIR" ? `Fret Aérien Express (${dest.daysAir})` : `Fret Maritime (${dest.daysSea})`;
      const c = await call("/concierge/conversations", {
        productId: id,
        body: `Bonjour Baobab, je souhaite un devis pour ${qty} ${p.unit || "pièce(s)"} : ${p.name}. Destination : ${dest.name} en ${modeLabel}. Total estimé : ${money(estimatedGrandTotal)}.`,
        requestKey: requestKey(),
      });
      save("baobab_conversations", [
        ...saved<any[]>("baobab_conversations", []),
        c,
      ]);
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
  const message = `Bonjour Baobab, je souhaite un devis pour ${qty} ${p.unit || "pièce(s)"} de "${p.name}" vers ${dest.name} en ${shippingMode === "AIR" ? "Fret Aérien Express" : "Fret Maritime"}. Référence ${p.id}. ${window.location.href}`;
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
              <button
                type="button"
                className={`mode-btn ${shippingMode === "AIR" ? "active" : ""}`}
                onClick={() => setShippingMode("AIR")}
              >
                ✈️ Aérien ({dest.daysAir})
              </button>
              <button
                type="button"
                className={`mode-btn ${shippingMode === "SEA" ? "active" : ""}`}
                onClick={() => setShippingMode("SEA")}
              >
                🚢 Maritime ({dest.daysSea})
              </button>
            </div>
            <div className="freight-breakdown">
              <div>
                <span>Marchandise ({qty} {p.unit || "pcs"})</span>
                <b>{money(productSubtotal)}</b>
              </div>
              <div>
                <span>
                  Fret & dédouanement estimé (~{totalWeight.toFixed(1)} kg{" "}
                  {freight.basis === "volumetric" ? "volumétriques" : "réels"}
                  {shippingMode === "SEA" && freight.volumeCbm > 0
                    ? ` · ${freight.volumeCbm.toFixed(2)} m³`
                    : ""}
                  )
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
    const timer = setInterval(refresh, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      if (id && selected) {
        await call(
          `/concierge/conversations/${id}/messages`,
          { body: text, requestKey: requestKey() },
          selected.token,
        );
        setConversation(
          await call(
            `/concierge/conversations/${id}`,
            undefined,
            selected.token,
          ),
        );
      } else {
        const c = await call("/concierge/conversations", {
          body: text,
          requestKey: requestKey(),
        });
        save("baobab_conversations", [...contacts, c]);
        navigate(`/messages/${c.id}`);
      }
      setText("");
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
              <small>Une équipe humaine pour vous accompagner</small>
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
                  : "administrateur"}
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
