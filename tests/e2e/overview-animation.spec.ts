import { test, expect, reply, user, role, overview } from './fixtures'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`overview disclosures animate and remain reversible with ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion })
    await page.setViewportSize({ width: 390, height: 900 })
    await page.route('**/api/user/current', (route) => reply(route, user))
    await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
    await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
      reply(route, {
        ...overview(),
        sections: [
          {
            key: 'arknightsRecruitment',
            items: [
              {
                id: 'slot',
                name: null,
                level: null,
                status: 'idle',
                current: null,
                total: null,
                completeAt: null,
              },
            ],
          },
        ],
        operators: Array.from({ length: 12 }, (_, index) => ({
          id: `test-${index}`,
          name: `Operator ${index}`,
          level: 1,
          phase: 0,
        })),
      }),
    )
    await page.goto('/game/hypergryph/skland')
    const daily = page.locator('.metric-section').first()
    await expect(daily.locator('.metric:visible')).toHaveCount(4)
    const animateGrid = async (selector: string) =>
      page.locator(selector).evaluate(async (button) => {
        const viewport = button.parentElement!.querySelector('.overview-reveal')!
        const before = viewport.getBoundingClientRect().height
        ;(button as HTMLElement).click()
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        )
        return {
          before,
          after: viewport.getBoundingClientRect().height,
          running: viewport.getAnimations().some((animation) => animation.playState === 'running'),
        }
      })
    expect((await animateGrid('.metrics-toggle')).running).toBe(reducedMotion === 'no-preference')
    await expect(daily.locator('.metric:visible')).toHaveCount(9)
    await expect
      .poll(() => daily.locator('.overview-reveal').evaluate((el) => el.getAnimations().length))
      .toBe(0)
    expect((await animateGrid('.metrics-toggle')).running).toBe(reducedMotion === 'no-preference')
    await expect(daily.locator('.metric:visible')).toHaveCount(4)

    // Reverse twice before completion: the final state must still match the button.
    await daily.locator('button').evaluate(async (button) => {
      for (let index = 0; index < 3; index++) {
        ;(button as HTMLElement).click()
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
    })
    await expect(daily.locator('button')).toHaveAttribute('aria-expanded', 'true')
    await expect(daily.locator('.metric:visible')).toHaveCount(9)

    const details = page.locator('.facility-group').first()
    if (reducedMotion === 'no-preference') {
      // Hold the closing animation at its final frame before the finish callback.
      // No card may remain visible in the group's bottom padding or reappear.
      const visibleHeight = await details.evaluate((element) => {
        element.querySelector('summary')!.click()
        const animation = element.getAnimations({ subtree: true })[0]!
        animation.pause()
        animation.currentTime = Number(animation.effect!.getTiming().duration)
        const card = element.querySelector('li')!
        let { top, bottom } = card.getBoundingClientRect()
        for (let parent = card.parentElement; parent; parent = parent.parentElement) {
          if (['hidden', 'clip'].includes(getComputedStyle(parent).overflowY)) {
            const rect = parent.getBoundingClientRect()
            top = Math.max(top, rect.top)
            bottom = Math.min(bottom, rect.bottom)
          }
        }
        const visible = Math.max(0, bottom - top)
        animation.finish()
        return visible
      })
      expect(visibleHeight).toBeLessThan(0.5)
      await expect(details).not.toHaveAttribute('open')
      await details.locator('summary').click()
      await expect.poll(() => details.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0)
    }
    const animateDetails = () =>
      details.locator('summary').evaluate(async (summary) => {
        ;(summary as HTMLElement).click()
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        )
        return summary
          .parentElement!.getAnimations({ subtree: true })
          .some((animation) => animation.playState === 'running')
      })
    expect(await animateDetails()).toBe(reducedMotion === 'no-preference')
    await expect(details).not.toHaveAttribute('open')
    expect(await animateDetails()).toBe(reducedMotion === 'no-preference')
    await expect(details.locator('li')).toBeVisible()
    await details.locator('summary').evaluate(async (summary) => {
      for (let index = 0; index < 3; index++) {
        ;(summary as HTMLElement).click()
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
    })
    await expect(details).not.toHaveAttribute('open')

    await expect(page.locator('.operator-grid li')).toHaveCount(8)
    expect((await animateGrid('.operator-toggle')).running).toBe(reducedMotion === 'no-preference')
    await expect(page.locator('.operator-grid li:visible')).toHaveCount(12)
    await expect
      .poll(() =>
        page
          .locator('.operator-section .overview-reveal')
          .evaluate((el) => el.getAnimations().length),
      )
      .toBe(0)
    expect((await animateGrid('.operator-toggle')).running).toBe(reducedMotion === 'no-preference')
    await expect(page.locator('.operator-grid li')).toHaveCount(8)
  })
}
