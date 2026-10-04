import { test, expect, reply, user, role, overview } from './fixtures'

for (const theme of ['light', 'dark']) {
  test(`overview headings retain official artwork and no enclosing focus border in ${theme}`, async ({
    page,
  }) => {
    await page.addInitScript((theme) => localStorage.setItem('eason-theme', theme), theme)
    await page.route('**/api/user/current', (route) => reply(route, user))
    await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
    await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
      reply(route, {
        ...overview(),
        sections: ['arknightsCampaign', 'arknightsSandbox'].map((key) => ({
          key,
          items: [
            {
              id: key,
              name: '测试记录',
              level: null,
              status: 'unknown',
              current: 0,
              total: 1,
              completeAt: null,
            },
          ],
        })),
      }),
    )
    await page.goto('/game/hypergryph/skland')
    const heading = page.locator('summary').filter({ hasText: '生息演算' })
    await expect(heading).toBeVisible()
    await heading.click()
    await expect(heading.locator('..')).toHaveAttribute('open', '')
    expect(await heading.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none')
    const icon = heading.locator('.section-art img')
    await expect(icon).toBeVisible()
    await expect(icon).toHaveAttribute('src', /ak-logoBase/)
    expect(await icon.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    expect(await icon.evaluate((el) => getComputedStyle(el).filter)).toBe('none')
    expect(
      await heading.locator('.section-art').evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe('rgb(48, 35, 46)')
    await heading.click()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(heading).toBeFocused()
    expect(await heading.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none')
    expect(
      await heading
        .locator('.section-title')
        .evaluate((el) => getComputedStyle(el).textDecorationLine),
    ).toBe('underline')
    await page.keyboard.press('Enter')
    await expect(heading.locator('..')).toHaveAttribute('open', '')
    await page
      .locator('.facility-section')
      .screenshot({ path: test.info().outputPath(`overview-${theme}.png`) })
  })
}
