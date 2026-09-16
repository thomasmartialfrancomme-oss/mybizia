# DEPLOYMENT

## Vercel

1. Importer le dépôt GitHub.
2. Ajouter les variables `.env.example` dans Development, Preview et Production séparément.
3. Déployer les migrations Supabase avant d’exposer les routes authentifiées.
4. Définir `NEXT_PUBLIC_APP_URL` sur l’URL finale.
5. Configurer un domaine et les redirections Supabase Auth.
6. Ajouter l’endpoint Stripe `/api/stripe/webhook` avec la clé LIVE uniquement après validation du mode TEST.

Le projet lie l’analyse dans une requête HTTP pour cette V1; une analyse longue doit être déplacée vers une file/worker ou un job borné avant production. Les limites du crawler réduisent le risque mais ne remplacent pas une architecture de jobs.

## Stripe TEST

Créer produits/prix récurrents, conserver les Price IDs TEST dans les variables Preview, configurer le webhook TEST et tester les événements. Ne jamais mélanger clés LIVE et TEST. La page `success` n’active pas le plan: le webhook est la source de vérité.

## Sauvegarde

Aucune sauvegarde n’est prétendue comme configurée. Activer les sauvegardes Supabase et documenter une restauration testée avant lancement.
