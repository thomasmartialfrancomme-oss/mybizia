import type { PageSnapshot } from './types';

const decode = (value: string) => value.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const attr = (tag: string, name: string) => (tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? '').trim();
const tags = (html: string, name: string) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'gi'))].map((m) => decode(m[1]));

export function parsePage(html: string, url: string, status: number, responseMs: number, contentType: string, size: number, depth: number): PageSnapshot {
  const title = tags(html, 'title')[0] ?? '';
  const description = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).find((tag) => /name\s*=\s*["']description/i.test(tag)) ? attr([...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).find((tag) => /name\s*=\s*["']description/i.test(tag)) ?? '', 'content') : '';
  const h1 = tags(html, 'h1');
  const h2 = tags(html, 'h2');
  const origin = new URL(url).origin;
  const links = [...html.matchAll(/<a\b[^>]*>/gi)].map((m) => ({ href: attr(m[0], 'href'), text: '', external: false })).filter((link) => link.href && !link.href.startsWith('#') && !/^mailto:|^tel:|^javascript:/i.test(link.href)).map((link) => {
    try { const absolute = new URL(link.href, url); return { ...link, href: absolute.toString(), external: absolute.origin !== origin }; } catch { return { ...link, external: false }; }
  });
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ src: attr(m[0], 'src'), alt: attr(m[0], 'alt') })).filter((image) => image.src);
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? '';
  return {
    url, status, responseMs, html, contentType, size, depth, title, description, h1, h2, links,
    images,
    scripts: (html.match(/<script\b/gi) ?? []).length,
    forms: (html.match(/<form\b/gi) ?? []).length,
    hasViewport: /<meta\b[^>]*name\s*=\s*["']viewport/i.test(html),
    lang: attr(htmlTag, 'lang'),
  };
}

export function visibleText(html: string): string {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<svg[\s\S]*?<\/svg>/gi, ''));
}
