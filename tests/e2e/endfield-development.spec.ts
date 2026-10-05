import { test, expect, reply, user, role, overview } from './fixtures'
// @ts-expect-error Shared synthetic fixtures.
import { developmentFixture, monolithFixture } from '../fixtures/endfield-development.js'
import { readFileSync } from 'node:fs'
for (const theme of ['light', 'dark'])
  for (const language of ['zh-CN', 'en']) {
    test(`development and monolith ${theme} ${language}`, async ({ page, isMobile }) => {
      await page.addInitScript(
        ({ theme, language }) => {
          localStorage.setItem('eason-theme', theme)
          localStorage.setItem('eason-locale', language)
        },
        { theme, language },
      )
      const a = { ...role('first'), appCode: 'endfield', gameId: '2' },
        b = { ...a, uid: 'second', nickName: 'second' }
      const data = {
        ...overview(),
        account: a,
        regionalDevelopment: developmentFixture(),
        monolith: monolithFixture(),
      }
      await page.route('**/api/user/current', (r) => reply(r, user))
      await page.route('**/api/game/hypergryph/account/games', (r) => reply(r, [a, b]))
      await page.route('**/api/game/hypergryph/account/overview?*', (r) =>
        reply(r, { ...data, account: r.request().url().includes('uid=second') ? b : a }),
      )
      await page.route('https://web.hycdn.cn/synthetic-cover.png', (r) =>
        r.fulfill({
          contentType: 'image/png',
          body: readFileSync('src/assets/skland/ef-domain_1.png'),
        }),
      )
      await page.route('https://web.hycdn.cn/synthetic-missing.png', (r) => r.abort())
      await page.goto('/game/hypergryph/skland')
      const dev = page.locator('[data-section="endfieldDomains"]'),
        mono = page.locator('[data-section="endfieldMonolith"]')
      await expect(dev).not.toHaveAttribute('open')
      await dev.locator(':scope > summary').click()
      await expect(dev.locator('.region-card')).toHaveCount(2)
      await expect(page.locator('[data-section="endfieldSettlements"]')).toHaveCount(0)
      await dev.locator('.reveal-button').first().click()
      await expect(dev.locator('.reveal-button').last()).toHaveAttribute('aria-expanded', 'false')
      await expect(dev.locator('.region-card').first().locator('.officer').first()).toBeVisible()
      await expect(
        dev.locator('.region-card').last().locator('.settlement-facts').first(),
      ).not.toBeVisible()
      await dev.locator('.reveal-button').last().click()
      await expect(dev.locator('.settlement')).toHaveCount(4)
      await expect(dev.locator('.settlement').nth(0)).toContainText('MAX')
      await expect(
        dev.locator('.settlement').nth(1).locator('.settlement-facts'),
      ).not.toContainText('MAX')
      await expect(dev.locator('.settlement').nth(1)).toContainText('1,800,000 / 1,800,000')
      await expect(dev.locator('.settlement').nth(2)).toHaveAttribute('data-locked', 'true')
      await expect(dev.locator('.settlement').nth(3)).toHaveAttribute('data-locked', 'false')
      await expect(dev.locator('.officer').first()).toContainText('Assigned Archive')
      await expect(dev.locator('.operator-initial').first()).toBeVisible()
      await mono.locator(':scope > summary').click()
      await expect(mono.locator('.monolith-theme').first()).toContainText('Current synthetic theme')
      await expect(mono.locator('.monolith-theme')).toHaveCount(1)
      const defaultMedalLabel = language === 'en' ? 'Engraved medal' : '蚀刻章'
      await expect(mono.locator('.medal summary')).toHaveText(defaultMedalLabel)
      await mono.locator('.reveal-button').click()
      await expect(mono.locator('.monolith-theme')).toHaveCount(1)
      await expect(mono.locator('.overview-select')).toContainText('Current synthetic theme')
      await expect(mono.locator(':scope > .monolith > .overview-select')).toHaveCount(0)
      await expect(mono.locator('.monolith-theme .overview-select')).toHaveCount(1)
      await expect(mono.locator('.member-portrait')).toHaveCount(0)
      await expect(mono.locator('.empty-slot')).toHaveCount(4)
      await mono.locator('.el-select__wrapper').click()
      await expect(
        page.getByRole('option', { name: 'Current synthetic theme', exact: true }),
      ).toHaveAttribute('aria-selected', 'true')
      await mono.getByRole('combobox').press('Escape')
      await expect(page.getByRole('listbox')).not.toBeVisible()
      await mono.locator('.el-select__wrapper').click()
      await page.getByRole('option', { name: 'Historical complete theme', exact: true }).click()
      await expect(mono.locator('.monolith-theme')).toHaveCount(1)
      await expect(mono.locator('.monolith-theme')).toContainText('Historical complete theme')
      await expect(mono.locator('.progress-segment')).toHaveAttribute('data-state', 'hard')
      await expect(mono.locator('.monolith-theme')).not.toContainText('Current synthetic theme')
      await mono.locator('.reveal-button').click()
      await expect(mono.locator('.monolith-theme')).toBeVisible()
      await expect(mono.locator('.record-team')).not.toBeVisible()
      await expect(mono.locator('.monolith-theme')).toContainText('Historical complete theme')
      await mono.locator('.reveal-button').click()
      await expect(mono.locator('.monolith-theme')).toHaveCount(1)
      await mono.locator('.difficulty-tabs button[data-mode=hard]').click()
      await expect(mono.locator('.record-time')).toHaveText('02:04')
      await expect(mono.locator('.monolith-stage').first()).toHaveClass(/is-hard/)
      await expect(mono.locator('.hard-mode-icon')).toBeVisible()
      await expect(mono.locator('.member-portrait').first()).toHaveAccessibleName(
        /Historical Operator/,
      )
      await expect(mono.locator('.member-element img').first()).toHaveAttribute(
        'src',
        /ef-char-element-fire/,
      )
      await expect(mono.locator('.member-phase')).toHaveCount(0)
      await expect(mono.locator('.member-portrait').first()).toHaveCSS(
        'border-bottom-color',
        'rgb(255, 113, 0)',
      )
      await expect(mono.locator('.member-potential img').first()).toHaveAttribute(
        'src',
        /ef-char-potential-0/,
      )
      await mono.locator('.member-portrait').first().click()
      await expect(mono.locator('.team-details')).toContainText('Historical Operator')
      await expect(mono.locator('.record-team')).toContainText('30')
      await expect(mono.locator('.monolith-theme .medal')).toContainText(
        language === 'en' ? 'Trimmed' : '已镀层',
      )
      await mono.locator('.medal summary').click()
      await expect(mono.locator('.medal-details')).toBeVisible()
      await expect(mono.locator('.medal-details')).toContainText('Synthetic medal')
      await mono.locator('.record-actions button').first().click()
      await expect(mono.locator('.enemies')).toContainText('Enemy ability')
      await mono.locator('.record-actions button').last().click()
      await expect(mono.locator('.record-detail')).toContainText('Mechanism details')
      await expect(mono.locator('.record-detail')).not.toContainText('<@ba.info>')
      await dev.locator('.reveal-button').first().click()
      await page
        .getByRole('button', {
          name: language === 'en' ? 'Refresh character data' : '刷新角色资料',
          exact: true,
        })
        .click()
      await expect(mono.locator('.overview-select')).toContainText('Historical complete theme')
      await expect(mono.locator('.difficulty-tabs button[data-mode=hard]')).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await expect(dev.locator('.reveal-button').last()).toHaveAttribute('aria-expanded', 'true')
      await expect(dev.locator('.reveal-button').first()).toHaveAttribute('aria-expanded', 'false')
      for (const width of isMobile ? [390, 320] : [1280]) {
        await page.setViewportSize({ width, height: 1000 })
        await expect
          .poll(() =>
            page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          )
          .toBe(true)
        await mono.locator('.el-select__wrapper').click()
        const menu = page.locator('.overview-select-menu.el-popper:visible')
        await expect(menu).toBeVisible()
        const bounds = await menu.boundingBox()
        if (!bounds) throw new Error('Dropdown has no visible bounds')
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
        await mono.getByRole('combobox').press('Escape')
        await expect
          .poll(() =>
            mono.locator('.monolith-detail').evaluate((el) => {
              const last = el.querySelector('.monolith-stage:last-child')!
              return (
                last.getBoundingClientRect().bottom <=
                el.parentElement!.getBoundingClientRect().bottom + 1
              )
            }),
          )
          .toBe(true)
        await mono.scrollIntoViewIfNeeded()
        await page.screenshot({
          path: `/tmp/endfield-development-${theme}-${language}-${width}.png`,
          fullPage: true,
        })
      }
      await mono.locator('.el-select__wrapper').click()
      await page.getByRole('option', { name: 'Unknown data theme', exact: true }).click()
      await expect(mono.locator('.monolith-stage')).toHaveCount(0)
      await expect(mono.locator('.medal summary')).toHaveText(defaultMedalLabel)
      await expect(mono.locator('.medal summary')).not.toHaveAttribute('title')
      await expect(mono.locator('.monolith-theme .medal')).toContainText(
        language === 'en' ? 'unavailable' : '未提供',
      )
      await mono.locator('.el-select__wrapper').click()
      await page.getByRole('option', { name: 'Empty theme', exact: true }).click()
      await expect(mono.locator('.monolith-stage')).toHaveCount(0)
      await page.getByRole('button').filter({ hasText: 'second' }).click()
      for (const button of await dev.locator('.reveal-button').all())
        await expect(button).toHaveAttribute('aria-expanded', 'false')
      await expect(mono.locator('.reveal-button')).toHaveAttribute('aria-expanded', 'false')
      await expect(mono.locator('.overview-select')).toContainText('Current synthetic theme')
      await expect(mono.locator('.difficulty-tabs button[data-mode=normal]')).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await page.getByRole('button').filter({ hasText: 'first' }).click()
      await expect(mono).not.toHaveAttribute('open')
      for (const button of await dev.locator('.reveal-button').all())
        await expect(button).toHaveAttribute('aria-expanded', 'false')
    })
  }

