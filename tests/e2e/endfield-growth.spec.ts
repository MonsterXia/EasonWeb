import { test, expect } from './fixtures'

async function chooseOption(
  page: import('@playwright/test').Page,
  control: import('@playwright/test').Locator,
  label: string,
) {
  await control.locator('xpath=ancestor::div[contains(@class, "el-select__wrapper")]').click()
  const listbox = page.locator(`#${await control.getAttribute('aria-controls')}`)
  await listbox.getByRole('option', { name: label, exact: true }).click()
  await expect(control).toHaveAttribute('aria-expanded', 'false')
}

async function chooseRange(
  trigger: import('@playwright/test').Locator,
  values: { from?: number; to?: number },
) {
  await trigger.click()
  const dialog = trigger.page().locator('.growth-range-dialog:visible')
  await expect(dialog).toHaveAttribute('data-ready', 'true')
  for (const [index, value] of [
    [0, values.from],
    [1, values.to],
  ] as const) {
    if (value === undefined) continue
    const wheel = dialog.getByRole('listbox').nth(index)
    await wheel.focus()
    await wheel.press('Home')
    const selected = wheel.getByRole('option', { selected: true })
    let step = Number((await selected.getAttribute('id'))!.split('-').at(-1))
    while (step + 5 <= value) {
      await wheel.press('PageDown')
      step += 5
    }
    while (step++ < value) await wheel.press('ArrowDown')
  }
  await dialog.locator('.el-dialog__footer .el-button--primary').click()
  await expect(dialog).not.toBeVisible()
}

