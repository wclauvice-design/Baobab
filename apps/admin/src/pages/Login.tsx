import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export function Login() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { devLogin } = useAuth();
  const navigate = useNavigate();

  // Temporaire — voir AuthService.devLogin() côté API : tant qu'aucun vrai
  // fournisseur SMS n'est branché, n'importe quel numéro se connecte
  // directement, sans code. À retirer (ce formulaire + devLogin) une fois
  // un SmsProvider réel en place.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await devLogin(phone);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold">Baobab — Back-office</h1>
      <p className="mb-8 text-sm text-slate-500">Accès réservé aux vendeurs et administrateurs.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-sm text-slate-600">
          Numéro de téléphone
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          Se connecter
        </button>
        <p className="text-center text-xs text-emerald-700">
          Connexion instantanée pendant la phase de test — aucun code requis pour le moment.
        </p>
      </form>
    </div>
  );
}
