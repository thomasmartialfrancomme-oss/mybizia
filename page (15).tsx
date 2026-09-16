import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { getCurrentUser } from '@/lib/auth';
import { getAdminStats } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export default async function AdminPage() { const user = await getCurrentUser(); if (user?.role !== 'ADMIN') redirect('/dashboard'); const stats = getAdminStats(); return <DashboardShell><p className="label text-brand">Administration</p><h1 className="mt-2 text-3xl font-black">Vue opérateur</h1><div className="mt-8 grid gap-4 md:grid-cols-4">{[['Utilisateurs', stats.users], ['Sites', stats.sites], ['Analyses', stats.reports], ['Abonnements', stats.subscriptions.length]].map(([label, value]) => <div key={String(label)} className="card p-5"><p className="label">{label}</p><p className="mt-3 text-3xl font-black">{value}</p></div>)}</div><div className="mt-8 rounded-2xl border border-[#ffe2dc] bg-[#fff8f6] p-5 text-sm leading-6 text-muted">Les privilèges admin sont vérifiés côté serveur. Cette V1 locale ne remplace pas les politiques RLS et les journaux d’audit à activer avec Supabase.</div></DashboardShell> }
