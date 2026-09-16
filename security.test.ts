import { describe, expect, it } from 'vitest';
import { rateLimit } from '@/lib/security/rate-limit';

describe('rate limiting', () => { it('blocks after the configured number of calls', () => { const key = `test-${Date.now()}`; expect(rateLimit(key, 2).allowed).toBe(true); expect(rateLimit(key, 2).allowed).toBe(true); expect(rateLimit(key, 2).allowed).toBe(false); }); });
