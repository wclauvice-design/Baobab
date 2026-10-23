# Déploiement Render + Vercel

Le backend NestJS utilise Render ; les deux interfaces conservent leurs projets Vercel et la base existante reste sur Supabase.

## Render

Importer `render.yaml` depuis la racine du dépôt (ne pas définir apps/api comme Root Directory : npm utilise les workspaces).
Renseigner DATABASE_URL et JWT_SECRET depuis les secrets existants, sans les enregistrer dans Git. ENABLE_DEV_LOGIN doit être choisi explicitement : true conserve la connexion sans code de la phase de test, qui ne convient pas à un lancement public. Renseigner le numéro marchand réel si nécessaire.
Les migrations sont exécutées au démarrage avec `prisma migrate deploy` ; ne pas lancer de reset ni de seed sur la base existante.
Le service écoute sur 0.0.0.0 et le PORT fourni par Render. `/health` vérifie aussi la base de données.
Le plan gratuit évite un abonnement automatique mais peut se mettre en veille : il ne garantit pas une connexion instantanée après inactivité.
Pour les photos, reprendre les variables SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et SUPABASE_STORAGE_BUCKET du service existant si configurées.

## Vercel

Après validation de `/health`, renseigner VITE_API_URL avec le domaine HTTPS réellement attribué par Render, sans suffixe /api, dans les deux projets. Redéployer les deux projets : cette variable est intégrée au JavaScript lors du build.
Les dossiers frontend sont apps/pwa et apps/admin, avec la sortie dist. Conserver les paramètres monorepo existants.

## Validation

- GET /health : 200 et status ok.
- GET /products : réponse JSON.
- OPTIONS /auth/dev-login avec Origin de chaque frontend et Access-Control-Request-Method POST : origine autorisée.
- Vérifier les bundles publiés : nouvelle URL Render et absence de l'ancienne URL Railway.
- Vérifier la connexion et /users/me avec un compte de test autorisé, sans toucher aux commandes ni aux paiements.

Ne considérer la migration comme terminée qu'après validation sur les domaines publics.