test('missing details and known-empty arrays retain distinct states', async ({ page }) => {
  const account = { ...role(), appCode: 'endfield', gameId: '2' }
  const data = {
    ...overview(),
    account,
    regionalDevelopment: developmentFixture(),
    monolith: monolithFixture(),
  }
  data.monolith.detailAvailable = false
  data.monolith.themes = [data.monolith.themes[0]]
  data.regionalDevelopment.regions[0].settlements = null
  await page.route('**/api/user/current', (r) => reply(r, user))
  await page.route('**/api/game/hypergryph/account/games', (r) => reply(r, [account]))
  await page.route('**/api/game/hypergryph/account/overview?*', (r) => reply(r, data))
  await page.goto('/game/hypergryph/skland')
  const dev = page.locator('[data-section="endfieldDomains"]'),
    mono = page.locator('[data-section="endfieldMonolith"]')
  await expect(dev.locator('.region-card').first()).toContainText('未提供')
  await mono.locator(':scope > summary').click()
  await expect(mono).toContainText('详细记录暂不可用，已保留概览资料。')
  await expect(mono).toContainText('Current synthetic theme')
  data.monolith.themes = []
  data.monolith.detailAvailable = true
  data.regionalDevelopment.regions = []
  await page.getByRole('button', { name: '刷新角色资料', exact: true }).click()
  await expect(dev).toContainText('暂无地区建设记录')
  await expect(mono).toContainText('暂无主题记录')
  await expect(mono.locator('.reveal-button')).toHaveCount(0)
})
