import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { getSubscription } from '@/lib/storage';
export async function POST(request: Request) { const stripe = getStripe(); const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Connectez-vous avant de gérer votre abonnement.' }, { status: 401 }); const customer = getSubscription(user.id).stripeCustomerId; if (!stripe || !customer) return NextResponse.json({ error: 'Aucun abonnement Stripe actif à gérer.' }, { status: 400 }); const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin; const session = await stripe.billingPortal.sessions.create({ customer, return_url: `${appUrl}/settings` }); return NextResponse.json({ url: session.url }); }
