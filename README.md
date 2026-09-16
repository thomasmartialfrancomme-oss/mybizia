# FixMyBusiness AI

V1 SaaS d’audit web automatisé en français. L’application analyse des éléments **publiquement accessibles**, produit un rapport explicable et conserve un mode déterministe lorsqu’aucun fournisseur IA n’est configuré.

## Démarrage local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir `http://localhost:3000`. Sans variables Supabase/Stripe, l’application démarre en **mode démo** avec un rapport d’exemple et une session locale de démonstration. Aucune dépense n’est déclenchée.

## Commandes

- `npm run dev` — développement
- `npm run typecheck` — vérification TypeScript
- `npm run test` — tests unitaires sécurité/analyse/quotas
- `npm run build` — build de production

## Fonctionnalités V1 réellement présentes

- landing page responsive, rapport exemple clairement fictif ;
- analyse HTTP/HTTPS limitée, validation SSRF, redirections bornées, taille, timeout, profondeur et pages ;
- contrôles SEO, contenu, conversion, mobile, accessibilité, performance et statut HTTP ;
- rapport détaillé avec score indicatif, preuves, recommandations, limites et exports JSON/CSV ;
- dashboard, sites, historique, quotas centralisés ;
- abstraction IA sans dépendance obligatoire ;
- endpoints Stripe Checkout, Customer Portal et webhook signé/idempotence à compléter avec une table de production ;
- migration Supabase PostgreSQL complète avec RLS et tests SQL de départ ;
- pages légales modèles, erreurs neutres, robots, sitemap, documentation sécurité.

## Limites honnêtes de cette V1

Le workspace n’a pas accès aux comptes Supabase, Vercel, Stripe ou à des secrets. Le stockage en mémoire et la session locale servent à rendre le parcours démontrable sans coût. Pour la production, configurez Supabase, remplacez l’adaptateur de stockage par les requêtes Supabase/RLS, déployez les migrations et branchez un ordonnanceur de jobs.
