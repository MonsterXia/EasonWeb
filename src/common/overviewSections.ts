import type { GameOverview } from './api/gameOverview'

type Section = NonNullable<GameOverview['sections']>[number]
export type DisplayItem = Section['items'][number] & {
  sourceSection?: string
  measures?: { key: string; current: number | null; total: number | null }[]
}
export type DisplaySection = { key: string; items: DisplayItem[] }

/** Present the legacy base level inside Dijiang, even with a partial/older response. */
export function endfieldSections(
  data: Pick<
    GameOverview,
    'sections' | 'metrics' | 'warEchoes' | 'regionalDevelopment' | 'monolith'
  >,
): DisplaySection[] {
  let sections = data.sections ?? []
  if (data.warEchoes) {
    const war = {
      key: 'endfieldWarEchoes',
      items: data.warEchoes.seasons.map((s) => ({
        id: s.id,
        name: s.name,
        level: null,
        current: s.stars,
        total: 9,
        status: 'unknown' as const,
        completeAt: null,
      })),
    }
    sections = sections.some((s) => s.key === war.key)
      ? sections.map((s) => (s.key === war.key ? war : s))
      : [...sections, war]
  }
  const replace = (key: string, items: DisplayItem[]) => {
    const group = { key, items }
    sections = sections.some((s) => s.key === key)
      ? sections.map((s) => (s.key === key ? group : s))
      : [...sections, group]
  }
  const summary = (id: string, name: string | null): DisplayItem => ({
    id,
    name,
    level: null,
    current: null,
    total: null,
    status: 'unknown',
    completeAt: null,
  })
  if (data.regionalDevelopment) {
    sections = sections.filter((s) => s.key !== 'endfieldSettlements')
    replace(
      'endfieldDomains',
      data.regionalDevelopment.regions.map((r) => summary(r.id, r.name)),
    )
  }
  if (data.monolith)
    replace(
      'endfieldMonolith',
      data.monolith.themes.map((t) => summary(t.id, t.name)),
    )
  const control = data.metrics.find(
    (metric) => metric.group === 'base' && metric.key === 'cnsLevel',
  )
  if (!control) return sections
  const ship = sections.find((section) => section.key === 'endfieldSpaceship')
  const items = [...(ship?.items ?? [])]
  const index = items.findIndex((item) => item.nameKey === 'endfieldControl')
  if (index >= 0) {
    const room = items[index]!
    items[index] = {
      ...room,
      level: room.level ?? control.current,
      maxLevel: room.maxLevel ?? control.total ?? undefined,
    }
  } else {
    items.unshift({
      id: 'endfield-control-summary',
      name: null,
      nameKey: 'endfieldControl',
      level: control.current,
      maxLevel: control.total ?? undefined,
      current: null,
      total: null,
      status: 'unknown',
      completeAt: null,
    })
  }
  const combined = { key: 'endfieldSpaceship', items }
  return ship
    ? sections.map((section) => (section === ship ? combined : section))
    : [combined, ...sections]
}

export const endfieldExplorationColumns = [
  'endfieldExplorationChests',
  'endfieldExplorationPuzzles',
  'endfieldExplorationBlackboxes',
  'endfieldExplorationPieces',
  'endfieldExplorationEquipChests',
  'endfieldExplorationTrstars',
] as const

