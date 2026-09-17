import type { AnalysisReport } from '@/lib/analyzer/types';
import type { Plan, StoredReport, StoredSubscription, StoredUser, StoredWebsite } from '@/lib/database/types';

const demoUser: StoredUser = { id: 'demo-user', email: 'demo@fixmybusiness.ai', name: 'Compte démo', role: 'USER', createdAt: new Date().toISOString() };
const users = new Map<string, StoredUser>([[demoUser.id, demoUser]]);
const websites = new Map<string, StoredWebsite>();
const reports = new Map<string, StoredReport>();
const subscriptions = new Map<string, StoredSubscription>([[demoUser.id, { userId: demoUser.id, plan: 'FREE', status: 'ACTIVE' }]]);
const stripeEvents = new Map<string, { type: string; status: 'RECEIVED' | 'PROCESSED' | 'FAILED'; processedAt?: string }>();

const demoReport: StoredReport = {
  id: 'demo', userId: demoUser.id, url: 'https://atelier-exemple.fr/', createdAt: '2026-09-12T09:20:00.000Z', status: 'COMPLETED', pageCount: 1, requestedPageCount: 1, aiAvailable: false,
  scores: { SEO: 74, CONTENU: 68, TECHNIQUE: 90, MOBILE: 100, ACCESSIBILITÉ: 72, CONVERSION: 57, PERFORMANCE: 81, global: 74 },
  summary: 'Exemple de rapport pour comprendre comment les contrôles automatisés transforment des signaux publics en actions concrètes.',
  positives: ['Viewport mobile détecté', 'La page répond correctement', 'Un H1 unique est détecté', 'Indicateur de poids raisonnable'],
  limitations: ['EXEMPLE — DONNÉES FICTIVES', 'Contrôle automatisé basé sur les éléments publiquement accessibles.', 'Le score est un indicateur interne, pas une norme officielle.'],
  pages: [{ url: 'https://atelier-exemple.fr/', status: 200, responseMs: 482, size: 184300, depth: 0, title: 'Atelier Exemple — Créations locales' }],
  results: [
    { id: 'd1', category: 'CONVERSION', rule: 'clear-cta', status: 'warning', severity: 'high', score: 35, title: 'Appel à l’action évident non détecté', evidence: 'Le contrôle n’a pas repéré de libellé habituel d’appel à l’action dans le texte visible.', recommendation: 'Rendez l’étape suivante explicite avec un bouton comme « Demander un devis » ou « Prendre contact ».' },
    { id: 'd2', category: 'SEO', rule: 'meta-description', status: 'fail', severity: 'high', score: 0, title: 'Meta description non détectée', evidence: 'La page ne contient pas de meta description identifiable.', recommendation: 'Ajoutez une description unique qui résume la page et donne envie de la visiter.' },
    { id: 'd3', category: 'ACCESSIBILITÉ', rule: 'image-alt', status: 'warning', severity: 'medium', score: 60, title: 'Certaines images n’ont pas de texte alternatif', evidence: '2 images sans alt sur 7 détectées.', recommendation: 'Ajoutez un alt pertinent aux images informatives.' },
    { id: 'd4', category: 'TECHNIQUE', rule: 'http-status', status: 'pass', severity: 'good', score: 100, title: 'La page répond correctement', evidence: 'Statut HTTP: 200.', recommendation: 'Continuez à surveiller les pages en erreur.' },
    { id: 'd5', category: 'MOBILE', rule: 'viewport', status: 'pass', severity: 'good', score: 100, title: 'Viewport mobile détecté', evidence: 'La balise meta viewport est présente.', recommendation: 'Vérifiez le rendu sur plusieurs tailles d’écran.' },
  ],
};
reports.set(demoReport.id, demoReport);
websites.set('demo-site', { id: 'demo-site', userId: demoUser.id, name: 'Atelier Exemple', url: demoReport.url, createdAt: demoReport.createdAt, monitoring: false });

export function getUser(userId: string) { return users.get(userId); }
export function upsertUser(user: StoredUser) { users.set(user.id, user); subscriptions.set(user.id, subscriptions.get(user.id) ?? { userId: user.id, plan: 'FREE', status: 'ACTIVE' }); return user; }
export function getReport(id: string) { return reports.get(id); }
export function saveReport(report: StoredReport) { reports.set(report.id, report); return report; }
export function getReports(userId: string) { return [...reports.values()].filter((report) => report.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export function getWebsites(userId: string) { return [...websites.values()].filter((site) => site.userId === userId); }
export function saveWebsite(site: StoredWebsite) { websites.set(site.id, site); return site; }
export function getWebsite(id: string, userId: string) { const site = websites.get(id); return site?.userId === userId ? site : undefined; }
export function getSubscription(userId: string) { return subscriptions.get(userId) ?? { userId, plan: 'FREE' as Plan, status: 'ACTIVE' as const }; }
export function saveSubscription(subscription: StoredSubscription) { subscriptions.set(subscription.userId, subscription); return subscription; }
export function getAdminStats() { return { users: users.size, sites: websites.size, reports: reports.size, subscriptions: [...subscriptions.values()] }; }
export function claimStripeEvent(eventId: string, type: string) { if (stripeEvents.has(eventId)) return false; stripeEvents.set(eventId, { type, status: 'RECEIVED' }); return true; }
export function completeStripeEvent(eventId: string, status: 'PROCESSED' | 'FAILED') { const event = stripeEvents.get(eventId); if (event) stripeEvents.set(eventId, { ...event, status, processedAt: new Date().toISOString() }); }
export function deleteUserData(userId: string) { for (const [id, report] of reports) if (report.userId === userId) reports.delete(id); for (const [id, site] of websites) if (site.userId === userId) websites.delete(id); users.delete(userId); subscriptions.delete(userId); }
