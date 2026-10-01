import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
import { baseCompile } from '@intlify/message-compiler'

const vite = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-i18n-tests', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } })
after(() => vite.close())
const { resolveLocale } = await vite.ssrLoadModule('/src/i18n/preferences.ts')

test('saved language wins, system matches supported browser languages, unsupported languages fall back', () => {
  assert.equal(resolveLocale('en', ['zh-CN']), 'en')
  assert.equal(resolveLocale('zh-CN', ['en-US']), 'zh-CN')
  assert.equal(resolveLocale('system', ['fr-FR', 'en-GB']), 'en')
  assert.equal(resolveLocale('system', ['zh-TW', 'en']), 'zh-CN')
  assert.equal(resolveLocale('invalid', ['en-US']), 'en')
  assert.equal(resolveLocale(null, ['fr']), 'zh-CN')
  assert.equal(resolveLocale('system', []), 'zh-CN')
})

function flatten(value, prefix = '') {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof item === 'string' ? [[path, item]] : Object.entries(flatten(item, path))
  }))
}

test('both catalogs have matching keys, valid messages and matching interpolation parameters', async () => {
  const { messages } = await vite.ssrLoadModule('/src/i18n/index.ts')
  const zh = flatten(messages['zh-CN']), en = flatten(messages.en)
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort())
  assert.ok(Object.keys(zh).length > 100)
  const params = text => [...new Set([...text.matchAll(/\{([\w]+)\}/g)].map(match => match[1]))].sort()
  for (const key of Object.keys(zh)) {
    assert.deepEqual(params(zh[key]), params(en[key]), key)
    for (const value of [zh[key], en[key]]) {
      assert.ok(value.trim(), `Empty message: ${key}`)
      const errors = []
      baseCompile(value, { onError: error => errors.push(error.message) })
      assert.deepEqual(errors, [], key)
    }
  }
})

test('language switching updates document metadata and survives storage failure and cross-tab changes', async () => {
  const listeners = new Map(), saved = new Map(), attributes = new Map()
  const oldWindow = globalThis.window, oldDocument = globalThis.document
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const browser = { languages: ['en-US'], language: 'en-US' }
  let blockStorage = false
  globalThis.window = {
    localStorage: {
      getItem: key => { if (blockStorage) throw Error('Storage disabled'); return saved.get(key) ?? null },
      setItem: (key, value) => { if (blockStorage) throw Error('Storage disabled'); saved.set(key, value) },
    },
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: name => listeners.delete(name),
  }
  globalThis.document = { documentElement: { lang: '' }, title: '', querySelector: () => ({ setAttribute: (key, value) => attributes.set(key, value) }) }
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: browser })
  let stop
  try {
    const { i18n, setLocalePreference, startLocaleSync, LOCALE_STORAGE_KEY } = await vite.ssrLoadModule('/src/i18n/index.ts')
    stop = startLocaleSync()
    setLocalePreference('en')
    assert.equal(document.documentElement.lang, 'en')
    assert.match(document.title, /Make room/)
    assert.match(attributes.get('content'), /Endfield/)
    assert.equal(saved.get(LOCALE_STORAGE_KEY), 'en')
    setLocalePreference('not-supported')
    assert.equal(i18n.global.locale.value, 'en')
    saved.set(LOCALE_STORAGE_KEY, 'zh-CN')
    listeners.get('storage')({ key: LOCALE_STORAGE_KEY })
    assert.equal(document.documentElement.lang, 'zh-CN')
    assert.match(document.title, /自由生长/)
    blockStorage = true
    setLocalePreference('en')
    assert.equal(i18n.global.locale.value, 'en')
    setLocalePreference('system')
    browser.languages = ['zh-CN']
    listeners.get('languagechange')()
    assert.equal(i18n.global.locale.value, 'zh-CN')
    blockStorage = false
    saved.clear()
    browser.languages = ['en-US']
    listeners.get('storage')({ key: null })
    assert.equal(i18n.global.locale.value, 'en')
  } finally {
    stop?.()
    globalThis.window = oldWindow
    globalThis.document = oldDocument
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator)
    else delete globalThis.navigator
  }
  assert.equal(listeners.size, 0)
})

test('validation and API errors follow the selected language without changing error semantics', async () => {
  const { i18n } = await vite.ssrLoadModule('/src/i18n/index.ts')
  const { apiError, passwordError, passwordErrorKey } = await vite.ssrLoadModule('/src/common/api/accounts.ts')
  const previous = i18n.global.locale.value
  try {
    i18n.global.locale.value = 'en'
    assert.equal(passwordErrorKey('abc'), 'account.error.passwordLength')
    assert.match(passwordError('abc'), /6 characters/)
    assert.equal(passwordError('ValidPassword1!'), '')
    assert.match(apiError({ isAxiosError: true, response: { status: 401 } }), /sign in/i)
    const response = { isAxiosError: true, response: { status: 400, data: { error: '手机号码有误' } } }
    assert.doesNotMatch(apiError(response), /[\u3400-\u9fff]/)
    i18n.global.locale.value = 'zh-CN'
    assert.match(passwordError('abc'), /6 个字符/)
    assert.equal(apiError(response), '手机号码有误')
  } finally { i18n.global.locale.value = previous }
})
