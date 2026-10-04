import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.vite-avatar-tests',
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => vite.close())
const { operatorAvatar } = await vite.ssrLoadModule('/src/common/operatorAvatars.ts')
const base = 'https://web.hycdn.cn/arknights/game/assets/'

test('Arknights avatars use official ID paths including new IDs without a catalogue', () => {
  for (const id of ['char_002_amiya', 'char_99999_future']) {
    assert.equal(operatorAvatar('arknights', id), `${base}char/avatar/${id}.png`)
  }
  for (const id of ['__proto__', '', '../other', 'https://evil.invalid', 'chr_0016_laevat']) {
    assert.equal(operatorAvatar('arknights', id), undefined)
  }
  assert.equal(operatorAvatar('unknown', 'char_002_amiya'), undefined)
})
test('class-change Amiya uses the official encoded #2 skin avatar rule', () => {
  for (const id of ['char_1001_amiya2', 'char_1037_amiya3']) {
    assert.equal(operatorAvatar('arknights', id), `${base}char_skin/avatar/${id}%232.png`)
  }
})
test('Endfield uses the supplied official avatar for any ID, never an ID or gender map', () => {
  const url = 'https://bbs.hycdn.cn/public/skland-game/image/synthetic-avatar.png'
  for (const id of ['chr_9000_endmin', '93e76fbbc07f7b480cfe0870c6414494', 'future-character']) {
    assert.equal(operatorAvatar('endfield', id, url), url)
    assert.equal(operatorAvatar('endfield', id), undefined)
    assert.equal(operatorAvatar('endfield', id, null), undefined)
  }
})
test('invalid or nonofficial Endfield images use the text fallback', () => {
  for (const url of [
    '',
    'bad',
    'male',
    'female',
    'http://bbs.hycdn.cn/a.png',
    'https://evil.invalid/a.png',
    'https://web.hycdn.cn.evil.invalid/a.png',
    'data:image/png;base64,AA',
  ]) {
    assert.equal(operatorAvatar('endfield', 'chr_0016_laevat', url), undefined)
  }
})

test('equipped skins override default avatars, preserving encoded # and @ identifiers', () => {
  for (const [id, skinId] of [
    ['char_002_amiya', 'char_002_amiya#2'],
    ['char_002_amiya', 'char_002_amiya@epoque#4'],
    ['char_1001_amiya2', 'char_1001_amiya2@epoque#1'],
    ['char_99999_future', 'char_99999_future@new_collection#1'],
  ]) {
    assert.equal(
      operatorAvatar('arknights', id, undefined, skinId),
      `${base}char_skin/avatar/${encodeURIComponent(skinId)}.png`,
    )
  }
  for (const skin of [
    null,
    undefined,
    '',
    ' ',
    '../other',
    'https://evil.invalid/a',
    'char_002_amiya/../other',
  ]) {
    assert.equal(
      operatorAvatar('arknights', 'char_002_amiya', undefined, skin),
      `${base}char/avatar/char_002_amiya.png`,
    )
  }
  const url = 'https://bbs.hycdn.cn/public/skland-game/image/synthetic.png'
  assert.equal(operatorAvatar('endfield', 'anything', url, 'char_002_amiya#2'), url)
})
