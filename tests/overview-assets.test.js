import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createServer } from 'vite'
const root = new URL('../src/assets/skland/', import.meta.url)
const sources = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'))
const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => vite.close())
const { metricArt, facilityArt, sectionArt } = await vite.ssrLoadModule(
  '/src/common/overviewAssets.ts',
)

test('overview artwork is checked in, pinned and valid PNG, with no orphan assets', async () => {
  assert.deepEqual(
    (await readdir(root)).filter((x) => x.endsWith('.png')).sort(),
    Object.values(sources)
      .map((x) => x.file)
      .sort(),
  )
  for (const source of Object.values(sources)) {
    const data = await readFile(new URL(source.file, root))
    assert.equal(createHash('sha256').update(data).digest('hex'), source.sha256)
    assert.equal(data.toString('hex', 0, 8), '89504e470d0a1a0a')
    assert.ok(data.readUInt32BE(16) > 0 && data.readUInt32BE(20) > 0)
    assert.match(
      source.url ?? source.module,
      /^https:\/\/(bbs\.hycdn\.cn|web\.hycdn\.cn|assets\.skland\.com|media\.prts\.wiki)\//,
    )
  }
})
test('local artwork uses stable identifiers and unknown items use section fallbacks', () => {
  for (const [game, key] of [
    ['arknights', 'stamina'],
    ['arknights', 'drones'],
    ['endfield', 'stamina'],
    ['endfield', 'medalLevel3'],
  ]) {
    assert.match(metricArt(game, key).src, /^\/src\/assets\/skland\//)
  }
  assert.notEqual(metricArt('arknights', 'stamina').src, metricArt('endfield', 'stamina').src)
  assert.match(
    facilityArt('endfieldSpaceship', { id: 'room1', nameKey: 'endfieldPlant1' }).src,
    /ef-plant/,
  )
  assert.match(
    facilityArt('endfieldExplorationPuzzles', { id: 'domain_1:map01_lv001' }).src,
    /ef-map01_lv001/,
  )
  assert.equal(
    facilityArt('endfieldExplorationPuzzles', { id: 'domain_2:indie_dg007' }).src,
    facilityArt('endfieldExplorationPuzzles', { id: 'domain_2:map02_lv004' }).src,
  )
  assert.equal(facilityArt('endfieldDomains', { id: 'domain_2' }).kind, 'landscape')
  assert.equal(metricArt('unknown', 'stamina'), undefined)
  assert.equal(metricArt('endfield', 'unknown'), undefined)
  assert.equal(
    facilityArt('endfieldExplorationPuzzles', { id: 'domain_1:unknown' }).src,
    sectionArt('endfieldExplorationPuzzles').src,
  )
  assert.equal(
    facilityArt('endfieldSpaceship', { id: 'unknown', nameKey: 'unknown' }).src,
    sectionArt('endfieldSpaceship').src,
  )
  assert.equal(
    facilityArt('arknightsSupport', { id: '1', operatorId: 'char_002_amiya' }),
    undefined,
  )
  assert.equal(sectionArt('unknown'), undefined)
})

test('theme image filters stay scoped to artwork rather than the document root', async () => {
  const { parse, compileStyle } = await import('vue/compiler-sfc')
  const source = await readFile(
    new URL('../src/components/game/OverviewArtwork.vue', import.meta.url),
    'utf8',
  )
  const { descriptor } = parse(source)
  const result = compileStyle({
    source: descriptor.styles[0].content,
    filename: 'OverviewArtwork.vue',
    id: 'data-v-artwork',
    scoped: true,
  })
  assert.deepEqual(result.errors, [])
  // Vue :global() can discard a trailing descendant selector, accidentally applying
  // invert/blend to the entire page. Verify the actual compiled selector boundary.
  assert.doesNotMatch(result.code, /(?:^|\})\s*html\.dark\s*\{/)
  for (const rule of result.code.split('}')) {
    if (!rule.includes('filter:') && !rule.includes('mix-blend-mode:')) continue
    assert.match(rule.split('{')[0], /img\[data-v-artwork\]/)
  }
  assert.equal(metricArt('endfield', 'medalLevel3').tone, 'color')
  assert.equal(metricArt('endfield', 'cnsLevel').tone, 'color')
})

test('official item artwork takes priority, with local and generic fallback chains', () => {
  const url = 'https://bbs.hycdn.cn/public/skland-game/image/fixture.png'
  const cover = facilityArt('arknightsActivities', { id: 'fixture', artworkUrl: url })
  assert.equal(cover.src, url)
  assert.equal(cover.kind, 'cover')
  assert.equal(cover.tone, 'color')
  assert.equal(cover.fallback.src, sectionArt('arknightsActivities').src)
  const map = facilityArt('endfieldExplorationPuzzles', {
    id: 'domain_1:map01_lv001',
    artworkUrl: url,
  })
  assert.match(map.fallback.src, /map01_lv001/)
  assert.equal(map.fallback.fallback.src, sectionArt('endfieldExplorationPuzzles').src)
  for (const artworkUrl of [
    null,
    '',
    'https://evil.invalid/a.png',
    'https://bbs.hycdn.cn.evil.invalid/a.png',
    'http://bbs.hycdn.cn/a.png',
    'https://user:pass@bbs.hycdn.cn/a.png',
    '//bbs.hycdn.cn/a.png',
    'data:image/png;base64,AA',
    'bad',
  ]) {
    assert.equal(
      facilityArt('arknightsActivities', { id: 'fixture', artworkUrl }).src,
      sectionArt('arknightsActivities').src,
    )
  }
})
