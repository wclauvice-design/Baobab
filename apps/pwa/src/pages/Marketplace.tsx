import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { useUnreadMessages } from "../lib/unreadMessages";
import { usePendingClientCounts } from "../lib/clientCounts";
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
import { DiscoverySearch, DynamicTrustRibbon, HeroAnimatedHeadline } from "./DiscoveryMotion";
import {
  getNotificationPermission,
  hasNotificationSupport,
  notifyNewMessage,
  requestNotificationPermission,
} from "../lib/notifications";
import { isVehicleProduct } from "../lib/vehicles";
import { isVideoUrl } from "../lib/media";
import {
  peekProduct,
  rememberProduct,
  rememberProducts,
} from "../lib/productCache";
import { VehicleCard } from "../components/VehicleCard";
import { DubizzleVehicleDetail } from "../components/DubizzleVehicleDetail";
import { ImageSwipeGallery } from "../components/ImageSwipeGallery";
import "./marketplace.css";
import "./marketplace-premium.css";
import "./marketplace-motion.css";
import "./marketplace-refined.css";

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
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
    check: <path d="m5 12 5 5 9-10" />,
    plane: <path d="M2 16l20-8-6 14-4-6-6-2Zm10 0 10-8" />,
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
      </>
    ),
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
  { id: "BF", flag: "🇧🇫", name: "Burkina Faso (Ouagadougou)", cbmRate: 230000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "CI", flag: "🇨🇮", name: "Côte d'Ivoire (Abidjan)", cbmRate: 185000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "SN", flag: "🇸🇳", name: "Sénégal (Dakar)", cbmRate: 190000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "CM", flag: "🇨🇲", name: "Cameroun (Douala)", cbmRate: 195000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "CD", flag: "🇨🇩", name: "RD Congo (Kinshasa)", cbmRate: 275000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "TG", flag: "🇹🇬", name: "Togo (Lomé)", cbmRate: 175000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "BJ", flag: "🇧🇯", name: "Bénin (Cotonou)", cbmRate: 180000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "ML", flag: "🇲🇱", name: "Mali (Bamako)", cbmRate: 240000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "NE", flag: "🇳🇪", name: "Niger (Niamey)", cbmRate: 245000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "GN", flag: "🇬🇳", name: "Guinée (Conakry)", cbmRate: 210000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
  { id: "GA", flag: "🇬🇦", name: "Gabon (Libreville)", cbmRate: 220000, daysExpress: "3–6 j", daysCargo: "14–16 j", daysSea: "45–50 j" },
];

const DEST_KEY = "baobab_selected_destination";
const DEST_EVENT = "baobab:destination";
export const DEFAULT_DEST_ID = "BF";

