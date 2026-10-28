import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ApiError, warmUpBackend } from '../lib/api';
import { WestzoneMark, WestzoneWordmark } from '../components/icons';

export function Login() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { devLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    warmUpBackend();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    setStatusMessage('Connexion en cours...');

    const wakeTimer = setTimeout(() => {
      setStatusMessage('Le serveur sécurisé se réveille (~15-30s)... Merci de patienter');
    }, 3500);

    try {
      await devLogin(phone);
      clearTimeout(wakeTimer);
      navigate('/');
    } catch (err: any) {
      clearTimeout(wakeTimer);
      setStatusMessage(null);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        setError('Le serveur met du temps à répondre ou se réveille. Veuillez cliquer sur Réessayer.');
      } else {
        setError(err?.message || 'Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      clearTimeout(wakeTimer);
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-flame opacity-20 blur-[80px]" />

      <div className="relative mb-8 animate-fade-up">
        <WestzoneMark className="mb-3 h-14 w-14 drop-shadow-[0_8px_20px_rgba(240,147,15,0.35)]" />
        <WestzoneWordmark textClassName="text-4xl" />
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
              placeholder="+226 76 95 00 89"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input mt-1"
            />
          </label>

          {statusMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-300 border border-amber-500/20">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              <span>{statusMessage}</span>
            </div>
          )}

          {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

          <button disabled={busy} className="btn-primary flex items-center justify-center gap-2">
            {busy ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Connexion...</span>
              </>
            ) : (
              <span>{error ? 'Réessayer la connexion' : 'Se connecter'}</span>
            )}
          </button>
          <p className="text-center text-xs text-emerald-400/80">
            Connexion instantanée pendant la phase de test — aucun code requis pour le moment.
          </p>
        </form>
      </div>
    </div>
  );
}
