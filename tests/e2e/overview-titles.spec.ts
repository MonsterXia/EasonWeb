import { test, expect, reply, user, role, overview } from './fixtures'
test('official Arknights headings default open and support pointer and keyboard disclosure', async ({
  page,
}, info) => {
  await page.route('**/api/user/current', (r) => reply(r, user))
  await page.route('**/api/game/hypergryph/account/games', (r) => reply(r, [role()]))
  await page.route('**/api/game/hypergryph/account/overview?*', (r) =>
    reply(r, {
      ...overview(),
      sections: [{ key: 'arknightsRecruitment', items: [] }],
      metrics: [...overview().metrics, { key: 'drones', group: 'base', current: 24, total: 235 }],
    }),
  )
  for (const theme of ['light', 'dark']) {
    await page.addInitScript((theme) => {
      localStorage.setItem('eason-theme', theme)
    }, theme)
    await page.goto('/game/hypergryph/skland')
    const titles = page.locator('.compact-metrics h3, .operator-summary h3')
    await expect(titles).toHaveText(['实时数据', '基建数据', '我的干员'])
    const referenceX = await page
      .locator('.facility-group .section-title')
      .evaluate((el) => el.getBoundingClientRect().x)
    for (const title of await titles.all()) {
      const textX = await title.evaluate((el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        let text: Node | null
        while ((text = walker.nextNode())) {
          if (!text.textContent?.trim()) continue
          const range = document.createRange()
          range.selectNodeContents(text)
          return range.getBoundingClientRect().x
        }
        return -1
      })
      expect(Math.abs(textX - referenceX)).toBeLessThan(0.5)
    }

    for (let i = 0; i < 3; i++) {
      const disclosure = page.locator('details.compact-metrics, details.operator-section').nth(i)
      await expect(disclosure).toHaveAttribute('open')
      const style = (element: Element) => {
        const s = getComputedStyle(element)
        return [s.borderTop, s.paddingTop, s.paddingBottom]
      }
      expect(await disclosure.evaluate(style)).toEqual(
        await page.locator('.facility-group').evaluate(style),
      )
      await disclosure.locator(':scope > summary').click()
      await expect(disclosure).not.toHaveAttribute('open')
      await disclosure.locator(':scope > summary').focus()
      await page.keyboard.press('Enter')
      await expect(disclosure).toHaveAttribute('data-details-expanded', 'true')
      await expect
        .poll(() => disclosure.evaluate((el) => el.getAnimations({ subtree: true }).length))
        .toBe(0)
      await titles.nth(i).scrollIntoViewIfNeeded()
      if (i < 2)
        await titles
          .nth(i)
          .locator('img')
          .evaluate((img: HTMLImageElement) => img.decode())
      await titles.nth(i).screenshot({ path: info.outputPath(`title-${theme}-${i}.png`) })
    }
    for (const group of await page
      .locator('details.compact-metrics, details.operator-section, .facility-group')
      .all()) {
      if ((await group.getAttribute('open')) !== null)
        await group.locator(':scope > summary').click()
      await expect(group).not.toHaveAttribute('open')
    }
    await page.locator('.overview').screenshot({ path: info.outputPath(`collapsed-${theme}.png`) })
  }
})

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Endfield title groups default open and preserve search with ${reducedMotion}`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion })
    const account = { ...role(), appCode: 'endfield', gameId: '2' }
    await page.route('**/api/user/current', (r) => reply(r, user))
    await page.route('**/api/game/hypergryph/account/games', (r) => reply(r, [account]))
    await page.route('**/api/game/hypergryph/account/overview?*', (r) =>
      reply(r, {
        ...overview(),
        account,
        operators: [{ id: 'fixture-operator', name: 'Test Operator', level: 1, phase: 0 }],
      }),
    )
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((theme) => localStorage.setItem('eason-theme', theme), theme)
      await page.goto('/game/hypergryph/skland')
      const groups = page.locator('details.compact-metrics, details.operator-section')
      await expect(groups).toHaveCount(2)
      await expect(groups.locator(':scope > summary h3')).toHaveText(['实时数据', '干员'])
      const search = page.locator('.operator-section input')
      await search.fill('Test')
      for (const group of await groups.all()) {
        await expect(group).toHaveAttribute('open')
        await group.locator(':scope > summary').click()
        await expect(group).not.toHaveAttribute('open')
        await expect(group.locator(':scope > .facility-content')).not.toBeVisible()
        await group.locator(':scope > summary').focus()
        await page.keyboard.press('Enter')
        await expect(group).toHaveAttribute('data-details-expanded', 'true')
        await expect
          .poll(() => group.evaluate((el) => el.getAnimations({ subtree: true }).length))
          .toBe(0)
        await expect(group.locator(':scope > .facility-content')).toBeVisible()
      }
      await expect(search).toHaveValue('Test')
      await expect(page.locator('.operator-archive')).toBeVisible()
      for (const group of await groups.all()) await group.locator(':scope > summary').click()
      await expect
        .poll(() => groups.evaluateAll((els) => els.every((el) => !el.hasAttribute('open'))))
        .toBe(true)
      await page
        .locator('.overview')
        .screenshot({ path: info.outputPath(`endfield-collapsed-${theme}.png`) })
    }
  })
}
