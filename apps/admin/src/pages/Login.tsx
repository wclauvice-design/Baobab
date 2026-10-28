import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ApiError, warmUpBackend } from '../lib/api';

export function Login() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { devLogin } = useAuth();
  const navigate = useNavigate();

  // Préchauffer le serveur Render dès l'affichage de la page
  useEffect(() => {
    warmUpBackend();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    setStatusMessage('Connexion en cours...');

    // Si le backend Render était en veille, afficher un message explicatif après 3.5s
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
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold">Westzone — Back-office</h1>
      <p className="mb-8 text-sm text-slate-500">Accès réservé aux vendeurs et administrateurs.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-sm text-slate-600">
          Numéro de téléphone
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+226 76 95 00 89"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
        </label>

        {statusMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
            <span>{statusMessage}</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <button
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {busy ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Connexion...</span>
            </>
          ) : (
            <span>{error ? 'Réessayer la connexion' : 'Se connecter'}</span>
          )}
        </button>

        <p className="text-center text-xs text-emerald-700">
          Connexion instantanée pendant la phase de test — aucun code requis pour le moment.
        </p>
      </form>
    </div>
  );
}
