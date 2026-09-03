import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { BaobabMark, BaobabWordmark } from '../components/icons';

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
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-flame opacity-20 blur-[80px]" />

      <div className="relative mb-8 animate-fade-up">
        <BaobabMark className="mb-3 h-14 w-14 drop-shadow-[0_8px_20px_rgba(240,147,15,0.35)]" />
        <BaobabWordmark textClassName="text-4xl" />
        <p className="mt-3 text-sm text-slate-400">
          La marketplace indépendante d'Afrique de l'Ouest.
        </p>
      </div>

      <div className="relative animate-fade-up rounded-2xl border border-white/[0.06] bg-surface p-5 shadow-card" style={{ animationDelay: '80ms' }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm text-slate-300">
            Numéro de téléphone
            <input
              type="tel"
              required
              placeholder="+225 07 00 00 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input mt-1"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={busy} className="btn-primary">
            Se connecter
          </button>
          <p className="text-center text-xs text-emerald-400/80">
            Connexion instantanée pendant la phase de test — aucun code requis pour le moment.
          </p>
        </form>
      </div>
    </div>
  );
}
