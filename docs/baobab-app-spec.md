# Baobab — Cahier des charges technique (MVP)

Plateforme e-commerce indépendante ciblant l'Afrique de l'Ouest francophone : Côte d'Ivoire, Burkina Faso, Togo, Bénin, Mali, Niger. Modèle hybride (vente directe + vendeurs partenaires). Paiement principal Orange Money, validé manuellement en back-office au démarrage.

Ce document est écrit pour être donné tel quel à une session de développement (Claude Code ou une équipe technique) comme point de départ.

---

## 1. Principe directeur du système de paiement

C'est le point le plus sensible du projet : il doit fonctionner **manuellement dès le premier jour**, sans bloquer une automatisation future, et sans que l'utilisateur final ne perçoive de différence.

**Règle d'architecture : n'écrivez jamais de logique de paiement en dur contre "Orange Money manuel".** Construisez une interface `PaymentProvider` unique, et le mode manuel n'est qu'une implémentation parmi d'autres :

```
PaymentProvider
├── initiate(order) → renvoie une référence de paiement + instructions à afficher au client
├── checkStatus(reference) → "en_attente" | "confirmé" | "échoué" | "expiré"
└── onWebhook(payload) → optionnel, utilisé seulement par les providers automatiques
```

**Implémentation 1 — `ManualOrangeMoneyProvider` (celle du MVP) :**

