import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots { const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; return { rules: { userAgent: '*', allow: ['/', '/pricing', '/analyze', '/report/demo'], disallow: ['/dashboard', '/admin', '/settings', '/api/', '/login', '/register'] }, sitemap: `${base}/sitemap.xml` }; }
