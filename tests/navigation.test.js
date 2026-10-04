import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => vite.close())

test('return paths accept known local destinations and preserve queries and fragments', async () => {
  const { safeReturnPath } = await vite.ssrLoadModule('/src/router/returnPath.ts')
  for (const path of [
    '/',
    '/user',
    '/game/hypergryph/skland?view=daily#overview',
    '/game/hypergryph/endfield',
  ]) {
    assert.equal(safeReturnPath(path), path)
  }
})

test('return paths reject external, encoded, unknown, auth-loop and non-string destinations', async () => {
  const { safeReturnPath } = await vite.ssrLoadModule('/src/router/returnPath.ts')
  for (const path of [
    undefined,
    null,
    {},
    ['/'],
    'https://evil.invalid',
    '//evil.invalid',
    '/\\evil.invalid',
    '/%2f%2fevil.invalid',
    '/%5cevil.invalid',
    '/user\n',
    '/user%0a',
    '/foo/../user',
    '/missing',
    '/login',
    '/register',
    '/reset-password',
    '/user?x=%00',
  ]) {
    assert.equal(safeReturnPath(path), '/user', String(path))
  }
})
