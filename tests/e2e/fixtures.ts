import { test as base, expect, type Page, type Route } from '@playwright/test'

// Synthetic fixtures only. Every API call is intercepted; these tests never sign in to a real service.
export const user = {
  id: 123,
  username: 'Test Explorer',
  email: 'test@example.invalid',
  phone: null,
  isAdmin: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  postAdmin: null,
  hypergryphAccount: {
    phone: '13800000000',
    userId: 123,
    createdAt: '2026-01-01',
    updatedAt: 'v1',
  },
}
export const role = (uid = 'fixture-a') => ({
  appCode: 'arknights',
  gameId: '1',
  uid,
  nickName: uid,
})
export const overview = (uid = 'fixture-a') => ({
  account: role(uid),
  fetchedAt: 1791000000,
  updatedAt: null,
  profile: {
    level: 120,
    worldLevel: null,
    registeredAt: null,
    lastOnlineAt: null,
    mainProgress: '',
  },
  metrics: [{ key: 'stamina', group: 'daily', current: 0, total: 135 }],
  sections: [],
  operators: [],
})
export const reply = (route: Route, data: unknown, status = 200) =>
  route.fulfill({ status, json: { message: 'Test response', data, httpStatus: status } })
export function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
export const test = base.extend<{ mockNetwork: void; applicationErrors: void }>({
  applicationErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await use()
      expect(errors).toEqual([])
    },
    { auto: true },
  ],
  mockNetwork: [
    async ({ context }, use) => {
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url())
        if (url.origin !== 'http://localhost:4173') return route.abort()
        if (url.pathname.startsWith('/api/')) return reply(route, null, 401)
        return route.continue()
      })
      await use()
    },
    { auto: true },
  ],
})
export async function fillLogin(page: Page) {
  await page.getByRole('textbox', { name: '用户名', exact: true }).fill('test-explorer')
  await page.getByRole('textbox', { name: '密码', exact: true }).fill('Synthetic1!')
}
export { expect }
