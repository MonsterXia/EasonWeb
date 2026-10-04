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
const data = await vite.ssrLoadModule('/src/constant/game/hypergryph/endfield/weapons.ts')
const weapons = data.endfieldWeapons
const regions = data.endfieldWeaponBaseMaterialRegion

test('includes the released Snowy Dreams weapons and all twelve distinct alluviums', () => {
  for (const name of ['寒夜幽影', '苦难的尽头', '点心时刻', '遥望', '狼之绯']) {
    assert.ok(weapons.some((weapon) => weapon.name === name), `missing weapon: ${name}`)
  }
  assert.equal(weapons.length, 80)
  assert.equal(new Set(weapons.map((weapon) => weapon.name)).size, weapons.length)
  assert.equal(regions.length, 12)
  assert.equal(new Set(regions.map((region) => region.region)).size, regions.length)
  for (const name of ['首墩', '试验园区', '藏剑谷', '应龙关', '北部禁区', '雪松林']) {
    assert.ok(regions.some((region) => region.region === name), `missing region: ${name}`)
  }
})

test('uses canonical weapon names and gem terms shared by the drop pools', () => {
  for (const name of ['不知归', '佩科5', 'O.B.J.迅极', '作品：众生', '作品：蚀迹']) {
    assert.ok(weapons.some((weapon) => weapon.name === name), `incorrect name: ${name}`)
  }
  assert.equal(weapons.find((weapon) => weapon.name === '白夜新星').attribute2, '源石技艺提升')
  const secondaryTerms = new Set(regions.flatMap((region) => region.attribute2Array))
  for (const weapon of weapons) {
    if (weapon.attribute2 !== null) {
      assert.ok(secondaryTerms.has(weapon.attribute2), `unmatched term: ${weapon.name}`)
    }
  }
})

test('matches corrected and new weapon triples against real drop pools', () => {
  const matching = (name) => {
    const weapon = weapons.find((item) => item.name === name)
    assert.ok(weapon, `missing weapon: ${name}`)
    return regions.filter((region) => data.weaponMatchesRegion(weapon, region)).map((r) => r.region)
  }
  assert.ok(matching('白夜新星').includes('矿脉源区'))
  assert.ok(matching('十二问').includes('源石研究园'))
  assert.ok(matching('坚城铸造者').includes('源石研究园'))
  assert.ok(!matching('坚城铸造者').includes('武陵城'), 'Wuling City does not drop 昂扬')
  assert.ok(matching('全自动骇新星').includes('清波寨'))
  assert.ok(matching('寒夜幽影').includes('枢纽区'))
  assert.ok(!matching('寒夜幽影').includes('源石研究园'))
  assert.ok(matching('点心时刻').includes('供能高地'))
  assert.ok(matching('塔尔11').includes('枢纽区'), 'three-star weapons have no secondary term')
  for (const weapon of weapons) {
    assert.ok(matching(weapon.name).length > 0, `no available drop pool: ${weapon.name}`)
  }
})
