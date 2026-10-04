import { test, expect, reply, user, role, overview } from './fixtures'

for (const language of ['zh-CN', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`${language} / ${theme}: responsive forms, errors and overview`, async ({
      page,
    }, testInfo) => {
      await page.addInitScript(
        ({ language, theme }) => {
          localStorage.setItem('eason-locale', language)
          localStorage.setItem('eason-theme', theme)
        },
        { language, theme },
      )
      await page.route('**/api/user/current', (route) => reply(route, user))
      await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
      await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
        reply(route, overview()),
      )
      const paths = ['/login', '/missing-page', '/game/hypergryph/skland']
      for (const path of paths) {
        await page.goto(path)
        await expect(page.locator('main h1')).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', language)
        if (path.includes('skland')) await expect(page.locator('.profile-facts')).toBeVisible()
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true)
        if (path.includes('skland') && language === 'zh-CN' && theme === 'light') {
          await testInfo.attach('initial-resource-sizes', {
            body: JSON.stringify(
              await page.evaluate(() =>
                performance
                  .getEntriesByType('resource')
                  .filter((entry) => new URL(entry.name).pathname.startsWith('/assets/'))
                  .map((entry) => {
                    const resource = entry as PerformanceResourceTiming
                    return {
                      path: new URL(resource.name).pathname,
                      encodedBytes: resource.encodedBodySize,
                      transferBytes: resource.transferSize,
                    }
                  }),
              ),
            ),
            contentType: 'application/json',
          })
        }
        await page.screenshot({
          path: testInfo.outputPath(`${path.split('/').at(-1)}.png`),
          fullPage: true,
          animations: 'disabled',
        })
      }
    })
  }
}

test('keyboard skip link reaches main content and narrow layouts do not overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/missing-page')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: '跳至主要内容' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})
