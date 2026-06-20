export function validateEnvironment(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const errors: string[] = [];

  if (!process.env.JWT_SECRET?.trim() || process.env.JWT_SECRET.trim().length < 32) {
    errors.push('JWT_SECRET must be set to at least 32 characters in production');
  }

  if (!process.env.MONGODB_URI?.trim()) {
    errors.push('MONGODB_URI must be set in production');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }
}
