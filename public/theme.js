// Runs before styles and Vue mount so the first paint uses the selected theme.
;(function () {
  const key = 'eason-theme'
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const valid = (value) => ['light', 'dark', 'system'].includes(value)
  let preference = 'system'

  function readPreference() {
    try {
      const value = localStorage.getItem(key)
      return valid(value) ? value : 'system'
    } catch {
      return 'system'
    }
  }

  function apply() {
    const dark = preference === 'dark' || (preference === 'system' && media.matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dataset.themePreference = preference
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#080b14' : '#f5f7fc')
    window.dispatchEvent(new CustomEvent('eason-theme-change'))
  }

  window.EasonTheme = {
    get preference() {
      return preference
    },
    setPreference(value) {
      if (!valid(value)) return
      preference = value
      try {
        localStorage.setItem(key, value)
      } catch {
        /* The selection still works for this session. */
      }
      apply()
    },
  }

  preference = readPreference()
  apply()
  media.addEventListener('change', () => {
    if (preference === 'system') apply()
  })
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return
    preference = readPreference()
    apply()
  })
})()
