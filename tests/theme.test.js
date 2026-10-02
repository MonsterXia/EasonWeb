import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

const source = readFileSync(new URL('../public/theme.js', import.meta.url), 'utf8')
function boot({ saved = null, systemDark = false, blocked = false } = {}) {
  const events = new Map()
  const media = {
    matches: systemDark,
    addEventListener: (_, handler) => {
      media.change = handler
    },
  }
  const root = {
    dataset: {},
    classList: {
      toggle: (_, value) => {
        root.dark = value
      },
    },
  }
  const meta = {
    setAttribute: (_, value) => {
      meta.color = value
    },
  }
  const storage = {
    value: saved,
    getItem() {
      if (blocked) throw Error('blocked')
      return this.value
    },
    setItem(_, value) {
      if (blocked) throw Error('blocked')
      this.value = value
    },
  }
  const window = {
    matchMedia: () => media,
    addEventListener: (event, handler) => events.set(event, handler),
    dispatchEvent() {},
  }
  const document = {
    documentElement: root,
    querySelector: () => meta,
    visibilityState: 'visible',
    addEventListener: (event, handler) => events.set(event, handler),
  }
  runInNewContext(source, {
    window,
    document,
    localStorage: storage,
    CustomEvent: class {},
  })
  return { theme: window.EasonTheme, media, root, meta, storage, events, document }
}

test('first paint follows the system when no valid preference is stored', () => {
  for (const saved of [null, 'invalid', 'system']) {
    for (const systemDark of [false, true]) {
      const { root, theme, meta } = boot({ saved, systemDark })
      assert.equal(root.dark, systemDark)
      assert.equal(theme.preference, 'system')
      assert.equal(meta.color, systemDark ? '#160f16' : '#fff7fa')
    }
  }
})
test('saved choice wins over system and manual changes persist', () => {
  const { root, theme, storage, media } = boot({ saved: 'light', systemDark: true })
  assert.equal(root.dark, false)
  media.change()
  assert.equal(root.dark, false)
  theme.setPreference('dark')
  assert.equal(root.dark, true)
  assert.equal(storage.value, 'dark')
  assert.equal(boot({ saved: storage.value }).root.dark, true)
  theme.setPreference('invalid')
  assert.equal(theme.preference, 'dark')
})
test('system mode tracks OS changes and can be restored after manual selection', () => {
  const { theme, root, media } = boot()
  media.matches = true
  media.change()
  assert.equal(root.dark, true)
  theme.setPreference('light')
  assert.equal(root.dark, false)
  theme.setPreference('system')
  assert.equal(root.dark, true)
  media.matches = false
  media.change()
  assert.equal(root.dark, false)
})
test('unavailable storage does not prevent initial render or switching', () => {
  const { theme, root } = boot({ blocked: true, systemDark: true })
  assert.equal(root.dark, true)
  theme.setPreference('light')
  assert.equal(root.dark, false)
  assert.equal(theme.preference, 'light')
})
test('theme changes and storage clearing synchronize across tabs', () => {
  const { theme, root, storage, events } = boot({ saved: 'dark' })
  storage.value = 'light'
  events.get('storage')({ key: 'eason-theme' })
  assert.equal(root.dark, false)
  storage.value = null
  events.get('storage')({ key: null })
  assert.equal(theme.preference, 'system')
})

test('resynchronizes system theme after a suspended page returns without a media change event', () => {
  for (const event of ['focus', 'pageshow', 'visibilitychange']) {
    const { theme, root, media, events } = boot({ saved: 'system', systemDark: false })
    media.matches = true
    events.get(event)()
    assert.equal(root.dark, true)
    theme.setPreference('light')
    events.get(event)()
    assert.equal(root.dark, false)
  }
})
