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
const { dailyStatus, nextDailyReset, nextWeeklyReset, nextTowerReset, durationParts } =
  await vite.ssrLoadModule('/src/common/dailyStatus.ts')
const ts = (date) => Date.parse(date) / 1000
const now = ts('2026-10-04T17:57:00+08:00')
const metric = (key, current = 0, total = null, group = 'daily') => ({ key, current, total, group })
const item = (status, completeAt = null, extra = {}) => ({
  id: 'slot',
  name: null,
  level: null,
  status,
  current: null,
  total: null,
  completeAt,
  ...extra,
})
const data = (metrics = [], sections = []) => ({
  fetchedAt: now,
  calculatedAt: now,
  metrics,
  sections,
})
const get = (result, key) => result.find((m) => m.key === key)

test('nine daily cards follow official order, reuse sections, and preserve the snapshot', () => {
  const source = data(
    [metric('stamina', 20, 100), metric('recruitRefresh', 0, null, 'base')],
    [
      { key: 'arknightsTraining', items: [item('idle', null, { name: '测试干员' })] },
      { key: 'arknightsOffice', items: [item('complete', now - 1, { current: 0 })] },
    ],
  )
  const original = structuredClone(source)
  const result = dailyStatus('arknights', source, now)
  assert.deepEqual(
    result.map((m) => m.key),
    [
      'stamina',
      'training',
      'recruitAvailable',
      'recruitRefresh',
      'orundum',
      'daily',
      'weekly',
      'towerHigher',
      'towerLower',
    ],
  )
  assert.equal(get(result, 'training').text, '测试干员')
  assert.equal(get(result, 'training').note.key, 'trainingIdle')
  assert.equal(get(result, 'recruitRefresh').textKey, 'refreshReady')
  assert.equal(get(result, 'recruitRefresh').current, 0)
  assert.equal(get(result, 'towerHigher').current, null)
  assert.deepEqual(source, original)
  assert.deepEqual(dailyStatus('endfield', source, now), source.metrics)
})

test('recruitment counts advance at deadlines and countdown waits for the last slot', () => {
  const source = data(
    [metric('recruitAvailable', 1, 3)],
    [
      {
        key: 'arknightsRecruitment',
        items: [
          item('idle'),
          item('working', now + 60),
          item('working', now + 120),
          item('locked'),
        ],
      },
    ],
  )
  let card = get(dailyStatus('arknights', source, now), 'recruitAvailable')
  assert.equal(card.current, 1)
  assert.deepEqual(card.note, { key: 'recruitRemaining', seconds: 120 })
  card = get(dailyStatus('arknights', source, now + 60), 'recruitAvailable')
  assert.equal(card.current, 2)
  assert.equal(card.note.seconds, 60)
  card = get(dailyStatus('arknights', source, now + 120), 'recruitAvailable')
  assert.equal(card.current, 3)
  assert.equal(card.note.key, 'recruitComplete')
})

test('training and office transition without inventing refresh counts', () => {
  const source = data(
    [],
    [
      { key: 'arknightsTraining', items: [item('working', now + 60, { name: '测试干员' })] },
      { key: 'arknightsOffice', items: [item('working', now + 60, { current: 0 })] },
    ],
  )
  const start = dailyStatus('arknights', source, now)
  assert.deepEqual(get(start, 'training').note, { key: 'trainingRemaining', seconds: 60 })
  assert.equal(get(start, 'recruitRefresh').textKey, 'refreshWorking')
  const end = dailyStatus('arknights', source, now + 60)
  assert.equal(get(end, 'training').note.key, 'trainingComplete')
  assert.equal(get(end, 'recruitRefresh').textKey, 'refreshReady')
  assert.equal(get(end, 'recruitRefresh').current, 0)
})

test('missing values are not converted to idle, completed or zero', () => {
  const cards = dailyStatus('arknights', data([metric('stamina', 10, 100)]), now)
  assert.equal(get(cards, 'training').note.key, 'missing')
  assert.equal(get(cards, 'recruitRefresh').note.key, 'missing')
  assert.equal(get(cards, 'stamina').note, undefined)
  assert.equal(get(cards, 'daily').current, null)
  const unknown = dailyStatus(
    'arknights',
    data([], [{ key: 'arknightsRecruitment', items: [item('unknown')] }]),
    now,
  )
  assert.equal(get(unknown, 'recruitAvailable').current, null)
})

test('sanity full and over-cap states, plus countdown from supplied recovery deadline', () => {
  for (const value of [100, 120]) {
    const card = get(
      dailyStatus('arknights', data([metric('stamina', value, 100)]), now),
      'stamina',
    )
    assert.equal(card.current, value)
    assert.equal(card.note.key, 'sanityFull')
  }
  const source = data([
    {
      ...metric('stamina', 90, 100),
      recoveryAt: now + 3600,
      recovery: { value: 90, at: now, intervalSeconds: 360 },
    },
  ])
  assert.equal(get(dailyStatus('arknights', source, now + 360), 'stamina').current, 91)
  assert.equal(get(dailyStatus('arknights', source, now + 360), 'stamina').note.seconds, 3240)
  assert.equal(get(dailyStatus('arknights', source, now + 3600), 'stamina').note.key, 'sanityFull')
})

test('daily and weekly reset at Beijing 04:00 independent of host timezone', () => {
  assert.equal(nextDailyReset(now), ts('2026-10-05T04:00:00+08:00'))
  assert.equal(nextWeeklyReset(now), ts('2026-10-05T04:00:00+08:00'))
  const reset = nextDailyReset(now)
  assert.equal(nextDailyReset(reset), reset + 86400)
  assert.equal(nextWeeklyReset(reset), reset + 7 * 86400)
  const source = data([
    metric('daily', 10, 10),
    metric('weekly', 13, 13),
    metric('orundum', 1800, 1800),
  ])
  const cards = dailyStatus('arknights', source, reset)
  for (const key of ['daily', 'weekly', 'orundum']) assert.equal(get(cards, key).current, 0)
})

test('duration formatting follows official day/hour/minute precision', () => {
  assert.deepEqual(durationParts(11 * 86400 + 6 * 3600 + 30 * 60), {
    days: 11,
    hours: 6,
    minutes: 0,
  })
  assert.deepEqual(durationParts(3601), { days: 0, hours: 1, minutes: 1 })
  assert.deepEqual(durationParts(3599), { days: 0, hours: 0, minutes: 59 })
  assert.deepEqual(durationParts(1), { days: 0, hours: 0, minutes: 1 })
})

test('tower rewards reset monthly on the 16th at 04:00, including year/leap-month boundaries', () => {
  for (const [before, after] of [
    ['2026-10-04T17:57:00+08:00', '2026-10-16T04:00:00+08:00'],
    ['2026-10-16T03:59:59+08:00', '2026-10-16T04:00:00+08:00'],
    ['2026-10-16T04:00:00+08:00', '2026-11-16T04:00:00+08:00'],
    ['2026-12-31T23:00:00+08:00', '2027-01-16T04:00:00+08:00'],
    ['2028-02-29T23:00:00+08:00', '2028-03-16T04:00:00+08:00'],
  ])
    assert.equal(nextTowerReset(ts(before)), ts(after))
  const source = {
    ...data([metric('towerHigher', 24, 24)]),
    calculatedAt: ts('2026-09-30T23:00:00+08:00'),
  }
  assert.equal(get(dailyStatus('arknights', source, now), 'towerHigher').current, 24)
  assert.equal(
    get(dailyStatus('arknights', source, ts('2026-10-16T04:00:00+08:00')), 'towerHigher').current,
    0,
  )
})
