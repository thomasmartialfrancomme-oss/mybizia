import { assertPublicHostname, normalizeUrl, sameOrigin, UrlValidationError } from './url';
import { parsePage } from './parser';
import type { PageSnapshot } from './types';

export type CrawlOptions = { maxPages?: number; maxDepth?: number };
export const crawlerConfig = {
  timeout: Number(process.env.CRAWLER_TIMEOUT || 8000),
  maxPages: Number(process.env.CRAWLER_MAX_PAGES || 10),
  maxResponseSize: Number(process.env.CRAWLER_MAX_RESPONSE_SIZE || 2_000_000),
  maxLinks: Number(process.env.CRAWLER_MAX_LINKS || 80),
  maxRedirects: Number(process.env.CRAWLER_MAX_REDIRECTS || 3),
  maxTotalTime: Number(process.env.CRAWLER_MAX_TOTAL_TIME || 20_000),
};

async function fetchHtml(target: URL): Promise<{ snapshot: PageSnapshot; discovered: string[] }> {
  let current = target;
  let redirects = 0;
  const started = Date.now();
  while (true) {
    await assertPublicHostname(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), crawlerConfig.timeout);
    let response: Response;
    try {
      response = await fetch(current, { signal: controller.signal, redirect: 'manual', headers: { 'user-agent': 'FixMyBusinessAI/1.0 (+public-site-audit)', accept: 'text/html,application/xhtml+xml' }, cache: 'no-store' });
    } catch (error) {
      clearTimeout(timer);
      const message = error instanceof Error && error.name === 'AbortError' ? 'Temps de réponse dépassé.' : 'Connexion impossible.';
      throw new Error(message);
    }
    clearTimeout(timer);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (++redirects > crawlerConfig.maxRedirects) throw new Error('Trop de redirections.');
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirection sans destination.');
      try { current = new URL(location, current); } catch { throw new Error('Destination de redirection invalide.'); }
      if (!['http:', 'https:'].includes(current.protocol) || !sameOrigin(target, current)) throw new Error('Redirection vers une autre origine bloquée.');
      continue;
    }
    const type = response.headers.get('content-type') || '';
    if (!type.toLowerCase().includes('text/html') && !type.toLowerCase().includes('application/xhtml+xml')) throw new Error('Le contenu récupéré n’est pas une page HTML.');
    const length = Number(response.headers.get('content-length') || 0);
    if (length > crawlerConfig.maxResponseSize) throw new Error('La réponse dépasse la taille maximale autorisée.');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Réponse vide.');
    const chunks: Uint8Array[] = []; let total = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      total += value?.byteLength ?? 0;
      if (total > crawlerConfig.maxResponseSize) { await reader.cancel(); throw new Error('La réponse dépasse la taille maximale autorisée.'); }
      if (value) chunks.push(value);
    }
    const html = new TextDecoder().decode(new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0)));
    let offset = 0; const merged = new Uint8Array(total);
    for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
    const body = new TextDecoder().decode(merged);
    const responseMs = Date.now() - started;
    const snapshot = parsePage(body, current.toString(), response.status, responseMs, type, total, 0);
    return { snapshot, discovered: snapshot.links.slice(0, crawlerConfig.maxLinks).filter((link) => !link.external).map((link) => link.href) };
  }
}

export async function crawl(rawUrl: string, options: CrawlOptions = {}): Promise<{ pages: PageSnapshot[]; warnings: string[] }> {
  const start = Date.now();
  const root = normalizeUrl(rawUrl);
  const maxPages = Math.min(Math.max(options.maxPages ?? 1, 1), crawlerConfig.maxPages);
  const maxDepth = maxPages > 1 ? 2 : 0;
  const queue: { url: string; depth: number }[] = [{ url: root.toString(), depth: 0 }];
  const seen = new Set<string>(); const pages: PageSnapshot[] = []; const warnings: string[] = [];
  while (queue.length && pages.length < maxPages && Date.now() - start < crawlerConfig.maxTotalTime) {
    const next = queue.shift(); if (!next) break;
    let normalized: URL;
    try { normalized = normalizeUrl(next.url); } catch { continue; }
    normalized.search = normalized.search; normalized.hash = '';
    const canonical = normalized.toString();
    if (seen.has(canonical) || !sameOrigin(root, normalized)) continue;
    seen.add(canonical);
    try {
      const { snapshot, discovered } = await fetchHtml(normalized);
      snapshot.depth = next.depth; pages.push(snapshot);
      if (next.depth < maxDepth) for (const link of discovered) if (!seen.has(link) && queue.length < crawlerConfig.maxLinks) queue.push({ url: link, depth: next.depth + 1 });
    } catch (error) {
      warnings.push(`${canonical}: ${error instanceof Error ? error.message : 'échec de récupération'}`);
    }
  }
  if (!pages.length && !warnings.length) throw new UrlValidationError('Aucune page n’a pu être analysée.');
  if (Date.now() - start >= crawlerConfig.maxTotalTime) warnings.push('La durée maximale de l’analyse a été atteinte.');
  if (pages.length < maxPages && warnings.length) warnings.push('Certaines pages n’ont pas pu être récupérées; le rapport est partiel.');
  return { pages, warnings };
}
