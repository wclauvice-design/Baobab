import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { formatXof } from '../lib/format';
import { api } from '../lib/api';
import { Product, ProductCard } from '../components/ProductCard';

export function Cart() {
  const { items, updateQuantity, removeItem, toggleSelected, setAllSelected, selectedTotal, selectedCount } =
    useCart();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    api.get<Product[]>('/products').then((all) => {
      const cartIds = new Set(items.map((i) => i.productId));
      setSuggestions(all.filter((p) => !cartIds.has(p.id)).slice(0, 6));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-4xl">🛒</p>
        <p className="mt-4 text-slate-400">Votre panier est vide.</p>
        <Link to="/" className="mt-4 inline-block text-amber-400 underline">
          Découvrir le catalogue
        </Link>
      </div>
    );
  }

  const allSelected = items.every((i) => i.selected);
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.shopName || 'Baobab';
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-40 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Mon panier</h1>
        <button
          onClick={() => setAllSelected(!allSelected)}
          className="flex items-center gap-1.5 text-xs text-slate-400"
        >
          <input type="checkbox" checked={allSelected} readOnly className="accent-amber-500" />
          Tout sélectionner
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {Array.from(groups.entries()).map(([shopName, shopItems]) => {
          const groupSelected = shopItems.every((i) => i.selected);
          return (
            <div key={shopName} className="rounded-xl2 bg-base-800 p-3">
              <div className="mb-2 flex items-center gap-2 border-b border-base-700 pb-2">
                <input
                  type="checkbox"
                  checked={groupSelected}
                  onChange={() => shopItems.forEach((i) => {
                    if (i.selected === groupSelected) toggleSelected(i.productId);
                  })}
                  className="accent-amber-500"
                />
                <span className="text-xs font-medium text-slate-300">🏪 {shopName}</span>
              </div>
              <ul className="flex flex-col gap-3">
                {shopItems.map((item) => (
                  <li key={item.productId} className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelected(item.productId)}
                      className="mt-6 accent-amber-500"
                    />
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-base-700 text-xl">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        '🧺'
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-sm text-amber-400">{formatXof(item.price)}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-base-700">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-2 py-1 text-slate-300"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-2 py-1 text-slate-300"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-xs text-slate-500 underline"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-200">Vous pourriez aussi aimer</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {suggestions.map((p) => (
              <div key={p.id} className="w-36 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-md border-t border-base-700 bg-base-900/95 px-4 py-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-400">Total ({selectedCount} article{selectedCount > 1 ? 's' : ''})</span>
          <span className="font-heading text-lg font-semibold text-amber-400">
            {formatXof(selectedTotal)}
          </span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          disabled={selectedCount === 0}
          className="w-full rounded-xl2 bg-amber-500 py-3 font-semibold text-base-950 shadow-glow transition hover:bg-amber-400 disabled:opacity-50"
        >
          Commander{selectedCount > 0 ? ` (${selectedCount})` : ''}
        </button>
      </div>
    </div>
  );
}
