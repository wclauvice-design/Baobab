import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ApiError, warmUpBackend } from '../lib/api';
import { WestzoneMark, WestzoneWordmark } from '../components/icons';
import { SUPPORT_WHATSAPP_LABEL, whatsappHref } from '../lib/contact';

type Step = 'phone' | 'code';

/** Connexion rapide de test : jamais affichée sur le build de production. */
const DEV_LOGIN_VISIBLE = import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true';

export function Login() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const codeInput = useRef<HTMLInputElement | null>(null);
  const { requestOtp, verifyOtp, devLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    warmUpBackend();
  }, []);

  useEffect(() => {
    if (step === 'code') codeInput.current?.focus();
  }, [step]);

  function describeError(err: unknown) {
    if (err instanceof ApiError) return err.message;
    if (
      err instanceof TypeError ||
      String((err as { message?: string })?.message || '').includes('Failed to fetch')
    ) {
      return 'Le serveur met du temps à répondre ou se réveille. Réessayez dans quelques secondes.';
    }
    return (err as { message?: string })?.message || 'Une erreur est survenue. Réessayez.';
  }

  async function withBusy(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    const wakeTimer = setTimeout(() => {
      setStatusMessage('Le serveur sécurisé se réveille (~15-30s)… Merci de patienter');
    }, 3500);
    try {
      await action();
    } catch (err) {
      setStatusMessage(null);
      setError(describeError(err));
    } finally {
      clearTimeout(wakeTimer);
      setBusy(false);
    }
  }

  function requestCode(e?: FormEvent) {
    e?.preventDefault();
    const value = phone.trim();
    if (!value) {
      setError('Indiquez votre numéro de téléphone.');
      return;
    }
    void withBusy(async () => {
      await requestOtp(value);
      setStatusMessage(null);
      setCode('');
      setStep('code');
    });
  }

  function submitCode(e: FormEvent) {
    e.preventDefault();
    void withBusy(async () => {
      await verifyOtp(phone.trim(), code.trim());
      navigate('/');
    });
  }

  function quickLogin() {
    void withBusy(async () => {
      await devLogin(phone.trim());
      navigate('/');
    });
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
        {step === 'phone' ? (
          <form onSubmit={requestCode} className="flex flex-col gap-4">
            <label className="text-sm text-slate-300">
              Numéro de téléphone
              <input
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="+226 76 95 00 89"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input mt-1"
              />
            </label>

            {statusMessage && <StatusNote>{statusMessage}</StatusNote>}
            {error && <ErrorNote>{error}</ErrorNote>}

            <button disabled={busy} className="btn-primary flex items-center justify-center gap-2">
              {busy ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Envoi du code…</span>
                </>
              ) : (
                <span>Recevoir mon code</span>
              )}
            </button>
            <p className="text-center text-xs text-slate-500">
              Nous vous envoyons un code à 4 chiffres par SMS. Aucun mot de passe à retenir.
            </p>
          </form>
        ) : (
          <form onSubmit={submitCode} className="flex flex-col gap-4">
            <div className="text-sm text-slate-300">
              Code envoyé au <strong className="text-slate-100">{phone}</strong>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError(null);
                  setStatusMessage(null);
                }}
                className="ml-2 text-xs font-semibold text-amber-400 underline-offset-2 hover:underline"
              >
                Modifier
              </button>
            </div>

            <label className="text-sm text-slate-300">
              Code de vérification
              <input
                ref={codeInput}
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="input mt-1 text-center text-lg tracking-[0.5em]"
              />
            </label>

            {statusMessage && <StatusNote>{statusMessage}</StatusNote>}
            {error && <ErrorNote>{error}</ErrorNote>}

            <button
              disabled={busy || code.trim().length < 4}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Vérification…</span>
                </>
              ) : (
                <span>Valider et se connecter</span>
              )}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => requestCode()}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Renvoyer le code
            </button>
          </form>
        )}

        {DEV_LOGIN_VISIBLE && (
          <button
            type="button"
            disabled={busy || !phone.trim()}
            onClick={quickLogin}
            className="mt-3 w-full rounded-lg border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-semibold text-amber-300 disabled:opacity-50"
          >
            Connexion rapide (test, numéro autorisé uniquement)
          </button>
        )}

        <p className="mt-4 border-t border-white/[0.06] pt-3 text-center text-[11px] leading-relaxed text-slate-500">
          Pas de code reçu ? Écrivez-nous sur{' '}
          <a
            href={whatsappHref('Bonjour Westzone, je souhaite me connecter à mon compte.')}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#25D366] hover:underline"
          >
            WhatsApp {SUPPORT_WHATSAPP_LABEL}
          </a>
          .
        </p>
      </div>

      <Link to="/" className="relative mt-6 text-center text-xs text-slate-500 hover:text-slate-300">
        ← Continuer sans compte
      </Link>
    </div>
  );
}

function StatusNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      <span>{children}</span>
    </div>
  );
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{children}</p>
  );
}
