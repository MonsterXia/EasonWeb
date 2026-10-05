import { test, expect, reply, user, role, overview } from './fixtures'
import { readFileSync } from 'node:fs'

const cover = 'https://assets.skland.com/test/endfield-cover.png'
const crewAvatar = 'https://assets.skland.com/test/crew.png'
const broken = 'https://assets.skland.com/test/endfield-broken.png'
const row = (id: string, overrides = {}) => ({
  id,
  name: id,
  level: null,
  status: 'unknown',
  current: 0,
  total: null,
  completeAt: null,
  ...overrides,
})
const exploration = ['Puzzles', 'Chests', 'Pieces', 'Blackboxes', 'EquipChests', 'Trstars']

for (const theme of ['light', 'dark']) {
  for (const language of ['zh-CN', 'en']) {
    test(`Endfield compact details preserve data and image fallback in ${theme} / ${language}`, async ({
      page,
      isMobile,
    }) => {
      await page.addInitScript(
        ({ theme, language }) => {
          localStorage.setItem('eason-theme', theme)
          localStorage.setItem('eason-locale', language)
        },
        { theme, language },
      )
      const account = {
        ...role('endfield-fixture'),
        appCode: 'endfield',
        gameId: '2',
        nickName: 'Endfield UI fixture',
      }
      const data = {
        ...overview(),
        account,
        profile: {
          ...overview().profile,
          level: 60,
          worldLevel: 7,
          mainProgress: 'Fixture mission',
        },
        metrics: [
          { key: 'stamina', group: 'daily', current: 0, total: 240 },
          { key: 'activity', group: 'daily', current: 100, total: 100 },
          { key: 'weekly', group: 'daily', current: null, total: 1000 },
          { key: 'battlePass', group: 'daily', current: 16, total: 60 },
          { key: 'cnsLevel', group: 'base', current: 4, total: 5 },
          { key: 'medalLevel1', group: 'collection', current: 0, total: null },
        ],
        sections: [
          {
            key: 'endfieldSpaceship',
            items: [
              row('control', {
                nameKey: 'endfieldControl',
                level: 4,
                maxLevel: 5,
                current: 3,
                total: 3,
                staff: [
                  { id: 'a', name: 'Alpha', avatarUrl: crewAvatar },
                  { id: 'b', name: 'Beta', avatarUrl: broken },
                  { id: 'unknown', name: null },
                ],
              }),
              row('manufacture', {
                nameKey: 'endfieldManufacture1',
                level: 3,
                maxLevel: 3,
                staff: [],
                current: 0,
                total: 3,
                status: 'working',
                completeAt: 1991000000,
              }),
              row('plant', {
                nameKey: 'endfieldPlant1',
                level: 2,
                maxLevel: 3,
                staff: null,
                current: null,
                total: 3,
              }),
              row('reception', {
                nameKey: 'endfieldReception',
                level: 2,
                current: 2,
                total: 3,
              }),
            ],
          },
          {
            key: 'endfieldDomains',
            items: [
              row('domain_1', {
                name: 'Valley IV',
                level: 4,
                current: 12345,
                total: 20000,
              }),
              row('domain_2', { name: 'Wuling', current: 0 }),
            ],
          },
          {
            key: 'endfieldSettlements',
            items: [
              row('domain_1:settlement', {
                name: 'A settlement with a long unbroken identifier ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                level: 3,
                current: 0,
                total: 10000,
              }),
            ],
          },
          ...exploration.map((kind) => ({
            key: `endfieldExploration${kind}`,
            items: [
              row('domain_1:map01_lv001', {
                name: 'Exploration fixture',
                current: 0,
                total: 12,
              }),
              row('domain_1:unknown', {
                name: 'Zero capacity',
                current: 0,
                total: 0,
              }),
              ...Array.from({ length: 5 }, (_, i) =>
                row(`domain_2:extra-${i}`, {
                  name: `Extra region ${i}`,
                  current: i,
                  total: 20,
                }),
              ),
            ],
          })),
          ...[
            'endfieldWarEchoes',
            'endfieldWarEchoesWeeks',
            'endfieldWarEchoesStages',
            'endfieldMonolith',
          ].map((key) => ({
            key,
            items: [
              row('record', {
                name: 'Record fixture',
                current: key === 'endfieldMonolith' ? 1 : key === 'endfieldWarEchoesStages' ? 3 : 9,
                total: key === 'endfieldMonolith' ? 2 : key === 'endfieldWarEchoesStages' ? 3 : 9,
                rating: key === 'endfieldMonolith' ? null : 'S+',
                artworkUrl: cover,
              }),
              row('broken', {
                name: 'Missing artwork fixture',
                current: null,
                total: null,
                artworkUrl: broken,
              }),
            ],
          })),
        ],
      }
      await page.route(cover, (route) =>
        route.fulfill({
          contentType: 'image/png',
          body: readFileSync('src/assets/skland/ef-domain_1.png'),
        }),
      )
      await page.route(crewAvatar, (route) =>
        route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#7e9ba5"/><text x="24" y="33" text-anchor="middle" font-size="28" fill="white">A</text></svg>',
        }),
      )
      await page.route(broken, (route) => route.abort())
      await page.route('**/api/user/current', (route) => reply(route, user))
      await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [account]))
      await page.route('**/api/game/hypergryph/account/overview?*', (route) => reply(route, data))
      await page.goto('/game/hypergryph/skland')
      await expect(page.getByRole('heading', { name: account.nickName })).toBeVisible()
      const details = page.locator('.facility-group')
      // Exploration merges into one group; Glory Road adds its own group.
      await expect(details).toHaveCount(data.sections.length - exploration.length + 2)
      const explorationGroup = page.locator('[data-section="endfieldExploration"]')
      await expect(explorationGroup).not.toHaveAttribute('open')
      await expect(explorationGroup.getByRole('table')).not.toBeVisible()
      await expect(page.locator('[data-section="endfieldSpaceship"]')).not.toHaveAttribute('open')
      await expect(page.locator('[data-section="endfieldDomains"]')).not.toHaveAttribute('open')
      for (const group of await details.all()) {
        if ((await group.getAttribute('open')) === null) await group.locator('summary').click()
      }
      const ship = page.locator('[data-section="endfieldSpaceship"]')
      const control = ship.locator('.endfield-card').first()
      await expect(control).toContainText('3 / 3')
      await expect(ship.locator('.endfield-card').nth(2)).toContainText('— / 3')
      await expect(page.locator('.metric-grid.base')).toHaveCount(0)
      await expect(ship).toHaveCount(1)
      await expect(control.locator('.facility-level')).toContainText('4 / 5')
      await expect(control.locator('.staff-member')).toHaveCount(3)
      await expect(control.locator('.staff-member').first()).toContainText('Alpha')
      await expect(control.locator('.staff-member').first().locator('img')).toHaveAttribute(
        'src',
        crewAvatar,
      )
      await expect(control.locator('.staff-member').nth(1).locator('.operator-initial')).toHaveText(
        'B',
      )
      await expect(control.locator('.staff-member').nth(2)).toContainText(
        language === 'en' ? 'Unknown operator' : '未知干员',
      )
      await expect(ship.locator('.endfield-card').nth(1)).toContainText('0 / 3')
      await expect(ship.locator('.endfield-card').nth(1)).toContainText(
        language === 'en' ? 'No operators assigned' : '暂无进驻干员',
      )
      await expect(ship.locator('.endfield-card').nth(3)).toContainText(
        language === 'en' ? 'Assigned operator details unavailable' : '未提供进驻干员详情',
      )
      const regions = page.locator('[data-section="endfieldExploration"]')
      await expect(regions).toHaveCount(1)
      await expect(regions.getByRole('row')).toHaveCount(6)
      await expect(regions.getByRole('columnheader')).toHaveCount(7)
      for (const kind of exploration) {
        await expect(
          regions
            .locator('[data-region="domain_1:map01_lv001"]')
            .locator(`[data-measure="endfieldExploration${kind}"]`),
        ).toContainText(/0\s*\/\s*12/)
        await expect(
          regions
            .locator('[data-region="domain_1:unknown"]')
            .locator(`[data-measure="endfieldExploration${kind}"]`),
        ).toHaveText('—')
      }
      const more = regions.getByRole('button')
      const fifthRow = regions.locator('.exploration-row:not([aria-hidden="true"])').nth(4)
      expect((await more.boundingBox())!.y).toBeGreaterThanOrEqual(
        (await fifthRow.boundingBox())!.y + (await fifthRow.boundingBox())!.height,
      )
      await regions.locator('summary').click()
      await expect(regions).not.toHaveAttribute('open')
      await regions.locator('summary').focus()
      await page.keyboard.press('Enter')
      await expect(regions.getByRole('table')).toBeVisible()
      await more.focus()
      await page.keyboard.press('Enter')
      await expect(more).toHaveAttribute('aria-expanded', 'true')
      await expect(regions.getByRole('row')).toHaveCount(8)
      await more.click()
      await expect(more).toHaveAttribute('aria-expanded', 'false')
      await expect(regions.getByRole('row')).toHaveCount(6)
      const records = page.locator('[data-section="endfieldWarEchoes"]')
      await expect(records.locator('li').first()).toContainText('S+')
      const failed = records.locator('li').nth(1)
      await failed.scrollIntoViewIfNeeded()
      await expect(failed.locator('img')).toHaveAttribute('src', /ef-warEchoes/)
      const headingBefore = await failed.locator('header').boundingBox()
      await failed.locator('img').dispatchEvent('error')
      await expect(failed.locator('img')).toHaveCount(0)
      const headingAfter = await failed.locator('header').boundingBox()
      expect(headingAfter!.x).toBeCloseTo(headingBefore!.x, 0)
      expect(headingAfter!.y).toBeCloseTo(headingBefore!.y, 0)
      await expect(failed).toContainText(language === 'en' ? 'Not provided' : '未提供')
      await ship.scrollIntoViewIfNeeded()
      await page.screenshot({
        path: test.info().outputPath('endfield-details.png'),
        fullPage: true,
      })
      // Desktop cabins stay compact; narrow screens may grow to retain full dates and labels.
      if (!isMobile) expect((await control.boundingBox())!.height).toBeLessThan(185)
      expect(
        await control
          .locator('.facility-art')
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe('rgba(0, 0, 0, 0)')
      for (const width of isMobile ? [390, 320] : [1280]) {
        await page.setViewportSize({ width, height: 900 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        )
        const clipped = await details
          .locator('li')
          .evaluateAll(
            (cards) => cards.filter((card) => card.scrollWidth > card.clientWidth + 1).length,
          )
        expect(clipped).toBe(0)
        await ship.evaluate((el) => {
          const navigation = document.querySelector('body > #app header, #app .nav')
          const offset = navigation?.getBoundingClientRect().height ?? 160
          window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - offset - 20)
        })
        await page.screenshot({
          path: test.info().outputPath(`endfield-${width}.png`),
        })
        await regions.scrollIntoViewIfNeeded()
        await page.screenshot({
          path: test.info().outputPath(`exploration-${width}.png`),
        })
        expect(await regions.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
      }
      await ship.locator('summary').click()
      await expect(ship).not.toHaveAttribute('open', '')
      await ship.locator('summary').focus()
      await page.keyboard.press('Enter')
      await expect(ship).toHaveAttribute('open', '')
      await page
        .getByRole('button', {
          name: language === 'en' ? 'Refresh character data' : '刷新角色资料',
        })
        .click()
      await expect(control).toContainText('3 / 3')
      await expect(page.locator('.overview')).not.toContainText('game.overview.')
    })
  }
}
