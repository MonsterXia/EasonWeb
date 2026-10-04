<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GameOverview } from '@/common/api/gameOverview'
import { sectionArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'

const props = defineProps<{
  items: NonNullable<GameOverview['sections']>[number]['items']
  resourceTime: number
}>()
const { t } = useI18n()
const { number, date } = useOverviewFormat()
const board = computed(() => props.items.find((item) => item.id === 'board'))
const status = computed(() => {
  const item = board.value
  return item?.status === 'working' && item.completeAt && item.completeAt <= props.resourceTime
    ? 'complete'
    : (item?.status ?? 'unknown')
})
const metrics = computed(() =>
  [
    ['board', 'clueBoard'],
    ['own', 'clueOwned'],
    ['received', 'clueReceived'],
    ['needReceive', 'cluePending'],
  ].map(([id, label]) => ({ id, label, item: props.items.find((item) => item.id === id) })),
)
</script>

<template>
  <article class="reception-card" :aria-label="t('game.overview.facilityNames.arknightsReception')">
    <OverviewArtwork class="reception-art" :art="sectionArt('arknightsClues')" />
    <header>
      <strong>{{ t('game.overview.facilityNames.arknightsReception') }}</strong>
      <span v-if="board?.level != null">{{
        t('game.overview.facilityLevel', { level: number(board.level) })
      }}</span>
      <span class="reception-status" :data-status="status">{{
        t(`game.overview.statuses.${status}`)
      }}</span>
    </header>
    <dl class="clue-metrics">
      <div v-for="metric in metrics" :key="metric.id" :data-clue="metric.id">
        <dt>{{ t(`game.overview.facilityNames.${metric.label}`) }}</dt>
        <dd>
          <strong>{{ number(metric.item?.current ?? null, false) }}</strong>
          <span v-if="metric.item?.total != null"> / {{ number(metric.item.total, false) }}</span>
        </dd>
      </div>
    </dl>
    <p v-if="board?.completeAt && board.completeAt > resourceTime" class="reception-note">
      {{ t('game.overview.completes', { time: date(board.completeAt) }) }}
    </p>
  </article>
</template>

<style scoped>
.reception-card {
  position: relative;
  isolation: isolate;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
}
.reception-art {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 72px;
  height: 72px;
  background: transparent;
  opacity: 0.12;
  pointer-events: none;
  z-index: -1;
}
header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 12px;
  color: var(--muted);
}
header strong {
  font-size: 14px;
  color: var(--color-heading);
}
.reception-status {
  margin-left: auto;
}
.reception-status[data-status='working'],
.reception-status[data-status='complete'] {
  color: var(--accent);
}
.clue-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 10px 0 0;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}
.clue-metrics > div {
  min-width: 0;
}
dt {
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
dd {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
dd strong {
  color: var(--color-heading);
  font-size: 20px;
  font-weight: 600;
}
.reception-note {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
@media (max-width: 600px) {
  .clue-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
