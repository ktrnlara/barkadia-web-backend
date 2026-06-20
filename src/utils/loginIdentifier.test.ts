import { describe, expect, it } from 'vitest';
import { buildLoginQuery, normalizeLoginIdentifier } from './loginIdentifier';

describe('normalizeLoginIdentifier', () => {
  it('trims whitespace', () => {
    expect(normalizeLoginIdentifier('  alice  ')).toBe('alice');
  });
});

describe('buildLoginQuery', () => {
  it('returns null for empty input', () => {
    expect(buildLoginQuery('')).toBeNull();
    expect(buildLoginQuery('   ')).toBeNull();
  });

  it('matches email case-insensitively via lowercase', () => {
    expect(buildLoginQuery('Student@NU.edu.ph')).toEqual({
      email: 'student@nu.edu.ph',
    });
  });

  it('matches username case-insensitively', () => {
    const query = buildLoginQuery('Alice_B');
    expect(query).toHaveProperty('username');
    expect((query as { username: RegExp }).username.test('alice_b')).toBe(true);
    expect((query as { username: RegExp }).username.test('Alice_B')).toBe(true);
  });

  it('escapes regex characters in usernames', () => {
    const query = buildLoginQuery('user.name+test');
    expect(query).toHaveProperty('username');
    expect((query as { username: RegExp }).username.test('user.name+test')).toBe(true);
    expect((query as { username: RegExp }).username.test('userXname+test')).toBe(false);
  });
});
