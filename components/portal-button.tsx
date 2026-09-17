'use client';
import { useState } from 'react';
export function PortalButton() { const [message, setMessage] = useState(''); async function open() { const response = await fetch('/api/stripe/customer-portal', { method: 'POST' }); const data = await response.json(); if (data.url) window.location.href = data.url; else setMessage(data.error || 'Portail indisponible.'); } return <div><button onClick={open} className="btn-secondary">Gérer mon abonnement</button>{message && <p className="mt-2 text-xs text-coral">{message}</p>}</div> }
