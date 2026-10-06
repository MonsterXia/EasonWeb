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
const { recommendEssencePlan } = await vite.ssrLoadModule('/src/common/endfieldEssence.ts')
const weapons = data.endfieldWeapons
const regions = data.endfieldWeaponBaseMaterialRegion

test('includes the released Snowy Dreams weapons and all twelve distinct alluviums', () => {
  for (const name of ['寒夜幽影', '苦难的尽头', '点心时刻', '遥望', '狼之绯']) {
    assert.ok(
      weapons.some((weapon) => weapon.name === name),
      `missing weapon: ${name}`,
    )
  }
  assert.equal(weapons.length, 80)
  assert.equal(new Set(weapons.map((weapon) => weapon.name)).size, weapons.length)
  assert.equal(regions.length, 12)
  assert.equal(new Set(regions.map((region) => region.region)).size, regions.length)
  for (const name of ['首墩', '试验园区', '藏剑谷', '应龙关', '北部禁区', '雪松林']) {
    assert.ok(
      regions.some((region) => region.region === name),
      `missing region: ${name}`,
    )
  }
})

test('uses canonical weapon names and gem terms shared by the drop pools', () => {
  for (const name of ['不知归', '佩科5', 'O.B.J.迅极', '作品：众生', '作品：蚀迹']) {
    assert.ok(
      weapons.some((weapon) => weapon.name === name),
      `incorrect name: ${name}`,
    )
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

test('coverage excludes 不知归 when the targeting skill is 夜幕', () => {
  const selected = ['仰止', '不知归', '熔铸火焰'].map((name) =>
    weapons.find((w) => w.name === name),
  )
  const plan = recommendEssencePlan(selected)
  assert.equal(plan.skillType, '夜幕')
  assert.deepEqual(
    plan.coveredWeapons.map((weapon) => weapon.name),
    ['仰止', '熔铸火焰'],
  )
  assert.deepEqual(new Set(plan.primaryAttributes), new Set(['敏捷提升', '智识提升']))
  assert.equal(recommendEssencePlan([selected[1]]).skillType, '流转')
  assert.equal(recommendEssencePlan([]), null)
})

test('ranks maps by realizable targeting coverage rather than their raw drop coverage', () => {
  const weapon = (name, attribute1, attribute2, skill) => ({
    name,
    attribute1,
    attribute2,
    skill: { type: skill },
  })
  const selected = [
    weapon('a', 'A', 'X', 'S'),
    weapon('b', 'A', 'X', 'S'),
    weapon('c', 'A', 'X', 'T'),
    weapon('d', 'A', 'X', 'T'),
    weapon('e', 'A', 'Y', 'U'),
    weapon('f', 'A', 'Y', 'U'),
    weapon('g', 'A', 'Y', 'U'),
  ]
  const regions = [
    {
      region: 'raw four',
      attribute1Array: ['A'],
      attribute2Array: ['X'],
      skillTypeArray: ['S', 'T'],
    },
    {
      region: 'targeted three',
      attribute1Array: ['A'],
      attribute2Array: ['Y'],
      skillTypeArray: ['U'],
    },
  ]
  const plan = recommendEssencePlan(selected, regions)
  assert.equal(plan.region.region, 'targeted three')
  assert.equal(plan.coveredWeapons.length, 3)
})

test('optimizes skills together with the three-primary limit and respects secondary drops', () => {
  const selected = ['A', 'B', 'C', 'D', 'E'].map((attribute1) => ({
    name: attribute1,
    attribute1,
    attribute2: 'X',
    skill: { type: 'S' },
  }))
  for (let i = 0; i < 4; i++)
    selected.push({ name: `T${i}`, attribute1: 'A', attribute2: null, skill: { type: 'T' } })
  selected.push({ name: 'unavailable', attribute1: 'A', attribute2: 'Y', skill: { type: 'T' } })
  const region = {
    region: 'test',
    attribute1Array: ['A', 'B', 'C', 'D', 'E'],
    attribute2Array: ['X'],
    skillTypeArray: ['S', 'T'],
  }
  const plan = recommendEssencePlan(selected, [region])
  assert.equal(plan.skillType, 'T')
  assert.equal(plan.coveredWeapons.length, 4)
  const limited = recommendEssencePlan(selected.slice(0, 5), [region])
  assert.deepEqual(limited.primaryAttributes, ['A', 'B', 'C'])
  assert.equal(limited.coveredWeapons.length, 3)
  assert.equal(recommendEssencePlan([selected.at(-1)], [region]), null)
})

test('显锋 is excluded from 枢纽区 solely because its secondary attribute cannot drop there', () => {
  const weapon = weapons.find((item) => item.name === '显锋')
  const hub = regions.find((item) => item.region === '枢纽区')
  const research = regions.find((item) => item.region === '源石研究园')
  assert.equal(weapon.attribute2, '物理伤害提升')
  assert.ok(hub.attribute1Array.includes(weapon.attribute1))
  assert.ok(hub.skillTypeArray.includes(weapon.skill.type))
  assert.ok(!hub.attribute2Array.includes(weapon.attribute2))
  assert.equal(recommendEssencePlan([weapon], [hub]), null)
  const plan = recommendEssencePlan([weapon], [hub, research])
  assert.equal(plan.region.region, '源石研究园')
  assert.deepEqual(
    plan.coveredWeapons.map((item) => item.name),
    ['显锋'],
  )
  assert.equal(recommendEssencePlan([weapon], [{ ...research, attribute1Array: [] }]), null)
  assert.equal(recommendEssencePlan([weapon], [{ ...research, skillTypeArray: [] }]), null)
})
