import { test, expect, reply, user, fillLogin } from './fixtures'

test('login returns to the original tool and preserves the destination across auth links', async ({
  page,
}) => {
  await page.route('**/api/user/login', (route) => reply(route, null))
  await page.goto('/game/hypergryph/skland')
  await page.getByRole('link', { name: /前往登录|登录账号/ }).click()
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.getByRole('link', { name: '注册账号', exact: true }).click()
  await expect(page).toHaveURL(/\/register\?redirect=/)
  await page.getByRole('link', { name: '返回登录', exact: true }).click()
  await fillLogin(page)
  await page.route('**/api/user/current', (route) =>
    reply(route, { ...user, hypergryphAccount: null }),
  )
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page).toHaveURL('/game/hypergryph/skland')
})

test('parent routes redirect and missing pages have localized recovery links and titles', async ({
  page,
}) => {
  await page.goto('/game')
  await expect(page).toHaveURL('/game/hypergryph/endfield')
  await expect(page).toHaveTitle(/基质/)
  await page.goto('/game/hypergryph')
  await expect(page).toHaveURL('/game/hypergryph/endfield')
  await page.goto('/missing-page')
  await expect(page.getByRole('heading', { name: /页面不存在/ })).toBeVisible()
  await expect(page).toHaveTitle(/页面不存在/)
  await page.getByRole('button', { name: /切换语言/ }).click()
  await page.getByRole('menuitem', { name: 'English' }).click()
  await expect(page).toHaveTitle(/Page not found/)
  await page.getByRole('link', { name: 'Back to home', exact: true }).click()
  await expect(page).toHaveURL('/')
  await expect(page).toHaveTitle(/Make room/)
})
