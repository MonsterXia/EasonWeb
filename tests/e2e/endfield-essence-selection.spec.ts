import { test, expect } from './fixtures'

for (const language of ['zh-CN', 'en']) {
  test(`${language}: essence candidates exclude selected weapons and restore removed weapons`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((language) => {
      localStorage.setItem('eason-locale', language)
      localStorage.setItem('eason-theme', language === 'en' ? 'dark' : 'light')
    }, language)
    await page.goto('/game/hypergryph/endfield')
    const input = page.getByRole('combobox', {
      name: language === 'en' ? 'Select a weapon' : '选择武器',
      exact: true,
    })
    const add = page.getByRole('button', {
      name: language === 'en' ? 'Add weapon' : '添加武器',
      exact: true,
    })
    const cards = page.locator('.selected-weapons .selected-weapon')
    const dropdown = page.locator(`#${await input.getAttribute('aria-controls')}`)
    const weapon = '赫拉芬格'
    const secondWeapon = '淬火者'
    await expect(add).toBeDisabled()
    await input.click()
    await expect(
      dropdown.getByRole('option', { name: '塔尔11', exact: true }).locator('svg'),
    ).toBeVisible()
    await expect(
      dropdown.getByRole('option', { name: '塔尔11', exact: true }).locator('.weapon-option-name'),
    ).toHaveClass(/rarity-3/)
    await page.locator('.el-select-dropdown:visible').screenshot({
      path: testInfo.outputPath('weapon-options.png'),
      animations: 'disabled',
    })
    await input.fill(weapon)
    await dropdown.getByRole('option', { name: weapon, exact: true }).click()
    await add.click()
    await expect(cards).toHaveCount(1)
    await expect(cards.first().locator('.weapon-name')).toHaveText(weapon)
    await expect(input).toHaveValue('')
    await expect(add).toBeDisabled()

    // A selected weapon cannot be found or re-added through search.
    await input.fill(weapon)
    await expect(dropdown.getByRole('option', { name: weapon, exact: true })).toHaveCount(0)
    await expect(
      page.getByText(language === 'en' ? 'No matching unselected weapons' : '没有匹配的未选武器', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(add).toBeDisabled()
    await input.fill(secondWeapon)
    await dropdown.getByRole('option', { name: secondWeapon, exact: true }).click()
    await add.click()
    await expect(cards).toHaveCount(2)
    await input.click()
    await expect(dropdown.getByRole('option', { name: weapon, exact: true })).toHaveCount(0)
    await expect(dropdown.getByRole('option', { name: secondWeapon, exact: true })).toHaveCount(0)
    await input.press('Escape')

    // Removing a card restores that candidate without disturbing the other selection.
    await cards
      .filter({ hasText: weapon })
      .getByRole('button', {
        name: `${language === 'en' ? 'Remove' : '移除'} ${weapon}`,
        exact: true,
      })
      .click()
    await expect(cards).toHaveCount(1)
    await expect(cards.first().locator('.weapon-name')).toHaveText(secondWeapon)
    await input.fill(weapon)
    await dropdown.getByRole('option', { name: weapon, exact: true }).click()
    await add.click()
    await expect(cards).toHaveCount(2)
    await expect(cards.filter({ hasText: weapon })).toHaveCount(1)
    await expect(input).toHaveValue('')
    await expect(add).toBeDisabled()
    await expect(cards.locator('img')).toHaveCount(2)
    for (const img of await cards.locator('img').all()) {
      await expect(img).toHaveAttribute('src', /ef-growth-wpn_/)
      await expect
        .poll(() => img.evaluate((image) => (image as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0)
    }
    await expect(cards.first().locator('.weapon-attributes')).not.toBeEmpty()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page
      .locator('.calculator-inputs > .el-card')
      .first()
      .screenshot({ path: testInfo.outputPath('weapon-cards.png'), animations: 'disabled' })
  })
}

test('targeting coverage and highlighted cards agree for mixed weapon skills', async ({ page }) => {
  await page.goto('/game/hypergryph/endfield')
  const input = page.getByRole('combobox', { name: '选择武器', exact: true })
  const dropdown = page.locator(`#${await input.getAttribute('aria-controls')}`)
  for (const name of ['仰止', '不知归', '熔铸火焰']) {
    await input.fill(name)
    await dropdown.getByRole('option', { name, exact: true }).click()
    await page.getByRole('button', { name: '添加武器', exact: true }).click()
  }
  const cards = page.locator('.selected-weapon')
  await expect(page.locator('.coverage')).toContainText('2 / 3')
  await expect(page.locator('.ticket').last()).toContainText('夜幕')
  await expect(cards.filter({ hasText: '不知归' })).not.toHaveClass(/is-recommended/)
  await expect(page.locator('.selected-weapon.is-recommended')).toHaveCount(2)
  for (const name of ['仰止', '熔铸火焰']) {
    await page.getByRole('button', { name: `移除 ${name}`, exact: true }).click()
  }
  await expect(page.locator('.coverage')).toContainText('1 / 1')
  await expect(page.locator('.ticket').last()).toContainText('流转')
  await expect(cards).toHaveClass(/is-recommended/)
  await page.getByRole('button', { name: '移除 不知归', exact: true }).click()
  await expect(page.locator('.coverage')).toHaveCount(0)
  await expect(page.locator('.ticket')).toHaveCount(0)
})
