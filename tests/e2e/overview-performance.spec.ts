import { test, expect, reply, user, role, overview } from './fixtures'

test('resource ticks update live values without formatting static operator records again', async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date(1791000000000) })
  await page.addInitScript(() => {
    const state = window as typeof window & { numberFormats: number }
    state.numberFormats = 0
    Intl.NumberFormat = new Proxy(Intl.NumberFormat, {
      construct(target, args) {
        state.numberFormats++
        return Reflect.construct(target, args)
      },
    })
  })
  const data = {
    ...overview(),
    calculatedAt: 1791000000,
    metrics: [
      {
        key: 'stamina',
        group: 'daily',
        current: 0,
        total: 135,
        recovery: { value: 0, at: 1791000000, intervalSeconds: 1 },
      },
    ],
    operators: Array.from({ length: 8 }, (_, i) => ({
      id: `synthetic-${i}`,
      name: `Operator ${i}`,
      level: 50,
      phase: 2,
    })),
  }
  await page.route('**/api/user/current', (route) => reply(route, user))
  await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
  await page.route('**/api/game/hypergryph/account/overview?*', (route) => reply(route, data))
  await page.goto('/game/hypergryph/skland')
  await expect(page.locator('.operator-grid li')).toHaveCount(8)
  const before = await page.evaluate(
    () => (window as typeof window & { numberFormats: number }).numberFormats,
  )
  const current = Number(
    await page.locator('[data-metric="stamina"] .metric-value strong').textContent(),
  )
  await page.clock.runFor(2100)
  const after = await page.evaluate(
    () => (window as typeof window & { numberFormats: number }).numberFormats,
  )
  await testInfo.attach('resource-tick-formatting', {
    body: JSON.stringify({ numberFormatsOverTwoTicks: after - before }),
    contentType: 'application/json',
  })
  expect(
    Number(await page.locator('[data-metric="stamina"] .metric-value strong').textContent()),
  ).toBeGreaterThan(current)
  expect(after - before).toBeLessThan(6)
})
