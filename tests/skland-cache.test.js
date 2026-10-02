import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
after(() => vite.close())
const { createSklandCache, SKLAND_CACHE_TTL } = await vite.ssrLoadModule('/src/common/sklandCache.ts')
const user = { id: 1, hypergryphAccount: { phone: 'fixture-account', updatedAt: 'v1' } }
const arknights = { appCode: 'arknights', uid: '1', gameId: '1', nickName: 'Doctor' }
const endfield = { ...arknights, appCode: 'endfield' }
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

test('reuses role lists and separate game snapshots until expiry or explicit refresh', async () => {
  let now = 0, calls = 0
  const cache = createSklandCache(() => now)
  cache.setUser(user)
  const accounts = () => { calls++; return Promise.resolve([arknights, endfield]) }
  const snapshot = game => { calls++; return Promise.resolve({ account: game, fetchedAt: calls }) }
  await cache.loadAccounts(accounts)
  await cache.loadOverview(arknights, () => snapshot(arknights))
  await cache.loadOverview(endfield, () => snapshot(endfield))
  const first = cache.peekOverview(arknights)
  cache.setUser(user)
  await cache.loadAccounts(accounts)
  assert.equal(await cache.loadOverview(arknights, () => snapshot(arknights)), first)
  assert.equal(calls, 3)
  assert.notEqual(cache.peekOverview(arknights), cache.peekOverview(endfield))
  now = SKLAND_CACHE_TTL
  assert.equal(cache.peekOverview(arknights), undefined)
  await cache.loadAccounts(accounts)
  await cache.loadOverview(arknights, () => snapshot(arknights))
  assert.equal(calls, 5)
  await cache.loadOverview(arknights, () => snapshot(arknights), true)
  assert.equal(calls, 6)
})

test('shares in-flight reads and prevents cancelled responses overwriting newer data', async () => {
  const cache = createSklandCache()
  cache.setUser(user)
  const old = deferred()
  let calls = 0
  const loader = () => { calls++; return old.promise }
  const first = cache.loadOverview(arknights, loader)
  const reused = cache.loadOverview(arknights, loader)
  assert.equal(first, reused)
  const rejected = assert.rejects(first, error => error.name === 'AbortError')
  const fresh = { account: arknights, fetchedAt: 2 }
  await cache.loadOverview(arknights, async () => fresh, true)
  old.resolve({ account: arknights, fetchedAt: 1 })
  await rejected
  assert.equal(calls, 1)
  assert.equal(cache.peekOverview(arknights), fresh)
})

test('isolates by user, binding version, game, server, and role', async () => {
  const cache = createSklandCache()
  cache.setUser(user)
  await cache.loadOverview(arknights, async () => ({ account: arknights }))
  assert.equal(cache.peekOverview({ ...arknights, gameId: '2' }), undefined)
  assert.equal(cache.peekOverview({ ...arknights, uid: '2' }), undefined)
  cache.setUser({ ...user, id: 2 })
  assert.equal(cache.peekOverview(arknights), undefined)
  await cache.loadAccounts(async () => [arknights])
  cache.setUser({ ...user, id: 2, hypergryphAccount: { ...user.hypergryphAccount, updatedAt: 'v2' } })
  assert.deepEqual(await cache.loadAccounts(async () => [endfield]), [endfield])
  cache.setUser(null)
  await assert.rejects(cache.loadAccounts(async () => [arknights]), /No linked account/)
})

test('does not cache errors, and clearing cancels late work from an old identity', async () => {
  const cache = createSklandCache()
  cache.setUser(user)
  await assert.rejects(cache.loadOverview(arknights, async () => { throw new Error('offline') }), /offline/)
  assert.equal(cache.peekOverview(arknights), undefined)
  const old = deferred()
  const request = cache.loadOverview(arknights, () => old.promise)
  const rejected = assert.rejects(request, error => error.name === 'AbortError')
  cache.clear()
  cache.setUser({ ...user, id: 2 })
  old.resolve({ account: arknights })
  await rejected
  assert.equal(cache.peekOverview(arknights), undefined)
})

test('leaving the page cancels only unfinished requests and retains completed snapshots', async () => {
  const cache = createSklandCache()
  cache.setUser(user)
  const data = { account: arknights }
  await cache.loadOverview(arknights, async () => data)
  const wait = deferred()
  const request = cache.loadOverview(endfield, () => wait.promise)
  const rejected = assert.rejects(request, error => error.name === 'AbortError')
  cache.cancelPending()
  wait.resolve({ account: endfield })
  await rejected
  assert.equal(cache.peekOverview(arknights), data)
  assert.equal(cache.peekOverview(endfield), undefined)
})
