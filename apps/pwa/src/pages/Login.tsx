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
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-flame opacity-20 blur-[80px]" />

      <div className="relative mb-8 animate-fade-up">
        <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-flame text-2xl shadow-glow">
          🌳
        </span>
        <h1 className="bg-flame bg-clip-text text-4xl font-bold text-transparent">Baobab</h1>
        <p className="mt-2 text-sm text-slate-400">
          La marketplace indépendante d'Afrique de l'Ouest.
        </p>
      </div>

      <div className="relative animate-fade-up rounded-2xl border border-white/[0.06] bg-surface p-5 shadow-card" style={{ animationDelay: '80ms' }}>
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
                className="input mt-1"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={busy} className="btn-primary">
              Recevoir le code
            </button>

            <div className="mt-2 rounded-xl2 border border-dashed border-emerald-700/60 bg-emerald-500/5 p-4">
              <p className="mb-2 text-xs text-emerald-400">
                Connexion rapide (temporaire, à retirer avant lancement)
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDevLogin('+2250700000003')}
                className="w-full rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
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
                className="input mt-1 tracking-[0.5em]"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={busy} className="btn-primary">
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
    </div>
  );
}
