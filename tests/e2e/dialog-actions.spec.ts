import { test, expect, reply, user, deferred } from './fixtures'

for (const theme of ['light', 'dark']) {
  test(`${theme}: account dialog keeps submit, pending protection and close behavior`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((value) => localStorage.setItem('eason-theme', value), theme)
    if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 560 })
    await page.route('**/api/user/current', (route) => reply(route, user))
    const started = deferred()
    const finish = deferred()
    let requests = 0
    await page.route('**/api/game/hypergryph/account', async (route) => {
      requests++
      started.resolve()
      await finish.promise
      await reply(route, null, 503)
    })
    await page.goto('/user')
    await page.getByRole('button', { name: '管理鹰角账号', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const close = dialog.getByRole('button', { name: '关闭此对话框', exact: true })
    const submit = dialog.getByRole('button', { name: '更新鹰角登录', exact: true })
    await expect(dialog.locator('.el-dialog__close')).toHaveCSS('font-size', '24px')
    const closeBox = (await close.boundingBox())!
    expect(closeBox.width).toBeCloseTo(44, 1)
    expect(closeBox.height).toBeCloseTo(44, 1)
    await dialog.getByText('密码登录', { exact: true }).click()
    await expect(dialog.getByRole('radio', { name: '密码登录', exact: true })).toBeChecked()
    await dialog.getByLabel('鹰角密码', { exact: true }).fill('Synthetic1!')
    await submit.scrollIntoViewIfNeeded()
    await expect(submit).toHaveAttribute('type', 'submit')
    await page.screenshot({
      path: testInfo.outputPath('account-dialog.png'),
      animations: 'disabled',
    })
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    )
    await expect(dialog.getByRole('button', { name: '完成', exact: true })).toHaveCount(0)
    const submitBox = (await submit.boundingBox())!
    expect(submitBox.y + submitBox.height).toBeLessThanOrEqual(page.viewportSize()!.height)
    try {
      await submit.click()
      await started.promise
      await expect(submit).toHaveClass(/is-loading/)
      await expect(close).toHaveCount(0)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeVisible()
      expect(requests).toBe(1)
    } finally {
      finish.resolve()
    }
    await expect(submit).not.toHaveClass(/is-loading/)
    await close.click()
    await expect(dialog).toHaveCount(0)
    await page.getByRole('button', { name: '管理鹰角账号', exact: true }).click()
    await expect(page.getByLabel('鹰角密码', { exact: true })).toHaveValue('')
  })
}
