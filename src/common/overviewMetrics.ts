import type { GameOverview, OverviewMetric } from './api/gameOverview'

const baseOrder = [
  'drones',
  'restedOperators',
  'tradingOrders',
  'manufacturing',
  'tiredOperators',
  'clueCollection',
]

/** Present the official base summary using the existing overview snapshot. */
export function overviewMetrics(
  game: string,
  data: Pick<GameOverview, 'metrics' | 'sections'>,
): OverviewMetric[] {
  const metrics = [...data.metrics]
  if (game !== 'arknights') return metrics
  if (
    metrics.some((metric) => metric.group === 'base') &&
    !metrics.some((metric) => metric.group === 'base' && metric.key === 'clueCollection')
  ) {
    const board = data.sections
      ?.find((section) => section.key === 'arknightsClues')
      ?.items.find((item) => item.id === 'board')
    metrics.push({
      key: 'clueCollection',
      group: 'base',
      current: board?.current ?? null,
      total: board?.total ?? null,
    })
  }
  // Reorder only base slots, preserving unrelated groups and unknown metrics.
  const rank = (key: string) =>
    baseOrder.includes(key) ? baseOrder.indexOf(key) : baseOrder.length
  const base = metrics
    .filter((metric) => metric.group === 'base')
    .sort((a, b) => rank(a.key) - rank(b.key))
  let index = 0
  return metrics.map((metric) => (metric.group === 'base' ? base[index++]! : metric))
}
