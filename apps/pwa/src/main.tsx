import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/auth';
import { CartProvider } from './lib/cart';
import { CurrencyProvider } from './lib/currency';
import { I18nProvider } from './lib/i18n';
import { warmUpBackend } from './lib/api';
import './index.css';

// Réveille l'API (offre gratuite Render) dès l'ouverture de l'app, en parallèle
// du rendu, pour que la première fiche produit s'ouvre sans attente.
warmUpBackend();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <CurrencyProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </CurrencyProvider>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
