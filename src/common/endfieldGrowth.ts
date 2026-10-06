import {
  endfieldData,
  type GrowthKind,
  type GrowthEntity,
} from '../constant/game/hypergryph/endfield'
import type { Materials } from '../constant/game/hypergryph/endfield'
export type {
  GrowthKind,
  GrowthEntity,
  LocalName,
  Materials,
} from '../constant/game/hypergryph/endfield'
// Compatibility export for existing calculation consumers. No second snapshot.
export const growthData = endfieldData

export interface GrowthPlan {
  kind: GrowthKind
  id: string
  currentLevel: number
  targetLevel: number
  currentStage: number
  currentEquipmentStage: number
  targetStage: number
  skills: { id: string; from: number; to: number }[]
  ownedNodes: string[]
  targetNodes: string[]
  weapon?: GrowthPlan
  preset: GrowthPreset | 'custom'
}
export const presets = {
  basic: { level: 60, skill: 6 },
  advancement: { level: 80, skill: 9 },
  advanced: { level: 90, skill: 9 },
  perfect: { level: 90, skill: 12 },
} as const
export type GrowthPreset = keyof typeof presets
export function entityFor(plan: Pick<GrowthPlan, 'kind' | 'id'>): GrowthEntity {
  const entity = growthData[plan.kind].find((entry) => entry.id === plan.id)
  if (!entity) throw new Error('Unknown growth target')
  return entity
}
export function integer(value: unknown, min: number, max: number, fallback = min) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.trunc(number))) : fallback
}
export function stageRange(entity: GrowthEntity, level: number) {
  return {
    min: entity.promotions.filter((p) => p.level < level).length,
    max: entity.promotions.filter((p) => p.level <= level).length,
  }
}
export function createPlan(kind: GrowthKind, id: string): GrowthPlan {
  const entity = entityFor({ kind, id })
  return {
    kind,
    id,
    preset: 'perfect',
    currentLevel: 1,
    targetLevel: 90,
    currentStage: 0,
    currentEquipmentStage: 0,
    targetStage: stageRange(entity, 90).max,
    skills: entity.skills.map((skill) => ({ id: skill.id, from: 1, to: 12 })),
    ownedNodes: [],
    targetNodes: entity.nodes.map((node) => node.id),
  }
}
function reconcile(plan: GrowthPlan) {
  const entity = entityFor(plan)
  const current = stageRange(entity, plan.currentLevel)
  const target = stageRange(entity, plan.targetLevel)
  plan.currentStage = integer(plan.currentStage, current.min, current.max)
  plan.targetStage = integer(plan.targetStage, Math.max(target.min, plan.currentStage), target.max)
  plan.currentEquipmentStage = integer(
    plan.currentEquipmentStage,
    0,
    Math.min(plan.currentStage, entity.equipment.length),
  )
  normalizeTalents(plan)
}
export function normalizeTalents(plan: GrowthPlan) {
  const nodes = entityFor(plan).nodes
  const expand = (ids: string[], stage: number) => {
    const selected = nodes.filter((n) => ids.includes(n.id) && n.stage <= stage)
    return nodes
      .filter((n) => selected.some((target) => target.chain === n.chain && n.stage <= target.stage))
      .map((n) => n.id)
  }
  plan.ownedNodes = expand(plan.ownedNodes, plan.currentStage)
  plan.targetNodes = expand(plan.targetNodes, plan.targetStage).filter(
    (id) => !plan.ownedNodes.includes(id),
  )
}
export function setLevel(plan: GrowthPlan, side: 'current' | 'target', value: unknown) {
  plan.preset = 'custom'
  const entity = entityFor(plan)
  if (side === 'current') {
    plan.currentLevel = integer(value, 1, 90, plan.currentLevel)
    plan.targetLevel = Math.max(plan.currentLevel, plan.targetLevel)
    plan.currentStage = stageRange(entity, plan.currentLevel).min
    plan.currentEquipmentStage = Math.min(plan.currentStage, entity.equipment.length)
  } else {
    plan.targetLevel = integer(value, plan.currentLevel, 90, plan.targetLevel)
  }
  plan.targetStage = stageRange(entity, plan.targetLevel).max
  reconcile(plan)
}
export function setStage(plan: GrowthPlan, side: 'current' | 'target', value: unknown) {
  plan.preset = 'custom'
  if (side === 'current') {
    plan.currentStage = integer(value, 0, 4)
    plan.currentEquipmentStage = Math.min(plan.currentStage, entityFor(plan).equipment.length)
  } else plan.targetStage = integer(value, 0, 4)
  reconcile(plan)
}
export function applyPreset(plan: GrowthPlan, preset: GrowthPreset) {
  // A manual plan has no synced baseline. Official templates restart it from level 1.
  plan.currentLevel = 1
  plan.currentStage = 0
  plan.currentEquipmentStage = 0
  plan.ownedNodes = []
  setLevel(plan, 'target', presets[preset].level)
  if (plan.weapon) applyPreset(plan.weapon, preset)
  plan.skills.forEach((skill) => {
    skill.from = 1
    skill.to = presets[preset].skill
  })
  plan.targetNodes =
    preset === 'basic'
      ? []
      : entityFor(plan)
          .nodes.filter((n) => n.stage <= plan.targetStage)
          .map((n) => n.id)
  plan.preset = preset
}
export function attachWeapon(plan: GrowthPlan, id: string) {
  if (!id) {
    plan.weapon = undefined
    return
  }
  const weapon = entityFor({ kind: 'weapons', id })
  if (weapon.weaponType !== entityFor(plan).weaponType) return
  plan.weapon = createPlan('weapons', id)
  applyPreset(plan.weapon, plan.preset === 'custom' ? 'perfect' : plan.preset)
}
export function setTalent(plan: GrowthPlan, id: string, status: 'none' | 'owned' | 'planned') {
  const nodes = entityFor(plan).nodes
  const node = nodes.find((n) => n.id === id)
  if (!node || node.stage > (status === 'owned' ? plan.currentStage : plan.targetStage)) return
  plan.preset = 'custom'
  const chain = nodes.filter((n) => n.chain === node.chain)
  const predecessors = chain.filter((n) => n.stage <= node.stage).map((n) => n.id)
  const successors = chain.filter((n) => n.stage >= node.stage).map((n) => n.id)
  if (status === 'none') {
    plan.targetNodes = plan.targetNodes.filter((n) => !successors.includes(n))
    plan.ownedNodes = plan.ownedNodes.filter((n) => !successors.includes(n))
  } else if (status === 'owned') {
    plan.ownedNodes = [...new Set([...plan.ownedNodes, ...predecessors])]
    plan.targetNodes = plan.targetNodes.filter((n) => !predecessors.includes(n))
  } else {
    plan.ownedNodes = plan.ownedNodes.filter((n) => !successors.includes(n))
    plan.targetNodes = [
      ...new Set([
        ...plan.targetNodes,
        ...predecessors.filter((n) => !plan.ownedNodes.includes(n)),
      ]),
    ]
  }
  normalizeTalents(plan)
}
export type CostMap = Record<string, number>
export const experienceGroups = endfieldData.experienceGroups
export function convertedExperience(inventory: CostMap, high: string) {
  const group = experienceGroups.find((group) => group.high === high)
  if (!group) return { count: 0, remainder: 0 }
  const exp = group.low.reduce(
    (sum, item) => sum + integer(inventory[item.id] ?? 0, 0, 999999999) * item.exp,
    0,
  )
  return { count: Math.floor(exp / group.exp), remainder: exp % group.exp }
}
export interface GrowthCost {
  level: CostMap
  skill: CostMap
  talent: CostMap
  weapon: CostMap
  total: CostMap
}
function add(target: CostMap, rows: Materials) {
  for (const [id, count] of rows) {
    if (!growthData.materials[id]) throw new Error(`Unknown material: ${id}`)
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid material cost')
    if (count) target[id] = (target[id] ?? 0) + count
  }
}
export function calculatePlan(plan: GrowthPlan): GrowthCost {
  const entity = entityFor(plan)
  const result: GrowthCost = { level: {}, skill: {}, talent: {}, weapon: {}, total: {} }
  const from = integer(plan.currentLevel, 1, 90)
  const to = integer(plan.targetLevel, from, 90)
  const experience: CostMap = {}
  let gold = 0
  for (let level = from; level < to; level++) {
    const row = entity.levels[level - 1]
    if (!row) throw new Error('Missing level cost')
    const id =
      plan.kind === 'weapons'
        ? 'item_weapon_expcard_high'
        : level < 60
          ? 'item_expcard_stage1_high'
          : 'item_expcard_stage2_high'
    experience[id] = (experience[id] ?? 0) + row[0]
    gold += row[1]
  }
  // Round each entity and each experience tier independently, as the official tool does.
  add(
    result.level,
    Object.entries(experience).map(([id, exp]) => [id, Math.ceil(exp / 10000)]),
  )
  add(result.level, [['item_gold', gold]])
  const current = stageRange(entity, from)
  const target = stageRange(entity, to)
  const currentStage = integer(plan.currentStage, current.min, current.max)
  const targetStage = integer(plan.targetStage, Math.max(currentStage, target.min), target.max)
  for (const promotion of entity.promotions) {
    if (promotion.stage > currentStage && promotion.stage <= targetStage)
      add(result.level, promotion.materials)
  }
  const equipmentStage = integer(
    plan.currentEquipmentStage,
    0,
    Math.min(currentStage, entity.equipment.length),
  )
  for (const equipment of entity.equipment) {
    if (equipment.stage > equipmentStage && equipment.stage <= targetStage)
      add(result.level, equipment.materials)
  }
  for (const skill of entity.skills) {
    const rule = plan.skills.find((s) => s.id === skill.id)
    if (!rule) continue
    const start = integer(rule.from, 1, skill.costs.length)
    const end = integer(rule.to, start, skill.costs.length)
    for (let level = start + 1; level <= end; level++) add(result.skill, skill.costs[level - 1]!)
  }
  for (const node of entity.nodes) {
    if (
      node.stage <= targetStage &&
      plan.targetNodes.includes(node.id) &&
      !plan.ownedNodes.includes(node.id)
    )
      add(result.talent, node.materials)
  }
  if (plan.kind === 'characters' && plan.weapon?.kind === 'weapons')
    result.weapon = calculatePlan(plan.weapon).total
  for (const category of [result.level, result.skill, result.talent, result.weapon])
    add(result.total, Object.entries(category))
  return result
}
export function calculateTotal(plans: GrowthPlan[], inventory: Record<string, number> = {}) {
  const total: CostMap = {}
  for (const plan of plans) add(total, Object.entries(calculatePlan(plan).total))
  return Object.entries(total)
    .map(([id, count]) => {
      const owned =
        integer(inventory[id] ?? 0, 0, 999999999) + convertedExperience(inventory, id).count
      return { id, count, owned, difference: owned - count, missing: Math.max(0, count - owned) }
    })
    .sort((a, b) =>
      a.id === 'item_gold' ? -1 : b.id === 'item_gold' ? 1 : a.id.localeCompare(b.id),
    )
}
