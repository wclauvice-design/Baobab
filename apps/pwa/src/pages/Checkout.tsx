import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { api, ApiError } from '../lib/api';
import { formatXof } from '../lib/format';

type DeliveryMode = 'STANDARD' | 'EXPRESS';
type Provider = 'MANUAL_ORANGE_MONEY' | 'CASH_ON_DELIVERY';

interface SavedAddress {
  id: string;
  label: string;
  fullAddress: string;
  city: string;
  isDefault: boolean;
}

const CASH_ON_DELIVERY_FEE = 1000;

export function Checkout() {
  const { items, selectedTotal, clearSelected } = useCart();
  const checkoutItems = items.filter((i) => i.selected);
  const navigate = useNavigate();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('STANDARD');
  const [provider, setProvider] = useState<Provider>('MANUAL_ORANGE_MONEY');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const deliveryFee = provider === 'CASH_ON_DELIVERY' ? CASH_ON_DELIVERY_FEE : 0;
  const grandTotal = selectedTotal + deliveryFee;

  useEffect(() => {
    api.get<SavedAddress[]>('/addresses').then((list) => {
      setSavedAddresses(list);
      const preferred = list.find((a) => a.isDefault) ?? list[0];
      if (preferred) {
        setSelectedAddressId(preferred.id);
        setAddress(`${preferred.fullAddress}, ${preferred.city}`);
      }
    });
  }, []);

  function handleSelectAddress(id: string) {
    setSelectedAddressId(id);
    if (id === 'custom') {
      setAddress('');
      return;
    }
    const found = savedAddresses.find((a) => a.id === id);
    if (found) setAddress(`${found.fullAddress}, ${found.city}`);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const order = await api.post<{ id: string }>('/orders', {
        items: checkoutItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: address,
        deliveryMode,
        provider,
      });
      const initiation = await api.post<{
        instructions: string;
        merchantNumber?: string;
      }>(`/orders/${order.id}/payment/initiate`, { provider });
      sessionStorage.setItem(`baobab_payment_${order.id}`, JSON.stringify(initiation));
      clearSelected();
      navigate(`/orders/${order.id}/payment`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-slate-400">
          Aucun article sélectionné. Retournez au panier pour en choisir.
        </p>
        <button onClick={() => navigate('/cart')} className="btn-primary mt-4">
          Retour au panier
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-64 pt-6">
      <h1 className="mb-4 text-xl font-bold">Finaliser la commande</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-sm text-slate-300">
            Adresse de livraison
            {savedAddresses.length > 0 && (
              <select
                value={selectedAddressId}
                onChange={(e) => handleSelectAddress(e.target.value)}
                className="input mt-1 text-sm"
              >
                {savedAddresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} — {a.fullAddress}, {a.city}
                  </option>
                ))}
                <option value="custom">Autre adresse…</option>
              </select>
            )}
          </label>
          {(savedAddresses.length === 0 || selectedAddressId === 'custom') && (
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Quartier, rue, ville, indications..."
              rows={3}
              className="input mt-2 text-sm"
            />
          )}
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-300">Mode de livraison</p>
          <div className="grid grid-cols-2 gap-2">
            {(['STANDARD', 'EXPRESS'] as DeliveryMode[]).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setDeliveryMode(mode)}
                className={`rounded-xl2 border px-4 py-3 text-sm transition-all duration-200 ${
                  deliveryMode === mode
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-glow'
                    : 'border-base-700 text-slate-300 hover:border-base-600'
                }`}
              >
                {mode === 'STANDARD' ? 'Standard' : 'Express'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-300">Paiement</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setProvider('MANUAL_ORANGE_MONEY')}
              className={`rounded-xl2 border px-4 py-3 text-left text-sm transition-all duration-200 ${
                provider === 'MANUAL_ORANGE_MONEY'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-glow'
                  : 'border-base-700 text-slate-300 hover:border-base-600'
              }`}
            >
              Orange Money
              <span className="block text-xs text-slate-500">
                Instructions affichées après validation, confirmation sous 5 à 15 min
              </span>
            </button>
            <button
              type="button"
              onClick={() => setProvider('CASH_ON_DELIVERY')}
              className={`rounded-xl2 border px-4 py-3 text-left text-sm transition-all duration-200 ${
                provider === 'CASH_ON_DELIVERY'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-glow'
                  : 'border-base-700 text-slate-300 hover:border-base-600'
              }`}
            >
              Paiement à la livraison
              <span className="block text-xs text-slate-500">
                Frais de livraison de {formatXof(CASH_ON_DELIVERY_FEE)} appliqués
              </span>
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-md border-t border-white/[0.06] bg-base-900/90 px-4 py-4 shadow-card backdrop-blur-xl">
          <div className="mb-3 flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span>Sous-total ({checkoutItems.length} article{checkoutItems.length > 1 ? 's' : ''})</span>
              <span className="tabular-nums">{formatXof(selectedTotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Frais de livraison</span>
                <span className="tabular-nums">{formatXof(deliveryFee)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total</span>
              <span className="font-heading text-lg font-semibold tabular-nums text-amber-400">
                {formatXof(grandTotal)}
              </span>
            </div>
          </div>
          <button disabled={busy} className="btn-primary w-full">
            {busy ? 'Traitement…' : 'Confirmer la commande'}
          </button>
        </div>
      </form>
    </div>
  );
}
