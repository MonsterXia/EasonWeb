/** Public Skland artwork only; never send the site's referrer or credentials. */
export function officialArtworkUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    const url = new URL(value)
    if (
      url.protocol === 'https:' &&
      ['bbs.hycdn.cn', 'web.hycdn.cn', 'assets.skland.com'].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
    )
      return url.href
  } catch {
    /* Missing or malformed artwork falls back without hiding game data. */
  }
  return undefined
}
