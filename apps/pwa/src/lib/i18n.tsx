import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'fr' | 'en';

const STORAGE_KEY = 'baobab_lang';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  fr: {
    explore: 'Explorer',
    favorites: 'Favoris',
    messages: 'Messages',
    my_orders: 'Mes commandes',
    my_space: 'Mon espace',
    contact_baobab: 'Contacter Baobab',
    terms: 'Conditions Générales (CGUV)',
    privacy: 'Politique de Confidentialité',
    share_whatsapp: 'Partager WhatsApp',
    copy_link: 'Copier le lien',
    link_copied: 'Lien copié dans le presse-papier !',
    protected_payment: 'Garantie Paiement Protégé',
    need_help: 'Besoin d\'aide ou signaler un litige ?',
    open_inbox: 'Ouvrir la messagerie dédiée',
    whatsapp_help: 'Assistance WhatsApp (+226 76 95 00 89)',
    download_proforma: 'Télécharger / Imprimer la Proforma (PDF)',
    destination_label: 'Expédition vers :',
    transit_info: 'Express 3–6j · Cargo 14–16j · Maritime 45–50j',
    origin_badge: 'DUBAÏ ➔ AFRIQUE',
  },
  en: {
    explore: 'Explore',
    favorites: 'Favorites',
    messages: 'Messages',
    my_orders: 'My Orders',
    my_space: 'My Space',
    contact_baobab: 'Contact Baobab',
    terms: 'Terms & Conditions',
    privacy: 'Privacy Policy',
    share_whatsapp: 'Share on WhatsApp',
    copy_link: 'Copy Link',
    link_copied: 'Tracking link copied to clipboard!',
    protected_payment: 'Protected Escrow Guarantee',
    need_help: 'Need help or open a dispute?',
    open_inbox: 'Open dedicated chat',
    whatsapp_help: 'WhatsApp Support (+226 76 95 00 89)',
    download_proforma: 'Download / Print Proforma (PDF)',
    destination_label: 'Shipping to:',
    transit_info: 'Express 3–6d · Cargo 14–16d · Sea freight 45–50d',
    origin_badge: 'DUBAI ➔ AFRICA',
  },
};

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved === 'fr' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'fr';
  });

  function setLang(newLang: Language) {
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
    setLangState(newLang);
  }

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[lang]?.[key] || fallback || TRANSLATIONS.fr[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: 'fr',
      setLang: () => {},
      t: (key, fallback) => TRANSLATIONS.fr[key] || fallback || key,
    };
  }
  return ctx;
}
