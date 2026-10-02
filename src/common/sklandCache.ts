import type { GameAccount } from './api/accounts'
import type { GameOverview } from './api/gameOverview'
import type { CurrentUser } from './api/user'

export const SKLAND_CACHE_TTL = 5 * 60 * 1000
export const roleKey = (game: GameAccount) => JSON.stringify([game.appCode, game.gameId, game.uid])
type Loader<T> = (signal: AbortSignal) => Promise<T>

function createBucket<T>(now: () => number) {
  const values = new Map<string, { data: T; expires: number }>()
  const pending = new Map<string, { controller: AbortController; promise: Promise<T> }>()
  function peek(key: string): T | undefined {
    const entry = values.get(key)
    if (entry && entry.expires > now()) return entry.data
    values.delete(key)
  }
  function load(key: string, loader: Loader<T>, force = false): Promise<T> {
    if (force) {
      pending.get(key)?.controller.abort()
      pending.delete(key)
      values.delete(key)
    }
    const cached = peek(key)
    if (cached !== undefined) return Promise.resolve(cached)
    const existing = pending.get(key)
    if (existing) return existing.promise
    const controller = new AbortController()
    const promise = Promise.resolve()
      .then(() => loader(controller.signal))
      .then((data) => {
        // A loader may resolve even after cancellation. Never revive an old account's cache.
        if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError')
        for (const key of values.keys()) peek(key)
        values.set(key, { data, expires: now() + SKLAND_CACHE_TTL })
        return data
      })
      .finally(() => {
        if (pending.get(key)?.controller === controller) pending.delete(key)
      })
    pending.set(key, { controller, promise })
    return promise
  }
  function cancelPending() {
    for (const entry of pending.values()) entry.controller.abort()
    pending.clear()
  }
  return {
    peek,
    load,
    cancelPending,
    clear() {
      cancelPending()
      values.clear()
    },
  }
}

/** Memory only, scoped to the verified website user and the current Hypergryph binding. */
export function createSklandCache(now: () => number = Date.now) {
  let owner: string | null = null
  const accounts = createBucket<GameAccount[]>(now)
  const overviews = createBucket<GameOverview>(now)
  function clear() {
    owner = null
    accounts.clear()
    overviews.clear()
  }
  function setUser(user: Pick<CurrentUser, 'id' | 'hypergryphAccount'> | null) {
    const binding = user?.hypergryphAccount
    const key = user && binding ? JSON.stringify([user.id, binding.phone, binding.updatedAt]) : null
    if (owner !== key) clear()
    owner = key
  }
  return {
    clear,
    setUser,
    cancelPending() {
      accounts.cancelPending()
      overviews.cancelPending()
    },
    loadAccounts(loader: Loader<GameAccount[]>) {
      return owner
        ? accounts.load('accounts', loader)
        : Promise.reject(new Error('No linked account'))
    },
    peekOverview(game: GameAccount) {
      return owner ? overviews.peek(roleKey(game)) : undefined
    },
    loadOverview(game: GameAccount, loader: Loader<GameOverview>, force = false) {
      return owner
        ? overviews.load(roleKey(game), loader, force)
        : Promise.reject(new Error('No linked account'))
    },
  }
}
export const sklandCache = createSklandCache()

export async function invalidateSklandAfter<T>(operation: Promise<T>): Promise<T> {
  const result = await operation
  sklandCache.clear()
  return result
}