const growthPath = '/game/hypergryph/endfield?tool=growth'
for (const theme of ['light', 'dark']) {
  test(`${theme}: mouse dragging snaps both wheels without clicking the original option`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((value) => localStorage.setItem('eason-theme', value), theme)
    if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 480 })
    await page.goto(growthPath)
    const plan = await selectGilberta(page)
    const trigger = plan.locator('.skill-grid .growth-range-trigger').first()
    await chooseRange(trigger, { from: 5, to: 10 })
    await trigger.click()
    const dialog = page.locator('.growth-range-dialog:visible')
    await expect(dialog).toHaveAttribute('data-ready', 'true')
    const current = dialog.getByRole('listbox', { name: '当前', exact: true })
    const target = dialog.getByRole('listbox', { name: '目标', exact: true })
    async function drag(wheel: import('@playwright/test').Locator, dy: number, dx = 0) {
      const option = wheel.getByRole('option', { selected: true })
      await expect(option).toBeVisible()
      // Hover waits for the dialog's opening transition before measuring coordinates.
      await option.hover()
      const box = (await option.boundingBox())!
      const x = box.x + box.width / 2
      const y = box.y + box.height / 2
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x + dx, y + dy, { steps: 8 })
      await expect(wheel).toHaveClass(/dragging/)
      await page.mouse.up()
      await expect(wheel).not.toHaveClass(/dragging/)
    }
    await drag(current, -70)
    await expect(current.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      'LV. 7',
    )
    await expect.poll(() => current.evaluate((el) => el.scrollTop)).toBe(6 * 44)
    // Capture keeps the drag active even when the mouse leaves the column.
    await drag(target, 57, -180)
    await expect(target.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      'LV. 9',
    )
    await expect.poll(() => target.evaluate((el) => el.scrollTop)).toBe(8 * 44)
    await current.getByRole('option', { name: 'LV. 6', exact: true }).click()
    await expect(current.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      'LV. 6',
    )
    await drag(target, 240)
    await expect(target.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      'LV. 6',
    )
    await drag(current, -350)
    await expect(current.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      '专精 3 阶',
    )
    await expect(target.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      '专精 3 阶',
    )
    await dialog.getByRole('button', { name: '确定', exact: true }).click()
    await expect(trigger).toHaveAttribute('data-from', '12')
    await expect(trigger).toHaveAttribute('data-to', '12')
  })
}
for (const theme of ['light', 'dark']) {
  test(`${theme}: level wheels scroll, select mastery, constrain targets and cancel drafts`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((value) => localStorage.setItem('eason-theme', value), theme)
    if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 480 })
    await page.goto(growthPath)
    const plan = await selectGilberta(page)
    const trigger = plan.locator('.skill-grid .growth-range-trigger').first()
    await chooseRange(trigger, { from: 3, to: 11 })
    await trigger.click()
    const dialog = page.locator('.growth-range-dialog:visible')
    await expect(dialog).toHaveAttribute('data-ready', 'true')
    const current = dialog.getByRole('listbox', { name: '当前', exact: true })
    const target = dialog.getByRole('listbox', { name: '目标', exact: true })
    await expect(current.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      'LV. 3',
    )
    await expect(target.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      '专精 2 阶',
    )
    await expect(dialog.locator('input')).toHaveCount(0)
    await page.screenshot({ path: testInfo.outputPath('level-wheels.png'), animations: 'disabled' })
    await current.getByRole('option', { name: 'LV. 4', exact: true }).click()
    await expect(current.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      'LV. 4',
    )
    await target.hover()
    await page.mouse.wheel(0, -44)
    await expect(target.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      '专精 1 阶',
    )
    await target.focus()
    await target.press('Home')
    await expect(target.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      'LV. 4',
    )
    await expect(target.getByRole('option', { name: 'LV. 3', exact: true })).toBeDisabled()
    await expect(target.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      'LV. 4',
    )
    await current.focus()
    await current.press('End')
    await expect(target.getByRole('option', { selected: true })).toHaveAttribute(
      'aria-label',
      '专精 3 阶',
    )
    const done = dialog.getByRole('button', { name: '确定', exact: true })
    const footerBox = (await dialog.locator('.el-dialog__footer').boundingBox())!
    expect((await done.boundingBox())!.width).toBeGreaterThanOrEqual(footerBox.width - 2)
    await expect(dialog.locator('.el-dialog__close')).toHaveCSS('font-size', '24px')
    expect((await done.boundingBox())!.y + (await done.boundingBox())!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    )
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await expect(dialog.getByRole('button', { name: '取消', exact: true })).toHaveCount(0)
    await dialog.getByRole('button', { name: '关闭此对话框', exact: true }).click()
    await expect(trigger).toHaveAttribute('data-from', '3')
    await expect(trigger).toHaveAttribute('data-to', '11')
    await chooseRange(trigger, { from: 4, to: 10 })
    await expect(trigger).toHaveAttribute('data-from', '4')
    await expect(trigger).toHaveAttribute('data-to', '10')
  })
}
for (const theme of ['light', 'dark']) {
  test(`${theme}: official talent branches preserve owned nodes and prerequisite selection`, async ({
    page,
  }, testInfo) => {
    const english = theme === 'dark'
    const label = (zh: string, en: string) => (english ? en : zh)
    await page.addInitScript(
      ({ theme, english }) => {
        localStorage.setItem('eason-theme', theme)
        localStorage.setItem('eason-locale', english ? 'en' : 'zh-CN')
      },
      { theme, english },
    )
    if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 560 })
    await page.goto(growthPath)
    await page
      .getByRole('button', { name: label('添加目标', 'Add targets'), exact: true })
      .first()
      .click()
    const selection = page.getByRole('dialog')
    await selection.getByRole('searchbox').fill(label('别礼', 'Last Rite'))
    await selection
      .getByRole('button', { name: label('选择 别礼', 'Select Last Rite'), exact: true })
      .click()
    await selection.getByRole('button', { name: label('完成选择', 'Done'), exact: true }).click()
    const plan = page.getByRole('article', { name: label('别礼', 'Last Rite'), exact: true })
    await chooseRange(plan.locator('.level-row .growth-range-trigger'), { from: 38 })
    await expect(plan.locator('.stage-details')).not.toHaveAttribute('open', '')
    await expect(plan.locator('.skill-grid .upgrade-icon img')).toHaveCount(4)
    await expect
      .poll(() =>
        plan
          .locator('.skill-grid .upgrade-icon img')
          .evaluateAll((imgs) => imgs.every((img) => (img as HTMLImageElement).naturalWidth > 0)),
      )
      .toBe(true)
    await expect(plan.locator('.skill-grid .mastery-mark')).toHaveCount(4)
    const mastery = plan.locator('.skill-grid .growth-range-trigger').first()
    await chooseRange(mastery, { to: 10 })
    await expect(mastery).toHaveAttribute('data-to', '10')
    await expect(
      plan.locator('.skill-grid .mastery-mark').first().locator('path[opacity="1"]'),
    ).toHaveCount(1)
    await expect(plan.locator('.skill-grid')).toBeVisible()
    expect(await plan.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await expect(
      plan.getByRole('button', { name: label('编辑天赋', 'Edit talents'), exact: true }),
    ).toHaveCount(1)
    await plan
      .getByRole('button', { name: label('编辑天赋', 'Edit talents'), exact: true })
      .first()
      .click()
    const dialog = page.getByRole('dialog', {
      name: label('选择天赋阵列', 'Select talents'),
      exact: true,
    })
    await expect(dialog.locator('.talent-branch')).toHaveCount(5)
    await expect(dialog.locator('.talent-node')).toHaveCount(12)
    const clear = dialog.getByRole('button', {
      name: label('清除计划天赋', 'Clear planned talents'),
      exact: true,
    })
    await clear.click()
    const node = (id: string) => dialog.locator(`[data-node="${id}"]`)
    const first = node('chr_0026_lastrite_talent_1_1')
    const second = node('chr_0026_lastrite_talent_1_2')
    await second.click()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
    await expect(second).toHaveAttribute('aria-pressed', 'true')
    await first.click()
    await expect(second).toHaveAttribute('aria-pressed', 'false')
    await node('chr_0026_lastrite_7').click()
    await expect(node('chr_0026_lastrite_1')).toHaveAttribute('aria-pressed', 'false')
    await dialog.getByRole('button', { name: label('当前', 'Current'), exact: true }).click()
    await expect(node('chr_0026_lastrite_7')).toBeDisabled()
    await node('chr_0026_lastrite_1').click()
    await first.click()
    await node('fac_chr_0026_lastrite_0_1').click()
    await dialog.getByRole('button', { name: label('目标', 'Target'), exact: true }).click()
    await expect(first).toBeDisabled()
    await second.focus()
    await second.press('Space')
    await expect(second).toHaveAttribute('aria-pressed', 'true')
    await expect(first).toHaveClass(/owned/)
    await dialog.getByRole('button', { name: label('全选', 'Select all'), exact: true }).click()
    await expect(dialog.locator('.talent-node[aria-pressed="true"]')).toHaveCount(12)
    await expect(
      dialog.getByRole('button', { name: label('完成选择', 'Done'), exact: true }),
    ).toHaveCount(0)
    const done = dialog.getByRole('button', {
      name: label('关闭此对话框', 'Close this dialog'),
      exact: true,
    })
    const box = await done.boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('talent-branches.png') })
    await clear.click()
    await expect(dialog.locator('.talent-node.owned')).toHaveCount(3)
    await expect(dialog.locator('.talent-node.planned')).toHaveCount(0)
    await done.click()
    await expect(plan.locator('.preview-node.owned')).toHaveCount(3)
    await expect(plan.locator('.preview-node.planned')).toHaveCount(0)
  })
}
for (const theme of ['light', 'dark']) {
  test(`${theme}: operator filters follow official groups and stay active while collapsed`, async ({
    page,
  }, testInfo) => {
    const english = theme === 'dark'
    await page.addInitScript(
      ({ theme, english }) => {
        localStorage.setItem('eason-theme', theme)
        localStorage.setItem('eason-locale', english ? 'en' : 'zh-CN')
      },
      { theme, english },
    )
    if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 700 })
    await page.goto(growthPath)
    await page.getByRole('button', { name: /^(添加目标|Add targets)$/, exact: true }).click()
    const dialog = page.getByRole('dialog')
    const panel = dialog.locator('.selection-filter-panel')
    const summary = panel.locator('summary')
    await expect(panel).not.toHaveAttribute('open', '')
    await expect(panel.locator('fieldset').first()).not.toBeVisible()
    await summary.focus()
    await summary.press('Enter')
    const rarities = panel.locator('.rarity-options button')
    const elements = panel.locator('.element-options button')
    const professions = panel.locator('.profession-options button')
    await expect(rarities).toHaveText(['6', '5', '4'])
    await expect(elements).toHaveText(
      english
        ? ['Physical', 'Nature', 'Cryo', 'Electric', 'Heat']
        : ['物理', '自然', '寒冷', '电磁', '灼热'],
    )
    await expect(professions).toHaveText(
      english
        ? ['Defender', 'Supporter', 'Caster', 'Striker', 'Vanguard', 'Guard']
        : ['重装', '辅助', '术师', '突击', '先锋', '近卫'],
    )
    await expect
      .poll(() =>
        elements
          .nth(1)
          .locator('img')
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0)
    await expect
      .poll(() =>
        professions
          .nth(1)
          .locator('img')
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0)
    await rarities.nth(0).click()
    await rarities.nth(1).click()
    await elements.nth(1).click()
    await elements.nth(2).click()
    await professions.nth(1).click()
    const choices = dialog.locator('.entity-choice')
    expect((await choices.locator('.choice-name').allTextContents()).sort()).toEqual(
      (english ? ['Ardelia', 'Gilberta', 'Xaihi'] : ['艾尔黛拉', '洁尔佩塔', '赛希']).sort(),
    )
    const selected = dialog.getByRole('button', {
      name: english ? 'Select Gilberta' : '选择 洁尔佩塔',
      exact: true,
    })
    await selected.click()
    await summary.click()
    await expect(panel).not.toHaveAttribute('open', '')
    await expect(summary).toContainText(english ? '5 active' : '已启用 5 项')
    await expect(choices).toHaveCount(3)
    await expect(selected).toHaveAttribute('aria-pressed', 'true')
    await page.screenshot({ path: testInfo.outputPath('operator-filters-collapsed.png') })
    await summary.click()
    await expect(elements.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await rarities.nth(0).click()
    await expect(choices).toHaveCount(1)
    await expect(choices).toContainText(english ? 'Xaihi' : '赛希')
    await rarities.nth(0).click()
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('operator-filters-expanded.png') })
    await dialog.locator('.selection-footer button').click()
    await page.getByRole('button', { name: /^(添加目标|Add targets)$/, exact: true }).click()
    await expect(panel).not.toHaveAttribute('open', '')
    await expect(dialog.locator('.active-filter-count')).toHaveCount(0)
    await expect(selected).toHaveAttribute('aria-pressed', 'true')
  })
}

