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
const { metricCurrent, rememberOverview, overviewTime } = await vite.ssrLoadModule(
  '/src/common/resourceRecovery.ts',
)
const ap = {
  current: 23,
  total: 210,
  recoveryAt: 100000,
  recovery: { value: 23, at: 1000, intervalSeconds: 360 },
}
test('cached sanity advances at each recovery boundary without mutating the snapshot', () => {
  assert.equal(metricCurrent(ap, 1359), 23)
  assert.equal(metricCurrent(ap, 1360), 24)
  assert.equal(metricCurrent(ap, 100000), 210)
  assert.equal(metricCurrent(ap, 900), 23)
  assert.equal(ap.current, 23)
})
test('drone fractional recovery intervals preserve exact boundaries; unavailable/over-cap data stay intact', () => {
  assert.equal(
    metricCurrent(
      {
        current: 2,
        total: 200,
        recoveryAt: 4600,
        recovery: { value: 2, at: 1000, intervalSeconds: 3600 / 198 },
      },
      2800,
    ),
    101,
  )
  assert.equal(metricCurrent({ ...ap, current: 250 }, 200000), 250)
  assert.equal(metricCurrent({ ...ap, current: null }, 200000), null)
  assert.equal(metricCurrent({ current: 20, total: 100 }, 200000), 20)
})
test('uses the server calculation clock and elapsed local time, even when device time is wrong', () => {
  const data = { calculatedAt: 1000, fetchedAt: 2000 }
  rememberOverview(data, 5000000)
  assert.equal(overviewTime(data, 5000000), 1000)
  assert.equal(overviewTime(data, 5360000), 1360)
  assert.equal(overviewTime(data, 4900000), 1000)
  const other = { calculatedAt: 3000, fetchedAt: 3000 }
  rememberOverview(other, 6000000)
  assert.equal(overviewTime(data, 5360000), 1360)
})

test('keeps the recovery clock when Vue wraps a cached response in a reactive proxy', async () => {
  const { reactive } = await import('vue')
  const raw = { calculatedAt: 1000, fetchedAt: 1000 }
  rememberOverview(raw, 1000000)
  const cached = reactive(raw)
  assert.equal(overviewTime(cached, 1360000), 1360)
})
