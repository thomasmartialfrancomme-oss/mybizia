import { describe, expect, it } from 'vitest';
import { parsePage, visibleText } from '@/lib/analyzer/parser';

describe('HTML parser', () => {
  const html = '<!doctype html><html lang="fr"><head><title>Un titre clair</title><meta name="description" content="Une description utile"></head><body><h1>Bienvenue</h1><h2>Services</h2><img src="a.jpg" alt="Atelier"><img src="b.jpg"><a href="/contact">Contact</a><script></script></body></html>';
  it('extracts audit signals', () => { const page = parsePage(html, 'https://example.com/', 200, 120, 'text/html', html.length, 0); expect(page.title).toBe('Un titre clair'); expect(page.h1).toEqual(['Bienvenue']); expect(page.hasViewport).toBe(false); expect(page.images).toHaveLength(2); expect(page.images[1].alt).toBe(''); expect(page.links[0].href).toBe('https://example.com/contact'); expect(page.lang).toBe('fr'); });
  it('removes script/style text', () => { expect(visibleText('<body>Visible<script>ignore this</script><style>ignore</style></body>')).toBe('Visible'); });
});
