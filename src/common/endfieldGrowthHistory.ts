import {
  createPlan,
  entityFor,
  integer,
  setLevel,
  setStage,
  normalizeTalents,
  type GrowthPlan,
  type GrowthKind,
} from './endfieldGrowth'

export const growthHistoryKey = 'eason-endfield-growth-history-v1'
export const historyLifetime = 90 * 24 * 60 * 60 * 1000
export interface GrowthRecord {
  timestamp: number
  kind: GrowthKind
  plans: GrowthPlan[]
}

// Browser storage may be stale, edited or from an older data snapshot. Rebuild only known fields.
function restorePlan(value: unknown, kind: GrowthKind): GrowthPlan | undefined {
  if (!value || typeof value !== 'object') return
  const data = value as Record<string, unknown>
  if (data.kind !== kind || typeof data.id !== 'string') return
  let plan: GrowthPlan
  try {
    plan = createPlan(kind, data.id)
  } catch {
    return
  }
  const entity = entityFor(plan)
  setLevel(plan, 'current', data.currentLevel)
  setLevel(plan, 'target', data.targetLevel)
  setStage(plan, 'current', data.currentStage)
  setStage(plan, 'target', data.targetStage)
  plan.currentEquipmentStage = integer(
    data.currentEquipmentStage,
    0,
    Math.min(plan.currentStage, entity.equipment.length),
  )
  plan.skills = entity.skills.map((skill) => {
    const row = Array.isArray(data.skills)
      ? data.skills.find((s) => s && s.id === skill.id)
      : undefined
    const from = integer(row?.from, 1, 12)
    return { id: skill.id, from, to: integer(row?.to, from, 12) }
  })
  const nodes = (value: unknown, stage: number) =>
    entity.nodes
      .filter((n) => n.stage <= stage && Array.isArray(value) && value.includes(n.id))
      .map((n) => n.id)
  plan.ownedNodes = nodes(data.ownedNodes, plan.currentStage)
  plan.targetNodes = nodes(data.targetNodes, plan.targetStage)
  normalizeTalents(plan)
  if (kind === 'characters') {
    const weapon = restorePlan(data.weapon, 'weapons')
    if (weapon && entityFor(weapon).weaponType === entity.weaponType) plan.weapon = weapon
  }
  // Restored values are authoritative; do not apply a template over manual changes.
  plan.preset = ['basic', 'advancement', 'advanced', 'perfect'].includes(String(data.preset))
    ? (data.preset as GrowthPlan['preset'])
    : 'custom'
  return plan
}
export function parseGrowthHistory(raw: string | null, now = Date.now()): GrowthRecord[] {
  try {
    const rows: unknown = JSON.parse(raw ?? '[]')
    if (!Array.isArray(rows)) return []
    return rows
      .flatMap((row): GrowthRecord[] => {
        if (
          !row ||
          !['characters', 'weapons'].includes(row.kind) ||
          !Number.isFinite(row.timestamp) ||
          row.timestamp > now ||
          now - row.timestamp >= historyLifetime ||
          !Array.isArray(row.plans)
        )
          return []
        const plans: GrowthPlan[] = []
        for (const value of row.plans.slice(0, 8)) {
          const plan = restorePlan(value, row.kind)
          if (plan && !plans.some((p) => p.id === plan.id)) plans.push(plan)
        }
        return plans.length ? [{ timestamp: row.timestamp, kind: row.kind, plans }] : []
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
  } catch {
    return []
  }
}
