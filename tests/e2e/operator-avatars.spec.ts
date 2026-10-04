import { test, expect, reply, user, role, overview } from './fixtures'
import { readFileSync } from 'node:fs'

const avatar = 'https://bbs.hycdn.cn/public/skland-game/image/synthetic-avatar.png'
const changed = 'https://bbs.hycdn.cn/public/skland-game/image/synthetic-changed.png'
const broken = 'https://bbs.hycdn.cn/public/skland-game/image/synthetic-broken.png'
const png = readFileSync('src/assets/skland/ef-control.png')
for (const theme of ['light', 'dark']) {
  test(`Endfield uses API avatars and text fallbacks in ${theme}`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem('eason-theme', theme), theme)
    const account = { ...role(), appCode: 'endfield', gameId: '2' }
    let refreshed = false
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.route(avatar, (route) => route.fulfill({ contentType: 'image/png', body: png }))
    await page.route(changed, (route) => route.fulfill({ contentType: 'image/png', body: png }))
    await page.route(broken, (route) => route.abort())
    await page.route('**/api/user/current', (route) => reply(route, user))
    await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [account]))
    await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
      reply(route, {
        ...overview(),
        account,
        operators: [
          { id: 'chr_9000_endmin', name: '管理员', avatarUrl: refreshed ? changed : avatar },
          { id: 'failed', name: '失效头像', avatarUrl: refreshed ? changed : broken },
          { id: 'missing', name: '缺失头像' },
        ].map((char) => ({ ...char, level: 0, phase: 0 })),
      }),
    )
    await page.goto('/game/hypergryph/skland')
    const card = (id: string) => page.locator(`[data-operator-id="${id}"]`)
    const own = card('chr_9000_endmin').locator('img')
    await own.scrollIntoViewIfNeeded()
    await expect(own).toHaveAttribute('src', avatar)
    await expect(own).toHaveClass('loaded')
    await expect(card('chr_9000_endmin').locator('.operator-initial')).toHaveCount(0)
    await card('failed').scrollIntoViewIfNeeded()
    await expect(card('failed').locator('img')).toHaveCount(0)
    await expect(card('failed').locator('.operator-initial')).toHaveText('失')
    await expect(card('missing').locator('.operator-initial')).toHaveText('缺')
    await expect(card('missing').locator('img')).toHaveCount(0)
    refreshed = true
    await page.getByRole('button', { name: '刷新角色资料', exact: true }).click()
    for (const id of ['chr_9000_endmin', 'failed']) {
      const img = card(id).locator('img')
      await img.scrollIntoViewIfNeeded()
      await expect(img).toHaveAttribute('src', changed)
      await expect(img).toHaveClass('loaded')
      await expect(card(id).locator('.operator-initial')).toHaveCount(0)
    }
    expect(requests.some((url) => /chr_.*\.png|catalog\.json|game-avatars/.test(url))).toBe(false)
  })
}

test('Arknights generates official avatars for roster and support, including Amiya forms', async ({
  page,
}) => {
  const base = 'https://web.hycdn.cn/arknights/game/assets/'
  await page.route(`${base}**`, (route) => route.fulfill({ contentType: 'image/png', body: png }))
  await page.route('**/api/user/current', (route) => reply(route, user))
  await page.route('**/api/game/hypergryph/account/games', (route) => reply(route, [role()]))
  await page.route('**/api/game/hypergryph/account/overview?*', (route) =>
    reply(route, {
      ...overview(),
      operators: [
        'char_002_amiya',
        'char_1001_amiya2',
        'char_1037_amiya3',
        'char_99999_future',
      ].map((id) => ({ id, name: id, level: 1, phase: 0 })),
      sections: [
        {
          key: 'arknightsSupport',
          items: [
            {
              id: 'support',
              operatorId: 'char_002_amiya',
              name: '助战',
              level: null,
              status: 'unknown',
              current: null,
              total: null,
              completeAt: null,
            },
          ],
        },
      ],
    }),
  )
  await page.goto('/game/hypergryph/skland')
  for (const id of [
    'char_002_amiya',
    'char_1001_amiya2',
    'char_1037_amiya3',
    'char_99999_future',
  ]) {
    const img = page.locator(`[data-operator-id="${id}"] img`)
    await img.scrollIntoViewIfNeeded()
    await expect(img).toHaveAttribute(
      'src',
      `${base}${/amiya[23]$/.test(id) ? `char_skin/avatar/${id}%232` : `char/avatar/${id}`}.png`,
    )
    await expect(img).toHaveClass('loaded')
  }
  const support = page.locator('.facility-grid .operator-avatar img')
  await support.scrollIntoViewIfNeeded()
  await expect(support).toHaveAttribute('src', `${base}char/avatar/char_002_amiya.png`)
  await expect(support).toHaveClass('loaded')
})
