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
const {
  growthData,
  createPlan,
  calculatePlan,
  calculateTotal,
  applyPreset,
  setLevel,
  setStage,
  attachWeapon,
  setTalent,
  convertedExperience,
} = await vite.ssrLoadModule('/src/common/endfieldGrowth.ts')
const { parseGrowthHistory, historyLifetime } = await vite.ssrLoadModule(
  '/src/common/endfieldGrowthHistory.ts',
)
const charId = 'chr_0013_aglina'
function levelOnlyPlan(kind, id) {
  const p = createPlan(kind, id)
  p.skills.forEach((s) => (s.to = 1))
  p.targetNodes = []
  return p
}
test('catalog has all released entities and complete material references', () => {
  assert.equal(growthData.characters.length, 32)
  assert.equal(growthData.weapons.length, 80)
  for (const kind of ['characters', 'weapons'])
    for (const entity of growthData[kind]) {
      const p = createPlan(kind, entity.id)
      applyPreset(p, 'perfect')
      const result = calculatePlan(p)
      assert.ok(result.total.item_gold > 0)
      for (const [id, amount] of Object.entries(result.total)) {
        assert.ok(growthData.materials[id], id)
        assert.ok(Number.isSafeInteger(amount) && amount > 0)
      }
    }
})
test('equal progress costs nothing; one level uses the source row and rounds experience', () => {
  const p = levelOnlyPlan('characters', charId)
  setLevel(p, 'target', 1)
  assert.deepEqual(calculatePlan(p).total, {})
  setLevel(p, 'target', 2)
  assert.deepEqual(calculatePlan(p).total, { item_expcard_stage1_high: 1 })
})
test('60 boundary uses advanced cognition for 60 to 61 and does not charge existing promotion', () => {
  const p = levelOnlyPlan('characters', charId)
  setLevel(p, 'target', 61)
  setLevel(p, 'current', 60)
  setStage(p, 'current', 3)
  const r = calculatePlan(p).total
  assert.equal(r.item_expcard_stage2_high, 2)
  assert.equal(r.item_gold, 1820)
  assert.equal(r.item_expcard_stage1_high, undefined)
  assert.equal(r.item_char_break_stage_3_4, undefined)
})
test('same level promotion includes equipment adaptation exactly once', () => {
  const p = levelOnlyPlan('characters', charId)
  setLevel(p, 'target', 20)
  setLevel(p, 'current', 20)
  assert.equal(p.currentStage, 0)
  assert.equal(p.targetStage, 1)
  const r = calculatePlan(p).total
  assert.equal(r.item_gold, 3200)
  assert.equal(r.item_char_break_stage_1_2, 8)
  setStage(p, 'current', 1)
  assert.deepEqual(calculatePlan(p).total, {})
})
test('skill upgrades sum target rows and total inventory is deducted once across plans', () => {
  const p = levelOnlyPlan('characters', charId)
  setLevel(p, 'target', 1)
  p.skills[0].to = 3
  const r = calculatePlan(p).total
  assert.equal(r.item_char_skill_level_1_6, 18)
  assert.equal(r.item_gold, 3700)
  const total = calculateTotal([p, p], { item_gold: 1000 })
  assert.equal(total.find((x) => x.id === 'item_gold').missing, 6400)
})
test('manual presets reset baseline like official templates; invalid input cannot produce NaN', () => {
  const p = levelOnlyPlan('characters', charId)
  setLevel(p, 'current', 90)
  applyPreset(p, 'basic')
  assert.equal(p.targetLevel, 60)
  assert.equal(p.currentLevel, 1)
  setLevel(p, 'target', NaN)
  assert.equal(p.targetLevel, 60)
  assert.equal(p.currentLevel, 1)
  setLevel(p, 'current', -4)
  assert.equal(p.currentLevel, 1)
  assert.throws(() => createPlan('weapons', 'unknown'))
})

test('a linked weapon contributes its upgrades to the operator plan', () => {
  const p = levelOnlyPlan('characters', charId)
  setLevel(p, 'target', 1)
  p.weapon = createPlan('weapons', 'wpn_sword_0014')
  setLevel(p.weapon, 'target', 2)
  assert.equal(calculatePlan(p).total.item_weapon_expcard_high, 1)
  assert.equal(calculatePlan(p).weapon.item_weapon_expcard_high, 1)
})

