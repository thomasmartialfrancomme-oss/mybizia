# SETUP

## 1. Installer

Node 20 recommandé. `npm install`, puis copier `.env.example` en `.env.local`.

## 2. Mode local sans comptes

Laisser Supabase et Stripe vides. `/analyze` lance un contrôle réel sur l’URL publique fournie; `/report/demo` utilise des données explicitement fictives. La connexion locale crée uniquement un cookie de démonstration et ne doit pas être utilisée telle quelle en production.

## 3. Supabase

1. Créer un projet Supabase gratuit.
2. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Appliquer `supabase/migrations/001_initial.sql` via Supabase CLI ou SQL Editor.
4. Configurer l’URL de redirection Auth vers `/auth/callback`.
5. Garder `SUPABASE_SERVICE_ROLE_KEY` côté serveur uniquement.

La migration active RLS sur toutes les tables exposées. Les écritures Stripe/usage/audit sont prévues pour une couche serveur de confiance.

## 4. Vérifier

```bash
npm run typecheck
npm test
npm run build
```
