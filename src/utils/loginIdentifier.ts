function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeLoginIdentifier(raw: unknown): string {
  return String(raw ?? '').trim();
}

export function buildLoginQuery(identifier: string): { email: string } | { username: RegExp } | null {
  const trimmed = normalizeLoginIdentifier(identifier);
  if (!trimmed) return null;

  if (trimmed.includes('@')) {
    return { email: trimmed.toLowerCase() };
  }

  return { username: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') };
}
