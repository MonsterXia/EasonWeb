import { test, expect, reply, user, role, overview } from './fixtures'
// @ts-expect-error Shared synthetic fixture.
import { warEchoesFixture } from '../fixtures/war-echoes.js'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`honor layout and disclosure are sequenced with ${reducedMotion}`, async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion })
    const account = { ...role(), appCode: 'endfield', gameId: '2' }
    await page.route('**/api/user/current', (r) => reply(r, user))
    await page.route('**/api/game/hypergryph/account/games', (r) => reply(r, [account]))
    await page.route('**/api/game/hypergryph/account/overview?*', (r) =>
      reply(r, {
        ...overview(),
        account,
        warEchoes: warEchoesFixture(),
        sections: [],
      }),
    )
    await page.goto('/game/hypergryph/skland')
    const group = page.locator('[data-section="endfieldWarEchoes"]')
    await group.locator(':scope > summary').click()
    const honors = group.locator('.honors')
    const layout = group.locator('.season-facts')
    const finishLeg = () =>
      layout.evaluate((el) => {
        for (const animation of el.getAnimations({ subtree: true })) animation.finish()
      })
    const clickAndPause = () =>
      honors.evaluate(async (el) => {
        el.querySelector('summary')!.click()
        // The mobile layout leg is a no-op; allow its continuation to start the reveal.
        await Promise.resolve()
        for (const animation of el.parentElement!.getAnimations({ subtree: true }))
          animation.pause()
        return { phase: (el as HTMLElement).dataset.detailsPhase, open: el.hasAttribute('open') }
      })

    if (reducedMotion === 'no-preference') {
      const first = await clickAndPause()
      expect(first.phase).toBe(isMobile ? 'content' : 'layout')
      expect(first.open).toBe(isMobile)
      await finishLeg()
      if (!isMobile) {
        await expect(honors).toHaveAttribute('data-details-phase', 'content')
        await expect(layout).toHaveAttribute('data-honors-layout', 'expanded')
        await finishLeg()
      }
    } else {
      await honors.locator('summary').click()
    }
    await expect(honors).toHaveAttribute('data-details-phase', 'idle')
    await expect(honors).toHaveAttribute('open')
    const aligned = await layout.evaluate((el) => {
      const rating = el.querySelector('.rating-summary')!.getBoundingClientRect()
      const honor = el.querySelector('.honors')!.getBoundingClientRect()
      return Math.abs(rating.width - honor.width) < 1 && honor.top >= rating.bottom
    })
    expect(aligned).toBe(true)

    if (reducedMotion === 'no-preference') {
      expect((await clickAndPause()).phase).toBe('content')
      await expect(layout).toHaveAttribute('data-honors-layout', 'expanded')
      await finishLeg()
      if (!isMobile) {
        await expect(honors).toHaveAttribute('data-details-phase', 'layout')
        await expect(honors).not.toHaveAttribute('open')
        await finishLeg()
      }
    } else {
      await honors.locator('summary').click()
    }
    await expect(honors).toHaveAttribute('data-details-phase', 'idle')
    await expect(honors).not.toHaveAttribute('open')
    await expect(layout).toHaveAttribute('data-honors-layout', 'collapsed')
    expect(await layout.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0)

    // Latest intent wins even if the layout leg hasn't finished yet.
    await honors.locator('summary').evaluate((el) => {
      for (let i = 0; i < 3; i++) (el as HTMLElement).click()
    })
    await expect(honors).toHaveAttribute('data-details-phase', 'idle')
    await expect(honors).toHaveAttribute('open')
    await honors.locator('summary').evaluate((el) => {
      for (let i = 0; i < 3; i++) (el as HTMLElement).click()
    })
    await expect(honors).toHaveAttribute('data-details-phase', 'idle')
    await expect(honors).not.toHaveAttribute('open')

    await honors.locator('summary').evaluate((el) => (el as HTMLElement).click())
    await page.setViewportSize({ width: 390, height: 900 })
    await expect(honors).toHaveAttribute('data-details-phase', 'idle')
    await expect(honors).toHaveAttribute('open')
    expect(await layout.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
    const fits = await honors.evaluate((el) => {
      const content = el.querySelector('.facility-content')!.getBoundingClientRect()
      const last = el.querySelector('.honor-list li:last-child')!.getBoundingClientRect()
      return last.bottom <= content.bottom + 1
    })
    expect(fits).toBe(true)
  })
}
