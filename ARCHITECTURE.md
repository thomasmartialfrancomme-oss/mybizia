# ARCHITECTURE

- `app/`: App Router Next.js, pages publiques, dashboard et route handlers.
- `components/`: composants UI accessibles et réutilisables.
- `lib/analyzer/`: validation URL, crawler borné, parseur HTML et règles déterministes.
- `lib/ai/`: interface `AIProvider`; le fallback déterministe est toujours disponible.
- `lib/quotas/`: règles de plans et usage centralisés.
- `lib/storage.ts`: adaptateur mémoire de démonstration. En production, brancher les entités sur Supabase et conserver les contrôles RLS.
- `supabase/migrations/`: schéma PostgreSQL et politiques RLS versionnées.
- `lib/stripe.ts` et `app/api/stripe/`: Stripe côté serveur, jamais Connect, jamais clé secrète côté client.

## Flux analyse

`POST /api/analyze` → validation/rate limit/quota → `crawl()` → parse HTML → règles → score pondéré → rapport → export/dashboard.

Les scores sont pondérés: SEO 20 %, contenu 15 %, technique 15 %, mobile 10 %, accessibilité 15 %, conversion 15 %, performance 10 %. Il s’agit d’un indicateur interne.
