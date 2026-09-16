# SECURITY

## Garde-fous présents

- URL limitée à HTTP/HTTPS, identifiants URL refusés, hôtes locaux/IP privées/link-local bloqués ;
- résolution DNS contrôlée avant chaque récupération et redirections manuelles bornées à la même origine ;
- timeout, réponse maximale, nombre de pages/liens, profondeur et durée totale configurables ;
- validation Zod, rate limiting mémoire sur l’analyse, secrets sans `NEXT_PUBLIC_` ;
- contenu du site traité comme donnée non fiable: il ne peut pas exécuter d’instruction ni de commande ;
- RLS versionné dans Supabase et routes privées filtrées côté serveur ;
- signature Stripe vérifiée sur le corps brut.

## Avant production

Remplacer le rate limiter mémoire par Redis/Upstash ou un mécanisme distribué, persister les événements Stripe avant traitement pour l’idempotence, utiliser l’adaptateur Supabase réel, ajouter CSRF sur mutations cookie si nécessaire, journaliser avec redaction, configurer CSP/headers, vérifier les quotas atomiquement et tester les politiques RLS avec deux utilisateurs réels.
