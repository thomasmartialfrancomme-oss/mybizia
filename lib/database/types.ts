import type { AnalysisReport } from '@/lib/analyzer/types';

export type Plan = 'FREE' | 'PRO' | 'BUSINESS';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';
export type StoredUser = { id: string; email: string; name: string; role: 'USER' | 'ADMIN'; createdAt: string };
export type StoredWebsite = { id: string; userId: string; name: string; url: string; createdAt: string; monitoring: boolean };
export type StoredSubscription = { userId: string; plan: Plan; status: SubscriptionStatus; stripeCustomerId?: string; stripeSubscriptionId?: string; stripePriceId?: string; currentPeriodEnd?: string; cancelAtPeriodEnd?: boolean };
export type StoredReport = AnalysisReport & { userId: string; websiteId?: string };
