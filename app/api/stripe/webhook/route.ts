import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { claimStripeEvent, completeStripeEvent, saveSubscription } from '@/lib/storage';

export const runtime = 'nodejs';

type EventData = { metadata?: Record<string, string>; customer?: string; subscription?: string; client_reference_id?: string };

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: 'Webhook Stripe non configuré.' }, { status: 503 });
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET); } catch { return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 }); }
  if (!claimStripeEvent(event.id, event.type)) return NextResponse.json({ received: true, duplicate: true });
  const object = event.data.object as unknown as EventData;
  const metadata = object.metadata || {};
  const userId = metadata.userId || (event.type === 'checkout.session.completed' ? object.client_reference_id : undefined);
  if (userId) {
    if (event.type === 'checkout.session.completed') {
      saveSubscription({ userId, plan: metadata.plan === 'BUSINESS' ? 'BUSINESS' : 'PRO', status: 'ACTIVE', stripeCustomerId: String(object.customer || ''), stripeSubscriptionId: String(object.subscription || '') });
    }
    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as unknown as Stripe.Subscription;
      const currentPeriodEnd = Number((subscription as unknown as { current_period_end?: number }).current_period_end || 0);
      saveSubscription({ userId, plan: metadata.plan === 'BUSINESS' ? 'BUSINESS' : 'PRO', status: subscription.status === 'active' ? 'ACTIVE' : subscription.status === 'past_due' ? 'PAST_DUE' : subscription.status === 'canceled' ? 'CANCELED' : 'INCOMPLETE', stripeCustomerId: String(subscription.customer), stripeSubscriptionId: subscription.id, stripePriceId: subscription.items.data[0]?.price.id, currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : undefined, cancelAtPeriodEnd: subscription.cancel_at_period_end });
    }
    if (event.type === 'invoice.payment_failed') saveSubscription({ userId, plan: 'PRO', status: 'PAST_DUE', stripeCustomerId: String(object.customer || '') });
  }
  completeStripeEvent(event.id, 'PROCESSED');
  return NextResponse.json({ received: true });
}
