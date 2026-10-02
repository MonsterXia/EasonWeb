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
