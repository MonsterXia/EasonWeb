import { test, expect, reply, user, role, overview, deferred } from './fixtures'
const first = role(),
  second = { ...role('fixture-b'), appCode: 'endfield', serverName: '测试区服' }
const row = (account = first, status = 'success', patch = {}) => ({
  account,
  status,
  rewards: status === 'success' ? [{ id: 'r', name: '合成玉', count: 80, type: 'daily' }] : [],
  rewardsComplete: true,
  errorCode: status === 'failed' ? 'timeout' : null,
  retryable: status === 'failed',
  upstreamCode: null,
  ...patch,
})
const report = (rows: unknown[]) => ({
  results: rows,
  checkInResults: [],
  errorResults: [],
  requestId: '0c9c7c31-f07a-4049-a814-e96b3048b44f',
  completedAt: 1791187200,
  durationMs: 650,
})
test.beforeEach(async ({ page }) => {
  await page.route('**/api/user/current', (route) => reply(route, user))
  await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [first, second]))
  await page.route('**/api/game/hypergryph/account/overview?*', (route) => reply(route, overview()))
})
test('partial failure retries only the failed role and preserves successful rewards', async ({
  page,
}, testInfo) => {
  const requests: unknown[] = []
  const pending = deferred()
  await page.route('**/api/game/hypergryph/account/check-in', async (route) => {
    requests.push(route.request().postDataJSON())
    if (requests.length === 1) {
      await pending.promise
      await reply(route, report([row(), row(second, 'failed')]), 207)
    } else await reply(route, report([row(second, 'already_checked_in')]))
  })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/game/hypergryph/skland')
  await page.getByRole('button', { name: '全部签到', exact: true }).click()
  await expect(page.getByRole('button', { name: '签到当前角色', exact: true })).toBeDisabled()
  pending.resolve()
  const results = page.getByRole('region', { name: '签到结果', exact: true })
  await expect(results.getByText('新签到 1 · 已签到 0 · 失败 1')).toBeVisible()
  await expect(results.getByText('合成玉', { exact: true })).toBeVisible()
  await expect(results.getByText(/领取结果暂未确认/)).toBeVisible()
  await expect(results.getByText('测试区服', { exact: false })).toBeVisible()
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await results.screenshot({ path: `/tmp/skland-checkin-${testInfo.project.name}.png` })
  await expect(results.getByRole('button', { name: '重试失败角色', exact: true })).toHaveCount(0)
  await results.getByRole('button', { name: '重试此角色', exact: true }).click()
  await expect(results.getByText('新签到 1 · 已签到 1 · 失败 0')).toBeVisible()
  expect(requests[1]).toEqual({ roles: [{ appCode: 'endfield', uid: 'fixture-b', gameId: '1' }] })
  await expect(results.getByText('合成玉', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
test('all failures render an error and expired logins expose recovery instead of retry', async ({
  page,
}) => {
  await page.route('**/api/game/hypergryph/account/check-in', (route) =>
    reply(
      route,
      report([row(first, 'failed', { errorCode: 'auth_expired', retryable: false })]),
      207,
    ),
  )
  await page.goto('/game/hypergryph/skland')
  await page.getByRole('button', { name: '签到当前角色', exact: true }).click()
  const results = page.getByRole('region', { name: '签到结果', exact: true })
  await expect(results.getByText('本次签到未成功，请查看角色详情后重试。')).toBeVisible()
  await expect(results.getByRole('link', { name: '更新账号登录' })).toHaveAttribute('href', '/user')
  await expect(results.getByRole('button')).toHaveCount(0)
})
test('missing rewards stay successful, show zero amounts, and fit 320px dark layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.route('**/api/game/hypergryph/account/check-in', (route) =>
    reply(
      route,
      report([
        row(first, 'success', {
          rewards: [
            { id: 'missing', name: null, count: null, type: null },
            { id: 'zero', name: '零数量奖励', count: 0, type: 'daily' },
          ],
          rewardsComplete: false,
        }),
      ]),
    ),
  )
  await page.goto('/game/hypergryph/skland')
  await page.getByRole('button', { name: '全部签到', exact: true }).click()
  const results = page.getByRole('region', { name: '签到结果', exact: true })
  await expect(results.getByText('签到成功', { exact: true })).toBeVisible()
  await expect(results.getByText('× 0', { exact: true })).toBeVisible()
  await expect(results.getByText('数量未知', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test('English results retain long identity and diagnostics without overflow', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('eason-locale', 'en'))
  const longRole = {
    ...second,
    nickName: 'A very long synthetic Endministrator display name',
    serverName: 'Synthetic test server with a long display name',
  }
  await page.route('**/api/game/hypergryph/account/check-in', (route) =>
    reply(route, report([row(longRole, 'already_checked_in')])),
  )
  await page.goto('/game/hypergryph/skland')
  await page.getByRole('button', { name: 'Check in all', exact: true }).click()
  const results = page.getByRole('region', { name: 'Check-in results', exact: true })
  await expect(results.getByText('Already checked in today', { exact: true })).toBeVisible()
  await results.getByText('Diagnostics', { exact: true }).click()
  await expect(
    results.getByText('0c9c7c31-f07a-4049-a814-e96b3048b44f', { exact: true }),
  ).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await results.screenshot({ path: `/tmp/skland-checkin-en-${testInfo.project.name}.png` })
})

test('official clock skew remains retryable without suggesting a new login', async ({ page }) => {
  await page.route('**/api/game/hypergryph/account/check-in', (route) =>
    reply(
      route,
      report([
        row(first, 'failed', { errorCode: 'clock_skew', retryable: true, upstreamCode: 10003 }),
      ]),
      207,
    ),
  )
  await page.goto('/game/hypergryph/skland')
  await page.getByRole('button', { name: '全部签到', exact: true }).click()
  const results = page.getByRole('region', { name: '签到结果', exact: true })
  await expect(results.getByText(/服务器时间暂时无法同步/)).toBeVisible()
  await expect(results.getByRole('button', { name: '重试此角色', exact: true })).toBeVisible()
  await expect(results.getByRole('link', { name: '更新账号登录' })).toHaveCount(0)
})

test('one linked character has one check-in entry, while multiple retryable failures retain batch retry', async ({
  page,
}) => {
  await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [first]))
  const requests: { roles?: unknown[] }[] = []
  await page.route('**/api/game/hypergryph/account/check-in', async (route) => {
    requests.push(route.request().postDataJSON())
    await reply(route, report([row()]))
  })
  await page.goto('/game/hypergryph/skland')
  await expect(page.getByRole('button', { name: '签到当前角色', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '全部签到', exact: true }).click()
  await expect(page.getByRole('region', { name: '签到结果', exact: true })).toBeVisible()
  expect(requests).toHaveLength(1)
  await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [first, second]))
  await page.route('**/api/game/hypergryph/account/check-in', async (route) => {
    requests.push(route.request().postDataJSON())
    await reply(
      route,
      report(
        requests.length === 2
          ? [row(first, 'failed'), row(second, 'failed')]
          : [row(), row(second)],
      ),
      207,
    )
  })
  await page.reload()
  await expect(page.getByRole('button', { name: '签到当前角色', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '全部签到', exact: true }).click()
  const results = page.getByRole('region', { name: '签到结果', exact: true })
  await results.getByRole('button', { name: '重试失败角色', exact: true }).click()
  await expect(results.getByText('新签到 2 · 已签到 0 · 失败 0')).toBeVisible()
  expect(requests[2]?.roles).toHaveLength(2)
})
