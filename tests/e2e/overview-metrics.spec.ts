import { test, expect, reply, user, role, overview } from './fixtures'

for (const theme of ['light', 'dark']) {
  for (const language of ['zh-CN', 'en']) {
    test(`compact daily and base metrics in ${theme} / ${language}`, async ({ page, isMobile }) => {
      await page.addInitScript(
        ({ theme, language }) => {
          localStorage.setItem('eason-theme', theme)
          localStorage.setItem('eason-locale', language)
        },
        { theme, language },
      )
      await page.route('**/api/user/current', (route) => reply(route, user))
      await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
      await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
        reply(route, {
          ...overview(),
          sections: [
            {
              key: 'arknightsTraining',
              items: [
                {
                  id: 'training',
                  name: '测试训练干员',
                  level: 3,
                  status: 'idle',
                  current: null,
                  total: null,
                  completeAt: null,
                },
              ],
            },
            {
              key: 'arknightsOffice',
              items: [
                {
                  id: 'office',
                  name: null,
                  nameKey: 'recruitRefresh',
                  level: 3,
                  status: 'complete',
                  current: 0,
                  total: 3,
                  completeAt: 1790999999,
                },
              ],
            },
            {
              key: 'arknightsRecruitment',
              items: Array.from({ length: 4 }, (_, index) => ({
                id: `slot-${index}`,
                name: null,
                level: null,
                status: 'complete',
                current: null,
                total: null,
                completeAt: null,
              })),
            },
            {
              key: 'arknightsClues',
              items: [
                {
                  id: 'board',
                  name: null,
                  nameKey: 'clueBoard',
                  current: 0,
                  total: 7,
                  level: null,
                  completeAt: null,
                  status: 'idle',
                },
              ],
            },
          ],
          metrics: [
            { key: 'operators', group: 'collection', current: 0, total: null },
            { key: 'skins', group: 'collection', current: null, total: 500 },
            { key: 'furniture', group: 'collection', current: 1234, total: null },
            { key: 'medals', group: 'collection', current: 0, total: 0 },
            { key: 'towerHigher', group: 'daily', current: 0, total: 24 },
            { key: 'towerLower', group: 'daily', current: 0, total: 60 },
            { key: 'recruitRefresh', group: 'base', current: 0, total: null },
            { key: 'stamina', group: 'daily', current: 240, total: 135 },
            { key: 'daily', group: 'daily', current: 0, total: 100 },
            { key: 'weekly', group: 'daily', current: null, total: 500 },
            { key: 'orundum', group: 'daily', current: 1800, total: 1800 },
            { key: 'drones', group: 'base', current: 24, total: 235, recoveryAt: 1791003600 },
            { key: 'restedOperators', group: 'base', current: 11, total: 20 },
            { key: 'tradingOrders', group: 'base', current: 4, total: 22 },
            { key: 'manufacturing', group: 'base', current: 4, total: 74 },
            { key: 'tiredOperators', group: 'base', current: 0, total: null },
          ],
        }),
      )
      await page.goto('/game/hypergryph/skland')
      const collection = page.locator('.collection-facts')
      await collection.scrollIntoViewIfNeeded()
      await expect(collection.locator('.collection-icon img')).toHaveCount(4)
      for (const icon of await collection.locator('.collection-icon').all()) {
        await expect(icon).toHaveCSS('width', '18px')
        await expect(icon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
        await expect
          .poll(() => icon.locator('img').evaluate((el) => (el as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(0)
        await expect(icon.locator('img')).toHaveCSS(
          'filter',
          theme === 'dark' ? 'none' : 'invert(1)',
        )
      }
      await expect(collection.locator('dd')).toHaveText(['0', '— / 500', '1,234', '0 / 0'])
      await expect(page.locator('.metric-grid.collection')).toHaveCount(0)
      for (const icon of await page.locator('.facility-group summary .section-art').all()) {
        await expect(icon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      }
      const daily = page.locator('.metric-grid.daily')
      const base = page.locator('.metric-grid.base')
      for (const grid of [daily, base]) {
        const toggle = grid
          .locator('xpath=ancestor::section[1]')
          .getByRole('button', { name: language === 'en' ? 'Expand' : '展开', exact: true })
        if (await toggle.isVisible()) await toggle.click()
      }
      await expect(daily.locator('.metric')).toHaveCount(9)
      await expect(base.locator('.metric')).toHaveCount(6)
      await expect(base.locator('h4')).toHaveText(
        language === 'en'
          ? [
              'Drones',
              'Rest progress',
              'Order progress',
              'Manufacturing progress',
              'Operator fatigue',
              'Clue collection',
            ]
          : ['无人机', '休息进度', '订单进度', '制造进度', '干员疲劳', '线索收集'],
      )
      await expect(base.locator('.metric-value strong')).toHaveText([
        '24',
        '11',
        '4',
        '4',
        '0',
        '0',
      ])
      await expect(base.locator('.metric').last().locator('.metric-value')).toHaveText('0 / 7')
      await expect(base.locator('.metric').last().locator('img')).toHaveAttribute(
        'src',
        /ak-icon-meeting/,
      )
      await expect(daily.locator('h4')).toHaveText(
        language === 'en'
          ? [
              'Sanity',
              'Training room',
              'Recruitment',
              'Recruitment refresh',
              'Annihilation Orundum',
              'Daily missions',
              'Weekly missions',
              'Data Supplement Devices',
              'Data Supplement Sticks',
            ]
          : [
              '理智',
              '训练室',
              '公开招募',
              '公招刷新',
              '每周报酬合成玉',
              '每日任务',
              '每周任务',
              '数据增补仪',
              '数据增补条',
            ],
      )
      await expect(daily.locator('.metric-value strong')).toHaveText([
        '240',
        '测试训练干员',
        '4',
        language === 'en' ? 'Available' : '可刷新',
        '1800',
        '0',
        '—',
        '0',
        '0',
      ])
      await expect(daily.locator('[data-metric="orundum"] .metric-value')).toHaveText('1800 / 1800')
      await expect(daily.locator('[data-metric="training"] .metric-note')).toHaveText(
        language === 'en' ? 'Equipment idle' : '设备空闲中',
      )
      await expect(daily.locator('[data-metric="recruitRefresh"] .metric-note')).toHaveText(
        language === 'en' ? 'Recruitment tags can be refreshed' : '可进行公开招募标签刷新',
      )
      await expect(daily.locator('[data-metric="towerHigher"] .metric-note')).toContainText(
        language === 'en' ? 'Resets in' : '后刷新',
      )
      for (const card of await daily.locator('.metric').all()) {
        await expect(card.locator('img')).toHaveCount(1)
      }
      await expect(daily.locator('.meter')).toHaveCount(0)
      await expect(base.locator('.meter')).toHaveCount(0)
      await expect(base.locator('.metric-note')).toContainText('2026')
      for (const width of isMobile ? [320, 390] : [768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        expect(
          await collection.evaluate((el) => {
            const box = el.getBoundingClientRect()
            const profile = el.previousElementSibling!.getBoundingClientRect()
            const daily = document.querySelector('.metric-section')!.getBoundingClientRect()
            return (
              profile.bottom <= box.top &&
              box.bottom <= daily.top &&
              el.scrollWidth <= el.clientWidth
            )
          }),
        ).toBe(true)
        for (const grid of [daily, base]) {
          const toggle = grid
            .locator('xpath=ancestor::section[1]')
            .getByRole('button', { name: language === 'en' ? 'Expand' : '展开', exact: true })
          if (await toggle.isVisible()) await toggle.click()
          const geometry = await grid.evaluate((el) => {
            const cards = [...el.querySelectorAll('.metric')]
            return {
              columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
              watermarks: cards.every((card) => {
                const icon = card.querySelector('.metric-heading > .overview-artwork')!
                const style = getComputedStyle(icon)
                const iconBox = icon.getBoundingClientRect()
                const box = card.getBoundingClientRect()
                return (
                  style.position === 'absolute' &&
                  style.backgroundColor === 'rgba(0, 0, 0, 0)' &&
                  Number(style.opacity) < 0.3 &&
                  box.right - iconBox.right <= 10 &&
                  iconBox.left >= box.left
                )
              }),
              fits: cards.every((card) => {
                const box = card.getBoundingClientRect()
                return (
                  card.scrollWidth <= card.clientWidth &&
                  [...card.querySelectorAll('h4, .metric-value, .metric-note')].every((child) => {
                    const text = child.getBoundingClientRect()
                    return (
                      text.left >= box.left &&
                      text.right <= box.right + 1 &&
                      text.bottom <= box.bottom
                    )
                  })
                )
              }),
            }
          })
          expect(geometry.columns).toBeGreaterThanOrEqual(isMobile ? 2 : 3)
          expect(geometry.fits).toBe(true)
          expect(geometry.watermarks).toBe(true)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        )
        for (const card of await page.locator('.recruitment-grid li').all()) {
          const icon = card.locator('.facility-art')
          await expect(icon).toHaveCSS('position', 'absolute')
          await expect(icon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
          expect((await card.boundingBox())!.height).toBeLessThan(100)
          expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
        }
        const paired = page.locator('.paired-facility')
        await expect(paired).toHaveCount(1)
        await expect(paired.locator('summary')).toHaveCount(1)
        const headingIcons = paired.locator('summary .section-art')
        await expect(headingIcons).toHaveCount(2)
        await expect(paired.locator('.paired-facility-label')).toHaveText(
          language === 'en' ? ['Office', 'Training room'] : ['办公室', '训练室'],
        )
        await expect(headingIcons.nth(0).locator('img')).toHaveAttribute('src', /ak-icon-hire/)
        await expect(headingIcons.nth(1).locator('img')).toHaveAttribute('src', /ak-icon-training/)
        for (const icon of await headingIcons.all()) {
          await expect(icon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
        }
        const boxes = await paired.locator('li').evaluateAll((groups) =>
          groups.map((group) => {
            const box = group.getBoundingClientRect()
            return {
              top: box.top,
              left: box.left,
              right: box.right,
              fits: group.scrollWidth <= group.clientWidth,
            }
          }),
        )
        expect(Math.abs(boxes[0]!.top - boxes[1]!.top)).toBeLessThan(1)
        expect(boxes[0]!.right).toBeLessThanOrEqual(boxes[1]!.left)
        expect(boxes.every((box) => box.fits)).toBe(true)
        for (const group of await paired.all()) {
          await expect(group.locator('.facility-grid li')).toHaveCount(2)
          await expect(group.locator('header span')).toHaveText(
            language === 'en' ? ['Level 3', 'Level 3'] : ['等级 3', '等级 3'],
          )
          expect(
            await group
              .locator('li')
              .evaluateAll((cards) => cards.every((el) => el.scrollWidth <= el.clientWidth)),
          ).toBe(true)
        }
        await paired.locator('summary').click()
        await expect(paired.locator('li:visible')).toHaveCount(0)
        await paired.locator('summary').click()
        await expect(paired.locator('li:visible')).toHaveCount(2)
        for (const grid of [daily, base]) {
          const heights = await grid
            .locator('.metric:visible')
            .evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().height))
          expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1)
          const noteOffsets = await grid
            .locator('.metric:visible .metric-note')
            .evaluateAll((notes) =>
              notes.map(
                (note) =>
                  note.parentElement!.getBoundingClientRect().bottom -
                  note.getBoundingClientRect().bottom,
              ),
            )
          expect(Math.max(...noteOffsets) - Math.min(...noteOffsets)).toBeLessThan(1)
        }
        await expect(base.locator('.metric:visible')).toHaveCount(6)
        await expect(base.locator('xpath=ancestor::section[1]').getByRole('button')).toHaveCount(0)
        await expect(base.locator('[data-metric="drones"] .metric-note')).toBeVisible()
      }
      for (const [name, grid] of [
        ['collection', collection],
        ['daily', daily],
        ['base', base],
        ['recruitment', page.locator('.recruitment-grid')],
        ['facilities', page.locator('.facility-section')],
      ] as const) {
        await grid.scrollIntoViewIfNeeded()
        await grid.screenshot({ path: test.info().outputPath(`${name}-${theme}.png`) })
      }
    })
  }
}

test('daily countdowns advance locally across reset and completion without polling', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-05T03:59:00+08:00') })
  const now = Date.parse('2026-10-05T03:59:00+08:00') / 1000
  let requests = 0
  await page.route('**/api/user/current', (route) => reply(route, user))
  await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
  const timed = (id: string) => ({
    id,
    name: id === 'training' ? '测试干员' : null,
    level: null,
    status: 'working',
    current: 0,
    total: null,
    completeAt: now + 60,
  })
  await page.route('**/api/game/hypergryph/account/overview?*', (route) => {
    requests++
    return reply(route, {
      ...overview(),
      calculatedAt: now,
      metrics: [
        { key: 'daily', group: 'daily', current: 10, total: 10 },
        { key: 'weekly', group: 'daily', current: 13, total: 13 },
        {
          key: 'stamina',
          group: 'daily',
          current: 99,
          total: 100,
          recoveryAt: now + 60,
          recovery: { value: 99, at: now - 300, intervalSeconds: 360 },
        },
      ],
      sections: [
        { key: 'arknightsTraining', items: [timed('training')] },
        { key: 'arknightsOffice', items: [timed('office')] },
        { key: 'arknightsRecruitment', items: [timed('slot')] },
      ],
    })
  })
  await page.goto('/game/hypergryph/skland')
  const card = (key: string) => page.locator(`.metric-grid.daily [data-metric="${key}"]`)
  const expand = page
    .locator('.metric-section')
    .first()
    .getByRole('button', { name: '展开', exact: true })
  if (await expand.isVisible()) await expand.click()
  await expect(card('daily').locator('.metric-note')).toHaveText('1分钟后刷新')
  await expect(card('stamina').locator('.metric-note')).toHaveText('1分钟后全部恢复')
  await expect(card('recruitRefresh').locator('.metric-value')).toHaveText('联络中')
  await page.clock.fastForward(61000)
  await expect(card('daily').locator('.metric-value')).toHaveText('0 / 10')
  await expect(card('weekly').locator('.metric-value')).toHaveText('0 / 13')
  await expect(card('training').locator('.metric-note')).toHaveText('干员已完成专精')
  await expect(card('recruitAvailable').locator('.metric-note')).toHaveText('招募已全部完成')
  await expect(card('recruitRefresh').locator('.metric-value')).toHaveText('可刷新')
  await expect(card('stamina').locator('.metric-note')).toHaveText('理智已全部恢复')
  expect(requests).toBe(1)
})

test('daily cards collapse to two rows while base stays visible, and role switching resets', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.route('**/api/user/current', (route) => reply(route, user))
  await page.route('**/api/game/hypergryph/account/games', (route) =>
    reply(route, [role('first'), role('second')]),
  )
  await page.route('**/api/game/hypergryph/account/overview?*', (route) => {
    const uid = new URL(route.request().url()).searchParams.get('uid')!
    return reply(route, {
      ...overview(uid),
      metrics: [
        ...overview(uid).metrics,
        ...['drones', 'restedOperators', 'tradingOrders', 'manufacturing', 'tiredOperators'].map(
          (key) => ({ key, group: 'base', current: 0, total: null }),
        ),
      ],
    })
  })
  await page.goto('/game/hypergryph/skland')
  const daily = page.locator('.metric-grid.daily')
  const base = page.locator('.metric-grid.base')
  const section = daily.locator('xpath=ancestor::section[1]')
  await expect(daily.locator('.metric:visible')).toHaveCount(4)
  await expect(section.getByRole('button', { name: '展开', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(base.locator('.metric:visible')).toHaveCount(6)
  await expect(base.locator('xpath=ancestor::section[1]').getByRole('button')).toHaveCount(0)
  const expandButton = section.getByRole('button', { name: '展开', exact: true })
  await expect(expandButton).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expandButton.hover()
  await expect(expandButton).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(expandButton).toHaveCSS('user-select', 'none')
  await expandButton.click()
  await expect(section.getByRole('button', { name: '收起', exact: true })).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  )
  await expect(daily.locator('.metric:visible')).toHaveCount(9)
  await expect(base.locator('.metric:visible')).toHaveCount(6)
  await section.getByRole('button', { name: '收起', exact: true }).click()
  await expect(daily.locator('.metric:visible')).toHaveCount(4)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(daily.locator('.metric:visible')).toHaveCount(9)
  await expect(section.getByRole('button')).toHaveCount(0)
  await page.setViewportSize({ width: 768, height: 900 })
  await expect
    .poll(async () => {
      const columns = await daily.evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
      )
      return (await daily.locator('.metric:visible').count()) === Math.min(9, columns * 2)
    })
    .toBe(true)
  await page.setViewportSize({ width: 390, height: 900 })
  await section.getByRole('button', { name: '展开', exact: true }).click()
  await page.getByRole('button', { name: /second/ }).click()
  await expect(daily.locator('.metric:visible')).toHaveCount(4)
})
