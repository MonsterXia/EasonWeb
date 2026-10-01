import { onBeforeUnmount, ref } from 'vue'

type ThemePreference = 'light' | 'dark' | 'system'

declare global {
  interface Window {
    EasonTheme: {
      readonly preference: ThemePreference
      setPreference(value: ThemePreference): void
    }
  }
}

export function useTheme() {
  const preference = ref(window.EasonTheme.preference)
  const isDark = ref(document.documentElement.classList.contains('dark'))
  const sync = () => {
    preference.value = window.EasonTheme.preference
    isDark.value = document.documentElement.classList.contains('dark')
  }
  window.addEventListener('eason-theme-change', sync)
  onBeforeUnmount(() => window.removeEventListener('eason-theme-change', sync))

  return {
    preference,
    isDark,
    setTheme: (value: ThemePreference) => window.EasonTheme.setPreference(value),
  }
}
