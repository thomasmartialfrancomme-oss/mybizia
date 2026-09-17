'use client';
import { useEffect } from 'react';
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error('application_error', { digest: 'error-boundary' }); }, []); return <main className="flex min-h-[600px] items-center justify-center bg-cloud px-5"><div className="text-center"><h1 className="text-3xl font-black">Une erreur est survenue.</h1><p className="mt-3 text-muted">Les détails techniques ne sont pas affichés.</p><button onClick={() => reset()} className="btn-primary mt-7">Réessayer</button></div></main> }
