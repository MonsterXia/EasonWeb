const destinations = new Set(['/', '/user', '/game/hypergryph/endfield', '/game/hypergryph/skland'])

/** Only known, canonical in-app paths may be used after authentication. */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/user'
  try {
    if (/[\\\u0000-\u0020\u007f]/.test(decodeURIComponent(value))) return '/user'
    const parsed = new URL(value, 'https://return.invalid')
    if (parsed.origin !== 'https://return.invalid' || parsed.pathname !== value.split(/[?#]/)[0])
      return '/user'
    return destinations.has(parsed.pathname) ? value : '/user'
  } catch {
    return '/user'
  }
}

export function authLocation(
  path: '/login' | '/register' | '/reset-password',
  destination: unknown,
) {
  return { path, query: { redirect: safeReturnPath(destination) } }
}
