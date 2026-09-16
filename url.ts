import dns from 'node:dns/promises';
import net from 'node:net';

export class UrlValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'UrlValidationError'; }
}

const blockedHostnames = new Set(['localhost', 'localhost.localdomain', 'ip6-localhost', 'ip6-loopback', '0.0.0.0']);

function ipv4ToNumber(ip: string) {
  return ip.split('.').reduce((n, octet) => (n * 256) + Number(octet), 0);
}

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const n = ipv4ToNumber(ip);
    const ranges: [number, number][] = [
      [ipv4ToNumber('0.0.0.0'), ipv4ToNumber('0.255.255.255')],
      [ipv4ToNumber('10.0.0.0'), ipv4ToNumber('10.255.255.255')],
      [ipv4ToNumber('100.64.0.0'), ipv4ToNumber('100.127.255.255')],
      [ipv4ToNumber('127.0.0.0'), ipv4ToNumber('127.255.255.255')],
      [ipv4ToNumber('169.254.0.0'), ipv4ToNumber('169.254.255.255')],
      [ipv4ToNumber('172.16.0.0'), ipv4ToNumber('172.31.255.255')],
      [ipv4ToNumber('192.0.0.0'), ipv4ToNumber('192.0.0.255')],
      [ipv4ToNumber('192.168.0.0'), ipv4ToNumber('192.168.255.255')],
      [ipv4ToNumber('198.18.0.0'), ipv4ToNumber('198.19.255.255')],
      [ipv4ToNumber('224.0.0.0'), ipv4ToNumber('255.255.255.255')],
    ];
    return ranges.some(([start, end]) => n >= start && n <= end);
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('::ffff:127.') || normalized.startsWith('::ffff:10.') || normalized.startsWith('::ffff:192.168.');
  }
  return false;
}

export function normalizeUrl(raw: string): URL {
  const input = raw.trim();
  if (!input) throw new UrlValidationError('Veuillez saisir une URL.');
  let parsed: URL;
  try { parsed = new URL(input); } catch { throw new UrlValidationError('URL invalide. Utilisez une adresse commençant par http:// ou https://.'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new UrlValidationError('Seuls les protocoles HTTP et HTTPS sont autorisés.');
  if (parsed.username || parsed.password) throw new UrlValidationError('Les identifiants intégrés dans une URL ne sont pas autorisés.');
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (blockedHostnames.has(hostname) || isPrivateIp(hostname)) throw new UrlValidationError('Cette adresse cible un hôte local ou une plage réseau privée.');
  if (!hostname.includes('.') && !net.isIP(hostname)) throw new UrlValidationError('Le nom de domaine semble incomplet.');
  parsed.hostname = hostname;
  parsed.hash = '';
  if (parsed.pathname.length > 2048) throw new UrlValidationError('Le chemin de cette URL est trop long.');
  return parsed;
}

export async function assertPublicHostname(url: URL): Promise<void> {
  if (isPrivateIp(url.hostname)) throw new UrlValidationError('Cette adresse IP n’est pas accessible par le scanner.');
  try {
    const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) throw new UrlValidationError('Le domaine résout vers une adresse réseau non publique.');
  } catch (error) {
    if (error instanceof UrlValidationError) throw error;
    throw new UrlValidationError('Le domaine est introuvable ou ne peut pas être vérifié.');
  }
}

export function sameOrigin(a: URL, b: URL) { return a.origin === b.origin; }
