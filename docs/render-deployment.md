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

Les interfaces de production utilisent `/api`. Les fichiers `apps/pwa/vercel.json` et `apps/admin/vercel.json` transmettent ces requêtes vers `https://baobab-api-7w7h.onrender.com`, sans préfixe /api côté backend. Les réponses API ne sont pas mises en cache par le proxy. Les anciennes variables VITE_API_URL ne sont plus utilisées en production ; elles restent disponibles pour le développement local. Un push sur main redéploie les deux projets via leur intégration Git existante. Ne publier le changement de destination qu'après validation de `/health`.

Service Render : `srv-dbdl4jqvcj2c7385do1g`, espace `My Workspace`, région Singapore. Le service a été créé directement via le connecteur Render ; render.yaml reste une configuration de référence, pas un Blueprint synchronisé. La création via ce connecteur applique le contrôle TCP par défaut : le contrôle HTTP /health peut être sélectionné dans les réglages Render.
Les dossiers frontend sont apps/pwa et apps/admin, avec la sortie dist. Conserver les paramètres monorepo existants.

## Validation

Le package `@baobab/shared` expose `dist/index.js` à Node et `src/index.ts` aux bundlers via `module`. Compiler le package partagé avant l’API, puis vérifier `node -e "require('@baobab/shared')"`. Un build TypeScript réussi ne suffit pas : un point d’entrée vers une source TypeScript contenant des enums peut faire échouer le démarrage Node en production.

Le réglage Render « On Commit » doit être accompagné d’une intégration GitHub fonctionnelle. Après un push sur `main`, vérifier qu’un déploiement Render apparaît pour ce SHA avec un déclencheur Git, puis attendre `live`. Un déploiement lancé par API prouve la publication, pas le fonctionnement du déclenchement automatique. Si aucun événement n’apparaît, vérifier la source connectée, la branche, les filtres et les droits de l’application Render sur le dépôt GitHub. Ne pas enregistrer un Deploy Hook privé dans ce dépôt.

- GET /health : 200 et status ok.
- GET /products : réponse JSON.
- OPTIONS /auth/dev-login avec Origin de chaque frontend et Access-Control-Request-Method POST : origine autorisée.
- Vérifier les bundles publiés : appels relatifs /api et absence de l'ancienne URL Railway.
- Vérifier la connexion et /users/me avec un compte de test autorisé, sans toucher aux commandes ni aux paiements.

Ne considérer la migration comme terminée qu'après validation sur les domaines publics.