test('advanced and expert presets differ in operator and weapon levels, not skills or talents', () => {
  const p = createPlan('characters', charId)
  attachWeapon(p, 'wpn_funnel_0001')
  applyPreset(p, 'advancement')
  assert.equal(p.targetLevel, 80)
  assert.equal(p.weapon.targetLevel, 80)
  assert.ok(p.skills.every((s) => s.to === 9))
  const advancedCost = calculatePlan(p)
  const nodes = [...p.targetNodes]
  applyPreset(p, 'advanced')
  assert.equal(p.targetLevel, 90)
  assert.equal(p.weapon.targetLevel, 90)
  assert.ok(p.skills.every((s) => s.to === 9))
  assert.deepEqual(p.targetNodes, nodes)
  const expertCost = calculatePlan(p)
  assert.deepEqual(expertCost.skill, advancedCost.skill)
  assert.deepEqual(expertCost.talent, advancedCost.talent)
  assert.ok(expertCost.level.item_expcard_stage2_high > advancedCost.level.item_expcard_stage2_high)
  assert.ok(
    expertCost.weapon.item_weapon_expcard_high > advancedCost.weapon.item_weapon_expcard_high,
  )
  assert.ok(expertCost.total.item_gold > advancedCost.total.item_gold)
  applyPreset(p, 'advancement')
  assert.deepEqual(calculatePlan(p), advancedCost)
})

test('already promoted operators can still owe same-stage equipment adaptation', () => {
  const p = levelOnlyPlan('characters', charId)
  setLevel(p, 'target', 20)
  setLevel(p, 'current', 20)
  setStage(p, 'current', 1)
  p.currentEquipmentStage = 0
  assert.deepEqual(calculatePlan(p).total, { item_gold: 1600 })
  p.currentEquipmentStage = 1
  assert.deepEqual(calculatePlan(p).total, {})
})
test('official basic preset excludes optional talents', () => {
  const p = levelOnlyPlan('characters', charId)
  applyPreset(p, 'perfect')
  applyPreset(p, 'basic')
  assert.deepEqual(p.targetNodes, [])
  assert.deepEqual(calculatePlan(p).talent, {})
})

test('new targets default to perfect and linked weapons follow the selected preset', () => {
  const p = createPlan('characters', charId)
  assert.equal(p.preset, 'perfect')
  assert.equal(p.targetLevel, 90)
  assert.ok(p.skills.every((s) => s.to === 12))
  assert.equal(p.targetNodes.length, 12)
  applyPreset(p, 'basic')
  attachWeapon(p, 'wpn_funnel_0001')
  assert.equal(p.weapon.targetLevel, 60)
  assert.equal(p.weapon.preset, 'basic')
  setLevel(p, 'target', 70)
  attachWeapon(p, 'wpn_funnel_0001')
  assert.equal(p.weapon.targetLevel, 90)
  attachWeapon(p, 'wpn_sword_0014')
  assert.equal(p.weapon.id, 'wpn_funnel_0001')
})

test('combat and logistics chains include prerequisites; attributes remain independent', () => {
  const p = createPlan('characters', charId)
  p.targetNodes = []
  setTalent(p, charId + '_talent_1_2', 'planned')
  assert.deepEqual(p.targetNodes, [charId + '_talent_1_1', charId + '_talent_1_2'])
  setTalent(p, charId + '_talent_1_1', 'none')
  assert.deepEqual(p.targetNodes, [])
  setTalent(p, 'fac_' + charId + '_0_2', 'planned')
  assert.deepEqual(p.targetNodes, ['fac_' + charId + '_0_1', 'fac_' + charId + '_0_2'])
  setTalent(p, charId + '_7', 'planned')
  assert.ok(!p.targetNodes.includes(charId + '_1'))
  setLevel(p, 'current', 60)
  setStage(p, 'current', 3)
  setTalent(p, 'fac_' + charId + '_0_2', 'owned')
  assert.ok(p.ownedNodes.includes('fac_' + charId + '_0_1'))
  assert.ok(!p.targetNodes.includes('fac_' + charId + '_0_2'))
  assert.equal(
    growthData.characters
      .find((e) => e.id === charId)
      .nodes.find((n) => n.id === 'fac_' + charId + '_0_1').name['zh-CN'],
    '信使的加工艺术·β',
  )
})

