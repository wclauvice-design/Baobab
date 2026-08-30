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
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

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
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold">Baobab — Back-office</h1>
      <p className="mb-8 text-sm text-slate-500">Accès réservé aux vendeurs et administrateurs.</p>

      {step === 'phone' ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
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
            Recevoir le code
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">
            Code envoyé à {phone}. (Dev : voir la console du serveur API.)
          </p>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 tracking-[0.5em] focus:border-amber-500 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={busy}
            className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Valider
          </button>
        </form>
      )}
    </div>
  );
}
