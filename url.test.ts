import { describe, expect, it } from 'vitest';
import { isPrivateIp, normalizeUrl } from '@/lib/analyzer/url';

describe('URL validation and SSRF guards', () => {
  it('normalizes public http(s) URLs', () => { expect(normalizeUrl('HTTPS://Example.com/path#section').toString()).toBe('https://example.com/path'); });
  it('rejects local and private targets', () => { for (const url of ['http://localhost:3000', 'http://127.0.0.1', 'http://10.0.0.2', 'http://192.168.1.4', 'ftp://example.com']) expect(() => normalizeUrl(url)).toThrow(); });
  it('recognizes private ranges', () => { expect(isPrivateIp('172.16.0.1')).toBe(true); expect(isPrivateIp('169.254.1.1')).toBe(true); expect(isPrivateIp('8.8.8.8')).toBe(false); expect(isPrivateIp('::1')).toBe(true); });
  it('rejects URL credentials', () => { expect(() => normalizeUrl('https://user:pass@example.com')).toThrow(/identifiants/); });
});
