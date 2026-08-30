import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { formatXof } from '../lib/format';

export function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();

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

  return (
    <div className="mx-auto max-w-md px-4 pb-32 pt-6">
      <h1 className="mb-4 text-xl font-bold">Mon panier</h1>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-3 rounded-xl2 bg-base-800 p-3">
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

      <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-md border-t border-base-700 bg-base-900/95 px-4 py-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-400">Total</span>
          <span className="font-heading text-lg font-semibold text-amber-400">
            {formatXof(total)}
          </span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full rounded-xl2 bg-amber-500 py-3 font-semibold text-base-950 shadow-glow transition hover:bg-amber-400"
        >
          Commander
        </button>
      </div>
    </div>
  );
}
