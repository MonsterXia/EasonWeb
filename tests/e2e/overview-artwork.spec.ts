import { test, expect, reply, user, role, overview } from './fixtures'
import { readFileSync } from 'node:fs'

// Synthetic URLs/responses only. Official local image bytes exercise real decoding.
const url = 'https://bbs.hycdn.cn/public/skland-game/image/test-cover.png'
const broken = 'https://bbs.hycdn.cn/public/skland-game/image/test-broken.png'
const png = readFileSync('src/assets/skland/ef-domain_1.png')
for (const theme of ['light', 'dark']) {
  for (const game of ['arknights', 'endfield']) {
    test(`${game} item artwork takes priority and falls back in ${theme}`, async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem('eason-theme', theme), theme)
      const account = { ...role(), appCode: game, gameId: game === 'arknights' ? '1' : '2' }
      const key = game === 'arknights' ? 'arknightsActivities' : 'endfieldWarEchoes'
      let refreshed = false
      await page.route(url, (route) => route.fulfill({ contentType: 'image/png', body: png }))
      await page.route(broken, (route) => route.abort())
      await page.route('**/api/user/current', (route) => reply(route, user))
      await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [account]))
      await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
        reply(route, {
          ...overview(),
          account,
          sections: [
            {
              key,
              items: ['own', 'broken', 'missing', 'unsafe'].map((id) => ({
                id,
                name: id,
                level: null,
                status: 'unknown',
                current: 0,
                total: 1,
                completeAt: null,
                artworkUrl:
                  id === 'own' || (refreshed && id === 'broken')
                    ? url
                    : id === 'broken'
                      ? broken
                      : id === 'unsafe'
                        ? 'https://evil.invalid/image.png'
                        : null,
              })),
            },
          ],
        }),
      )
      await page.goto('/game/hypergryph/skland')
      const section = page.locator(`details[data-section="${key}"]`)
      await section.locator('summary').click()
      const card = (name: string) =>
        section.locator('li').filter({ has: page.getByText(name, { exact: true }) })
      const own = card('own').locator('.facility-art img')
      await own.scrollIntoViewIfNeeded()
      await expect(own).toHaveAttribute('src', url)
      await expect
        .poll(() => own.evaluate((el) => (el as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0)
      expect(await own.evaluate((el) => getComputedStyle(el).filter)).toBe('none')
      expect(await own.evaluate((el) => getComputedStyle(el).mixBlendMode)).toBe('normal')
      await expect(own).toHaveAttribute('referrerpolicy', 'no-referrer')
      const fallback = game === 'arknights' ? /ak-sideStory/ : /ef-warEchoes/
      for (const id of ['broken', 'missing', 'unsafe']) {
        const img = card(id).locator('.facility-art img')
        await img.scrollIntoViewIfNeeded()
        await expect(img).toHaveAttribute('src', fallback)
      }
      await section.screenshot({ path: test.info().outputPath(`${game}-${theme}.png`) })
      // Exhausting both artwork and fallback keeps the full record text.
      await card('missing').locator('img').dispatchEvent('error')
      await expect(card('missing').locator('img')).toHaveCount(0)
      await expect(card('missing').getByText('missing', { exact: true })).toBeVisible()
      refreshed = true
      await page.getByRole('button', { name: '刷新角色资料' }).click()
      const recovered = card('broken').locator('.facility-art img')
      await expect(recovered).toHaveAttribute('src', url)
      await recovered.scrollIntoViewIfNeeded()
      await expect
        .poll(() => recovered.evaluate((el) => (el as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0)
    })
  }
}