async function selectGilberta(page: import('@playwright/test').Page) {
  await expect(page.getByRole('button', { name: '添加目标', exact: true })).toHaveCount(1)
  await page.getByRole('button', { name: '添加目标', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('searchbox').fill('洁尔佩塔')
  await dialog.getByRole('button', { name: '选择 洁尔佩塔', exact: true }).click()
  await dialog.getByRole('button', { name: '完成选择', exact: true }).click()
  return page.getByRole('article', { name: '洁尔佩塔', exact: true })
}

async function resetOptionalCosts(plan: import('@playwright/test').Locator) {
  const skills = plan.locator('.skill-grid .growth-range-trigger')
  for (let i = 0; i < (await skills.count()); i++) await chooseRange(skills.nth(i), { to: 1 })
  await plan.getByRole('button', { name: '编辑天赋', exact: true }).first().click()
  const talents = plan.page().getByRole('dialog', { name: '选择天赋阵列', exact: true })
  await talents.getByRole('button', { name: '清除计划天赋', exact: true }).click()
  await talents.getByRole('button', { name: '关闭此对话框', exact: true }).click()
}

test('growth lives beside essence, calculates exact level costs and shares manual inventory', async ({
  page,
}) => {
  await page.goto('/game/hypergryph/endfield')
  await page.getByRole('link', { name: '养成计算器', exact: true }).click()
  await expect(page).toHaveURL(growthPath)
  const plan = await selectGilberta(page)
  await resetOptionalCosts(plan)
  const target = plan.locator('.level-row .growth-range-trigger').first()
  await chooseRange(target, { to: 2 })
  await page.getByRole('button', { name: '开始计算', exact: true }).click()
  const row = page.locator('[data-material="item_expcard_stage1_high"]')
  await expect(row).toContainText('高级作战记录')
  await expect(row.locator('td').last()).toHaveText('-1')
  await row.getByRole('spinbutton').fill('1')
  await row.getByRole('spinbutton').blur()
  await expect(row.locator('td').last()).toHaveText('0')
  await page.getByRole('link', { name: '基质计算器', exact: true }).click()
  await expect(page.getByRole('heading', { name: /^基质计算器/, level: 1 })).toBeVisible()
  await page.getByRole('link', { name: '养成计算器', exact: true }).click()
  await expect(plan).toBeVisible()
  await expect(target).toHaveAttribute('data-to', '2')
  await page.getByRole('button', { name: '武器养成', exact: true }).click()
  await expect(page.getByText('选择目标，开始规划养成')).toBeVisible()
  await page.getByRole('button', { name: '干员养成', exact: true }).click()
  await expect(plan).toBeVisible()
})

test('selection is searchable, bounded to eight, cancellable and removable', async ({ page }) => {
  await page.goto(growthPath)
  await page.getByRole('button', { name: '添加目标', exact: true }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('searchbox').fill('no-such-operator')
  await expect(dialog.getByRole('status')).toContainText('没有找到')
  await dialog.getByRole('searchbox').fill('')
  const choices = dialog.locator('.entity-choice')
  for (let i = 0; i < 8; i++) await choices.nth(i).click()
  await expect(choices.nth(8)).toBeDisabled()
  await expect(choices.nth(0)).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('article')).toHaveCount(0)
  const plan = await selectGilberta(page)
  await plan.getByRole('button', { name: '移除 洁尔佩塔', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(0)
})

test('presets, talent edits, linked weapons and breakdown produce usable results', async ({
  page,
}) => {
  await page.goto(growthPath)
  const plan = await selectGilberta(page)
  await plan.getByRole('button', { name: '卓越', exact: true }).click()
  await expect(plan.locator('.level-row .growth-range-trigger').first()).toHaveAttribute(
    'data-to',
    '90',
  )
  await chooseOption(page, plan.getByLabel('配套武器', { exact: true }), '全自动骇新星')
  await expect(plan.getByRole('article')).toBeVisible()
  await page.getByRole('button', { name: '开始计算', exact: true }).click()
  await expect(page.locator('[data-material="item_weapon_expcard_high"]')).toBeVisible()
  await page.getByText('资源消耗明细', { exact: true }).click()
  await expect(page.getByRole('heading', { name: '配套武器升级', exact: true })).toBeVisible()
  await expect(page.locator('[data-material="item_char_skill_crown"]')).toContainText('24')
})

test('advanced and expert presets show their difference and immediately update resource costs', async ({
  page,
}, testInfo) => {
  await page.goto(growthPath)
  const plan = await selectGilberta(page)
  await chooseOption(page, plan.getByLabel('配套武器', { exact: true }), '全自动骇新星')
  const summary = plan.locator('.preset-summary').first()
  const level = plan.locator('.level-row .growth-range-trigger').first()
  const weapon = plan.getByRole('article')
  await plan.getByRole('button', { name: '进阶', exact: true }).first().click()
  await expect(summary).toHaveText('等级 80 · 技能 9')
  await expect(level).toHaveAttribute('data-to', '80')
  await expect(weapon.locator('.plan-presets')).toHaveCount(0)
  await expect(weapon.locator('.level-row .growth-range-trigger')).toHaveAttribute('data-to', '80')
  await page.getByRole('button', { name: '开始计算', exact: true }).click()
  const exp = page.locator('[data-material="item_expcard_stage2_high"] td').first()
  const weaponExp = page.locator('[data-material="item_weapon_expcard_high"] td').first()
  const before = await exp.innerText()
  const beforeWeapon = await weaponExp.innerText()
  await plan.getByRole('button', { name: '精通', exact: true }).first().click()
  await expect(summary).toHaveText('等级 90 · 技能 9')
  await expect(level).toHaveAttribute('data-to', '90')
  await expect(weapon.locator('.level-row .growth-range-trigger')).toHaveAttribute('data-to', '90')
  for (const skill of await plan.locator('.skill-grid .growth-range-trigger').all()) {
    await expect(skill).toHaveAttribute('data-to', '9')
  }
  await expect(exp).not.toHaveText(before)
  await expect(weaponExp).not.toHaveText(beforeWeapon)
  await plan.getByRole('button', { name: '进阶', exact: true }).first().click()
  await expect(exp).toHaveText(before)
  await expect(weaponExp).toHaveText(beforeWeapon)
  await plan.locator('.plan-presets').first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('preset-description.png') })
  await plan.getByRole('button', { name: '卓越', exact: true }).first().click()
  await expect(summary).toHaveText('等级 90 · 技能 专精 3 阶')
  await chooseRange(level, { to: 85 })
  await expect(summary).not.toBeVisible()
})

for (const language of ['zh-CN', 'en'])
  for (const theme of ['light', 'dark']) {
    test(`${language} ${theme}: selection, populated results and narrow layout`, async ({
      page,
    }, testInfo) => {
      await page.addInitScript(
        ({ language, theme }) => {
          localStorage.setItem('eason-locale', language)
          localStorage.setItem('eason-theme', theme)
        },
        { language, theme },
      )
      await page.goto(growthPath)
      await page.getByRole('button', { name: /^(添加目标|Add targets)$/, exact: true }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('searchbox').fill('Gilberta')
      await dialog.locator('.entity-choice').click()
      await dialog.locator('.selection-footer button').click()
      await page.locator('.plan-presets button').last().click()
      await page.locator('.calculate-bar button').click()
      await expect(page.locator('.resource-table')).toBeVisible()
      if (testInfo.project.name === 'mobile')
        await page.setViewportSize({ width: 320, height: 850 })
      const header = page.locator('.plan-heading').first()
      const portrait = (await header.locator('.plan-portrait').boundingBox())!
      const presets = (await header.locator('.plan-presets').boundingBox())!
      expect(presets.x).toBeGreaterThan(portrait.x + portrait.width)
      const firstPreset = (await header.locator('.plan-presets button').first().boundingBox())!
      expect(firstPreset.x - portrait.x - portrait.width).toBeLessThanOrEqual(16)
      await header.screenshot({ path: testInfo.outputPath('compact-plan-header.png') })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await page.evaluate(() => {
        ;(document.activeElement as HTMLElement)?.blur()
        window.scrollTo(0, 0)
      })
      await page.screenshot({ path: testInfo.outputPath('growth.png'), fullPage: true })
      await page.getByRole('button', { name: /^(添加目标|Add targets)$/, exact: true }).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await expect(dialog).toBeVisible()
      await page.screenshot({
        path: testInfo.outputPath('selection.png'),
        fullPage: true,
        animations: 'disabled',
      })
    })
  }

test('equipment adaptation is independent and basic clears optional talents', async ({ page }) => {
  await page.goto(growthPath)
  const plan = await selectGilberta(page)
  await resetOptionalCosts(plan)
  const target = plan.locator('.level-row .growth-range-trigger').first()
  await chooseRange(target, { to: 20 })
  await chooseRange(target, { from: 20 })
  await plan.locator('.stage-details > summary').click()
  await chooseOption(
    page,
    plan.getByRole('combobox', { name: '当前 突破阶段', exact: true }),
    '阶段 1',
  )
  await chooseOption(
    page,
    plan.getByRole('combobox', { name: '当前 装备适配', exact: true }),
    '阶段 0',
  )
  await page.getByRole('button', { name: '开始计算', exact: true }).click()
  await expect(page.locator('[data-material="item_gold"] td').first()).toHaveText('1,600')
  await chooseOption(
    page,
    plan.getByRole('combobox', { name: '当前 装备适配', exact: true }),
    '阶段 1',
  )
  await expect(page.getByText('已达成养成目标', { exact: true })).toBeVisible()
  await plan.getByRole('button', { name: '卓越', exact: true }).click()
  await plan.getByRole('button', { name: '基础', exact: true }).click()
  await expect(plan.locator('.talent-empty')).toBeVisible()
})

test('official default, preset weapon level, signed surplus and history restoration', async ({
  page,
}) => {
  await page.goto(growthPath)
  const plan = await selectGilberta(page)
  await expect(plan.getByRole('button', { name: '卓越', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(plan.locator('.level-row .growth-range-trigger').first()).toHaveAttribute(
    'data-to',
    '90',
  )
  await plan.getByRole('button', { name: '基础', exact: true }).click()
  await chooseOption(page, plan.getByLabel('配套武器', { exact: true }), '全自动骇新星')
  await expect(
    plan.getByRole('article').locator('.level-row .growth-range-trigger'),
  ).toHaveAttribute('data-to', '60')
  await page.getByRole('button', { name: '开始计算', exact: true }).click()
  const gold = page.locator('[data-material="item_gold"]')
  await gold.getByRole('spinbutton').fill('9999999')
  await gold.getByRole('spinbutton').blur()
  await expect(gold.locator('td').last()).toHaveText(/^\+/)
  await page.getByLabel('扣除手动库存').uncheck()
  await expect(gold.getByRole('spinbutton')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '所需资源总览', exact: true })).toBeVisible()
  await page.reload()
  await page.getByText('最近查看 · 1', { exact: true }).click()
  await page.locator('.recent-list button').click()
  await expect(
    plan.getByRole('article').locator('.level-row .growth-range-trigger'),
  ).toHaveAttribute('data-to', '60')
  await expect(page.locator('[data-material="item_gold"] input')).toHaveValue('0')
})

test('filters combine, switching targets retains independent edits and deleting selects a neighbor', async ({
  page,
}) => {
  await page.goto(growthPath)
  await page.getByRole('button', { name: '添加目标', exact: true }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: '完成选择', exact: true })).toBeDisabled()
  await dialog.locator('.selection-filter-panel > summary').click()
  await dialog.getByRole('button', { name: '自然', exact: true }).click()
  await dialog.getByRole('button', { name: '辅助', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '选择 洁尔佩塔', exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: '选择 洁尔佩塔', exact: true }).click()
  await dialog.getByRole('button', { name: '自然', exact: true }).click()
  await dialog.getByRole('button', { name: '辅助', exact: true }).click()
  await dialog.getByRole('searchbox').fill('伊冯')
  await dialog.locator('.entity-choice').click()
  await dialog.getByRole('button', { name: '完成选择', exact: true }).click()
  const target = page.locator('.level-row .growth-range-trigger').first()
  await chooseRange(target, { to: 75 })
  await expect(page.getByText('自定义', { exact: true })).toBeVisible()
  await page.locator('.target-tabs button').nth(1).click()
  await expect(target).toHaveAttribute('data-to', '90')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.locator('.target-tabs button').nth(0).click()
  await expect(target).toHaveAttribute('data-to', '75')
  await page.getByRole('button', { name: '移除 洁尔佩塔', exact: true }).click()
  await expect(page.getByRole('article', { name: '伊冯', exact: true })).toBeVisible()
})

test('selection overlay covers the viewport and confirmation stays reachable in short windows', async ({
  page,
}, testInfo) => {
  await page.goto(growthPath)
  for (const viewport of [
    { width: 1280, height: 600 },
    { width: 844, height: 390 },
    { width: 320, height: 480 },
    { width: 640, height: 240 },
  ]) {
    await page.setViewportSize(viewport)
    await page.getByRole('button', { name: '添加目标', exact: true }).first().click()
    const dialog = page.getByRole('dialog')
    const overlay = page.locator('.el-overlay').filter({ has: dialog })
    await expect(dialog).toBeVisible()
    await expect
      .poll(async () => {
        const rect = await overlay.boundingBox()
        return (
          rect &&
          Math.abs(rect.x) < 1 &&
          Math.abs(rect.y) < 1 &&
          Math.abs(rect.width - viewport.width) < 1 &&
          Math.abs(rect.height - viewport.height) < 1
        )
      })
      .toBe(true)
    const confirm = dialog.getByRole('button', { name: '完成选择', exact: true })
    await expect(confirm).toBeInViewport({ ratio: 1 })
    const choice = dialog.locator('.entity-choice').last()
    await choice.click()
    await expect(confirm).toBeEnabled()
    await expect(confirm).toBeInViewport({ ratio: 1 })
    const box = await confirm.boundingBox()
    expect(
      await confirm.evaluate(
        (button, point) =>
          button.contains(
            document.elementFromPoint(point!.x + point!.width / 2, point!.y + point!.height / 2),
          ),
        box,
      ),
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`dialog-${viewport.width}x${viewport.height}.png`),
    })
    await confirm.click()
    await expect(dialog).not.toBeVisible()
    await page.getByRole('button', { name: '清空当前清单', exact: true }).click()
  }
})

