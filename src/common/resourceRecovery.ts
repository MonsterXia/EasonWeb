import { toRaw } from 'vue'
import type { GameOverview, OverviewMetric } from './api/gameOverview'

const receivedAt = new WeakMap<GameOverview, number>()
export function rememberOverview(data: GameOverview, now = Date.now()) {
  receivedAt.set(toRaw(data), now)
}
export function overviewTime(data: GameOverview, now = Date.now()) {
  const received = receivedAt.get(toRaw(data)) ?? now
  return (data.calculatedAt ?? data.fetchedAt) + Math.max(0, now - received) / 1000
}

export function metricCurrent(metric: OverviewMetric, now: number): number | null {
  const { current, total, recovery, recoveryAt } = metric
  if (current === null || total === null || total <= 0 || current >= total || !recovery)
    return current
  if (recoveryAt && now >= recoveryAt) return total
  if (!Number.isFinite(recovery.intervalSeconds) || recovery.intervalSeconds <= 0) return current
  const gained = Math.floor(Math.max(0, now - recovery.at) / recovery.intervalSeconds + 1e-9)
  return Math.max(current, Math.min(total, recovery.value + gained))
}
