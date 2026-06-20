import { afterEach, describe, expect, it } from 'vitest';
import { getJwtSecret } from './jwtSecret';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('getJwtSecret', () => {
  it('uses configured secret in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'my-local-dev-secret';
    expect(getJwtSecret()).toBe('my-local-dev-secret');
  });

  it('throws in production when secret is missing or too short', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);

    process.env.JWT_SECRET = 'too-short';
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('accepts a strong secret in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(32);
    expect(getJwtSecret()).toBe('a'.repeat(32));
  });
});