test('lower-tier inventory converts with remainder, toggles cleanly, and uses material artwork', async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.addInitScript(() => localStorage.setItem('eason-theme', 'dark'))
  }
  await page.goto(growthPath)
  const plan = await selectGilberta(page)
  await resetOptionalCosts(plan)
  const target = plan.locator('.level-row .growth-range-trigger').first()
  await chooseRange(target, { to: 2 })
  await page.getByRole('button', { name: '开始计算', exact: true }).click()
  const row = page.locator('[data-material="item_expcard_stage1_high"]')
  await expect(row.locator('img')).toBeVisible()
  await expect
    .poll(() => row.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
  await page.getByText('低阶经验材料库存', { exact: true }).click()
  const lowIcon = page.locator('[data-conversion="item_expcard_stage1_high"] img').first()
  await expect(lowIcon).toBeVisible()
  await expect
    .poll(() => lowIcon.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
  await page.getByRole('spinbutton', { name: '初级作战记录 已有数量', exact: true }).fill('49')
  await page.getByRole('spinbutton', { name: '初级作战记录 已有数量', exact: true }).blur()
  await expect(row.locator('td').last()).toHaveText('-1')
  await page.getByRole('spinbutton', { name: '中级作战记录 已有数量', exact: true }).fill('1')
  await page.getByRole('spinbutton', { name: '中级作战记录 已有数量', exact: true }).blur()
  await expect(row.locator('td').last()).toHaveText('0')
  await expect(page.locator('[data-conversion="item_expcard_stage1_high"]')).toContainText(
    '余 800 点经验',
  )
  await expect(row.getByRole('spinbutton')).toHaveValue('0')
  await page.getByLabel('扣除手动库存').uncheck()
  await expect(page.locator('.resource-overview')).toContainText('1')
  await page.getByLabel('扣除手动库存').check()
  await expect(row.locator('td').last()).toHaveText('0')
  await page.getByText('低阶经验材料库存', { exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page
    .locator('.result-column')
    .screenshot({ path: testInfo.outputPath('experience-inventory.png') })
})

test('weapon choices use contained game artwork and still select when images fail', async ({
  page,
}) => {
  await page.goto(growthPath)
  await page.getByRole('button', { name: '武器养成', exact: true }).click()
  await page.getByRole('button', { name: '添加目标', exact: true }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('.selection-filter-panel > summary').click()
  await dialog.getByRole('button', { name: '施术单元', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '选择 爆破单元', exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '选择 白夜新星', exact: true })).toHaveCount(0)
  await dialog.getByRole('button', { name: '施术单元', exact: true }).click()
  const choice = dialog.locator('.entity-choice').first()
  const portrait = choice.locator('.growth-weapon-portrait')
  await expect(portrait).toHaveAttribute('title', '6 星')
  await expect(portrait).toHaveCSS('border-bottom-color', 'rgb(255, 113, 0)')
  await expect(choice.locator('small')).toHaveCount(0)
  const portraitBounds = await portrait.boundingBox()
  const nameBounds = await choice.locator('.choice-name').boundingBox()
  expect(nameBounds!.y).toBeGreaterThanOrEqual(portraitBounds!.y + portraitBounds!.height)
  expect(
    Math.abs(nameBounds!.x + nameBounds!.width / 2 - portraitBounds!.x - portraitBounds!.width / 2),
  ).toBeLessThan(1)
  const img = choice.locator('img')
  await expect
    .poll(() => img.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
  await expect(img).toHaveCSS('object-fit', 'contain')
  await img.dispatchEvent('error')
  await expect(choice.locator('.operator-initial')).toBeVisible()
  await expect(portrait).toHaveCSS('border-bottom-color', 'rgb(255, 113, 0)')
  await choice.click()
  await dialog.getByRole('button', { name: '完成选择', exact: true }).click()
  await expect(page.getByRole('article')).toBeVisible()
  await expect(page.locator('.target-tabs .growth-weapon-portrait')).toHaveCSS(
    'border-bottom-color',
    'rgb(255, 113, 0)',
  )
  await expect(page.getByRole('article').locator('.growth-weapon-portrait')).toHaveCSS(
    'border-bottom-color',
    'rgb(255, 113, 0)',
  )
})

for (const theme of ['light', 'dark']) {
  test(`${theme}: weapon filter buttons combine rarities, toggle type and retain draft choices`, async ({
    page,
  }, testInfo) => {
    const english = theme === 'dark'
    await page.addInitScript(
      ({ theme, english }) => {
        localStorage.setItem('eason-theme', theme)
        localStorage.setItem('eason-locale', english ? 'en' : 'zh-CN')
      },
      { theme, english },
    )
    if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 700 })
    await page.goto(growthPath)
    await page.getByRole('button', { name: english ? 'Weapons' : '武器养成', exact: true }).click()
    await page.getByRole('button', { name: /^(添加目标|Add targets)$/, exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('.selection-filter-panel')).not.toHaveAttribute('open', '')
    await dialog.locator('.selection-filter-panel > summary').click()
    const types = dialog.locator('.selection-filter-groups fieldset').last().getByRole('button')
    await expect(types).toHaveText(
      english
        ? ['Handcannon', 'Greatsword', 'Arts Unit', 'Sword', 'Polearm']
        : ['手铳', '双手剑', '施术单元', '单手剑', '长柄武器'],
    )
    await expect(dialog.getByRole('combobox')).toHaveCount(0)
    const choices = dialog.locator('.entity-choice')
    const allCount = await choices.count()
    const rarities = dialog.locator('.rarity-options button')
    await rarities.nth(0).click()
    await rarities.nth(1).focus()
    await rarities.nth(1).press('Space')
    await expect(rarities.nth(0)).toHaveAttribute('aria-pressed', 'true')
    await expect(rarities.nth(1)).toHaveAttribute('aria-pressed', 'true')
    const visibleRarities = await choices
      .locator('.growth-weapon-portrait')
      .evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('title')))])
    expect(visibleRarities.sort()).toEqual(english ? ['5-star', '6-star'] : ['5 星', '6 星'])
    await types.nth(2).click()
    const filteredCount = await choices.count()
    await dialog.locator('.selection-filter-panel > summary').click()
    await expect(dialog.locator('.active-filter-count')).toHaveText(
      english ? '3 active' : '已启用 3 项',
    )
    await expect(choices).toHaveCount(filteredCount)
    await dialog.locator('.selection-filter-panel > summary').click()
    const selected = dialog.getByRole('button', {
      name: english ? 'Select Detonation Unit' : '选择 爆破单元',
      exact: true,
    })
    await expect(selected).toBeVisible()
    await selected.click()
    await types.nth(0).click()
    await expect(types.nth(2)).toHaveAttribute('aria-pressed', 'false')
    await expect(types.nth(0)).toHaveAttribute('aria-pressed', 'true')
    await expect(selected).toHaveCount(0)
    await types.nth(0).click()
    await expect(selected).toHaveAttribute('aria-pressed', 'true')
    await rarities.nth(0).click()
    await rarities.nth(1).click()
    await expect(choices).toHaveCount(allCount)
    await dialog.getByRole('searchbox').fill('爆破单元')
    await expect(choices).toHaveCount(1)
    await expect(selected).toHaveAttribute('aria-pressed', 'true')
    await dialog.getByRole('searchbox').fill('')
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('weapon-filters.png') })
    await dialog.locator('.selection-footer button').click()
    await expect(page.getByRole('article')).toBeVisible()
    const plan = page.getByRole('article')
    await expect(plan.locator('.plan-presets, .preset-caption, .preset-summary')).toHaveCount(0)
    await expect(plan.getByText(/Changing presets|切换培养期望/)).toHaveCount(0)
    await expect(
      plan.getByRole('img', { name: english ? '6-star' : '6 星', exact: true }),
    ).toBeVisible()
    await expect(plan.locator('.weapon-rarity svg')).toHaveCount(6)
    const level = plan.locator('.level-row .growth-range-trigger')
    await chooseRange(level, { from: 20, to: 80 })
    await expect(level).toHaveAttribute('data-from', '20')
    await expect(level).toHaveAttribute('data-to', '80')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await plan
      .locator('.plan-heading')
      .screenshot({ path: testInfo.outputPath('weapon-header.png') })
  })
}

