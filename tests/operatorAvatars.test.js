import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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
  assert.equal(
    operatorAvatar('endfield', '0b199a0eaae5a9b37a5d3c990b6c8bca'),
    operatorAvatar('endfield', 'chr_0016_laevat'),
  )
  assert.equal(
    operatorAvatar('endfield', 'bfb4ba13f819568c69c2ae46d8f5b869'),
    operatorAvatar('endfield', 'chr_0025_ardelia'),
  )
  assert.equal(operatorAvatar('endfield', 'char_002_amiya'), undefined)
  assert.equal(operatorAvatar('unknown', 'char_002_amiya'), undefined)
  assert.equal(operatorAvatar('arknights', '__proto__'), undefined)
  assert.equal(operatorAvatar('endfield', 'future-character'), undefined)
})
test('every catalog entry resolves to an official CDN link or a bundled PNG', () => {
  for (const [id, url] of Object.entries(catalog.arknights)) {
    const parsed = new URL(url)
    assert.equal(parsed.origin, 'https://web.hycdn.cn')
    assert.equal(
      decodeURIComponent(parsed.pathname.split('/').at(-1)),
      `${id}#${['char_1001_amiya2', 'char_1037_amiya3'].includes(id) ? 2 : 1}.png`,
    )
  }
  for (const [id, file] of Object.entries(catalog.endfield)) {
    const gameId = file.replace(/\.png$/, '')
    assert.match(gameId, /^chr_\d{4}_[a-z0-9]+$/)
    assert.ok(id === gameId || id === createHash('md5').update(gameId).digest('hex'))
    assert.equal(catalog.endfield[createHash('md5').update(gameId).digest('hex')], file)
    const path = new URL('../src/assets/game-avatars/endfield/' + file, import.meta.url)
    assert.ok(existsSync(path))
    assert.equal(readFileSync(path).subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.ok(operatorAvatar('endfield', id))
  }
})

test('shared Endministrator ID resolves only when the game appearance is known', () => {
  const id = '93e76fbbc07f7b480cfe0870c6414494'
  assert.equal(
    operatorAvatar('endfield', id, 'male'),
    operatorAvatar('endfield', 'chr_0002_endminm'),
  )
  assert.equal(
    operatorAvatar('endfield', id, 'female'),
    operatorAvatar('endfield', 'chr_0003_endminf'),
  )
  assert.equal(
    operatorAvatar('endfield', 'chr_9000_endmin', 'female'),
    operatorAvatar('endfield', id, 'female'),
  )
  assert.equal(operatorAvatar('endfield', id), undefined)
  assert.equal(operatorAvatar('endfield', id, null), undefined)
  assert.equal(operatorAvatar('arknights', id, 'female'), undefined)
})

test('Amiya class changes keep their own portraits despite upstream non-obtainable flags', () => {
  for (const id of ['char_1001_amiya2', 'char_1037_amiya3']) {
    assert.equal(
      operatorAvatar('arknights', id),
      `https://web.hycdn.cn/arknights/game/assets/char_skin/portrait/${id}%232.png`,
    )
  }
})
