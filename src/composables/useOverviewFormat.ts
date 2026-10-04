import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/** Reuse formatters across records and ticks, rebuilding only when language changes. */
export function useOverviewFormat() {
  const { t, locale } = useI18n()
  const numbers = computed(() => new Intl.NumberFormat(locale.value))
  const dates = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }))
  const times = computed(
    () => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }),
  )
  return {
    number: (value: number | null) => (value === null ? '—' : numbers.value.format(value)),
    date: (value: number | null, dateOnly = false) =>
      value === null
        ? t('game.overview.missing')
        : (dateOnly ? dates.value : times.value).format(value * 1000),
  }
}
