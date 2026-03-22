import { beforeAll, describe, expect, it } from 'bun:test';

describe('auth', () => {
  let hashPassword: (password: string) => Promise<string>;
  let verifyPassword: (password: string, stored: string) => Promise<boolean>;

  beforeAll(async () => {
    const mod = await import('@/lib/auth');
    hashPassword = mod.hashPassword;
    verifyPassword = mod.verifyPassword;
  });

  describe('hashPassword', () => {
    it('returns a string with salt:hash format', async () => {
      const result = await hashPassword('mypassword');
      expect(result).toContain(':');
      const parts = result.split(':');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBe(32); // 16 bytes = 32 hex chars
      expect(parts[1].length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('produces different hashes each call (random salt)', async () => {
      const a = await hashPassword('same-password');
      const b = await hashPassword('same-password');
      expect(a).not.toBe(b);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const hash = await hashPassword('correcthorse');
      expect(await verifyPassword('correcthorse', hash)).toBe(true);
    });

    it('returns false for wrong password', async () => {
      const hash = await hashPassword('correcthorse');
      expect(await verifyPassword('wrongpassword', hash)).toBe(false);
    });

    it('returns false for empty password against non-empty hash', async () => {
      const hash = await hashPassword('somepassword');
      expect(await verifyPassword('', hash)).toBe(false);
    });
  });
});
