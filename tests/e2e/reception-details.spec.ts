import { test, expect, reply, user, role, overview } from './fixtures'

for (const missingRoom of [false, true]) {
  test(`one reception room with independent clue metrics, missing room: ${missingRoom}`, async ({
    page,
    isMobile,
  }) => {
    await page.addInitScript((mobile) => {
      localStorage.setItem('eason-locale', mobile ? 'en' : 'zh-CN')
      localStorage.setItem('eason-theme', mobile ? 'light' : 'dark')
    }, isMobile)
    const item = (id: string, current: number | null, total: number | null) => ({
      id,
      name: null,
      level: null,
      status: 'unknown',
      current,
      total,
      completeAt: null,
    })
    const items = [
      item('needReceive', 0, null),
      item('received', null, null),
      item('own', 4, 10),
      ...(!missingRoom
        ? [
            {
              ...item('board', 0, 7),
              level: 3,
              status: 'working',
              completeAt: Math.floor(Date.now() / 1000) + 3600,
            },
          ]
        : []),
    ]
    await page.route('**/api/user/current', (route) => reply(route, user))
    await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
    await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
      reply(route, {
        ...overview(),
        sections: [{ key: 'arknightsClues', items }],
      }),
    )
    await page.goto('/game/hypergryph/skland')
    const group = page.locator('[data-section="arknightsClues"]')
    const card = group.locator('.reception-card')
    await expect(card).toHaveCount(1)
    await expect(group.locator('.section-count')).toHaveCount(0)
    await expect(group.locator('.facility-grid')).toHaveCount(0)
    await expect(card.locator('dd')).toHaveText([missingRoom ? '—' : '0 / 7', '4 / 10', '—', '0'])
    await expect(card.locator('header')).toContainText(isMobile ? 'Reception room' : '会客室')
    await expect(card.locator('.reception-status')).toHaveAttribute(
      'data-status',
      missingRoom ? 'unknown' : 'working',
    )
    await expect(card.locator('.reception-note')).toHaveCount(missingRoom ? 0 : 1)
    await expect(card.locator('.reception-art')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    for (const width of isMobile ? [320, 390] : [768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    }
    await group.locator('summary').click()
    await expect(group).not.toHaveAttribute('open')
    await group.locator('summary').click()
    await expect(card).toBeVisible()
  })
}
