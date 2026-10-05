import { test, expect, reply, user, role, overview } from './fixtures'
// @ts-expect-error Synthetic fixture also used by Node contract tests.
import { warEchoesFixture } from '../fixtures/war-echoes.js'
import { readFileSync } from 'node:fs'
for (const theme of ['light', 'dark'])
  for (const language of ['zh-CN', 'en']) {
    test(`War Echoes complete records ${theme} ${language}`, async ({ page, isMobile }) => {
      await page.clock.install({ time: new Date('2026-10-05T00:00:00Z') })
      await page.addInitScript(
        ({ theme, language }) => {
          localStorage.setItem('eason-theme', theme)
          localStorage.setItem('eason-locale', language)
        },
        { theme, language },
      )
      const account = { ...role(), appCode: 'endfield', gameId: '2' }
      let data = { ...overview(), account, warEchoes: warEchoesFixture(), sections: [] }
      await page.route('**/api/user/current', (r) => reply(r, user))
      await page.route('**/api/game/hypergryph/account/games', (r) => reply(r, [account]))
      await page.route('**/api/game/hypergryph/account/overview?*', (r) => reply(r, data))
      await page.route('https://web.hycdn.cn/test-war-cover.png', (r) =>
        r.fulfill({
          contentType: 'image/png',
          body: readFileSync('src/assets/skland/ef-domain_1.png'),
        }),
      )
      await page.route('https://web.hycdn.cn/test-war-crew.png', (r) => r.abort())
      await page.goto('/game/hypergryph/skland')
      const group = page.locator('[data-section="endfieldWarEchoes"]')
      await group.locator(':scope > summary').click()
      const more = group.locator('.war-echoes > .reveal-button')
      await expect(more).toHaveAttribute('aria-expanded', 'false')
      await expect(group.locator('.week-tabs')).not.toBeVisible()
      await expect(group.locator('.war-details')).toHaveAttribute('inert')
      await more.focus()
      await page.keyboard.press('Enter')
      await expect(group.locator('.week-tabs')).toBeVisible()
      await expect(page.locator('[data-section="endfieldWarEchoesWeeks"]')).toHaveCount(0)
      await expect(group.locator('.overview-select')).toContainText('Current season')
      await expect(group.locator('.war-echoes > .overview-select')).toHaveCount(0)
      await expect(group.locator('.season-banner .overview-select')).toHaveCount(1)
      await group
        .getByRole('combobox', { name: language === 'en' ? 'Season' : '赛季', exact: true })
        .focus()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('listbox')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('listbox')).not.toBeVisible()
      await expect(group.getByRole('button', { name: 'Rotation II', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await expect(group.locator('.stage')).toHaveCount(3)
      await expect(group.locator('.challenge')).toHaveCount(9)
      await expect(group.locator('.stage-navigation button')).toHaveCount(3)
      await expect(group.locator('.challenge.is-cruel')).toHaveCount(3)
      const backgrounds = await group
        .locator('.stage')
        .first()
        .locator('.challenge')
        .evaluateAll((cards) =>
          cards.map((card) => ({
            base: getComputedStyle(card, '::before').backgroundImage,
            overlay: getComputedStyle(card, '::after').backgroundImage,
          })),
        )
      expect(
        backgrounds.every(
          ({ base }) => base.includes('ef-war-record-bg') && base.includes('ef-record-left-bg'),
        ),
      ).toBe(true)
      expect(backgrounds.slice(0, 2).every(({ overlay }) => overlay === 'none')).toBe(true)
      expect(backgrounds[2]?.overlay).toContain('ef-war-cruel-bg')
      if (language === 'zh-CN') {
        await group
          .locator('.stage')
          .first()
          .screenshot({
            path: test.info().outputPath(`war-backgrounds-${theme}.png`),
            animations: 'disabled',
          })
      }
      await group.locator('.stage-navigation button').nth(1).focus()
      await page.keyboard.press('Enter')
      await expect(group.locator('.stage-navigation button').nth(1)).toHaveAttribute(
        'aria-current',
        'location',
      )
      await expect(group.locator('.challenge .record-bonus')).toHaveCount(0)

      await expect(group.locator('.record-team li')).toHaveCount(36)
      await expect(group.locator('.member-portrait')).toHaveCount(12)
      await expect(group.locator('.empty-slot-icon')).toHaveCount(24)
      await expect(group.locator('.record-team').first()).toContainText('35')
      await expect(group.locator('.record-time').first()).toHaveText('02:05')
      await expect(group.locator('.operator-initial').first()).toBeVisible()
      await group.locator('.challenge').first().locator('.record-actions button').first().click()
      await expect(group.locator('.enemies').first()).toContainText('Enemy ability')
      await group.locator('.challenge').first().locator('.record-actions button').last().click()
      await expect(group.locator('.record-detail').first()).toContainText('Additional target')
      await expect(group.locator('.record-detail').first()).toContainText(
        language === 'en' ? 'Additional challenge' : '额外挑战',
      )
      await expect(group.locator('.record-detail').first()).toContainText(
        language === 'en' ? 'First clear' : '首次通关',
      )
      await group.locator('.member-portrait').first().click()
      await expect(group.locator('.team-details').first()).toContainText('Record operator')
      await expect(
        group.locator('.team-details li').first().locator('.operator-facts > span'),
      ).toHaveText(
        language === 'en'
          ? ['Level 35', 'Phase 2', '6-star', 'Potential 0', 'Heat']
          : ['等级 35', '突破 2', '6 星', '潜能 0', 'Heat'],
      )
      await expect(group.locator('.member-potential img').first()).toHaveAttribute(
        'src',
        /ef-char-potential-0/,
      )
      await group.locator('.honors summary').click()
      await expect(group.locator('.honor-count').first()).toContainText('1')
      await expect(group.locator('.honor-count').nth(1)).toContainText('1')
      await expect(group.locator('.honor-list')).not.toContainText('Secret honor')
      await group.getByRole('button', { name: 'Rotation I', exact: true }).click()
      await expect(group.getByRole('button', { name: 'Rotation I', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await page
        .getByRole('button', {
          name: language === 'en' ? 'Refresh character data' : '刷新角色资料',
          exact: true,
        })
        .click()
      await expect(group.getByRole('button', { name: 'Rotation I', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await group.locator('.el-select__wrapper').click()
      await page.getByRole('option', { name: 'Historical season', exact: true }).click()
      await expect(group.locator('.stage')).toHaveCount(0)
      await expect(group).toContainText('Historical season')
      await group.locator('.el-select__wrapper').click()
      await page.getByRole('option', { name: 'Current season', exact: true }).click()
      for (const width of isMobile ? [390, 320] : [1280]) {
        await page.setViewportSize({ width, height: 900 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        )
        expect(
          await group
            .locator('.stage')
            .evaluateAll((els) => els.every((e) => e.scrollWidth <= e.clientWidth + 1)),
        ).toBe(true)
        expect(
          await group
            .locator('.stage-navigation button')
            .evaluateAll((els) => els.every((e) => e.scrollWidth <= e.clientWidth + 1)),
        ).toBe(true)
        await group.scrollIntoViewIfNeeded()
        await page.screenshot({ path: test.info().outputPath(`war-${width}.png`), fullPage: true })
      }
      const selection = await group.locator('.week-tabs [aria-pressed="true"]').textContent()
      await more.click()
      await expect(more).toHaveAttribute('aria-expanded', 'false')
      await expect(group.locator('.stage-navigation')).not.toBeVisible()
      await expect(group.locator('.season-banner')).toBeVisible()
      await more.click()
      await expect(group.locator('.week-tabs [aria-pressed="true"]')).toHaveText(selection!)
      await expect
        .poll(() =>
          group.locator('.war-details').evaluate((el) => {
            const last = el.querySelector('.stage:last-child')!
            return (
              last.getBoundingClientRect().bottom <=
              el.parentElement!.getBoundingClientRect().bottom + 1
            )
          }),
        )
        .toBe(true)
    })
  }

test('War Echoes partial details keep known zeros distinct from unavailable records', async ({
  page,
}) => {
  const account = { ...role(), appCode: 'endfield', gameId: '2' }
  const war = warEchoesFixture()
  war.detailAvailable = false
  war.honors = null
  war.seasons = [war.seasons[0]]
  for (const week of war.seasons[0].weeks) {
    week.rating = null
    week.stars = 0
    week.stages = [
      { id: 'partial', name: 'Partial stage', stars: 0, plusTask: null, difficulties: null },
    ]
  }
  await page.route('**/api/user/current', (r) => reply(r, user))
  await page.route('**/api/game/hypergryph/account/games', (r) => reply(r, [account]))
  await page.route('**/api/game/hypergryph/account/overview?*', (r) =>
    reply(r, { ...overview(), account, warEchoes: war }),
  )
  await page.route('https://web.hycdn.cn/test-war-cover.png', (r) => r.abort())
  await page.goto('/game/hypergryph/skland')
  const group = page.locator('[data-section="endfieldWarEchoes"]')
  await group.locator(':scope > summary').click()
  await group.locator('.war-echoes > .reveal-button').click()
  await expect(group.locator('.war-echoes > .muted')).toBeVisible()
  await expect(group.locator('.honor-count').first()).toContainText('—')
  await expect(group.locator('.stage-score')).toContainText('0 / 3')
  await expect(group.locator('.challenge')).toHaveCount(0)
  await expect(group.locator('.season-banner')).toContainText('Current season')
})