/** Join by domain + level ID, never by row position or translated region name. */
function mergeEndfieldExploration(sections: DisplaySection[]): DisplaySection[] {
  const keys: readonly string[] = endfieldExplorationColumns
  const groups = sections.filter((section) => keys.includes(section.key))
  if (!groups.length) return sections
  const regions = new Map<string, DisplayItem>()
  for (const group of groups)
    for (const item of group.items) {
      const region = regions.get(item.id) ?? {
        ...item,
        measures: endfieldExplorationColumns.map((key) => ({ key, current: null, total: null })),
      }
      region.name ??= item.name
      region.subtitle ??= item.subtitle
      region.artworkUrl ??= item.artworkUrl
      const measure = region.measures!.find((measure) => measure.key === group.key)!
      measure.current = item.current
      measure.total = item.total
      regions.set(item.id, region)
    }
  // Official GameDataInfoCodec / RegionExploreTable ordering (2026-10-04):
  // newest level IDs within each domain, legacy levels at the end, featured map first.
  const legacy = [
    'map02_lv003',
    'map02_lv001',
    'map02_lv002',
    'map01_lv007',
    'map01_lv006',
    'map01_lv005',
    'map01_lv003',
    'map01_lv002',
    'map01_lv001',
  ]
  const domainOrder = new Map<string, number>()
  const parts = (item: DisplayItem) => item.id.split(':')
  for (const region of regions.values()) {
    const domain = parts(region)[0]!
    if (!domainOrder.has(domain)) domainOrder.set(domain, domainOrder.size)
  }
  const rank = (level: string) => (level === 'indie_dg016' ? -2 : legacy.indexOf(level))
  const ordered = [...regions.values()].sort((a, b) => {
    const [ad, al = ''] = parts(a),
      [bd, bl = ''] = parts(b)
    return (
      rank(al) - rank(bl) ||
      domainOrder.get(ad!)! - domainOrder.get(bd!)! ||
      (al === bl ? 0 : al > bl ? -1 : 1)
    )
  })
  let inserted = false
  return sections.flatMap((section) => {
    if (!keys.includes(section.key)) return [section]
    if (inserted) return []
    inserted = true
    return [{ key: 'endfieldExploration', items: ordered }]
  })
}

/** Join the two measures by season ID, preserving source order and partial records. */
export function overviewSections(sections: Section[] = []): DisplaySection[] {
  sections = mergeEndfieldExploration(sections)
  // Upstream ordering varies; compare verified editions numerically on a copy.
  sections = sections.map((section) =>
    section.key === 'arknightsBossRush'
      ? {
          ...section,
          items: [...section.items].sort((a, b) => {
            const edition = (value: string | null | undefined) =>
              value && /^\d+$/.test(value) ? Number(value) : -1
            return edition(b.bossRush?.edition) - edition(a.bossRush?.edition)
          }),
        }
      : section,
  )
  // Keep each facility's semantics while presenting one shared disclosure.
  const facilityKeys = ['arknightsOffice', 'arknightsTraining']
  const facilities = facilityKeys.map((key) => sections.find((section) => section.key === key))
  if (facilities.every((section) => section !== undefined)) {
    const combined: DisplaySection = {
      key: 'arknightsOfficeTraining',
      items: facilities.flatMap((section) =>
        section!.items.map((item) => ({ ...item, sourceSection: section!.key })),
      ),
    }
    let inserted = false
    sections = sections.flatMap((section) => {
      if (!facilityKeys.includes(section.key)) return [section]
      if (inserted) return []
      inserted = true
      return [combined]
    })
  }
  const isRogue = (key: string) => key === 'arknightsRogueRelics' || key === 'arknightsRogueBank'
  const groups = sections.filter((section) => isRogue(section.key))
  if (!groups.length) return sections
  const seasons = new Map<string, { relics?: DisplayItem; bank?: DisplayItem }>()
  for (const group of groups) {
    for (const item of group.items) {
      const season = seasons.get(item.id) ?? {}
      season[group.key === 'arknightsRogueRelics' ? 'relics' : 'bank'] = item
      seasons.set(item.id, season)
    }
  }
  const combined: DisplaySection = {
    key: 'arknightsRogue',
    items: [...seasons.values()].map(({ relics, bank }) => ({
      ...(relics ?? bank)!,
      name: relics?.name ?? bank?.name ?? null,
      artworkUrl: relics?.artworkUrl ?? bank?.artworkUrl,
      measures: [
        {
          key: 'arknightsRogueRelics',
          current: relics?.current ?? null,
          total: relics?.total ?? null,
        },
        { key: 'arknightsRogueBank', current: bank?.current ?? null, total: bank?.total ?? null },
      ],
    })),
  }
  let inserted = false
  return sections.flatMap((section) => {
    if (!isRogue(section.key)) return [section]
    if (inserted) return []
    inserted = true
    return [combined]
  })
}
