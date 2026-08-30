import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export function Login() {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { requestOtp, verifyOtp, devLogin } = useAuth();
  const navigate = useNavigate();

  async function handleDevLogin(devPhone: string) {
    setError(null);
    setBusy(true);
    try {
      await devLogin(devPhone);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestOtp(phone);
      setStep('code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(phone, code);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-1 text-3xl font-bold text-slate-100">Baobab</h1>
      <p className="mb-8 text-sm text-slate-400">
        La marketplace indépendante d'Afrique de l'Ouest.
      </p>

      {step === 'phone' ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <label className="text-sm text-slate-300">
            Numéro de téléphone
            <input
              type="tel"
              required
              placeholder="+225 07 00 00 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl2 border border-base-700 bg-base-800 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={busy}
            className="rounded-xl2 bg-amber-500 px-4 py-3 font-semibold text-base-950 shadow-glow transition hover:bg-amber-400 disabled:opacity-50"
          >
            Recevoir le code
          </button>

          <div className="mt-4 rounded-xl2 border border-dashed border-emerald-700 bg-emerald-500/5 p-4">
            <p className="mb-2 text-xs text-emerald-400">
              Connexion rapide (temporaire, à retirer avant lancement)
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDevLogin('+2250700000003')}
              className="w-full rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Acheteur (test)
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            Code envoyé à {phone}. (Astuce : en développement, regardez la console du serveur API.)
          </p>
          <label className="text-sm text-slate-300">
            Code reçu
            <input
              type="text"
              required
              inputMode="numeric"
              placeholder="1234"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-xl2 border border-base-700 bg-base-800 px-4 py-3 tracking-[0.5em] text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={busy}
            className="rounded-xl2 bg-amber-500 px-4 py-3 font-semibold text-base-950 shadow-glow transition hover:bg-amber-400 disabled:opacity-50"
          >
            Valider
          </button>
          <button
            type="button"
            onClick={() => setStep('phone')}
            className="text-sm text-slate-400 underline"
          >
            Changer de numéro
          </button>
        </form>
      )}
    </div>
  );
}
