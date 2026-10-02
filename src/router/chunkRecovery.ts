const KEY = 'eason-chunk-reload-at'
const RETRY_WINDOW = 60_000

export function createChunkRecovery(options: {
  storage: () => Pick<Storage, 'getItem' | 'setItem'>
  navigate: (path: string) => void
  online: () => boolean
  now?: () => number
}) {
  return (error: unknown, path: string): boolean => {
    const message = error instanceof Error ? error.message : String(error)
    if (
      !/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(
        message,
      ) ||
      !options.online() ||
      !path.startsWith('/') ||
      path.startsWith('//')
    )
      return false
    try {
      const storage = options.storage()
      const now = (options.now ?? Date.now)()
      const last = storage.getItem(KEY)
      if (last !== null && now - Number(last) < RETRY_WINDOW) return false
      // Persist before navigating so a broken deployment cannot create a reload loop.
      storage.setItem(KEY, String(now))
      options.navigate(path)
      return true
    } catch {
      return false
    }
  }
}