test('resource difference distinguishes surplus, exact inventory and shortage', () => {
  const p = levelOnlyPlan('characters', charId)
  setLevel(p, 'target', 2)
  for (const [owned, difference, missing] of [
    [0, -1, 1],
    [1, 0, 0],
    [5, 4, 0],
  ]) {
    const row = calculateTotal([p], { item_expcard_stage1_high: owned })[0]
    assert.equal(row.difference, difference)
    assert.equal(row.missing, missing)
  }
})

test('history expires after 90 days, keeps five recent records and survives malformed storage', () => {
  const now = 1800000000000
  const p = createPlan('characters', charId)
  setLevel(p, 'current', 65)
  p.skills[0] = { id: p.skills[0].id, from: 4, to: 9 }
  attachWeapon(p, 'wpn_funnel_0001')
  const row = { timestamp: now, kind: 'characters', plans: [p] }
  const records = parseGrowthHistory(
    JSON.stringify(Array.from({ length: 8 }, (_, i) => ({ ...row, timestamp: now - i }))),
    now,
  )
  assert.equal(records.length, 5)
  assert.equal(records[0].plans[0].currentLevel, 65)
  assert.equal(records[0].plans[0].skills[0].from, 4)
  assert.equal(records[0].plans[0].weapon.targetLevel, 90)
  assert.equal(
    parseGrowthHistory(JSON.stringify([{ ...row, timestamp: now - historyLifetime }]), now).length,
    0,
  )
  for (const raw of [
    'bad JSON',
    '{}',
    '[null]',
    JSON.stringify([{ ...row, plans: [{ id: 'removed', kind: 'characters' }] }]),
  ])
    assert.deepEqual(parseGrowthHistory(raw, now), [])
})

test('lowering current progress restores unowned prerequisites and repairs history chains', () => {
  const p = createPlan('characters', charId)
  p.targetNodes = []
  setLevel(p, 'current', 40)
  setStage(p, 'current', 2)
  setTalent(p, charId + '_talent_1_1', 'owned')
  setTalent(p, charId + '_talent_1_2', 'planned')
  assert.equal(calculatePlan(p).talent.item_gold, 8600)
  setLevel(p, 'current', 1)
  assert.equal(calculatePlan(p).talent.item_gold, 11000)
  assert.equal(calculatePlan(p).talent.item_char_skill_level_1_6, 52)
  p.targetNodes = [charId + '_talent_1_2']
  const now = Date.now()
  const restored = parseGrowthHistory(
    JSON.stringify([{ timestamp: now, kind: 'characters', plans: [p] }]),
    now,
  )[0].plans[0]
  assert.equal(calculatePlan(restored).talent.item_gold, 11000)
})

test('low EXP combines before rounding and never mixes types or level ranges', () => {
  const inventory = {
    item_expcard_stage1_low: 49,
    item_expcard_stage1_mid: 0,
    item_expcard_stage2_low: 10,
    item_weapon_expcard_low: 50,
  }
  assert.deepEqual(convertedExperience(inventory, 'item_expcard_stage1_high'), {
    count: 0,
    remainder: 9800,
  })
  inventory.item_expcard_stage1_mid = 1
  assert.deepEqual(convertedExperience(inventory, 'item_expcard_stage1_high'), {
    count: 1,
    remainder: 800,
  })
  assert.deepEqual(convertedExperience(inventory, 'item_expcard_stage2_high'), {
    count: 1,
    remainder: 0,
  })
  assert.deepEqual(convertedExperience(inventory, 'item_weapon_expcard_high'), {
    count: 1,
    remainder: 0,
  })
  assert.deepEqual(
    convertedExperience({ item_char_skill_level_1_6: 500 }, 'item_char_skill_level_7_12'),
    { count: 0, remainder: 0 },
  )
})
test('converted inventory is shared once, added to owned high tier and never mutates input', () => {
  const p = levelOnlyPlan('characters', charId)
  setLevel(p, 'target', 2)
  const inventory = { item_expcard_stage1_low: 50, item_expcard_stage1_high: 1 }
  const before = { ...inventory }
  const row = calculateTotal([p, p, p], inventory)[0]
  assert.equal(row.count, 3)
  assert.equal(row.owned, 2)
  assert.equal(row.missing, 1)
  assert.deepEqual(inventory, before)
  assert.equal(calculateTotal([p, p, p], {})[0].missing, 3)
  assert.deepEqual(
    convertedExperience(
      { item_expcard_stage1_low: NaN, item_expcard_stage1_mid: -20 },
      'item_expcard_stage1_high',
    ),
    { count: 0, remainder: 0 },
  )
})
