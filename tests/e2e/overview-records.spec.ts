import { test, expect, user, role, overview, reply } from './fixtures'
const base = {
  name: null,
  level: null,
  status: 'unknown',
  current: null,
  total: null,
  completeAt: null,
}
for (const language of ['zh-CN', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`${language} banner proportions and dedicated sandbox states in ${theme}`, async ({
      page,
    }) => {
      await page.addInitScript(
        (language) => localStorage.setItem('eason-locale', language),
        language,
      )
      await page.emulateMedia({ colorScheme: theme as 'light' | 'dark' })
      await page.route('**/api/user/current', (route) => reply(route, user))
      await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
      const url = 'https://bbs.hycdn.cn/public/fixture-banner.png'
      await page.route(url, (route) =>
        route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="200"><rect width="1200" height="200" fill="#816453"/><text x="50" y="120" font-size="64" fill="white">Synthetic banner</text></svg>',
        }),
      )
      await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
        reply(route, {
          ...overview(),
          sections: [
            {
              key: 'arknightsActivities',
              items: [
                {
                  ...base,
                  id: 'banner',
                  name: 'Banner record',
                  artworkUrl: url,
                  current: 0,
                  total: 12,
                },
                { ...base, id: 'missing', name: 'Missing artwork' },
              ],
            },
            {
              key: 'arknightsBossRush',
              items: [
                {
                  ...base,
                  id: 'trial',
                  bossRush: { edition: '02', played: true, difficulty: 'EX', stageCode: 'TN-2' },
                },
                {
                  ...base,
                  id: 'unplayed',
                  bossRush: { edition: '01', played: false, difficulty: null, stageCode: null },
                },
              ],
            },
            {
              key: 'arknightsSandbox',
              items: [
                {
                  ...base,
                  id: 'sandbox',
                  name: 'Synthetic sandbox',
                  sandbox: {
                    maxDay: 0,
                    maxDayChallenge: null,
                    mainQuest: 1,
                    subQuests: [
                      { id: 'done', name: 'Done quest', done: true },
                      { id: 'unfinished', name: 'Unfinished quest', done: false },
                      { id: 'unknown', name: 'Unknown quest', done: null },
                    ],
                    baseLv: 3,
                    unlockNode: 17,
                    enemyKill: 0,
                    createRift: null,
                    fixRift: { current: 0, total: 6 },
                  },
                },
              ],
            },
          ],
        }),
      )
      await page.goto('/game/hypergryph/skland')
      await expect(page.locator('.facility-group')).toHaveCount(3)
      for (const summary of await page.locator('.facility-group summary').all()) {
        await summary.focus()
        await summary.press('Enter')
        await expect(summary.locator('..')).toHaveAttribute('open', '')
      }
      const banners = page.locator('.banner-frame')
      const size = await banners.first().boundingBox()
      expect(size!.width / size!.height).toBeCloseTo(6, 1)
      expect((await banners.nth(1).boundingBox())!.height).toBeCloseTo(size!.height, 0)
      await expect(
        page.getByText(language === 'en' ? 'Spectacular Trial TN-2' : '恢弘试炼 TN-2'),
      ).toBeVisible()
      await expect(
        page.getByText(language === 'en' ? 'No record' : '暂无记录', { exact: true }),
      ).toBeVisible()
      const sandbox = page.locator('.sandbox-details')
      await expect(sandbox).toBeVisible()
      await expect(sandbox.locator('.survival-grid dd').first()).toHaveText(
        language === 'en' ? '0days' : '0天',
      )
      await expect(sandbox.locator('.survival-grid dd').nth(1)).toHaveText('—')
      await expect(sandbox.locator('.chapter-grid .complete')).toHaveCount(1)
      await expect(sandbox.locator('.quest-list li').nth(0)).toContainText(
        language === 'en' ? 'Completed' : '已完成',
      )
      await expect(sandbox.locator('.quest-list li').nth(1)).toContainText(
        language === 'en' ? 'Unfinished' : '未完成',
      )
      await expect(sandbox.locator('.quest-list li').nth(2)).toContainText(
        language === 'en' ? 'Not provided' : '未提供',
      )
      await expect(sandbox.getByText('0 / 6', { exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await page
        .locator('.facility-section')
        .screenshot({ path: test.info().outputPath(`records-${theme}.png`) })
    })
  }
}
