export type AppLocale = 'zh-CN' | 'en'
export type LocalePreference = AppLocale | 'system'
export const LOCALE_STORAGE_KEY = 'eason-locale'
export function isLocalePreference(value: unknown): value is LocalePreference {
  return value === 'zh-CN' || value === 'en' || value === 'system'
}
export function resolveLocale(preference: unknown, languages: readonly string[] = []): AppLocale {
  if (preference === 'zh-CN' || preference === 'en') return preference
  for (const language of languages) {
    if (/^zh(?:-|$)/i.test(language)) return 'zh-CN'
    if (/^en(?:-|$)/i.test(language)) return 'en'
  }
  return 'zh-CN'
}
