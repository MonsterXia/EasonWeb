import { test, expect, reply, user, role, overview, deferred } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/user/current', (route) => reply(route, user))
  await page.route('**/api/game/hypergryph/account/games', (route) =>
    reply(route, [role(), role('fixture-b')]),
  )
})

for (const lateStatus of [200, 502]) {
  test(`switching roles ignores a late ${lateStatus} response from the previous role`, async ({
    page,
  }) => {
    const pending = deferred(),
      started = deferred()
    await page.route('**/api/game/hypergryph/account/overview?*', async (route) => {
      const uid = new URL(route.request().url()).searchParams.get('uid')!
      if (uid === 'fixture-a') {
        started.resolve()
        await pending.promise
      }
      await reply(route, overview(uid), uid === 'fixture-a' ? lateStatus : 200)
    })
    await page.goto('/game/hypergryph/skland')
    await started.promise
    await page.getByRole('button', { name: /fixture-b/ }).click()
    await expect(page.locator('.overview-header h2')).toHaveText('fixture-b')
    await expect(page.locator('.profile-facts')).toBeVisible()
    pending.resolve()
    await page.waitForTimeout(300)
    await expect(page.locator('.overview-header h2')).toHaveText('fixture-b')
    await expect(page.locator('.profile-facts')).toBeVisible()
  })
}

for (const failure of [
  { status: 401, data: null, text: '本站登录已失效', link: '重新登录' },
  { status: 502, data: null, text: '鹰角或森空岛暂时无法提供资料', link: '管理关联账号' },
  { status: 200, data: { metrics: null }, text: '服务返回的资料格式异常', link: null },
]) {
  test(`overview failure ${failure.status} / ${failure.link ?? 'invalid data'} has recovery and can retry`, async ({
    page,
  }) => {
    let recovered = false
    await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
      reply(route, recovered ? overview() : failure.data, recovered ? 200 : failure.status),
    )
    await page.goto('/game/hypergryph/skland')
    await expect(page.getByText(failure.text, { exact: false })).toBeVisible()
    if (failure.link)
      await expect(page.getByRole('link', { name: failure.link, exact: true })).toBeVisible()
    recovered = true
    await page.getByRole('button', { name: '刷新角色资料', exact: true }).click()
    await expect(page.locator('.profile-facts')).toBeVisible()
    await expect(page.locator('.overview .empty-state')).toHaveCount(0)
  })
}

test('check-in shows successes and failures from HTTP 207', async ({ page }) => {
  await page.route('**/api/game/hypergryph/account/overview?*', (route) => reply(route, overview()))
  await page.route('**/api/game/hypergryph/account/check-in', (route) =>
    reply(
      route,
      {
        checkInResults: ['Synthetic check-in success'],
        errorResults: [{ ...role(), error: 'Synthetic upstream failure' }],
      },
      207,
    ),
  )
  await page.goto('/game/hypergryph/skland')
  await page.getByRole('button', { name: /一键签到|全部签到/ }).click()
  await expect(page.getByText('Synthetic check-in success', { exact: true })).toBeVisible()
  await expect(page.getByText(/Synthetic upstream failure/)).toBeVisible()
})
