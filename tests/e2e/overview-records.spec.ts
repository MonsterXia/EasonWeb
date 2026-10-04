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
    test(`${language} banner overlays and dedicated sandbox states in ${theme}`, async ({
      page,
      isMobile,
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
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="200"><defs><linearGradient id="fade"><stop stop-color="#816453"/><stop offset=".7" stop-color="#816453" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="200" fill="url(#fade)"/><text x="50" y="120" font-size="64" fill="white">Banner</text></svg>',
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
                {
                  ...base,
                  id: 'long',
                  name: '超长活动名称用于验证窄屏换行与完整显示 Long activity title without truncation',
                  subtitle: '附加说明 Subtitle',
                  artworkUrl: url + '?broken',
                  current: 128,
                  total: 128,
                  status: 'complete',
                },
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
                {
                  ...base,
                  id: 'newest',
                  bossRush: { edition: '10', played: true, difficulty: 'SP', stageCode: 'TN-1' },
                },
              ],
            },
            {
              key: 'arknightsRogueRelics',
              items: [
                {
                  ...base,
                  id: 'season',
                  name: 'Synthetic rogue season',
                  artworkUrl: url,
                  current: 0,
                },
              ],
            },
            {
              key: 'arknightsRogueBank',
              items: [
                { ...base, id: 'season', name: 'Synthetic rogue season', current: 42 },
                { ...base, id: 'bank-only', name: 'Bank-only season', current: 0 },
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
      await expect(page.locator('.facility-group')).toHaveCount(4)
      for (const summary of await page.locator('.facility-group summary').all()) {
        await summary.focus()
        await summary.press('Enter')
        await expect(summary.locator('..')).toHaveAttribute('open', '')
      }
      const banners = page.locator('.banner-frame')
      // Measure together so smooth scrolling cannot shift coordinates between reads.
      const boxes = await banners
        .first()
        .locator('..')
        .evaluate((row) => {
          const rect = (selector: string) => {
            const r = row.querySelector(selector)!.getBoundingClientRect()
            return { x: r.x, y: r.y, width: r.width, height: r.height }
          }
          return {
            banner: rect('.banner-frame'),
            body: rect('.record-body'),
            height: row.getBoundingClientRect().height,
          }
        })
      expect(boxes.banner.height).toBeCloseTo(boxes.height - 2, 0)
      expect(boxes.body.x - boxes.banner.x).toBeGreaterThanOrEqual(58)
      expect(boxes.body.x - boxes.banner.x).toBeLessThanOrEqual(80)
      expect(boxes.body.y).toBeGreaterThanOrEqual(boxes.banner.y)
      expect(boxes.body.y + boxes.body.height).toBeLessThanOrEqual(
        boxes.banner.y + boxes.banner.height + 1,
      )
      expect(boxes.height).toBeLessThanOrEqual(82)
      expect((await banners.nth(1).boundingBox())!.height).toBeCloseTo(boxes.banner.height, 0)
      await expect(
        page.getByText(language === 'en' ? 'Spectacular Trial TN-2' : '恢弘试炼 TN-2'),
      ).toBeVisible()
      await expect(
        page.getByText(language === 'en' ? 'No record' : '暂无记录', { exact: true }),
      ).toBeVisible()
      await expect(page.locator('.record-edition')).toHaveText(['#10', '#02', '#01'])
      expect(
        await page
          .locator('.record-edition')
          .first()
          .evaluate((el) => getComputedStyle(el).color),
      ).toBe(theme === 'dark' ? 'rgb(48, 21, 33)' : 'rgb(255, 255, 255)')
      const trialLayout = await page
        .locator('.trial-record')
        .first()
        .evaluate((el) => {
          const title = el.querySelector('h4')!.getBoundingClientRect()
          const edition = el.querySelector('.record-edition')!.getBoundingClientRect()
          const progress = el.querySelector('.record-progress')!.getBoundingClientRect()
          return {
            titleRight: title.right,
            titleTop: title.top,
            titleBottom: title.bottom,
            editionLeft: edition.left,
            editionTop: edition.top,
            progressTop: progress.top,
            leftDifference: Math.abs(title.left - progress.left),
          }
        })
      expect(trialLayout.editionLeft).toBeGreaterThan(trialLayout.titleRight)
      expect(trialLayout.editionTop).toBeLessThan(trialLayout.titleBottom)
      expect(trialLayout.progressTop).toBeGreaterThanOrEqual(trialLayout.titleBottom)
      expect(trialLayout.leftDifference).toBeLessThan(1)
      const rogue = page
        .locator('.facility-group')
        .filter({ has: page.getByText('Synthetic rogue season', { exact: true }) })
      await expect(rogue.locator('.section-title')).toHaveText(
        language === 'en' ? 'Integrated Strategies' : '集成战略',
      )
      await expect(rogue.locator('.record-row')).toHaveCount(2)
      await expect(
        rogue.locator('.record-row').first().locator('.record-measure strong'),
      ).toHaveText(['0', '42'])
      await expect(
        rogue.locator('.record-row').nth(1).locator('.record-measure strong'),
      ).toHaveText(['—', '0'])
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
        .locator('.record-list')
        .nth(1)
        .screenshot({
          path: test.info().outputPath(`trials-${theme}.png`),
          style: '.site-header, .site-header * { visibility: hidden !important; }',
        })
      if (isMobile) await page.setViewportSize({ width: 320, height: 850 })
      const long = page.locator('.record-row').filter({ hasText: 'Long activity title' })
      await long.scrollIntoViewIfNeeded()
      await expect(long.locator('h4')).toContainText('without truncation')
      await expect(long.locator('.complete')).toBeVisible()
      await expect(long.locator('img')).toHaveAttribute('src', /ak-logoRecord/)
      expect(
        await long.evaluate((el) => {
          const title = el.querySelector('h4')!.getBoundingClientRect()
          const row = el.getBoundingClientRect()
          return (
            title.right <= row.right &&
            title.bottom <= row.bottom &&
            el.scrollWidth <= el.clientWidth
          )
        }),
      ).toBe(true)
      await page
        .locator('.record-list')
        .first()
        .screenshot({
          path: test.info().outputPath(`banner-${theme}.png`),
          style: '.site-header, .site-header * { visibility: hidden !important; }',
        })
      await page
        .locator('.facility-section')
        .screenshot({ path: test.info().outputPath(`records-${theme}.png`) })
    })
  }
}
