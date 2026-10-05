import { test, expect, reply, user, role, overview } from './fixtures'

for (const theme of ['light', 'dark']) {
  test(`Endfield archive portrait metadata and disclosure ${theme}`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem('eason-theme', theme), theme)
    const account = { ...role(), appCode: 'endfield', gameId: '2' }
    await page.route('**/api/user/current', (r) => reply(r, user))
    await page.route('**/api/game/hypergryph/account/games', (r) => reply(r, [account]))
    await page.route('**/api/game/hypergryph/account/overview?*', (r) =>
      reply(r, {
        ...overview(),
        account,
        operators: Array.from({ length: 10 }, (_, i) => ({
          id: `operator-${i}`,
          name: i === 2 ? 'Operator with a long complete name' : `Operator ${i}`,
          level: i === 1 ? null : 90,
          rarity: i === 1 ? null : 6,
          phase: 0,
          potential: 0,
          profession: '突击',
          element: i === 1 ? null : '灼热',
        })),
      }),
    )
    await page.goto('/game/hypergryph/skland')
    const archives = page.locator('.operator-archive')
    await expect(archives).toHaveCount(8)
    const first = archives.first()
    await expect(first.locator('summary strong')).toHaveText('Operator 0')
    await expect(first.locator('.member-level')).toHaveText('90')
    await expect(first.locator('.member-element img')).toHaveAttribute(
      'src',
      /ef-char-element-fire/,
    )
    await expect(first.locator('.archive-portrait')).toHaveCSS(
      'border-bottom-color',
      'rgb(255, 113, 0)',
    )
    await expect(first.locator('.member-potential img')).toHaveAttribute(
      'src',
      /ef-char-potential-0/,
    )
    await expect(first.locator('.archive-facts')).not.toBeVisible()
    await expect(archives.nth(1).locator('.member-level')).toHaveText('—')
    await expect(archives.nth(1).locator('.member-element')).toHaveCount(0)
    await first.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(first.locator('.archive-facts')).toContainText('突破 0')
    await expect(first.locator('.archive-facts')).toContainText('潜能 0')
    await expect(first.locator('.archive-facts')).toContainText('突击')
    await expect
      .poll(() =>
        first.evaluate((el) => {
          const viewport = el.closest('.overview-reveal')!.getBoundingClientRect()
          const facts = el.querySelector('.archive-facts')!.getBoundingClientRect()
          return facts.bottom <= viewport.bottom + 1
        }),
      )
      .toBe(true)
    await expect(first.locator('.archive-facts > span')).toHaveText([
      '等级 90',
      '突破 0',
      '6 星',
      '潜能 0',
      '突击',
      '灼热',
    ])
    await first.locator('summary').click()
    await expect(first).not.toHaveAttribute('open')
    await page.locator('.operator-toggle').click()
    await expect(archives).toHaveCount(10)
    await page.locator('.operator-section input').fill('Operator 9')
    await expect(archives).toHaveCount(1)
    await expect(archives.locator('strong')).toHaveText('Operator 9')
    await page.locator('.operator-section input').fill('')
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      if (width === 1280) {
        expect(
          await page
            .locator('.operator-grid')
            .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
        ).toBeGreaterThanOrEqual(6)
      }
      expect(
        await page.locator('.operator-grid').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true)
      await page.locator('.operator-section').screenshot({
        path: test.info().outputPath(`operators-${width}.png`),
        animations: 'disabled',
      })
    }
  })
}
