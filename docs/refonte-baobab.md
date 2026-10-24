# Refonte Baobab

Catalogue public mobile, quatre univers, annonces modérées et minimums de commande. Baobab centralise les conversations : aucune donnée de contact client n'est exposée au commerçant. Les achats passent par un devis versionné et accepté, avec logistique manuelle. Les anciennes commandes sont conservées.

Clients permanents distincts des comptes ; accès invité par jetons aléatoires, rattachement au compte après vérification réelle du téléphone seulement. La connexion de test ne prouve pas la possession du numéro.

Comptabilité serveur : encaissement Baobab, encaissement livreur, reversement livreur, règlement fournisseur, coût logistique et remboursement. Écritures idempotentes, contrôles sous verrou et journal non supprimable. Livraison et paiement restent indépendants.

Notifications persistées, chat actualisé par sondage ; email uniquement avec prestataire configuré et consentement. WhatsApp est un envoi manuel préparé, sans faux statut envoyé. Pas de déploiement avant vérification des migrations et parcours réels.

## Reprise du 24 octobre 2026

Le minimum est facultatif dans le formulaire d’annonce : vide signifie 1 en base. Le conditionnement reste obligatoire pour les devis, même sans minimum supplémentaire (un carton de 100 pièces exige 100, 200, etc.). Un minimum explicite supérieur à 1 doit être un multiple du conditionnement. Les quantités initiales du catalogue et du devis tiennent compte du carton entier. La fiche affiche le montant minimal des produits et distingue les frais de transport et d’importation.

Vérification locale : 24 tests sur 6 suites réussis ; 26 vérifications PostgreSQL réussies dans le schéma isolé `baobab_refonte_test_20261023`. Compilation API, PWA et administration réussie. API locale : `/health` répond `ok`, catalogue public accessible. Après un délai de connexion du navigateur intégré, catalogue et fiche produit vérifiés sur ordinateur et à 390 px : prix par unité, quantité initiale, minimum, multiple et montant minimal de 400 FCFA pour 4 pièces à 100 FCFA. Lien WhatsApp configuré présent. Connexion administrateur de test, tableau de bord et formulaire de nouvelle annonce vérifiés : minimum vide et facultatif, conditionnement distinct. Aucun déploiement effectué lors de cette reprise.

Sous Windows, lancer Jest avec `npm.cmd test -w apps/api -- --runInBand --cacheDirectory=<dossier accessible>` si le cache temporaire système provoque une erreur EPERM.