1. Le client passe commande → le système génère une référence unique (ex. `BA-7734`) et affiche : numéro marchand Orange Money, montant exact, référence à saisir.
2. Le client paie via `#144#` ou l'app Orange Money, en indiquant la référence en communication/motif si le canal le permet.
3. **Ne vous fiez jamais à une preuve envoyée par le client** (capture d'écran falsifiable). La source de vérité doit être le compte marchand Orange Money lui-même :
   - court terme : un administrateur consulte le relevé du compte marchand (SMS de confirmation Orange, ou app marchande) et rapproche manuellement montant + référence dans le back-office ;
   - dès que le volume le justifie : transférer automatiquement les SMS de confirmation Orange vers un numéro dédié relié à un petit service qui les parse et pré-remplit le back-office (ne remplace pas la validation humaine, l'accélère).
4. L'admin clique "Valider" dans le back-office → le statut de la commande passe automatiquement à "confirmée" → notification au client (SMS + WhatsApp).
5. Anti-fraude minimal : référence unique non réutilisable, expiration de la commande si non payée sous 30-60 min (libère le stock), journal d'audit horodaté de chaque validation admin (qui a validé, quand, quel montant).
6. **Rien de tout cela n'est visible du client** : il ne voit qu'un écran "Paiement en cours de vérification, confirmation sous 5 à 15 minutes" suivi d'une confirmation.

**Implémentation 2 — à activer plus tard sans toucher au reste du système :** un provider automatique branché sur un agrégateur de paiement mobile déjà actif dans la région (par exemple Kolonell, SenePay ou CinetPay, qui combinent Orange Money, MTN Money et Wave derrière une seule API) ou directement l'API Orange Money Web Payment. Comme tout le reste du système ne parle qu'à l'interface `PaymentProvider`, ce changement se fait en ajoutant une classe, sans réécrire le panier, les commandes ou le back-office.

**Recommandation :** même en gardant la validation manuelle comme mécanisme de confiance au démarrage, il vaut la peine de brancher un agrégateur pour la **confirmation de paiement** dès que possible (il notifie de manière fiable qu'un paiement a été reçu), en gardant une étape de revue admin pour autre chose (contrôle anti-fraude, vérification vendeur) plutôt que pour le rapprochement du paiement lui-même. Cela réduit fortement la charge opérationnelle et le risque d'erreur humaine sans perdre l'agilité du MVP.

---

## 2. Rôles et utilisateurs

- **Acheteur** : parcourt le catalogue, achète, paie, suit sa commande.
- **Vendeur partenaire** : gère ses produits, reçoit et prépare les commandes, suit ses revenus (mode hybride : coexiste avec les produits vendus en direct par la plateforme).
- **Admin / back-office** : valide les paiements, supervise les commandes et litiges, gère les vendeurs et le catalogue, consulte les statistiques.

## 3. Fonctionnalités MVP par rôle

**Acheteur**
- Inscription/connexion (numéro de téléphone + code SMS, plus simple qu'un email dans ce contexte)
- Catalogue avec catégories et recherche
- Fiche produit (galerie, prix FCFA, vendeur, avis)
- Panier, choix d'adresse, choix de livraison (standard/express)
- Paiement Orange Money (flux ci-dessus) + option paiement à la livraison
- Suivi de commande (statuts + notifications SMS/WhatsApp)
- Historique des commandes, avis après livraison

**Vendeur partenaire**
- Tableau de bord (revenus, commandes en attente, produits actifs)
- Gestion des produits (ajout, stock, prix)
- Gestion des commandes reçues (préparation, marquage "expédiée")
- Historique des paiements reçus (versements groupés, à définir selon le modèle de règlement des vendeurs)

**Admin**
- File d'attente des paiements à valider (montant, référence, horodatage)
- Validation/rejet d'un paiement en un clic
- Gestion des vendeurs (approbation, suspension)
- Gestion du catalogue global
- Vue d'ensemble des commandes et litiges

## 4. Modèle de données (simplifié)

`User(id, téléphone, rôle, pays, langue)` · `Seller(id, user_id, nom_boutique, ville, statut_vérification)` · `Product(id, seller_id ou "plateforme", nom, prix, devise=XOF, stock, catégorie, images)` · `Order(id, buyer_id, statut, montant_total, adresse_livraison, mode_livraison)` · `OrderItem(order_id, product_id, quantité, prix_unitaire)` · `Payment(id, order_id, provider, référence, statut, validé_par, validé_le)` · `DeliveryEvent(order_id, statut, horodatage)` · `Notification(user_id, canal, contenu, envoyé_le)`.

## 5. Architecture technique recommandée

- **Approche headless** : backend API propre + frontend propre. Aucune dépendance à Shopify/WooCommerce — la marque et l'expérience restent 100% indépendantes — mais rien n'empêche de s'appuyer sur des briques spécialisées et fiables en coulisses (paiement, SMS, hébergement).
- **Frontend acheteur** : Progressive Web App (PWA) mobile-first en priorité. Avantages ici : pas de friction d'installation via un store, poids réduit, fonctionne sur connexion lente, installable sur l'écran d'accueil. Une app native (Android en priorité, largement dominant dans la région) peut suivre une fois le concept validé.
- **Frontend admin/vendeur** : une interface web interne séparée, plus simple, pas besoin d'optimisation mobile poussée.
- **Backend** : API REST ou GraphQL classique (Node.js/NestJS ou Python/FastAPI, au choix de l'équipe), base de données PostgreSQL.
- **Notifications** : SMS via un fournisseur local (souvent plus fiable que le push pour ce marché) + WhatsApp Business API pour la confirmation de commande et le support client — WhatsApp est le canal de confiance dominant dans la région.
- **Performance faible bande passante** : compression et redimensionnement systématique des images, chargement différé (lazy loading), mise en cache offline partielle du catalogue déjà consulté.
- **Multi-devise** : inutile à ce stade — les six pays ciblés partagent le franc CFA (XOF). Concevoir le modèle de données avec un champ devise dès le départ pour ne pas bloquer une extension future, sans complexifier l'affichage aujourd'hui.

## 6. Direction UX/UI

Palette dark-mode-first : fond anthracite/indigo très sombre, accent principal ambre-orange (chaleur, clin d'œil discret à Orange Money sans le copier), accent secondaire émeraude pour les états de succès/validation. Typographie géométrique (Space Grotesk pour les titres, Sora pour le texte courant). Cartes à coins généreusement arrondis, légère profondeur, glow discret plutôt que gradients agressifs. Une première exploration visuelle de l'accueil, la fiche produit, le panier, le paiement, le suivi de commande et l'espace vendeur a été maquettée séparément.

**Sur la navigation "différente de l'existant" :** la maquette actuelle utilise une barre de navigation basse classique (icônes + libellés), volontairement pour rester lisible dès la première itération. Pour aller plus loin vers quelque chose de vraiment distinctif, deux pistes à explorer avant de figer le patron de navigation :
- un fil de découverte en haut de l'accueil façon "stories" (nouveautés, promos, vendeurs mis en avant) que l'utilisateur balaie horizontalement, plutôt qu'une simple bannière statique ;
- une exploration des catégories en bulles/orbites qu'on fait glisser plutôt qu'une rangée de chips figée, avec une action centrale flottante contextuelle (recherche, scan, ou reprise du dernier panier) au lieu d'un onglet parmi cinq.
Cela reste à valider avec vous avant d'être construit — c'est le genre de décision de direction qui mérite d'être tranchée sur maquette avant d'être codée.

## 7. Feuille de route

- **Phase 0 — MVP piloté** (1-2 pays, ex. Côte d'Ivoire + Burkina Faso) : produits en vente directe + quelques vendeurs pilotes triés sur le volet, paiement Orange Money 100% manuel, livraison gérée avec un ou deux partenaires locaux.
- **Phase 1 — Extension régionale** : ouverture aux 6 pays, ouverture du programme vendeurs partenaires, ajout d'un agrégateur de paiement pour fiabiliser la confirmation Orange Money.
- **Phase 2 — Automatisation & différenciation** : paiement multi-opérateurs (MTN Money, Moov Money, Wave selon les pays), programme de fidélité, recommandations personnalisées, exploration de la navigation "orbite" si validée en phase 0.

## 8. Points de vigilance identifiés

- **Fraude sur la validation manuelle** : ne jamais valider un paiement sur la seule base d'une preuve envoyée par le client — toujours recouper avec le compte marchand Orange Money.
- **Charge opérationnelle** : le volume de commandes va vite dépasser ce qu'un admin peut valider à la main confortablement — prévoir le passage à un agrégateur avant que ça devienne un goulot d'étranglement, pas après.
- **Logistique transfrontalière** : le Mali, le Burkina Faso et le Niger ont quitté la CEDEAO en 2025 (Alliance des États du Sahel), tandis que la Côte d'Ivoire, le Togo et le Bénin y restent — à vérifier précisément avant de faire circuler des marchandises entre ces deux blocs, cela peut affecter les délais et coûts de livraison transfrontalière.
- **Dépendance à un seul canal de paiement** : Orange Money est dominant mais pas unique dans la région (MTN Money, Moov Money, Wave existent aussi) — l'architecture en `PaymentProvider` ci-dessus est justement pensée pour ne pas être bloqué là-dessus plus tard.

---

## Brief prêt à l'emploi pour démarrer le développement

À copier tel quel dans une session de développement pour lancer le MVP :

> Construis le backend et une PWA mobile-first pour "Baobab", une plateforme e-commerce indépendante (pas de Shopify/WooCommerce) ciblant la Côte d'Ivoire, le Burkina Faso, le Togo, le Bénin, le Mali et le Niger, en franc CFA (XOF). Modèle hybride : produits vendus en direct par la plateforme + vendeurs partenaires. Implémente le paiement derrière une interface `PaymentProvider` abstraite (`initiate`, `checkStatus`, `onWebhook` optionnel), avec une première implémentation `ManualOrangeMoneyProvider` : génération d'une référence de commande unique, affichage des instructions de paiement (numéro marchand, montant, référence), file d'attente de validation dans un back-office admin, passage automatique de la commande en "confirmée" + notification client (SMS et WhatsApp) une fois validée par un admin. Prévois l'expiration automatique d'une commande non payée sous 30 à 60 minutes. Modules à livrer pour le MVP : authentification par téléphone, catalogue produits avec catégories et recherche, fiche produit, panier et choix de livraison, flux de paiement décrit ci-dessus, suivi de commande avec statuts, tableau de bord vendeur simple (produits, commandes, revenus), back-office admin (validation des paiements, gestion vendeurs et catalogue). Priorise une PWA légère et rapide sur connexion lente plutôt qu'une app native pour cette première version. Direction visuelle : dark-mode, accent ambre-orange, accent secondaire émeraude, typographies Space Grotesk (titres) et Sora (texte), coins arrondis généreux, sobre — pas de gradients agressifs ni de clichés visuels.
