import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSSRApp } from 'vue'
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'
import { renderToString } from '@vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { fileURLToPath } from 'node:url'

const vite = await createServer({
  configFile: false,
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})
after(() => vite.close())
const { i18n } = await vite.ssrLoadModule('/src/i18n/index.ts')
i18n.global.locale.value = 'zh-CN'
const { default: App } = await vite.ssrLoadModule('/src/App.vue')
const pages = [
  ['/', 'home/IndexPage.vue', /保持好奇/],
  ['/login', 'auth/AuthPage.vue', /登录/],
  ['/user', 'user/userPage.vue', /el-skeleton/],
  ['/game/hypergryph/skland', 'game/hypergryph/SklandPage.vue', /empty-state/],
  ['/game/hypergryph/endfield', 'game/hypergryph/endfield/EndfieldPage.vue', /el-select/],
]
for (const [path, file, expected] of pages) {
  test(`renders ${path} with local UI and icon imports, without global registration`, async () => {
    const { default: component } = await vite.ssrLoadModule(`/src/pages/${file}`)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path, component },
        { path: '/:pathMatch(.*)*', component: { render: () => null } },
      ],
    })
    await router.push(path)
    await router.isReady()
    const warnings = []
    const app = createSSRApp(App).use(router).use(i18n)
    app.provide(ID_INJECTION_KEY, { prefix: 100, current: 0 })
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
    app.config.warnHandler = (message) => warnings.push(message)
    // The production app is client-only; provide only its theme bridge during SSR.
    globalThis.window = {
      EasonTheme: { preference: 'light', setPreference() {} },
      addEventListener() {},
      removeEventListener() {},
    }
    globalThis.document = { documentElement: { classList: { contains: () => false } } }
    let html
    try {
      html = await renderToString(app)
    } finally {
      delete globalThis.window
      delete globalThis.document
    }
    assert.match(html, expected)
    assert.match(html, /<svg/)
    assert.ok(
      !/<(?:el-[a-z-]+|House|Aim|Calendar|Sunny|Moon|Monitor|User)(?:\s|>)/.test(html),
      'components must render HTML, not unresolved custom tags',
    )
    assert.deepEqual(
      warnings.filter((message) =>
        /Failed to resolve component|Invalid vnode|not defined on instance/.test(message),
      ),
      [],
    )
  })
}

test('renders timed resources and detailed facility states without treating missing values as zero', async () => {
  const { default: panel } = await vite.ssrLoadModule('/src/components/game/GameOverviewPanel.vue')
  const account = { appCode: 'arknights', uid: 'fixture', gameId: '1', nickName: 'Test Doctor' }
  const data = {
    account,
    calculatedAt: 1360,
    fetchedAt: 1360,
    updatedAt: 1000,
    profile: {
      level: 1,
      worldLevel: null,
      registeredAt: null,
      lastOnlineAt: null,
      mainProgress: null,
    },
    metrics: [
      {
        key: 'stamina',
        group: 'daily',
        current: 23,
        total: 210,
        recoveryAt: 90000,
        recovery: { value: 23, at: 1000, intervalSeconds: 360 },
      },
    ],
    operators: [],
    sections: [
      {
        key: 'arknightsRecruitment',
        items: [
          {
            id: '0',
            name: null,
            level: null,
            status: 'locked',
            current: null,
            total: null,
            completeAt: null,
          },
          {
            id: '1',
            name: null,
            level: null,
            status: 'working',
            current: null,
            total: null,
            completeAt: 1300,
          },
        ],
      },
      {
        key: 'arknightsDormitories',
        items: [
          {
            id: 'd',
            name: null,
            level: 1,
            status: 'unknown',
            current: 0,
            total: 5,
            completeAt: null,
          },
        ],
      },
    ],
  }
  const app = createSSRApp(panel, { account, data, loading: false, failed: false }).use(i18n)
  app.provide(ID_INJECTION_KEY, { prefix: 200, current: 0 })
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
  const html = await renderToString(app)
  assert.match(html, /<strong[^>]*>24<\/strong>/)
  assert.match(html, /未解锁/)
  assert.match(html, /已完成/)
  assert.match(html, /心情已回满/)
  assert.match(html, /0.*\/ 5/)
  assert.match(html, /公开招募/)
})

test('renders Endfield ratings and zero-cap exploration in both languages', async () => {
  const { default: panel } = await vite.ssrLoadModule('/src/components/game/GameOverviewPanel.vue')
  const account = { appCode: 'endfield', uid: 'fixture', gameId: '1', nickName: 'Test' }
  const row = {
    id: 'test',
    name: 'Fixture',
    level: null,
    status: 'unknown',
    completeAt: null,
    current: 0,
    total: 0,
  }
  const data = {
    account,
    fetchedAt: 1000,
    calculatedAt: 1000,
    updatedAt: null,
    profile: {
      level: 60,
      worldLevel: 7,
      registeredAt: null,
      lastOnlineAt: null,
      mainProgress: null,
    },
    metrics: [],
    operators: [],
    sections: [
      { key: 'endfieldExplorationPuzzles', items: [row] },
      { key: 'endfieldWarEchoes', items: [{ ...row, current: 9, total: 9, rating: 'S+' }] },
    ],
  }
  for (const locale of ['zh-CN', 'en']) {
    i18n.global.locale.value = locale
    const app = createSSRApp(panel, { account, data, loading: false, failed: false }).use(i18n)
    app.provide(ID_INJECTION_KEY, { prefix: 300, current: 0 })
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
    const html = await renderToString(app)
    assert.match(html, /<strong[^>]*>—<\/strong>/)
    assert.doesNotMatch(html, /0 \/ 0|game\.overview\./)
    assert.match(html, /S\+/)
    assert.match(html, locale === 'en' ? /Exploration level/ : /探索等级/)
  }
  i18n.global.locale.value = 'zh-CN'
})
