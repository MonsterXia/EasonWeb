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
    assert.match(source.url ?? source.module, /^https:\/\/(bbs\.hycdn\.cn|assets\.skland\.com)\//)
  }
})
test('game and facility artwork use stable identifiers, never names or remote requests', () => {
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
  assert.equal(facilityArt('endfieldExplorationPuzzles', { id: 'domain_1:unknown' }), undefined)
  assert.equal(facilityArt('endfieldSpaceship', { id: 'unknown', nameKey: 'unknown' }), undefined)
  assert.equal(
    facilityArt('arknightsSupport', { id: '1', operatorId: 'char_002_amiya' }),
    undefined,
  )
  assert.equal(sectionArt('unknown'), undefined)
})
