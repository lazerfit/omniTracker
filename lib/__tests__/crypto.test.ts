import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

const TEST_KEY = 'a'.repeat(64);

describe('crypto', () => {
  let encrypt: (plaintext: string) => { encrypted: string; iv: string; authTag: string };
  let decrypt: (encrypted: string, iv: string, authTag: string) => string;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
    const mod = await import('@/lib/crypto');
    encrypt = mod.encrypt;
    decrypt = mod.decrypt;
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it('encrypt returns non-empty encrypted, iv, authTag', () => {
    const result = encrypt('hello');
    expect(result.encrypted).toBeTruthy();
    expect(result.iv).toBeTruthy();
    expect(result.authTag).toBeTruthy();
  });

  it('decrypt round-trips correctly', () => {
    const plaintext = 'super-secret-api-key-12345';
    const { encrypted, iv, authTag } = encrypt(plaintext);
    const result = decrypt(encrypted, iv, authTag);
    expect(result).toBe(plaintext);
  });

  it('produces different iv on each encrypt call (randomness)', () => {
    const input = 'same-input';
    const first = encrypt(input);
    const second = encrypt(input);
    expect(first.iv).not.toBe(second.iv);
  });

  it('decrypt throws when authTag is tampered', () => {
    const { encrypted, iv } = encrypt('sensitive-data');
    const badAuthTag = 'ff'.repeat(16);
    expect(() => decrypt(encrypted, iv, badAuthTag)).toThrow();
  });

  it('encrypt throws when ENCRYPTION_KEY is not set', () => {
    const savedKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    try {
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
    } finally {
      process.env.ENCRYPTION_KEY = savedKey;
    }
  });

  it('decrypt throws when ENCRYPTION_KEY is not set', () => {
    // encrypt first while key is still set
    const { encrypted, iv, authTag } = encrypt('test-value');

    const savedKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    try {
      expect(() => decrypt(encrypted, iv, authTag)).toThrow(
        'ENCRYPTION_KEY environment variable is not set',
      );
    } finally {
      process.env.ENCRYPTION_KEY = savedKey;
    }
  });
});
