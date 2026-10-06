import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => vite.close())
const resources = await vite.ssrLoadModule('/src/common/endfieldResources.ts')
const growth = await vite.ssrLoadModule('/src/common/endfieldGrowth.ts')
const essence = await vite.ssrLoadModule('/src/constant/game/hypergryph/endfield/weapons.ts')
const { endfieldData, weaponById, endfieldArt } = resources

test('both calculators share one catalog and every essence weapon has a stable growth/artwork ID', () => {
  assert.equal(growth.growthData, endfieldData)
  assert.equal(essence.endfieldWeapons, resources.endfieldWeapons)
  assert.equal(essence.endfieldWeaponBaseMaterialRegion, endfieldData.regions)
  assert.equal(weaponById.size, 80)
  assert.equal(new Set(essence.endfieldWeapons.map((weapon) => weapon.id)).size, 80)
  for (const weapon of essence.endfieldWeapons) {
    const entity = weaponById.get(weapon.id)
    assert.equal(entity, growth.entityFor({ kind: 'weapons', id: weapon.id }))
    assert.equal(weapon.name, entity.name['zh-CN'])
    assert.equal(weapon.rarity, entity.rarity)
    assert.equal(weapon.type, endfieldData.filters.weaponTypes[entity.weaponType]['zh-CN'])
    assert.equal(weapon.skill, entity.essence.skill)
    assert.match(
      endfieldArt(weapon.id).src,
      /\/src\/assets\/skland\/ef-growth-wpn_.*\.avif(?:\?|$)/,
    )
  }
  assert.equal(endfieldArt('missing-weapon'), undefined)
  assert.deepEqual(
    endfieldData.weapons.map((weapon) => weapon.essenceOrder).sort((a, b) => a - b),
    Array.from({ length: 80 }, (_, index) => index),
  )
})

test('experience conversion refers to the shared material records without duplicate labels', () => {
  assert.equal(growth.experienceGroups, endfieldData.experienceGroups)
  for (const group of growth.experienceGroups) {
    assert.ok(endfieldData.materials[group.high]?.name['zh-CN'])
    for (const item of group.low) {
      assert.ok(endfieldData.materials[item.id]?.name.en)
      assert.equal(item.name, undefined)
      assert.ok(item.exp > 0 && item.exp < group.exp)
    }
  }
})

test('the consolidated source manifest pins the exact catalog and preserves separate source versions', async () => {
  const root = new URL('../src/constant/game/hypergryph/endfield/', import.meta.url)
  const sources = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'))
  const bytes = await readFile(new URL(sources.catalog.file, root))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), sources.catalog.sha256)
  for (const key of ['characters', 'weapons', 'regions']) {
    assert.equal(sources.catalog[key], endfieldData[key].length)
  }
  assert.equal(sources.catalog.materials, Object.keys(endfieldData.materials).length)
  assert.equal(sources.growth.gameVersion, endfieldData.version)
  assert.ok(sources.experience.version)
  assert.ok(sources.sources.every((source) => source.revision && source.files.length))
})
