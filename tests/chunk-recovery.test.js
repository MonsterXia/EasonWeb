import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
after(() => vite.close())
const { createChunkRecovery } = await vite.ssrLoadModule('/src/router/chunkRecovery.ts')
const error = new Error('Failed to fetch dynamically imported module: /assets/old.js')
test('reloads the requested destination once across recreated app instances', () => {
  const data = new Map(), navigations = []
  const options = { storage: () => ({ getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }), navigate: path => navigations.push(path), online: () => true, now: () => 1000 }
  assert.equal(createChunkRecovery(options)(error, '/game/hypergryph/endfield'), true)
  assert.equal(createChunkRecovery(options)(error, '/game/hypergryph/endfield'), false)
  assert.deepEqual(navigations, ['/game/hypergryph/endfield'])
  assert.equal(createChunkRecovery({ ...options, now: () => 62000 })(error, '/user'), true)
})
test('does not reload application errors, offline pages, unsafe destinations or inaccessible storage', () => {
  let navigations = 0
  const options = { storage: () => ({ getItem: () => null, setItem() {} }), navigate: () => navigations++, online: () => true }
  assert.equal(createChunkRecovery(options)(new Error('Invalid input'), '/'), false)
  assert.equal(createChunkRecovery({ ...options, online: () => false })(error, '/'), false)
  assert.equal(createChunkRecovery(options)(error, '//untrusted.invalid'), false)
  assert.equal(createChunkRecovery({ ...options, storage: () => { throw new Error('blocked') } })(error, '/'), false)
  assert.equal(navigations, 0)
})
