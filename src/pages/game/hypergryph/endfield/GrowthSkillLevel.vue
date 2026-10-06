<script setup lang="ts">
import { useI18n } from 'vue-i18n'
defineProps<{ value: number; skill?: boolean; prefix?: boolean }>()
const { t } = useI18n()
</script>

<template>
  <span
    class="level-value"
    :aria-label="
      skill && value > 9 ? t('game.growth.masteryRank', { rank: value - 9 }) : `LV. ${value}`
    "
  >
    <svg v-if="skill && value > 9" class="mastery-mark" viewBox="0 0 28 26" aria-hidden="true">
      <path
        v-for="(offset, i) in ['0 7', '9 1', '9 13']"
        :key="offset"
        :transform="`translate(${offset})`"
        d="M7 0L12 3V9L7 12L2 9V3Z"
        fill="currentColor"
        :opacity="i < value - 9 ? 1 : 0.2"
      />
    </svg>
    <template v-else><small v-if="prefix" aria-hidden="true">LV.</small>{{ value }}</template>
  </span>
</template>

<style scoped>
.level-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-variant-numeric: tabular-nums;
}
small {
  font-size: 0.7em;
  font-weight: 400;
  color: var(--muted);
}
.mastery-mark {
  width: 1.2em;
  height: 1.2em;
  min-width: 22px;
  min-height: 22px;
}
</style>
