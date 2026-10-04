import { test, expect, reply, deferred, fillLogin } from './fixtures'

test('navigation intent wins even while the destination chunk is still loading', async ({
  page,
}) => {
  const loginStarted = deferred(),
    loginResponse = deferred()
  const homeStarted = deferred(),
    homeChunk = deferred()
  await page.route('**/api/user/login', async (route) => {
    loginStarted.resolve()
    await loginResponse.promise
    await reply(route, null)
  })
  await page.route('**/assets/IndexPage-*.js', async (route) => {
    homeStarted.resolve()
    await homeChunk.promise
    await route.continue()
  })
  await page.goto('/login')
  await fillLogin(page)
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await loginStarted.promise
  await page.getByRole('link', { name: 'Eason 首页' }).click()
  await homeStarted.promise
  loginResponse.resolve()
  await page.waitForTimeout(400)
  homeChunk.resolve()
  await expect(page).toHaveURL('/')
})

test('registration sends the submitted snapshot and returns to the selected tool', async ({
  page,
}) => {
  let body: unknown
  await page.route('**/api/user/username/*/exist', (route) => reply(route, false))
  await page.route('**/api/user/register', async (route) => {
    body = route.request().postDataJSON()
    await reply(route, null)
  })
  await page.goto('/register?redirect=%2Fgame%2Fhypergryph%2Fendfield')
  await fillLogin(page)
  await page.getByRole('textbox', { name: '邮箱', exact: true }).fill('test@example.invalid')
  await page.getByRole('textbox', { name: '确认密码', exact: true }).fill('Synthetic1!')
  await page.getByRole('textbox', { name: '邮箱验证码', exact: true }).fill('123456')
  await page.getByRole('button', { name: '注册账号', exact: true }).click()
  await expect(page).toHaveURL('/game/hypergryph/endfield')
  expect(body).toEqual({
    username: 'test-explorer',
    email: 'test@example.invalid',
    password: 'Synthetic1!',
    registrationCode: '123456',
  })
})

test('password reset returns to login with feedback and preserves the original destination', async ({
  page,
}) => {
  let body: unknown
  await page.route('**/api/user/password/reset', async (route) => {
    body = route.request().postDataJSON()
    await reply(route, null)
  })
  await page.goto('/reset-password?redirect=%2Fgame%2Fhypergryph%2Fskland')
  await page.getByRole('textbox', { name: '用户名', exact: true }).fill('test-explorer')
  await page.getByRole('textbox', { name: '邮箱', exact: true }).fill('test@example.invalid')
  await page.getByRole('textbox', { name: '新密码', exact: true }).fill('Synthetic1!')
  await page.getByRole('textbox', { name: '确认密码', exact: true }).fill('Synthetic1!')
  await page.getByRole('textbox', { name: '邮箱验证码', exact: true }).fill('123456')
  await page.getByRole('button', { name: '重置密码', exact: true }).click()
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await expect(page.locator('.auth-card .el-alert')).toContainText(/密码.*重置|重置.*密码/)
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/game/hypergryph/skland')
  expect(body).toEqual({
    username: 'test-explorer',
    email: 'test@example.invalid',
    password: 'Synthetic1!',
    code: '123456',
  })
})

test('late login response does not navigate after leaving the form', async ({ page }) => {
  const pending = deferred(),
    started = deferred()
  await page.route('**/api/user/login', async (route) => {
    started.resolve()
    await pending.promise
    await reply(route, null)
  })
  await page.goto('/login')
  await fillLogin(page)
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await started.promise
  await page.getByRole('link', { name: 'Eason 首页' }).click()
  await expect(page).toHaveURL('/')
  pending.resolve()
  // Allow the released response and any resulting router navigation to settle.
  await page.waitForTimeout(400)
  await expect(page).toHaveURL('/')
})

test('leaving registration during username check prevents a stale registration POST', async ({
  page,
}) => {
  const pending = deferred(),
    started = deferred()
  const bodies: unknown[] = []
  await page.route('**/api/user/username/*/exist', async (route) => {
    started.resolve()
    await pending.promise
    await reply(route, false)
  })
  await page.route('**/api/user/register', async (route) => {
    bodies.push(route.request().postDataJSON())
    await reply(route, null)
  })
  await page.goto('/login')
  await page.getByRole('link', { name: '注册账号', exact: true }).click()
  await fillLogin(page)
  await page.getByRole('textbox', { name: '邮箱', exact: true }).fill('test@example.invalid')
  await page.getByRole('textbox', { name: '确认密码', exact: true }).fill('Synthetic1!')
  await page.getByRole('textbox', { name: '邮箱验证码', exact: true }).fill('123456')
  await page.getByRole('button', { name: '注册账号', exact: true }).click()
  await started.promise
  await page.goBack()
  await expect(page).toHaveURL('/login')
  pending.resolve()
  await page.waitForTimeout(400)
  expect(bodies).toEqual([])
  await expect(page.getByRole('button', { name: '登录', exact: true })).toBeEnabled()
})

test('late verification response cannot add a notice or cooldown to another auth mode', async ({
  page,
}) => {
  const pending = deferred(),
    started = deferred()
  await page.route('**/api/user/email/verify', async (route) => {
    started.resolve()
    await pending.promise
    await reply(route, null)
  })
  await page.goto('/login')
  await page.getByRole('link', { name: '注册账号', exact: true }).click()
  await page.getByRole('textbox', { name: '邮箱', exact: true }).fill('test@example.invalid')
  await page.getByRole('button', { name: '发送验证码', exact: true }).click()
  await started.promise
  await page.goBack()
  pending.resolve()
  await page.waitForTimeout(400)
  await expect(page.locator('.auth-card .el-alert')).toHaveCount(0)
  await page.getByRole('link', { name: '注册账号', exact: true }).click()
  await expect(page.getByRole('button', { name: '发送验证码', exact: true })).toBeEnabled()
})
