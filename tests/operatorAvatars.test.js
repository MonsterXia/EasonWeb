import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { createServer } from 'vite'
const vite = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.vite-avatar-tests',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => vite.close())
const { operatorAvatar } = await vite.ssrLoadModule('/src/common/operatorAvatars.ts')
const catalog = JSON.parse(
  readFileSync(new URL('../src/assets/game-avatars/catalog.json', import.meta.url), 'utf8'),
)
test('avatar lookup is local, uses the game namespace and rejects unknown IDs', () => {
  assert.equal(
    operatorAvatar('arknights', 'char_002_amiya'),
    'https://web.hycdn.cn/arknights/game/assets/char_skin/portrait/char_002_amiya%231.png',
  )
  assert.match(operatorAvatar('endfield', 'chr_0016_laevat'), /chr_0016_laevat\.png/)
  assert.equal(operatorAvatar('endfield', 'char_002_amiya'), undefined)
  assert.equal(operatorAvatar('unknown', 'char_002_amiya'), undefined)
  assert.equal(operatorAvatar('arknights', '__proto__'), undefined)
  assert.equal(operatorAvatar('endfield', 'future-character'), undefined)
})
test('every catalog entry resolves to an official CDN link or a bundled PNG', () => {
  for (const [id, url] of Object.entries(catalog.arknights)) {
    const parsed = new URL(url)
    assert.equal(parsed.origin, 'https://web.hycdn.cn')
    assert.equal(decodeURIComponent(parsed.pathname.split('/').at(-1)), `${id}#1.png`)
  }
  for (const [id, file] of Object.entries(catalog.endfield)) {
    assert.equal(file, `${id}.png`)
    const path = new URL('../src/assets/game-avatars/endfield/' + file, import.meta.url)
    assert.ok(existsSync(path))
    assert.equal(readFileSync(path).subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.ok(operatorAvatar('endfield', id))
  }
})
