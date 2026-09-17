import Stripe from 'stripe';
let stripe: Stripe | null = null;
export function getStripe() { if (!process.env.STRIPE_SECRET_KEY) return null; stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' }); return stripe; }
export function priceForPlan(plan: 'PRO' | 'BUSINESS') { return plan === 'PRO' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_BUSINESS_PRICE_ID; }
