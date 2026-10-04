import { test, expect, reply, user, role, overview } from './fixtures'
import { readFileSync } from 'node:fs'

const cover = 'https://bbs.hycdn.cn/public/synthetic-tower-cover.png'
const iconRoot = 'https://web.hycdn.cn/arknights/game/assets/game_mode/climb_tower/icon/'
const background = readFileSync('src/assets/skland/ef-domain_1.png')
const logo = readFileSync('src/assets/skland/ak-icon-towerRewardHigher.png')

for (const theme of ['light', 'dark']) {
  test(`tower logos and covers load independently in ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('eason-theme', value), theme)
    let refreshed = false
    await page.route(cover, (route) =>
      route.fulfill({ contentType: 'image/png', body: background }),
    )
    await page.route(cover + '?broken', (route) => route.abort())
    await page.route(iconRoot + '*', (route) =>
      /broken-logo|both-broken/.test(route.request().url())
        ? route.abort()
        : route.fulfill({ contentType: 'image/png', body: logo }),
    )
    await page.route('**/api/user/current', (route) => reply(route, user))
    await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
    await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
      reply(route, {
        ...overview(),
        sections: [
          {
            key: 'arknightsTower',
            items: ['full', 'missing-cover', 'broken-cover', 'broken-logo', 'both-broken'].map(
              (id) => ({
                id,
                name: id,
                subtitle: 'Synthetic organization',
                level: null,
                status: 'unknown',
                current: 6,
                total: null,
                completeAt: null,
                artworkUrl:
                  id === 'missing-cover'
                    ? null
                    : id === 'both-broken' || (id === 'broken-cover' && !refreshed)
                      ? cover + '?broken'
                      : cover,
              }),
            ),
          },
        ],
      }),
    )
    await page.goto('/game/hypergryph/skland')
    const section = page.locator('.facility-group')
    await section.locator('summary').click()
    // Vite may deduplicate identical local PNGs under another emitted filename.
    const genericLogo = await section.locator('summary img').getAttribute('src')
    for (const id of ['full', 'missing-cover', 'broken-cover', 'broken-logo', 'both-broken']) {
      const row = section
        .locator('.record-row')
        .filter({ has: page.getByText(id, { exact: true }) })
      await row.scrollIntoViewIfNeeded()
      const image = row.locator('.record-logo img')
      const fallback = id === 'broken-logo' || id === 'both-broken'
      const hasCover = id === 'full' || id === 'broken-logo'
      await expect(image).toHaveAttribute('src', fallback ? genericLogo! : iconRoot + id + '.png')
      await expect
        .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0)
      await expect(row.locator('.banner-frame img')).toHaveCount(hasCover ? 1 : 0)
      if (hasCover) {
        await expect(row.locator('.banner-frame img')).toHaveAttribute('src', cover)
        await expect(row.locator('.banner-frame img')).toHaveCSS('filter', 'none')
        await expect(row).toHaveCSS(
          'background-color',
          theme === 'dark' ? 'rgb(32, 32, 32)' : 'rgb(249, 237, 242)',
        )
        await expect(row.locator('h4')).toHaveCSS(
          'color',
          theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(56, 38, 50)',
        )
        await expect(row.locator('.subtitle')).toHaveCSS(
          'color',
          theme === 'dark' ? 'rgb(240, 240, 240)' : 'rgb(56, 38, 50)',
        )
        await expect
          .poll(() =>
            row
              .locator('.banner-frame img')
              .evaluate((el) => (el as HTMLImageElement).naturalWidth),
          )
          .toBeGreaterThan(0)
      }
      await expect(image).toHaveCSS('filter', theme === 'dark' ? 'none' : 'invert(1)')
      await expect(row.locator('.record-progress strong')).toHaveText('6')
      expect(
        await row.evaluate((el) => {
          const icon = el.querySelector('.record-logo')!.getBoundingClientRect()
          const title = el.querySelector('h4')!.getBoundingClientRect()
          return icon.right <= title.left && el.scrollWidth <= el.clientWidth
        }),
      ).toBe(true)
    }
    await section.screenshot({
      path: test.info().outputPath(`tower-${theme}.png`),
      style: '.site-header, .site-header * { visibility: hidden !important; }',
    })
    refreshed = true
    await page.getByRole('button', { name: '刷新角色资料' }).click()
    const recovered = section
      .locator('.record-row')
      .filter({ has: page.getByText('broken-cover', { exact: true }) })
    await recovered.scrollIntoViewIfNeeded()
    await expect(recovered.locator('.banner-frame img')).toHaveAttribute('src', cover)
    await expect(recovered.locator('.record-logo img')).toHaveCSS(
      'filter',
      theme === 'dark' ? 'none' : 'invert(1)',
    )
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
