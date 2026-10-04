import { ref, watchEffect } from 'vue'
import { createI18n } from 'vue-i18n'
import { zhCN as shellZh, en as shellEn } from './shell'
import { zhCN as accountZh, en as accountEn } from './accounts'
import { zhCN as gameZh, en as gameEn } from './games'
import { zhCN as homeZh, en as homeEn } from './home'
import { isLocalePreference, LOCALE_STORAGE_KEY, resolveLocale } from './preferences'
import type { LocalePreference } from './preferences'
export { LOCALE_STORAGE_KEY, resolveLocale } from './preferences'

function readPreference(): LocalePreference {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocalePreference(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}
function browserLanguages(): readonly string[] {
  return typeof navigator === 'undefined'
    ? []
    : navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
}
export const localePreference = ref<LocalePreference>(readPreference())
export const messages = {
  'zh-CN': { shell: shellZh, account: accountZh, game: gameZh, home: homeZh },
  en: { shell: shellEn, account: accountEn, game: gameEn, home: homeEn },
}
export const i18n = createI18n({
  legacy: false,
  locale: resolveLocale(localePreference.value, browserLanguages()),
  fallbackLocale: 'zh-CN',
  messages,
})
export const tr = (key: string, named: Record<string, string | number> = {}) =>
  i18n.global.t(key, named)

function syncLocale() {
  i18n.global.locale.value = resolveLocale(localePreference.value, browserLanguages())
}
export function setLocalePreference(value: unknown) {
  if (!isLocalePreference(value)) return
  localePreference.value = value
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, value)
  } catch {
    /* Still switch in this tab. */
  }
  syncLocale()
}
export function startLocaleSync(
  metadata: () => { titleKey?: string; descriptionKey?: string } = () => ({}),
) {
  const updateMetadata = () => {
    document.documentElement.lang = i18n.global.locale.value
    const { titleKey, descriptionKey } = metadata()
    document.title = titleKey ? `${tr(titleKey)} · Eason Space` : tr('shell.metaTitle')
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', tr(descriptionKey ?? 'shell.metaDescription'))
  }
  const stop = watchEffect(updateMetadata, { flush: 'sync' })
  const storage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== LOCALE_STORAGE_KEY) return
    localePreference.value = readPreference()
    syncLocale()
  }
  const language = () => {
    if (localePreference.value === 'system') syncLocale()
  }
  window.addEventListener('storage', storage)
  window.addEventListener('languagechange', language)
  return () => {
    stop()
    window.removeEventListener('storage', storage)
    window.removeEventListener('languagechange', language)
  }
}
