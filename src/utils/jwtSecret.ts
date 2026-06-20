const DEV_FALLBACK = 'dev-only-jwt-secret-not-for-production';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a strong secret (at least 32 characters) in production'
      );
    }
    return secret;
  }

  if (secret) {
    return secret;
  }

  console.warn(
    'WARNING: JWT_SECRET is not set. Using a development-only fallback. Set JWT_SECRET in .env before deploying.'
  );
  return DEV_FALLBACK;
}