for (const theme of ['light', 'dark']) {
  test(`${theme}: themed selects and filters support keyboard and disabled states`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((theme) => localStorage.setItem('eason-theme', theme), theme)
    if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 600 })
    await page.goto(growthPath)
    const plan = await selectGilberta(page)
    const target = plan.locator('.level-row .growth-range-trigger').first()
    await chooseRange(target, { to: 80 })
    await plan.locator('.stage-details > summary').click()
    const stage = plan.getByRole('combobox', { name: '目标 突破阶段', exact: true })
    await stage.focus()
    await stage.press('Enter')
    await expect(page.getByRole('option', { name: '阶段 4', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await stage.press('ArrowUp')
    await stage.press('Enter')
    await expect(
      plan
        .locator('.overview-select')
        .filter({ has: page.getByRole('combobox', { name: '目标 突破阶段', exact: true }) }),
    ).toContainText('阶段 3')
    await stage.locator('xpath=ancestor::div[contains(@class, "el-select__wrapper")]').click()
    await expect(page.getByRole('option', { name: '阶段 3', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.locator('.overview-select-menu.el-popper:visible')).toHaveCSS('opacity', '1')
    const selectedLabel = stage
      .locator('xpath=ancestor::div[contains(@class, "el-select__wrapper")]')
      .locator('.el-select__placeholder')
    expect(await selectedLabel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath('stage-dropdown.png'),
      animations: 'disabled',
    })
    await stage.press('Escape')
    await expect(page.getByRole('listbox')).not.toBeVisible()
    await expect(stage).toBeFocused()
    await plan.getByRole('button', { name: '编辑天赋', exact: true }).first().click()
    const talentDialog = page.getByRole('dialog', { name: '选择天赋阵列', exact: true })
    await talentDialog.getByRole('button', { name: '当前', exact: true }).click()
    for (const node of await talentDialog.locator('.talent-node').all())
      await expect(node).toBeDisabled()
    await talentDialog.getByRole('button', { name: '关闭此对话框', exact: true }).click()
    await page.getByRole('button', { name: '添加目标', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('.selection-filter-panel > summary').click()
    const rarity = dialog.getByRole('button', { name: '4 星', exact: true })
    await rarity.focus()
    await rarity.press('Space')
    await expect(rarity).toHaveAttribute('aria-pressed', 'true')
    await expect(dialog.getByRole('combobox')).toHaveCount(0)
    await expect(dialog.locator('.entity-choice').first()).toBeVisible()
    const portraits = dialog.locator('.endfield-operator-portrait')
    await expect(portraits).toHaveCount(await dialog.locator('.entity-choice').count())
    for (const portrait of await portraits.all()) {
      await expect(portrait).toHaveAttribute('title', '4 星')
      await expect(portrait).toHaveCSS('border-bottom-color', 'rgb(179, 128, 255)')
    }
    await expect(page.locator('select')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const theme of ['light', 'dark']) {
  test(`${theme}: growth operator portraits share Skland element badges and rarity strips`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((theme) => localStorage.setItem('eason-theme', theme), theme)
    if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 700 })
    await page.goto(growthPath)
    await page.getByRole('button', { name: '添加目标', exact: true }).first().click()
    const dialog = page.getByRole('dialog')
    const firstChoice = await dialog.locator('.entity-choice').first().boundingBox()
    expect(firstChoice!.height).toBeLessThanOrEqual(74)
    const columns = await dialog
      .locator('.selection-grid')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    expect(columns).toBe(testInfo.project.name === 'mobile' ? 3 : 10)
    await dialog.getByRole('searchbox', { name: '搜索干员', exact: true }).fill('洁尔佩塔')
    const choice = dialog.getByRole('button', { name: '选择 洁尔佩塔', exact: true })
    const portrait = choice.locator('.endfield-operator-portrait')
    const portraitBounds = await portrait.boundingBox()
    const nameBounds = await choice.locator('.choice-name').boundingBox()
    expect(nameBounds!.y).toBeGreaterThan(portraitBounds!.y + portraitBounds!.height)
    expect(
      Math.abs(
        nameBounds!.x + nameBounds!.width / 2 - portraitBounds!.x - portraitBounds!.width / 2,
      ),
    ).toBeLessThan(1)

    await expect(portrait).toHaveAttribute('title', '6 星')
    await expect(portrait).toHaveCSS('border-bottom-color', 'rgb(255, 113, 0)')
    await expect(portrait.locator('.member-element')).toHaveAttribute('aria-label', '自然')
    const profession = portrait.locator('.member-profession')
    await expect(profession).toHaveAttribute('aria-label', '辅助')
    await expect(profession.locator('img')).toHaveAttribute('src', /ef-char-profession-supporter/)
    await expect
      .poll(() => profession.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0)
    const elementBox = await portrait.locator('.member-element').boundingBox()
    const professionBox = await profession.boundingBox()
    expect(Math.abs(elementBox!.x - professionBox!.x)).toBeLessThan(1)
    expect(elementBox!.y + elementBox!.height).toBeLessThan(professionBox!.y)

    await expect(portrait.locator('.member-element img')).toHaveAttribute(
      'src',
      /ef-char-element-nature/,
    )
    await expect
      .poll(() =>
        portrait
          .locator('.member-element img')
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0)
    await expect(portrait.locator('.member-level, .member-potential')).toHaveCount(0)
    await expect(choice.locator('small')).toHaveCount(0)
    await expect(choice.locator('.choice-check')).toHaveCount(0)
    await choice.click()
    await expect(choice).toHaveAttribute('aria-pressed', 'true')
    await expect(choice).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(choice).toHaveCSS('border-top-width', '0px')
    const check = choice.locator('.choice-portrait .choice-check')
    await expect(check).toBeVisible()
    const checkBox = await check.boundingBox()
    const avatarBox = await portrait.boundingBox()
    expect(checkBox!.x).toBeGreaterThan(professionBox!.x + professionBox!.width)
    expect(checkBox!.y).toBeLessThan(avatarBox!.y + 2)
    expect(checkBox!.x + checkBox!.width).toBeLessThanOrEqual(avatarBox!.x + avatarBox!.width + 2)
    const ring = await choice.locator('.choice-portrait').evaluate((el) => ({
      color: getComputedStyle(el, '::after').borderTopColor,
      width: getComputedStyle(el, '::after').borderTopWidth,
    }))
    expect(ring.width).toBe('2px')
    await expect(check).toHaveCSS('background-color', ring.color)
    await choice.click()
    await expect(choice).toHaveAttribute('aria-pressed', 'false')
    await expect(choice.locator('.choice-check')).toHaveCount(0)

    // The network fixture blocks remote portraits while allowing local badge assets.
    await expect(portrait.locator('.operator-initial')).toBeVisible()
    await expect(portrait.locator('.member-element')).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath('operator-portrait.png'),
      animations: 'disabled',
    })
    await choice.click()
    await dialog.getByRole('button', { name: '完成选择', exact: true }).click()
    for (const owner of [
      page.locator('.target-tabs'),
      page.getByRole('article', { name: '洁尔佩塔', exact: true }),
    ]) {
      await expect(owner.locator('.endfield-operator-portrait')).toHaveCSS(
        'border-bottom-color',
        'rgb(255, 113, 0)',
      )
      await expect(owner.locator('.member-element')).toHaveAttribute('aria-label', '自然')
      await expect(owner.locator('.member-profession')).toHaveAttribute('aria-label', '辅助')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
