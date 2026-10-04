import { expect, type Page } from '@playwright/test'

// Changing the shared root parameters must affect all banners without fading content
// or fallback icons. Run this against both record fixtures and both themes.
export async function checkBannerOpacity(page: Page) {
  const initialOpacity = await page.evaluate(() =>
    String(
      Number(
        getComputedStyle(document.documentElement).getPropertyValue('--skland-banner-opacity'),
      ),
    ),
  )
  const covers = page.locator('.record-row .banner-frame .cover img')
  expect(await covers.count()).toBeGreaterThan(0)
  for (const image of await covers.all()) await expect(image).toHaveCSS('opacity', initialOpacity)
  try {
    for (const value of ['0.35', '0']) {
      await page.evaluate((value) => {
        document.documentElement.style.setProperty('--skland-banner-opacity', value)
      }, value)
      for (const image of await covers.all()) await expect(image).toHaveCSS('opacity', value)
      const foreground = page.locator(
        '.record-row, .record-body, .record-logo, .record-logo img, .banner-frame .overview-artwork:not(.cover), .banner-frame .overview-artwork:not(.cover) img',
      )
      for (const element of await foreground.all()) await expect(element).toHaveCSS('opacity', '1')
    }
  } finally {
    await page.evaluate(() =>
      document.documentElement.style.removeProperty('--skland-banner-opacity'),
    )
  }
  for (const image of await covers.all()) await expect(image).toHaveCSS('opacity', initialOpacity)
}

export async function checkBannerScrim(page: Page) {
  const defaults = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement)
    return {
      image: String(Number(style.getPropertyValue('--skland-banner-opacity'))),
      scrim: String(Number(style.getPropertyValue('--skland-banner-scrim-opacity'))),
    }
  })
  const rows = page.locator('.record-row:has(.banner-frame .cover)')
  const opacities = () =>
    rows.evaluateAll((elements) => elements.map((el) => getComputedStyle(el, '::after').opacity))
  expect(await rows.count()).toBeGreaterThan(0)
  expect(await opacities()).toEqual(Array(await rows.count()).fill(defaults.scrim))
  try {
    for (const value of ['0', '0.4', '1']) {
      await page.evaluate((value) => {
        document.documentElement.style.setProperty('--skland-banner-scrim-opacity', value)
      }, value)
      expect(await opacities()).toEqual(Array(await rows.count()).fill(value))
      for (const image of await rows.locator('.cover img').all()) {
        await expect(image).toHaveCSS('opacity', defaults.image)
      }
      for (const element of await page.locator('.record-row, .record-body, .record-logo').all()) {
        await expect(element).toHaveCSS('opacity', '1')
      }
    }
  } finally {
    await page.evaluate(() =>
      document.documentElement.style.removeProperty('--skland-banner-scrim-opacity'),
    )
  }
  expect(await opacities()).toEqual(Array(await rows.count()).fill(defaults.scrim))
}
