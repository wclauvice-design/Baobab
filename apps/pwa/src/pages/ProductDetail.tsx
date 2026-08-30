import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatXof } from '../lib/format';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { recordView } from '../lib/history';

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

  if (!product) return <div className="p-6 text-sm text-slate-500">Chargement…</div>;

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

  return (
    <div className="mx-auto max-w-md pb-28">
      <div className="flex aspect-square items-center justify-center bg-base-800 text-5xl">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span>🧺</span>
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
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium disabled:opacity-50 ${
                  isFollowing
                    ? 'border-base-700 text-slate-400'
                    : 'border-emerald-500 text-emerald-400'
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
          <p className="font-heading text-2xl font-semibold text-amber-400">
            {formatXof(Number(product.price))}
          </p>
          {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
            <>
              <p className="text-sm text-slate-500 line-through">
                {formatXof(Number(product.compareAtPrice))}
              </p>
              <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                -{Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)}%
              </span>
            </>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{product.description}</p>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center rounded-xl2 border border-base-700">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-slate-300"
            >
              −
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="px-3 py-2 text-slate-300"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 rounded-xl2 bg-amber-500 py-3 font-semibold text-base-950 shadow-glow transition hover:bg-amber-400 disabled:opacity-50"
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
                <li key={r.id} className="rounded-xl2 bg-base-800 p-3 text-sm">
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
