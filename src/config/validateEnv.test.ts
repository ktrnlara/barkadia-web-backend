import { afterEach, describe, expect, it } from 'vitest';
import { validateEnvironment } from './validateEnv';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('validateEnvironment', () => {
  it('does not throw outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    delete process.env.MONGODB_URI;
    expect(() => validateEnvironment()).not.toThrow();
  });

  it('throws in production when required vars are missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.MONGODB_URI;
    expect(() => validateEnvironment()).toThrow(/JWT_SECRET/);
    expect(() => validateEnvironment()).toThrow(/MONGODB_URI/);
  });
});
