import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
export default function PaymentCancelPage() { return <main className="min-h-[600px] bg-cloud"><div className="mx-auto max-w-xl px-5 py-24 text-center"><div className="card p-10"><p className="label text-amber">Paiement</p><h1 className="mt-4 text-3xl font-black">Paiement annulé.</h1><p className="mt-4 text-sm leading-6 text-muted">Aucun changement d’abonnement n’a été appliqué.</p><Link href="/pricing" className="btn-primary mt-7"><ArrowLeft size={16}/> Retour aux tarifs</Link></div></div></main> }
