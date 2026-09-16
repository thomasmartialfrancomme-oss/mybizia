# STRIPE_SETUP

1. Utiliser Stripe en **TEST mode**.
2. Créer les produits PRO et BUSINESS et leurs prix récurrents.
3. Renseigner uniquement côté serveur: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_BUSINESS_PRICE_ID`. La clé publishable peut être exposée si nécessaire, mais le checkout V1 est créé côté serveur.
4. Configurer `POST /api/stripe/webhook`.
5. Tester `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid` et `invoice.payment_failed`.
6. Ajouter une persistance transactionnelle dans `stripe_events` avant de traiter un event afin de garantir l’idempotence en production.

Le serveur choisit le Price ID selon un plan validé par Zod. Le montant ne vient jamais du navigateur. Le compte Stripe du vendeur reçoit les paiements; Stripe Connect n’est pas utilisé.