export function useUserDestination() {
  const [destId, setDestId] = useState<string>(() => saved<string>(DEST_KEY, DEFAULT_DEST_ID));
  useEffect(() => {
    const sync = () => setDestId(saved<string>(DEST_KEY, DEFAULT_DEST_ID));
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
  { id: "all", label: "Tout voir", emoji: "✨", universe: "", categoryKey: "", subcategoryKey: "", fallbackSubcategory: "" },
  { id: "motors", label: "Véhicules", emoji: "🚗", universe: "motors", categoryKey: "", subcategoryKey: "", fallbackSubcategory: "" },
  { id: "solar", label: "Solaire", emoji: "⚡", universe: "classifieds", categoryKey: "energie-solaire", subcategoryKey: "", fallbackSubcategory: "Énergie Solaire & Batteries" },
  { id: "ac", label: "Climatiseurs", emoji: "❄️", universe: "classifieds", categoryKey: "electromenager", subcategoryKey: "climatisation-chauffage", fallbackSubcategory: "Électroménager" },
  { id: "phones", label: "Smartphones", emoji: "📱", universe: "classifieds", categoryKey: "telephones-tablettes", subcategoryKey: "", fallbackSubcategory: "Téléphones & Tablettes" },
  { id: "laptops", label: "Ordinateurs", emoji: "💻", universe: "classifieds", categoryKey: "informatique-pc", subcategoryKey: "", fallbackSubcategory: "Informatique & PC" },
  { id: "trade", label: "Outillage", emoji: "🛠️", universe: "trade", categoryKey: "outillage", subcategoryKey: "", fallbackSubcategory: "" },
  { id: "home", label: "Mobilier", emoji: "🛋️", universe: "home", categoryKey: "salons-mobilier", subcategoryKey: "", fallbackSubcategory: "" },
];

interface TaxonomyView {
  universe: any;
  category: any;
}

/** Toutes les catégories canoniques exposées par `/concierge/config`. */
function taxonomyViews(config: any): TaxonomyView[] {
  return (config?.taxonomy?.universes || []).flatMap((universe: any) =>
    (universe.categories || []).map((category: any) => ({ universe, category })),
  );
}

function findTaxonomyCategory(config: any, key: string): TaxonomyView | null {
  if (!key) return null;
  return (
    taxonomyViews(config).find(({ category }) => category.slug === key) || null
  );
}

function findTaxonomySubcategory(config: any, key: string) {
  if (!key) return null;
  for (const view of taxonomyViews(config)) {
    const subcategory = (view.category.subcategories || []).find(
      (item: any) => item.slug === key,
    );
    if (subcategory) return { ...view, subcategory };
  }
  return null;
}

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


export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  return (
    <select
      className="bb-currency-select"
      value={currency}
      onChange={(e) => setCurrency(e.target.value as any)}
      aria-label="Choisir la devise"
    >
      <option value="XOF">FCFA</option>
      <option value="AED">AED</option>
      <option value="EUR">EUR</option>
      <option value="USD">USD</option>
    </select>
  );
}

export function MarketShell({ children }: { children: React.ReactNode }) {
  const { ids: favoriteIds } = useFavorites();
  const { current: userDest, select: selectDest, all: allDests } = useUserDestination();
  const { unreadCount } = useUnreadMessages();
  const pending = usePendingClientCounts();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const search = params.get("search") || "";
  const showDestBar =
    location.pathname === "/" ||
    location.pathname === "/search" ||
    location.pathname === "/favorites" ||
    location.pathname.startsWith("/shop/") ||
    location.pathname.startsWith("/store/");

  function submitSearch(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("search", value);
    else next.delete("search");
    if (location.pathname === "/" || location.pathname === "/search") {
      setParams(next);
    } else {
      navigate(`/?${next.toString()}`);
    }
  }

  const badge = (count: number) =>
    count > 0 ? <b className="bb-badge">{count > 99 ? "99+" : count}</b> : null;

  return (
    <div className="market">
      <header className="bb-header">
        <Link
          to="/"
          className="bb-brand"
          onClick={() => setParams(new URLSearchParams())}
          aria-label="Baobab, retour à l'accueil"
        >
          <span className="bb-brand-mark"><Icon name="tree" size={19} /></span>
          <span className="bb-brand-name">
            baobab
            <span className="bb-brand-sub">Dubaï → Afrique</span>
          </span>
        </Link>

        <div className="bb-header-search">
          <DiscoverySearch search={search} onSearch={submitSearch} paused={false} />
        </div>

        <div className="bb-header-actions">
          <NavLink
            to="/messages"
            className={({ isActive }) => `bb-icon-btn bb-hide-sm ${isActive ? "active" : ""}`}
            aria-label="Messages"
          >
            <Icon name="chat" size={20} />
            {badge(unreadCount)}
          </NavLink>
          <NavLink
            to="/favorites"
            className={({ isActive }) => `bb-icon-btn ${isActive ? "active" : ""}`}
            aria-label="Favoris"
          >
            <Icon name="heart" size={20} />
            {badge(favoriteIds.length)}
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) => `bb-icon-btn ${isActive ? "active" : ""}`}
            aria-label="Mes commandes"
          >
            <Icon name="box" size={20} />
            {badge(pending.total)}
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) => `bb-icon-btn bb-hide-sm ${isActive ? "active" : ""}`}
            aria-label="Mon espace"
          >
            <Icon name="user" size={20} />
          </NavLink>
        </div>
      </header>

      {showDestBar && (
        <div className="bb-dest-bar">
          <span className="bb-flag" aria-hidden="true">{userDest.flag}</span>
          <span className="bb-dest-label">Livraison vers</span>
          <select
            value={userDest.id}
            onChange={(e) => selectDest(e.target.value)}
            className="bb-dest-select"
            aria-label="Pays de destination"
          >
            {allDests.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name.split(" (")[0]}
              </option>
            ))}
          </select>
          <span className="bb-dest-spacer" />
          <span className="bb-dest-transit">Express 3–6 j</span>
          <CurrencySelector />
        </div>
      )}

      <main className="market-main">{children}</main>

      <footer className="market-footer">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          <div>
            <Link to="/" className="brand">
              <Icon name="tree" />
              baobab
            </Link>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", opacity: 0.85 }}>
              Des découvertes à Dubaï. Un accompagnement de confiance jusqu’à votre destination.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "0.85rem", alignItems: "center" }}>
            <Link to="/messages" style={{ color: "inherit", textDecoration: "underline" }}>Contacter Baobab</Link>
            <Link to="/terms" style={{ color: "inherit", textDecoration: "underline" }}>Conditions Générales (CGUV)</Link>
            <Link to="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>Politique de Confidentialité</Link>
          </div>
        </div>
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
              {to === "/messages" && unreadCount > 0 && (
                <b className="mobile-nav-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </b>
              )}
              {to === "/orders" && pending.total > 0 && (
                <b className="mobile-nav-badge">
                  {pending.total > 99 ? "99+" : pending.total}
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
function productCategoryLabel(product: any): string {
  return product?.canonicalCategory?.label || product?.category?.name || "";
}

function subcategoryLabel(product: any): string {
  const usable = (value: any) =>
    typeof value === "string" &&
    value.trim() !== "" &&
    value.trim().toLowerCase() !== "autres";
  const canonical: string[] = Array.isArray(product?.canonicalSubcategories)
    ? product.canonicalSubcategories.filter(usable)
    : [];
  const list: string[] = canonical.length
    ? canonical
    : Array.isArray(product?.subcategories)
      ? product.subcategories.filter(usable)
      : [];
  if (list.length) return list.join(' · ');
  return usable(product?.subcategory) ? product.subcategory : '';
}

/** Quantité initiale respectant le minimum de commande et le conditionnement. */
function defaultQuantity(product: any): number {
  const pack = product?.packSize || 1;
  return Math.ceil((product?.minimumOrder || 1) / pack) * pack;
}

function ProductTile({ p, index = 0 }: { p: any; index?: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { ids, toggle } = useFavorites();
  const favorite = ids.includes(p.id);
  const isRealPhoto = Boolean(p.images?.[0]);

  if (isVehicleProduct(p)) {
    return (
      <div style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}>
        <VehicleCard
          product={p}
          isFavorite={favorite}
          onToggleFavorite={toggle}
        />
      </div>
    );
  }

  return (
    <article
      className="listing-tile"
      data-testid="product-tile"
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
    >
      <div className="listing-picture">
        <Link to={`/products/${p.id}`} state={{ product: p }}>
          {!imageFailed && isVideoUrl(p.images?.[0]) ? (
            <video
              src={p.images[0]}
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
              aria-label={p.name}
              className="is-real"
            />
          ) : (
            <img
              src={
                imageFailed ? "/photos/placeholder.svg" : p.images?.[0] ||
                fallbackPhoto(p.subcategory, productCategoryLabel(p), p.category?.universe, p.name)
              }
              alt={p.name}
              onError={() => setImageFailed(true)}
              loading="lazy"
              decoding="async"
              className={isRealPhoto ? "is-real" : "is-sample"}
            />
          )}
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
        {p.condition && (
          <span className={`picture-tag condition-tag condition-${String(p.condition).toLowerCase()}`}>
            {p.condition === "NEW" ? "Neuf" : p.condition === "REFURBISHED" ? "Reconditionné" : "Occasion"}
          </span>
        )}
        {!isRealPhoto && !imageFailed && <span className="picture-tag is-sample-label">Illustration</span>}
      </div>
      <div className="listing-copy">
        <Link to={`/products/${p.id}`} state={{ product: p }}>
          <h3 title={p.name}>{p.name}</h3>
        </Link>
        <strong>
          {money(p.price)} <small>/ {p.unit || "pièce"}</small>
        </strong>
        <span className="listing-meta">
          <Icon name="pin" size={11} />
          {p.location || "Dubaï"} · {p.shippingIncluded ? "Livraison incluse" : "Expédié"}
        </span>
      </div>
    </article>
  );
}
/** Derniers résultats par requête, pour un retour arrière instantané. */
const feedCache = new Map<string, any[]>();

export function Marketplace({ favorites = false }: { favorites?: boolean }) {
  const [motionPaused, setMotionPaused] = useState(false);
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>(
    () => feedCache.get(params.toString()) || [],
  ),
    [config, setConfig] = useState<any>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(
      () => !feedCache.has(params.toString()),
    );
  const { ids: favoriteIds } = useFavorites();
  const { current: currentDest } = useUserDestination();
  const universe = params.get("universe") || "",
    search = params.get("search") || "",
    categoryKey = params.get("categoryKey") || "",
    subcategoryKey = params.get("subcategoryKey") || "";
  useEffect(() => {
    let active = true;
    const key = params.toString();
    const cachedFeed = feedCache.get(key);
    if (cachedFeed) {
      // Retour depuis une fiche : le fil réapparaît immédiatement.
      setProducts(cachedFeed);
      setLoading(false);
    } else {
      setLoading(true);
    }
    call(`/products?${params}`)
      .then((p) => {
        if (active) {
          feedCache.set(key, p);
          rememberProducts(p);
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
    if (key === "universe") {
      next.delete("categoryKey");
      next.delete("subcategoryKey");
    }
    setParams(next);
  }
  function filterCategory(value: string) {
    const next = new URLSearchParams(params);
    if (value) {
      next.set("categoryKey", value);
      const view = findTaxonomyCategory(config, value);
      if (view) next.set("universe", view.universe.id);
    } else {
      next.delete("categoryKey");
      next.delete("universe");
    }
    next.delete("subcategoryKey");
    setParams(next);
  }
  function filterSubcategory(value: string) {
    const next = new URLSearchParams(params);
    if (value) {
      next.set("subcategoryKey", value);
      const view = findTaxonomySubcategory(config, value);
      if (view) {
        next.set("categoryKey", view.category.slug);
        next.set("universe", view.universe.id);
      }
    } else {
      next.delete("subcategoryKey");
    }
    setParams(next);
  }
  function clearFilter(key: string) {
    const next = new URLSearchParams(params);
    next.delete(key);
    if (key === "categoryKey") next.delete("subcategoryKey");
    if (key === "universe") {
      next.delete("categoryKey");
      next.delete("subcategoryKey");
    }
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
  const selectedCategoryView = findTaxonomyCategory(config, categoryKey);
  const selectedSubcategoryView = findTaxonomySubcategory(config, subcategoryKey);
  const activeFilters: { key: string; label: string }[] = [
    universe && {
      key: "universe",
      label: universes.find((u) => u.id === universe)?.name || universe,
    },
    selectedCategoryView && {
      key: "categoryKey",
      label: selectedCategoryView.category.label,
    },
    selectedSubcategoryView && {
      key: "subcategoryKey",
      label: selectedSubcategoryView.subcategory.label,
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
  const subcategoryGroups = selectedCategoryView
    ? [
        {
          label: selectedCategoryView.category.label,
          items: selectedCategoryView.category.subcategories || [],
        },
      ]
    : taxonomyViews(config).map(({ universe: parent, category }) => ({
        label: `${parent.name} · ${category.label}`,
        items: category.subcategories || [],
      }));
  return (
    <>
      {/* 1. Hero éditorial — un seul point focal */}
      {!search && !favorites && (
        <section className="bb-hero">
          <div className="bb-eyebrow-container flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="bb-eyebrow">Sourcing Direct Dubaï &amp; Asie</span>
          </div>
          <HeroAnimatedHeadline />
          <div className="bb-hero-actions mt-3">
            <button
              type="button"
              className="bb-btn bb-btn-primary"
              onClick={() =>
                document
                  .getElementById("bb-feed")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Explorer les nouveautés <Icon name="arrow" size={14} />
            </button>
            <Link className="bb-link" to="/messages">
              💬 Devis sur mesure
            </Link>
          </div>
        </section>
      )}

      {/* 2. Réassurance & activité dynamique (Temu-inspired compact ribbon) */}
      <DynamicTrustRibbon paused={motionPaused} />

      {/* 3. Catégories — chips sobres, sans emoji */}
      <nav className="bb-cat-strip" aria-label="Catégories">
        {STORY_CATEGORIES.map((cat) => {
          const isSelected =
            !cat.universe && !cat.categoryKey && !cat.subcategoryKey
              ? !universe && !categoryKey && !subcategoryKey
              : cat.subcategoryKey
                ? subcategoryKey === cat.subcategoryKey
                : cat.categoryKey
                  ? categoryKey === cat.categoryKey && !subcategoryKey
                  : universe === cat.universe && !categoryKey;
          return (
            <button
              key={cat.id}
              type="button"
              className={`bb-chip ${isSelected ? "active" : ""}`}
              aria-pressed={isSelected}
              onClick={() => {
                const next = new URLSearchParams(params);
                if (cat.universe) next.set("universe", cat.universe);
                else next.delete("universe");
                if (config?.taxonomy) {
                  if (cat.categoryKey) next.set("categoryKey", cat.categoryKey);
                  else next.delete("categoryKey");
                  if (cat.subcategoryKey)
                    next.set("subcategoryKey", cat.subcategoryKey);
                  else next.delete("subcategoryKey");
                  next.delete("subcategory");
                } else {
                  next.delete("categoryKey");
                  next.delete("subcategoryKey");
                  if (cat.fallbackSubcategory)
                    next.set("subcategory", cat.fallbackSubcategory);
                  else next.delete("subcategory");
                }
                setParams(next);
              }}
            >
              <span className="bb-chip-icon" aria-hidden="true">{cat.emoji}</span>
              <span className="bb-chip-label">{cat.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 4. Fil */}
      <section className="listings" id="bb-feed">
        <div className="bb-sec-head">
          <h2>
            {search
              ? `« ${search} »`
              : universe
                ? universes.find((u) => u.id === universe)?.name || "Sélection"
                : "Nouveautés"}
          </h2>
          <span className="feed-counter">
            {loading ? "…" : `${shown.length} offres`}
          </span>
        </div>
        <div className="app-feed-header">
          <div className="app-feed-chips">
            <button
              type="button"
              className={`feed-chip ${!params.get("sort") ? "active" : ""}`}
              onClick={() => filter("sort", "")}
            >
              <span className="feed-chip-icon" aria-hidden="true">⚡</span>
              <span>Nouveautés</span>
            </button>
            <button
              type="button"
              className={`feed-chip ${params.get("sort") === "price-asc" ? "active" : ""}`}
              onClick={() => filter("sort", "price-asc")}
            >
              <span className="feed-chip-icon" aria-hidden="true">🏷️</span>
              <span>Petits prix</span>
            </button>
            <button
              type="button"
              className={`feed-chip ${params.get("sort") === "price-desc" ? "active" : ""}`}
              onClick={() => filter("sort", "price-desc")}
            >
              <span className="feed-chip-icon" aria-hidden="true">📈</span>
              <span>Prix décroissants</span>
            </button>
          </div>
        </div>
        <details className="feed-filters">
        <summary>
          <span className="summary-title">⚙️ Affiner la sélection</span>
          {activeFilters.length > 0 ? (
            <span className="filter-badge-active">{activeFilters.length} actif{activeFilters.length > 1 ? "s" : ""}</span>
          ) : (
            <span className="summary-desc">État, budget, catégorie</span>
          )}
        </summary>
        <div className="filter-bar">
          {config?.taxonomy ? (
            <>
              <select
                aria-label="Catégorie"
                value={categoryKey}
                onChange={(e) => filterCategory(e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {(config?.taxonomy?.universes || []).map((u: any) => (
                  <optgroup key={u.id} label={u.name}>
                    {(u.categories || []).map((c: any) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                aria-label="Sous-catégorie"
                value={subcategoryKey}
                onChange={(e) => filterSubcategory(e.target.value)}
              >
                <option value="">Toutes les sous-catégories</option>
                {subcategoryGroups
                  .filter((group: any) => (group.items || []).length > 0)
                  .map((group: any) => (
                    <optgroup key={group.label} label={group.label}>
                      {(group.items || []).map((s: any) => (
                        <option key={s.slug} value={s.slug}>
                          {s.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
            </>
          ) : (
            <select
              aria-label="Sous-catégorie"
              value={params.get("subcategory") || ""}
              onChange={(e) => filter("subcategory", e.target.value)}
            >
              <option value="">Toutes les sous-catégories</option>
              {(config?.universes || []).map((u: any) => (
                <optgroup key={u.id} label={u.name}>
                  {(u.categories || []).map((name: string) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
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
                onClick={() => clearFilter(f.key)}
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

/**
 * Squelette doux affiché uniquement en accès direct (lien partagé) quand
 * aucune donnée n'est encore en cache. Il reprend la silhouette exacte de la
 * fiche pour éviter tout saut visuel, sans texte « chargement ».
 */
function ListingSkeleton() {
  return (
    <div className="product-detail-page listing-skeleton mx-auto max-w-4xl pb-16 text-slate-100" aria-busy="true" aria-label="Ouverture de l’annonce">
      <div className="mb-3 flex items-center justify-between">
        <span className="skeleton-line" style={{ width: 150, height: 12 }} />
        <span className="skeleton-line" style={{ width: 110, height: 12 }} />
      </div>

      <div className="detail-hero-top">
        <div className="skeleton-block aspect-square sm:aspect-[4/3] w-full max-h-[460px] rounded-2xl" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="skeleton-block h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="product-detail-summary mt-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <span className="skeleton-line" style={{ width: 170, height: 32 }} />
        <span className="skeleton-line mt-4" style={{ width: 120, height: 10 }} />
        <span className="skeleton-line mt-3" style={{ width: '85%', height: 20 }} />
        <span className="skeleton-line mt-2" style={{ width: '55%', height: 20 }} />
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3">
          <span className="skeleton-line" style={{ width: 190, height: 12 }} />
          <span className="skeleton-line" style={{ width: 100, height: 12 }} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
        <span className="skeleton-line" style={{ width: 150, height: 16 }} />
        <span className="skeleton-line mt-4" style={{ width: '100%', height: 12 }} />
        <span className="skeleton-line mt-2" style={{ width: '92%', height: 12 }} />
        <span className="skeleton-line mt-2" style={{ width: '70%', height: 12 }} />
      </div>
    </div>
  );
}

export function ListingDetail() {
  const { id } = useParams();
  const location = useLocation();
  useLayoutEffect(() => {
    // A listing opens at its gallery even after scrolling through the feed.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [id]);
  const navigate = useNavigate();
  const { current: dest, select: selectDest } = useUserDestination();
  const seed = (location.state as { product?: any } | null)?.product;
  const [p, setP] = useState<any>(() => {
    const cached = peekProduct(id);
    if (cached) return cached;
    return seed && String(seed.id) === String(id) ? seed : null;
  }),
    [config, setConfig] = useState<any>(null),
    [image, setImage] = useState(0),
    [showFullDesc, setShowFullDesc] = useState(false),
    [qty, setQty] = useState(() => {
      const cached = peekProduct(id);
      return cached ? defaultQuantity(cached) : 1;
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [shippingMode, setShippingMode] = useState<ShippingMode>("EXPRESS"),
    [sellerProducts, setSellerProducts] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    // Affichage instantané depuis le cache, sans écran de chargement.
    const cached = peekProduct(id);
    if (cached) {
      setP(cached);
      setQty(defaultQuantity(cached));
    } else {
      setP((current: any) =>
        current && String(current.id) === String(id) ? current : null,
      );
    }
    setImage(0);
    setShowFullDesc(false);
    setError("");
    call(`/products/${id}`)
      .then((fresh) => {
        if (!active) return;
        rememberProduct(fresh);
        setP(fresh);
        setQty(defaultQuantity(fresh));
        const sellerId = fresh.sellerId || fresh.seller?.id;
        if (sellerId) {
          call("/products")
            .then((all: any[]) => {
              if (!active) return;
              rememberProducts(all);
              setSellerProducts(
                all
                  .filter(
                    (item: any) =>
                      (item.sellerId === sellerId || item.seller?.id === sellerId) &&
                      item.id !== fresh.id
                  )
                  .slice(0, 4)
              );
            })
            .catch(() => {});
        }
      })
      .catch((e) => active && setError(e.message));
    call("/concierge/config")
      .then(setConfig)
      .catch(() => {});
    return () => {
      active = false;
    };
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
  if (!p) {
    if (error) {
      return (
        <>
          <Notice>{error}</Notice>
          <Empty title="Annonce indisponible" />
        </>
      );
    }
    return <ListingSkeleton />;
  }
  const message = `Bonjour Baobab, je souhaite un devis pour ${qty} ${p.unit || "pièce(s)"} de "${p.name}" vers ${dest.name} en ${freight.modeLabel}. Référence ${p.id}. ${window.location.href}`;

  if (isVehicleProduct(p)) {
    return (
      <DubizzleVehicleDetail
        product={p}
        destination={dest}
        onDiscuss={discuss}
        busy={busy}
      />
    );
  }

  const rawDescription = (p.description || "").trim();
  const firstLine = rawDescription.split("\n")[0]?.trim() || "";
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
  const rawDesc =
    firstLine && normalize(firstLine) === normalize(String(p.name || ""))
      ? rawDescription.slice(firstLine.length).trim()
      : rawDescription;
  const isLongDesc = rawDesc.length > 220;
  const displayedDesc = isLongDesc && !showFullDesc ? `${rawDesc.slice(0, 220)}…` : rawDesc;

  return (
    <>
      <div className="product-detail-page mx-auto max-w-4xl pb-28">
        {/* 1. VISUEL HERO SUPÉRIEUR : SWIPE TACTILE HORIZONTAL FLUIDE (Image propre sans encombrement) */}
        <ImageSwipeGallery
          images={p.images || []}
          title={p.name}
          aspectRatioClass="aspect-square sm:aspect-[4/3]"
        />

        {/* 2. NOM & PRIX (Carte Blanc Pur Haut de Gamme) */}
        <div className="product-detail-summary mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
          {/* LIGNE MARKETING STATUTAIRE & RÉASSURANCE (Placée proprement sous l'image) */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-lg bg-[#0B1E17] text-white px-3 py-1 text-xs font-bold shadow-sm">
              {p.condition === "NEW" ? "Neuf" : p.condition === "REFURBISHED" ? "Reconditionné" : "Occasion"}
            </span>
            <span className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 text-xs font-semibold">
              ✓ Contrôle qualité Dubaï
            </span>
            <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 text-xs font-semibold">
              🇦🇪 Import Direct Dubaï
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2">
            <span>{subcategoryLabel(p) || productCategoryLabel(p)}</span>
            <span className="text-slate-500 font-normal normal-case">Réf: {p.id}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#0B1E17] leading-tight tracking-tight">
            {p.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B1E17] tracking-tight">
              {money(p.price)}
              <small className="text-xs font-normal text-slate-500 ml-2">par {p.unit || "pièce"}</small>
            </div>
            {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) && (
              <span className="text-sm text-slate-500 line-through">
                Prix catalogue : {money(p.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Vendeur & Localisation */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Icon name="shield" size={14} />
              <span>Vendu par <strong>{p.seller?.shopName || "Baobab Dubaï Officiel"}</strong></span>
              <span className="rounded-full bg-[#E4F1EB] px-2 py-0.5 text-[10px] font-bold text-[#1F7A5C]">✓ Vérifié</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <Icon name="pin" size={14} />
              <span>Disponible à {p.location || "Dubaï"}</span>
            </div>
          </div>

          {/* Bandeau Conciergerie Baobab */}
          <div className="mt-5 rounded-2xl bg-[#FBF0D8]/60 border border-[#E8A33D]/30 p-4 sm:p-5 flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#173E32] text-[#FFF8E6] font-bold text-lg shadow-sm">
              🛡️
            </div>
            <div className="text-xs leading-relaxed text-[#0B1E17]">
              <div className="font-bold text-sm text-[#0B1E17] mb-0.5">
                Conciergerie Baobab Dubaï & Contrôle Qualité Inclus (+15%)
              </div>
              <p className="text-slate-700">
                Audit physique de la marchandise à Dubaï avant expédition, formalités de transit et garantie de livraison sécurisée vers <strong>{dest.name}</strong>.
              </p>
            </div>
          </div>
        </div>

        <a className="product-detail-jump" href="#product-purchase">Aller au simulateur de livraison et devis →</a>

        {/* 3. DESCRIPTION AVEC OPTION « VOIR PLUS... » */}
        <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
          <h2 className="text-lg font-bold font-heading text-[#0B1E17] mb-3 flex items-center gap-2">
            À propos du produit
          </h2>

          <div className="prose max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
            {displayedDesc}
          </div>

          {isLongDesc && (
            <button
              type="button"
              onClick={() => setShowFullDesc(!showFullDesc)}
              aria-expanded={showFullDesc}
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-[#0B1E17] transition-colors cursor-pointer"
            >
              <span>{showFullDesc ? "▲ Voir moins de description" : "▼ Voir toute la description…"}</span>
            </button>
          )}
        </div>

        {/* 4. CARACTÉRISTIQUES DU PRODUIT */}
        <details className="product-detail-section mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
          <summary className="text-lg font-bold font-heading text-[#0B1E17] cursor-pointer">
            Caractéristiques techniques
          </summary>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
            {Object.entries({
              État: p.condition === "NEW" ? "Neuf" : p.condition === "USED" ? "Occasion" : "Reconditionné",
              Localisation: p.location || "Dubaï",
              Conditionnement: `${p.packSize || 1} ${p.unit || "pièce"}`,
              ...(p.weightKg ? { "Poids unitaire": `${p.weightKg} kg` } : {}),
              ...(p.dimensions ? { "Dimensions": p.dimensions } : {}),
              ...p.attributes,
            }).map(([k, v]) => (
              <div key={k} className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                <span className="text-slate-500">{k}</span>
                <strong className="font-semibold text-[#0B1E17]">{String(v)}</strong>
              </div>
            ))}
          </div>
        </details>

        {/* 5. COMMANDE, FRET & ACTIONS RAPIDES */}
        <div id="product-purchase" className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-[0_2px_16px_rgba(23,62,50,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <label className="text-sm font-bold text-[#0B1E17] flex items-center gap-2">
              <span>Quantité souhaitée :</span>
              <input
                type="number"
                min={p.packSize || 1}
                step={p.packSize || 1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-24 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-sm font-bold text-[#0B1E17] text-center"
              />
            </label>
            <span className="text-xs text-slate-500">
              Total marchandise : <strong className="text-[#0B1E17] font-bold text-sm">{money(Math.round(Number(p.price) * qty))}</strong>
            </span>
          </div>

          {/* Simulateur Fret & Transit */}
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
                  <span className="mode-btn-title">Express (3–6 j)</span>
                  <small>12 500 F/kg</small>
                </button>
              )}
              {freight.availableModes.includes("CARGO") && (
                <button
                  type="button"
                  className={`mode-btn ${freight.mode === "CARGO" ? "active" : ""}`}
                  onClick={() => setShippingMode("CARGO")}
                >
                  <span className="mode-btn-title">Cargo (14–16 j)</span>
                  <small>8 600 F/kg</small>
                </button>
              )}
              {freight.availableModes.includes("SEA") && (
                <button
                  type="button"
                  className={`mode-btn ${freight.mode === "SEA" ? "active" : ""}`}
                  onClick={() => setShippingMode("SEA")}
                >
                  <span className="mode-btn-title">Maritime (45–50 j)</span>
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
                  <small style={{ color: "var(--muted)" }}>
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

          {/* Boutons d'action rapides */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="flex-1 rounded-2xl bg-[#173E32] py-3.5 px-4 text-center text-sm font-bold text-[#FFF8E6] hover:bg-[#1f4d3e] transition-colors shadow-lg shadow-[#173E32]/20"
              onClick={discuss}
              disabled={busy}
            >
              {busy ? "Ouverture…" : "Discuter & Demander un devis"}
            </button>

            {config?.whatsapp && (
              <a
                className="flex-1 rounded-2xl bg-[#25D366] py-3.5 px-4 text-center text-sm font-bold text-white hover:bg-[#20bd5a] transition-colors shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2"
                href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>💬</span>
                <span>WhatsApp direct</span>
              </a>
            )}
          </div>

          <div className="sponsor-share-banner mt-3">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Lien de l’annonce copié. Vous pouvez le partager.");
              }}
              className="sponsor-share-btn"
            >
              <Icon name="share" size={15} />
              <span>Copier le lien de l’annonce</span>
            </button>
          </div>
        </div>
      </div>

      {sellerProducts.length > 0 && (
        <div className="seller-showcase-section">
          <div className="seller-showcase-header">
            <h3>Autres articles de {p.seller?.shopName || "cette boutique"}</h3>
            <Link to={`/shop/${p.sellerId || p.seller?.id || "seller-baobab-official"}`}>
              Voir toute la boutique ({sellerProducts.length + 1}) →
            </Link>
          </div>
          <div className="seller-showcase-grid">
            {sellerProducts.map((rel: any) => (
              <Link key={rel.id} to={`/products/${rel.id}`} state={{ product: rel }} className="seller-showcase-card">
                <div className="seller-showcase-img">
                  {isVideoUrl(rel.images?.[0]) ? (
                    <video
                      src={rel.images[0]}
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={rel.images?.[0] || fallbackPhoto(rel.subcategory, rel.category?.name, rel.category?.universe, rel.name)}
                      alt={rel.name}
                    />
                  )}
                </div>
                <div className="seller-showcase-info">
                  <h4>{rel.name}</h4>
                  <p className="seller-showcase-price">{money(rel.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="bb-detail-cta">
        <div className="bb-detail-cta-price">
          <strong>{money(p.price)}</strong>
          <small>{p.shippingIncluded ? "Douane & livraison incluses" : "Hors fret · devis immédiat"}</small>
        </div>
        <button type="button" onClick={discuss} disabled={busy}>
          {busy ? "Ouverture…" : "Demander un devis"}
          <Icon name="arrow" size={14} />
        </button>
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
  const [notifState, setNotifState] = useState<NotificationPermission>(getNotificationPermission);
  const contacts = saved<any[]>("baobab_conversations", []),
    selected = contacts.find((c) => c.id === id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(0);

  // Monitor incoming messages and trigger sound / browser notifications
  useEffect(() => {
    const msgs = conversation?.messages || [];
    if (prevMsgCountRef.current > 0 && msgs.length > prevMsgCountRef.current) {
      const added = msgs.slice(prevMsgCountRef.current);
      const incoming = added.find((m: any) => m.role === "BAOBAB");
      if (incoming) {
        notifyNewMessage("Équipe Baobab", incoming.body);
      }
    }
    prevMsgCountRef.current = msgs.length;
  }, [conversation?.messages]);

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
              <div className="chat-status-row">
                <small className="chat-live-badge">
                  <span className="live-dot" /> En direct · Réponse instantanée
                </small>
                {hasNotificationSupport() && notifState !== "granted" && (
                  <button
                    type="button"
                    className="notif-optin-chip"
                    onClick={async () => {
                      const p = await requestNotificationPermission();
                      setNotifState(p);
                    }}
                  >
                    🔔 Activer alertes
                  </button>
                )}
                {notifState === "granted" && (
                  <span className="notif-active-chip">🔔 Alertes actives</span>
                )}
              </div>
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Bonjour ! Voici le lien de suivi en temps réel de ma commande Baobab (${order.reference || id}) :\n${window.location.origin}/tracking/${id}${token ? '#' + token : ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="market-button full"
                    style={{
                      background: "#25D366",
                      color: "#fff",
                      borderColor: "#25D366",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem"
                    }}
                  >
                    <Icon name="chat" size={17} /> Partager WhatsApp
                  </a>
                  <button
                    type="button"
                    className="market-button secondary full"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontSize: "0.85rem"
                    }}
                    onClick={() => {
                      const shareLink = `${window.location.origin}/tracking/${id}${token ? '#' + token : ''}`;
                      navigator.clipboard?.writeText(shareLink);
                      alert("Lien de suivi copié dans le presse-papier !");
                    }}
                  >
                    <Icon name="link" size={17} /> Copier le lien
                  </button>
                </div>
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
          <div className="tracking-card escrow-status-box" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontWeight: 700 }}>
              <Icon name="shield" size={20} />
              <span>Garantie Paiement Protégé Baobab</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#15803d", margin: "6px 0 0", lineHeight: 1.4 }}>
              {Number(f.paid) > 0 ? (
                Number(f.supplierPaid || 0) > 0 ? (
                  <><strong>Fonds libérés au commerçant</strong> : l'inspection et la préparation de votre commande ont été validées à Dubaï.</>
                ) : (
                  <><strong>Fonds sécurisés par Baobab</strong> : vos paiements sont conservés sur notre compte protégé. Le commerçant n'est crédité qu'après vérification de votre marchandise.</>
                )
              ) : (
                <>Vos règlements sont protégés et conservés par Baobab jusqu'à l'inspection de conformité de vos articles.</>
              )}
            </p>
          </div>
          <div className="tracking-card" style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Icon name="chat" size={18} />
              <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Besoin d'aide ou signaler un litige ?</h3>
            </div>
            <p className="muted" style={{ fontSize: "0.82rem" }}>
              Une question sur la livraison ou un article non conforme ? Contactez l'équipe de conciergerie Baobab directement via votre messagerie ou WhatsApp.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              <Link to={`/messages${order.conversationId ? '/' + order.conversationId : ''}`} className="market-button secondary full" style={{ fontSize: "0.85rem", textAlign: "center" }}>
                Ouvrir la messagerie dédiée
              </Link>
              <a
                href={`https://wa.me/22676950089?text=${encodeURIComponent(
                  `Bonjour Baobab, j'ai une question/réclamation concernant ma commande réf: ${order.reference || id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="market-button full"
                style={{
                  background: "#25D366",
                  color: "#fff",
                  borderColor: "#25D366",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  textAlign: "center"
                }}
              >
                Assistance WhatsApp (+226 76 95 00 89)
              </a>
            </div>
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


export function Storefront() {
  const { id } = useParams<{ id: string }>();
  const [products, setProducts] = useState<any[]>([]);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    call("/products")
      .then((allProducts) => {
        rememberProducts(allProducts);
        const matching = allProducts.filter(
          (p: any) =>
            p.sellerId === id ||
            p.seller?.id === id ||
            (id && p.seller?.shopName && p.seller.shopName.toLowerCase() === id.toLowerCase())
        );
        setProducts(matching);
        if (matching.length > 0 && matching[0].seller) {
          setSeller(matching[0].seller);
        } else if (id === "seller-baobab-official" || !id) {
          setSeller({
            id: "seller-baobab-official",
            shopName: "Baobab Dubaï Officiel",
            city: "Dubaï",
          });
        } else {
          setSeller({
            id,
            shopName: id.replace(/-/g, " ").toUpperCase(),
            city: "Dubaï",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  const shopName = seller?.shopName || "Boutique Partenaire";
  const categories = Array.from(
    new Set(products.map((p) => productCategoryLabel(p)).filter(Boolean))
  );

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === "ALL" || productCategoryLabel(p) === selectedCat;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="storefront-container">
      {/* 1. Couverture & identité */}
      <div className="storefront-cover">
        <span className="storefront-cover-label">Sélectionneur vérifié · Dubaï</span>
      </div>
      <div className="storefront-head">
        <div className="storefront-avatar">
          {shopName.charAt(0)}
          <span className="storefront-verified"><Icon name="check" size={11} /></span>
        </div>
        <h1>
          {shopName}
          <span className="storefront-badge">Vérifié</span>
        </h1>
        <p className="storefront-meta">
          {seller?.city || "Dubaï"}, Émirats · Depuis 2023 · Réponse &lt; 2 h
        </p>
      </div>

      <div className="storefront-stats">
        <div><b>{products.length}</b><span>articles</span></div>
        <div><b>{categories.length}</b><span>catégories</span></div>
        <div><b>100 %</b><span>vérifié</span></div>
      </div>

      <div className="storefront-actions">
        <button onClick={handleShare} className="storefront-btn-share">
          {copied ? "Lien copié" : "Partager la boutique"}
        </button>
        <a
          href={`https://wa.me/971568934905?text=${encodeURIComponent(
            `Bonjour, je visite la vitrine de la boutique ${shopName} sur Baobab et je souhaite commander un article.`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="storefront-btn-whatsapp"
        >
          Message
        </a>
      </div>

      {/* 2. Réassurance */}
      <div className="storefront-reassurance">
        <div className="reassurance-pill">
          <span>✓</span> Photos réelles & conformité garantie
        </div>
        <div className="reassurance-pill">
          <span>✓</span> Paiement sécurisé via Baobab
        </div>
        <div className="reassurance-pill">
          <span>✓</span> Expédition suivie Dubaï → Afrique
        </div>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="storefront-filter-bar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Rechercher parmi les ${products.length} articles de ${shopName}...`}
          className="storefront-search-input"
        />
        {categories.length > 1 && (
          <div className="storefront-category-tabs">
            <button
              onClick={() => setSelectedCat("ALL")}
              className={`cat-tab ${selectedCat === "ALL" ? "active" : ""}`}
            >
              Tous ({products.length})
            </button>
            {categories.map((c: any) => (
              <button
                key={c}
                onClick={() => setSelectedCat(c)}
                className={`cat-tab ${selectedCat === c ? "active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Products Grid */}
      {loading ? (
        <div className="storefront-loading" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          <p>Chargement des articles de {shopName}…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="storefront-empty" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          <p>Aucun article trouvé dans cette sélection.</p>
        </div>
      ) : (
        <div className="storefront-grid">
          {filtered.map((item) => (
            <Link key={item.id} to={`/products/${item.id}`} state={{ product: item }} className="storefront-card">
              <div className="storefront-card-img">
                <img
                  src={
                    item.images?.[0] ||
                    fallbackPhoto(
                      item.subcategory,
                      productCategoryLabel(item),
                      item.category?.universe,
                      item.name
                    )
                  }
                  alt={item.name}
                  loading="lazy"
                />
                {item.location && (
                  <span className="card-location-tag"><Icon name="pin" size={10} /> {item.location}</span>
                )}
              </div>
              <div className="storefront-card-body">
                <span className="card-cat">{productCategoryLabel(item)}</span>
                <h3>{item.name}</h3>
                <div className="card-price-row">
                  <div className="card-price">{money(item.price)}</div>
                  <span className="card-unit">/ {item.unit || "pièce"}</span>
                </div>
                <div className="card-action-btn">
                  Voir l'article & Commander →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
