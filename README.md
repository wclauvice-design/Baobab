# Baobab — MVP

Plateforme e-commerce indépendante pour l'Afrique de l'Ouest francophone (CI, Burkina Faso, Togo, Bénin, Mali, Niger), en franc CFA (XOF). Modèle hybride vente directe + vendeurs partenaires. Paiement Orange Money validé manuellement en back-office (voir `docs/baobab-app-spec.md` pour le cahier des charges complet).

## Structure

```
apps/
  api/     # Backend NestJS + Prisma/PostgreSQL
  pwa/     # PWA acheteur (React + Vite, mobile-first)
  admin/   # Back-office admin + vendeur (React + Vite)
packages/
  shared/  # Types/enums TypeScript partagés
```

## Démarrage local

1. **Base de données**

   ```bash
   docker compose up -d
   ```

2. **Dépendances** (à la racine, workspaces npm)

   ```bash
   npm install
   ```

3. **Variables d'environnement**

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

4. **Migrations + données de test**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   Le seed crée : un admin (`+2250700000001`), un vendeur approuvé (`+2250700000002`), un acheteur (`+2250700000003`), 4 catégories et 5 produits.

5. **Lancer les 3 apps en parallèle**

   ```bash
   npm run dev
   ```

   - API : http://localhost:3000
   - PWA acheteur : http://localhost:5173
   - Back-office (admin/vendeur) : http://localhost:5174

## Connexion (mode développement)

Aucun fournisseur SMS n'est branché : le code OTP est simplement affiché dans les logs du serveur API (`ConsoleSmsProvider`). Cherchez une ligne `OTP for +225...: 1234` dans le terminal de l'API après avoir demandé un code.

De même, les notifications SMS/WhatsApp (confirmation de commande, validation de paiement) sont loggées dans la console par `ConsoleNotificationProvider` plutôt qu'envoyées réellement.

## Parcours de test suggéré

1. Se connecter côté PWA avec `+2250700000003` (acheteur), récupérer le code OTP dans les logs API.
2. Parcourir le catalogue, ajouter un produit au panier, passer commande avec paiement **Orange Money**.
3. Noter la référence affichée (`BA-XXXX`).
4. Se connecter côté back-office (`http://localhost:5174`) avec `+2250700000001` (admin).
5. Dans la file des paiements, valider le paiement portant cette référence.
6. Revenir sur la PWA : la commande passe automatiquement à "Confirmée" (rafraîchir la page de suivi de paiement, elle sonde le statut toutes les 5s).
7. Optionnel : se connecter avec `+2250700000002` (vendeur) sur le back-office pour marquer la commande "expédiée", puis "livrée", puis repasser sur la PWA en acheteur pour laisser un avis.

## Architecture de paiement

Tout passe par l'interface `PaymentProvider` (`apps/api/src/payments/providers/payment-provider.interface.ts`) : `initiate`, `checkStatus`, `onWebhook?`. Le MVP fournit deux implémentations :

- `ManualOrangeMoneyProvider` — génère une référence unique, affiche les instructions de paiement, ne fait confiance qu'à la validation manuelle d'un admin (jamais à une preuve envoyée par le client).
- `CashOnDeliveryProvider` — confirme la commande immédiatement, paiement en espèces à la livraison. Des frais de livraison fixes de **1 000 FCFA** (`CASH_ON_DELIVERY_FEE` dans `apps/api/src/orders/orders.service.ts`) s'ajoutent au sous-total dès que ce mode est choisi au checkout ; le total (`Order.totalAmount`) et le détail des frais (`Order.deliveryFee`) sont calculés et stockés à la création de la commande.

Brancher un agrégateur de paiement automatique (Kolonell, CinetPay, API Orange Money Web Payment…) plus tard consiste à ajouter une nouvelle classe qui implémente cette même interface — aucun autre code (panier, commandes, back-office) n'a besoin de changer.

## Suivi de commande

Chaque changement de statut (création, confirmation de paiement, préparation, expédition, livraison, annulation, expiration) écrit une ligne dans `DeliveryEvent`, horodatée. La PWA affiche cet historique comme une timeline verticale (façon Temu) sur la page de suivi de commande (`apps/pwa/src/pages/OrderDetail.tsx`) : étapes déjà passées avec horodatage, étape courante en surbrillance, étapes à venir grisées avec leur description ; les commandes annulées/expirées affichent uniquement les événements réellement survenus.

## Ce qui n'est pas connecté (volontairement, pour le MVP)

- Pas de compte marchand Orange Money réel, pas de SMS gateway, pas de WhatsApp Business API — ces trois intégrations sont derrière des interfaces (`SmsProvider`, `NotificationProvider`, `PaymentProvider`) prêtes à recevoir une vraie implémentation.
- Pas de compression/CDN d'images (stockage de simples URLs pour l'instant).
- La navigation "stories" / "catégories en orbite" évoquée dans le cahier des charges n'est pas construite : elle reste à valider sur maquette avant d'être codée. La PWA utilise la barre de navigation basse classique.

## Tests

```bash
npm run test -w apps/api
```

Couvre la génération de référence `ManualOrangeMoneyProvider`, la transition paiement validé → commande confirmée, et l'expiration automatique des commandes non payées.
