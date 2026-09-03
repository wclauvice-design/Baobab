import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatXof } from '../lib/format';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { recordView } from '../lib/history';
import { PageLoader } from '../components/PageLoader';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  buyer: { phone: string };
}

interface ProductDetailData {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
  category: { name: string };
  seller: { id: string; shopName: string; city: string } | null;
  reviews: Review[];
  avgRating: number | null;
  reviewCount: number;
  soldCount: number;
}

interface FollowEntry {
  sellerId: string;
}

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-base-700 to-base-800 text-5xl">
        <span className="opacity-60">🧺</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex aspect-square snap-x snap-mandatory overflow-x-auto bg-gradient-to-br from-base-700 to-base-800"
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((url, i) => (
          <img
            key={url}
            src={url}
            alt={`${name} ${i + 1}`}
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {images.map((url, i) => (
            <span
              key={url}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-4 bg-amber-400' : 'w-1.5 bg-base-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    api.get<ProductDetailData>(`/products/${id}`).then((data) => {
      setProduct(data);
      recordView(data.id);
    });
  }, [id]);

  useEffect(() => {
    if (!product?.seller || user?.role !== 'BUYER') return;
    api
      .get<FollowEntry[]>('/sellers/following')
      .then((list) => setIsFollowing(list.some((f) => f.sellerId === product.seller!.id)))
      .catch(() => {});
  }, [product?.seller, user?.role]);

  if (!product) return <PageLoader />;

  function handleAddToCart() {
    addItem(
      {
        productId: product!.id,
        name: product!.name,
        price: Number(product!.price),
        image: product!.images[0],
        sellerId: product!.seller?.id ?? null,
        shopName: product!.seller?.shopName ?? 'Baobab',
      },
      quantity,
    );
    navigate('/cart');
  }

  async function toggleFollow() {
    if (!product?.seller) return;
    setFollowBusy(true);
    try {
      if (isFollowing) {
        await api.delete(`/sellers/${product.seller.id}/follow`);
        setIsFollowing(false);
      } else {
        await api.post(`/sellers/${product.seller.id}/follow`);
        setIsFollowing(true);
      }
    } finally {
      setFollowBusy(false);
    }
  }

  const discount =
    product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
      ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
      : null;

  return (
    <div className="mx-auto max-w-md pb-28">
      <div className="relative">
        <ImageGallery images={product.images} name={product.name} />
        {discount && (
          <span className="absolute left-3 top-3 rounded-md bg-flame px-2 py-1 text-xs font-bold text-base-950 shadow-glow">
            -{discount}%
          </span>
        )}
      </div>

      <div className="px-4 pt-4">
        <span className="text-[11px] uppercase tracking-wide text-emerald-400">
          {product.category.name}
        </span>
        <h1 className="mt-1 text-xl font-bold">{product.name}</h1>
        {product.seller && (
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Vendu par {product.seller.shopName} · {product.seller.city}
            </p>
            {user?.role === 'BUYER' && (
              <button
                onClick={toggleFollow}
                disabled={followBusy}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-all duration-200 disabled:opacity-50 ${
                  isFollowing
                    ? 'border-base-700 text-slate-400'
                    : 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 hover:shadow-glow-emerald'
                }`}
              >
                {isFollowing ? 'Suivi ✓' : '+ Suivre'}
              </button>
            )}
          </div>
        )}
        {(product.avgRating || product.soldCount > 0) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            {product.avgRating && (
              <span className="flex items-center gap-1 text-amber-400">
                ★ {product.avgRating.toFixed(1)}
                <span className="text-slate-500">({product.reviewCount})</span>
              </span>
            )}
            {product.soldCount > 0 && <span>{product.soldCount} vendu{product.soldCount > 1 ? 's' : ''}</span>}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <p className="font-heading text-2xl font-semibold tabular-nums text-amber-400">
            {formatXof(Number(product.price))}
          </p>
          {discount && (
            <p className="text-sm tabular-nums text-slate-500 line-through">
              {formatXof(Number(product.compareAtPrice))}
            </p>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{product.description}</p>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center rounded-xl2 border border-base-700 bg-base-800/60">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-slate-300 transition-colors hover:text-amber-400"
            >
              −
            </button>
            <span className="w-8 text-center tabular-nums">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="px-3 py-2 text-slate-300 transition-colors hover:text-amber-400"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="btn-primary flex-1"
          >
            {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </button>
        </div>

        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-slate-200">Avis</h2>
          {product.reviews.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun avis pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {product.reviews.map((r) => (
                <li key={r.id} className="card p-3 text-sm">
                  <div className="mb-1 text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  {r.comment && <p className="text-slate-300">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
