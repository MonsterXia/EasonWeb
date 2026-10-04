import type { GameOverview, OverviewMetric } from './api/gameOverview'
import { metricCurrent } from './resourceRecovery'

export interface DailyMetric extends OverviewMetric {
  text?: string
  textKey?: string
  note?: { key: string; seconds?: number }
}
const order = [
  'stamina',
  'training',
  'recruitAvailable',
  'recruitRefresh',
  'orundum',
  'daily',
  'weekly',
  'towerHigher',
  'towerLower',
]
const day = 86400
// Shift Beijing's 04:00 game-day boundary to UTC midnight.
const gameDay = (now: number) => Math.floor((now + 14400) / day) * day - 14400
export const nextDailyReset = (now: number) => gameDay(now) + day
export function nextWeeklyReset(now: number) {
  const start = gameDay(now)
  const weekday = new Date((start + 14400) * 1000).getUTCDay()
  return start + (7 - ((weekday + 6) % 7)) * day
}
export function nextTowerReset(now: number) {
  const local = new Date((now + 14400) * 1000)
  const year = local.getUTCFullYear(),
    month = local.getUTCMonth()
  return Date.UTC(year, month + (local.getUTCDate() >= 16 ? 1 : 0), 16) / 1000 - 14400
}

/** Skland displays at most two nonzero units; minutes round up, capped at 59. */
export function durationParts(seconds: number) {
  const remaining = Math.max(0, seconds)
  const days = Math.floor(remaining / day)
  const hours = Math.floor((remaining % day) / 3600)
  const minutes = days && hours ? 0 : Math.min(59, Math.ceil((remaining % 3600) / 60))
  return { days, hours, minutes }
}

/** Presentation only: derive the official live cards from the existing normalized snapshot. */
export function dailyStatus(
  game: string,
  data: Pick<GameOverview, 'metrics' | 'sections' | 'fetchedAt' | 'calculatedAt'>,
  now: number,
): DailyMetric[] {
  if (game !== 'arknights') return data.metrics
  const rows = (key: string) => data.sections?.find((section) => section.key === key)?.items
  const result: DailyMetric[] = order.map((key) => {
    const source = data.metrics.find((metric) => metric.key === key)
    return {
      ...source,
      key,
      group: 'daily',
      current: source ? metricCurrent(source, now) : null,
      total: source?.total ?? null,
    }
  })
  for (const card of result) {
    const countdown = (key: string, at: number) => {
      card.note = { key, seconds: at - now }
    }
    if (card.key === 'training') {
      const training = rows('arknightsTraining')?.[0]
      if (training?.name) card.text = training.name
      if (!training || training.status === 'unknown') card.note = { key: 'missing' }
      else if (training.status === 'idle') {
        if (!card.text) card.textKey = 'idle'
        card.note = { key: 'trainingIdle' }
      } else if (
        training.status === 'complete' ||
        (training.completeAt && training.completeAt <= now)
      )
        card.note = { key: 'trainingComplete' }
      else if (training.completeAt && training.completeAt > now)
        countdown('trainingRemaining', training.completeAt)
      else card.note = { key: 'missing' }
    } else if (card.key === 'recruitRefresh') {
      const office = rows('arknightsOffice')?.[0]
      // Availability is projected, but the exact refresh count remains a snapshot.
      card.current = office?.current ?? card.current
      card.total = null
      if (
        (card.current !== null && card.current > 0) ||
        office?.status === 'complete' ||
        (office?.completeAt && office.completeAt <= now)
      ) {
        card.textKey = 'refreshReady'
        card.note = { key: 'refreshAvailable' }
      } else if (office?.status === 'idle' || office?.status === 'working') {
        card.textKey = office.status === 'idle' ? 'refreshPaused' : 'refreshWorking'
        if (office.completeAt && office.completeAt > now)
          countdown('refreshRemaining', office.completeAt)
        else card.note = { key: 'refreshNone' }
      } else {
        card.textKey = 'unknown'
        card.note = { key: 'missing' }
      }
    } else if (card.key === 'recruitAvailable') {
      const recruitment = rows('arknightsRecruitment')
      if (recruitment?.length && recruitment.every((row) => row.status !== 'unknown')) {
        const slots = recruitment.filter((row) => row.status !== 'locked')
        card.total = slots.length
        card.current = slots.filter(
          (row) =>
            row.status === 'idle' ||
            row.status === 'complete' ||
            (row.completeAt && row.completeAt <= now),
        ).length
        const working = slots.filter(
          (row) => row.status === 'working' && (!row.completeAt || row.completeAt > now),
        )
        if (working.some((row) => !row.completeAt)) card.note = { key: 'missing' }
        else if (working.length)
          countdown('recruitRemaining', Math.max(...working.map((row) => row.completeAt!)))
        else if (slots.length) card.note = { key: 'recruitComplete' }
      } else if (
        card.current !== null &&
        card.total !== null &&
        card.total > 0 &&
        card.current >= card.total
      )
        card.note = { key: 'recruitComplete' }
    } else if (card.key === 'stamina') {
      if (card.current !== null && card.total !== null && card.total > 0) {
        if (card.current >= card.total) card.note = { key: 'sanityFull' }
        else if (card.recoveryAt && card.recoveryAt > now)
          countdown('sanityRemaining', card.recoveryAt)
      }
    } else {
      const reset =
        card.key === 'daily'
          ? nextDailyReset
          : card.key.startsWith('tower')
            ? nextTowerReset
            : nextWeeklyReset
      // Roll cached counters over without mutating the snapshot or fetching every second.
      if (card.current !== null && now >= reset(data.calculatedAt ?? data.fetchedAt))
        card.current = 0
      if (card.current !== null) countdown('resetRemaining', reset(now))
    }
    if (card.current === null && !card.text && !card.textKey && !card.note)
      card.note = { key: 'missing' }
  }
  return [...result, ...data.metrics.filter((metric) => !order.includes(metric.key))]
}
