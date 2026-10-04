import type { GameOverview } from './api/gameOverview'

type Section = NonNullable<GameOverview['sections']>[number]
export type DisplayItem = Section['items'][number] & {
  sourceSection?: string
  measures?: { key: string; current: number | null; total: number | null }[]
}
export type DisplaySection = { key: string; items: DisplayItem[] }

/** Join the two measures by season ID, preserving source order and partial records. */
export function overviewSections(sections: Section[] = []): DisplaySection[] {
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
