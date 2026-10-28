import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
  CurrencyConfig,
  formatMultiCurrency,
  convertFromXof,
} from '@westzone/shared';

const STORAGE_KEY = 'westzone_selected_currency';

export function getStoredCurrency(): SupportedCurrency {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedCurrency;
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'XOF';
}

export function setStoredCurrency(currency: SupportedCurrency) {
  try {
    localStorage.setItem(STORAGE_KEY, currency);
    window.dispatchEvent(new CustomEvent('westzone:currency-changed', { detail: currency }));
  } catch {
    // ignore
  }
}

export function formatPrice(amountXof: number | string | null | undefined, currency?: SupportedCurrency): string {
  const num = Number(amountXof || 0);
  const cur = currency || getStoredCurrency();
  return formatMultiCurrency(num, cur);
}

interface CurrencyContextValue {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  config: CurrencyConfig;
  format: (amountXof: number | string | null | undefined, includeApprox?: boolean) => string;
  convert: (amountXof: number | string | null | undefined) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(getStoredCurrency);

  useEffect(() => {
    function handleChange(e: Event) {
      const custom = e as CustomEvent<SupportedCurrency>;
      if (custom.detail && SUPPORTED_CURRENCIES[custom.detail]) {
        setCurrencyState(custom.detail);
      } else {
        setCurrencyState(getStoredCurrency());
      }
    }
    window.addEventListener('westzone:currency-changed', handleChange);
    window.addEventListener('storage', handleChange);
    return () => {
      window.removeEventListener('westzone:currency-changed', handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  function setCurrency(c: SupportedCurrency) {
    setStoredCurrency(c);
    setCurrencyState(c);
  }

  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.XOF;

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    config,
    format: (amountXof, includeApprox = false) => {
      const num = Number(amountXof || 0);
      return formatMultiCurrency(num, currency, includeApprox);
    },
    convert: (amountXof) => {
      return convertFromXof(Number(amountXof || 0), currency);
    },
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    const cur = getStoredCurrency();
    const config = SUPPORTED_CURRENCIES[cur] || SUPPORTED_CURRENCIES.XOF;
    return {
      currency: cur,
      setCurrency: setStoredCurrency,
      config,
      format: (amountXof, includeApprox = false) =>
        formatMultiCurrency(Number(amountXof || 0), cur, includeApprox),
      convert: (amountXof) => convertFromXof(Number(amountXof || 0), cur),
    };
  }
  return ctx;
}
