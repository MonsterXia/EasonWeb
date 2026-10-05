<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { ArrowDown, Filter } from '@element-plus/icons-vue'
import type { GloryMedal, GloryRoadData } from '@/common/api/gameOverview'
import { gloryArt, metricArt, type OverviewArt } from '@/common/overviewAssets'
import { officialArtworkUrl } from '@/common/officialArtwork'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'
import OverviewReveal from './OverviewReveal.vue'
import OverviewSelect from './OverviewSelect.vue'
const props = defineProps<{ data: GloryRoadData }>()
const { t } = useI18n()
const { number, date } = useOverviewFormat()
const expanded = ref(false)
const filtersOpen = ref(false)
const sort = ref('recent')
const tier = ref('all')
const plating = ref('all')
const certification = ref('all')
const id = useId()
const filterId = useId()
const activeFilters = computed(
  () => [tier.value, plating.value, certification.value].filter((x) => x !== 'all').length,
)
const medals = computed(() => new Map(props.data.medals?.map((m) => [m.id, m])))
const displayRows = computed(() =>
  [0, 1].map((row) =>
    Array.from({ length: 5 }, (_, column) => {
      const slot = column * 2 + row + 1
      const selected = props.data.display?.find((x) => x.slot === slot)
      return { slot, medal: selected?.medalId ? medals.value.get(selected.medalId) : undefined }
    }),
  ),
)
const eligible = (m: GloryMedal) =>
  m.level === null || m.canCertify === null ? null : m.level === 3 && m.canCertify
const art = (m?: GloryMedal): OverviewArt | undefined => {
  const src = officialArtworkUrl(m?.artworkUrl)
  const fallback = m?.level ? metricArt('endfield', `medalLevel${m.level}`) : gloryArt('empty')
  return src ? { src, kind: 'cover', tone: 'color', fallback } : fallback
}
const filtered = computed(() =>
  (props.data.medals ?? [])
    .filter(
      (m) =>
        (tier.value === 'all' || String(m.level) === tier.value) &&
        (plating.value === 'all' || m.plated === (plating.value === 'yes')) &&
        (certification.value === 'all' || eligible(m) === (certification.value === 'yes')),
    )
    .sort((a, b) => {
      const timeOrder = (b.acquiredAt ?? -1) - (a.acquiredAt ?? -1)
      const levelOrder = (b.level ?? -1) - (a.level ?? -1)
      return sort.value === 'recent' ? timeOrder || levelOrder : levelOrder || timeOrder
    }),
)
const sortOptions = computed(() => [
  { value: 'recent', label: t('game.overview.glory.recent') },
  { value: 'level', label: t('game.overview.glory.levelSort') },
])
const tierOptions = computed(() => [
  { value: 'all', label: t('game.overview.glory.all') },
  ...[1, 2, 3].map((level) => ({
    value: String(level),
    label: t(`game.overview.glory.tier${level}`),
  })),
])
const options = (yes: string, no: string) => [
  { value: 'all', label: t('game.overview.glory.all') },
  { value: 'yes', label: t(`game.overview.glory.${yes}`) },
  { value: 'no', label: t(`game.overview.glory.${no}`) },
]
function reset() {
  tier.value = plating.value = certification.value = 'all'
}
</script>

<template>
  <div class="glory-road">
    <div class="glory-summary">
      <div class="collection-summary">
        <strong class="collection-total">{{ number(data.count) }}</strong>
        <span class="muted">{{ t('game.overview.glory.total') }}</span>
        <dl class="tier-counts">
          <div v-for="level in [1, 2, 3]" :key="level">
            <dt :title="t(`game.overview.glory.tier${level}`)">
              <OverviewArtwork :art="metricArt('endfield', `medalLevel${level}`)" />
              <span class="sr-only">{{ t(`game.overview.glory.tier${level}`) }}</span>
            </dt>
            <dd>{{ number(data.tiers.find((x) => x.level === level)?.count ?? null) }}</dd>
          </div>
        </dl>
      </div>
      <div
        v-if="data.display !== null"
        class="medal-wall"
        :aria-label="t('game.overview.glory.display')"
        role="group"
      >
        <div v-for="(row, index) in displayRows" :key="index" class="wall-row">
          <div
            v-for="{ slot, medal } in row"
            :key="slot"
            class="display-medal"
            :data-slot="slot"
            :title="medal?.name || t('game.overview.glory.emptySlot')"
            role="img"
            :aria-label="medal?.name || t('game.overview.glory.emptySlot')"
          >
            <OverviewArtwork :art="art(medal)" />
            <OverviewArtwork
              v-if="medal && eligible(medal)"
              class="certification-mark"
              :art="gloryArt('certify')"
            />
          </div>
        </div>
      </div>
      <p v-else class="display-unavailable muted">
        {{ t('game.overview.glory.displayUnavailable') }}
      </p>
    </div>
    <OverviewReveal :expanded="expanded" :visible-count="0">
      <div
        :id="id"
        class="glory-details"
        :class="{ 'overview-reveal-hidden': !expanded }"
        :inert="!expanded"
        :aria-hidden="!expanded"
      >
        <div class="glory-toolbar">
          <OverviewSelect
            v-model="sort"
            :label="t('game.overview.glory.sort')"
            :options="sortOptions"
          />
          <button
            class="filter-button"
            :aria-expanded="filtersOpen"
            :aria-controls="filterId"
            @click="filtersOpen = !filtersOpen"
          >
            <ElIcon><Filter /></ElIcon>{{ t('game.overview.glory.filter')
            }}<span v-if="activeFilters">{{ activeFilters }}</span>
          </button>
        </div>
        <OverviewReveal :expanded="filtersOpen" :visible-count="0">
          <div
            :id="filterId"
            class="glory-filters"
            :class="{ 'overview-reveal-hidden': !filtersOpen }"
            :inert="!filtersOpen"
            :aria-hidden="!filtersOpen"
          >
            <OverviewSelect
              v-model="tier"
              :label="t('game.overview.glory.tier')"
              :options="tierOptions"
            />
            <OverviewSelect
              v-model="plating"
              :label="t('game.overview.glory.plating')"
              :options="options('plated', 'notPlated')"
            />
            <OverviewSelect
              v-model="certification"
              :label="t('game.overview.glory.certification')"
              :options="options('certifiable', 'notCertifiable')"
            />
            <button class="reset-button" :disabled="!activeFilters" @click="reset">
              {{ t('game.overview.glory.reset') }}
            </button>
          </div>
        </OverviewReveal>
        <p v-if="data.medals === null" class="muted">{{ t('game.overview.glory.unavailable') }}</p>
        <template v-else>
          <p class="result-count muted" aria-live="polite">
            {{ t('game.overview.glory.results', { n: number(filtered.length) }) }}
          </p>
          <ul v-if="filtered.length" class="medal-list">
            <li
              v-for="medal in filtered"
              :key="medal.id"
              class="medal-card"
              :data-medal-id="medal.id"
            >
              <div class="medal-image">
                <OverviewArtwork :art="art(medal)" />
                <OverviewArtwork
                  v-if="eligible(medal)"
                  class="certification-mark"
                  :art="gloryArt('certify')"
                  :title="t('game.overview.glory.certifiable')"
                />
              </div>
              <div class="medal-info">
                <strong>{{ medal.name || t('game.overview.missing') }}</strong>
                <time class="muted">{{ date(medal.acquiredAt, true) }}</time>
              </div>
            </li>
          </ul>
          <p v-else class="muted">
            {{
              t(data.medals.length ? 'game.overview.glory.noMatches' : 'game.overview.glory.empty')
            }}
          </p>
        </template>
      </div>
    </OverviewReveal>
    <button
      class="reveal-button"
      :aria-expanded="expanded"
      :aria-controls="id"
      @click="expanded = !expanded"
    >
      {{ t(expanded ? 'game.overview.showLess' : 'game.overview.more')
      }}<ElIcon :class="{ expanded }"><ArrowDown /></ElIcon>
    </button>
  </div>
</template>

<style scoped>
.glory-road {
  margin-top: 12px;
  min-width: 0;
  font-size: 12px;
}
.glory-summary {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px 24px;
  padding: 18px 22px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
}
.glory-summary::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: url('@/assets/skland/ef-glory-summary-bg.png') center / cover no-repeat;
  mix-blend-mode: multiply;
  opacity: 0.85;
  pointer-events: none;
  z-index: -1;
}
html.dark .glory-summary::before {
  filter: invert(1);
  mix-blend-mode: screen;
  opacity: 0.65;
}
.collection-summary {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}
.collection-total {
  font-size: 32px;
  line-height: 1.2;
  color: var(--color-heading);
}
.tier-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin: 18px 0 0;
}
.tier-counts > div {
  display: flex;
  align-items: center;
  gap: 5px;
}
.tier-counts dt {
  display: flex;
}
.tier-counts dd {
  margin: 0;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
.tier-counts .overview-artwork {
  width: 27px;
  height: 30px;
  background: transparent;
  border-radius: 0;
}
.tier-counts :deep(img) {
  width: 100%;
  height: 100%;
}
.muted {
  color: var(--muted);
}
.medal-wall {
  width: min(100%, 320px);
  flex: 0 1 320px;
  margin-left: auto;
  padding: 5px 4px;
}
.wall-row {
  display: flex;
  width: 90.9091%;
}
.wall-row + .wall-row {
  margin-top: -5.4545%;
  margin-left: 9.0909%;
}
.display-medal {
  position: relative;
  width: 20%;
  aspect-ratio: 40 / 46;
}
.display-medal > .overview-artwork {
  position: absolute;
  width: 120%;
  height: auto;
  aspect-ratio: 1;
  left: -10%;
  top: -2.174%;
  background: transparent;
  border-radius: 0;
}
.display-medal :deep(img),
.medal-image :deep(img) {
  width: 100%;
  height: 100%;
}
.display-unavailable {
  margin-left: auto;
}
.glory-details {
  display: flow-root;
  padding-bottom: 2px;
}
.glory-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 14px 0 8px;
}
.glory-toolbar .overview-select {
  flex: 1;
  margin: 0;
}
button {
  color: var(--muted);
  background: transparent;
  border: 0;
  font: inherit;
  cursor: pointer;
}
button:hover,
button:focus-visible {
  color: var(--accent);
}
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.filter-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 0;
}
.glory-filters {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 0 12px;
}
.glory-filters .overview-select {
  flex: 1 1 130px;
  display: grid;
  gap: 4px;
  margin: 0;
}
.glory-filters :deep(.el-select) {
  width: 100%;
}
.reset-button {
  padding: 8px 0;
}
.reset-button:disabled {
  opacity: 0.5;
  cursor: default;
}
.result-count {
  margin: 8px 0;
}
.medal-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.medal-card {
  display: flex;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-background);
}
.medal-image {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 72px;
  min-height: 76px;
  background: var(--color-background-mute);
}
.medal-image > .overview-artwork {
  width: 62px;
  height: 62px;
  background: transparent;
  border-radius: 0;
}
.display-medal > .certification-mark,
.medal-image > .certification-mark {
  position: absolute;
  top: 6%;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 18px;
  background: transparent;
}
.medal-info {
  min-width: 0;
  align-self: center;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-wrap: anywhere;
}
.medal-info strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-heading);
}
.medal-info time {
  font-size: 11px;
}
.reveal-button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 9px 0;
}
.reveal-button .el-icon {
  transition: transform 260ms ease;
}
.reveal-button .expanded {
  transform: rotate(180deg);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@media (max-width: 600px) {
  .glory-summary {
    padding: 14px;
    gap: 14px;
  }
  .collection-summary {
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 10px;
  }
  .collection-total {
    grid-row: 1 / 3;
    font-size: 30px;
  }
  .tier-counts {
    margin: 4px 0 0;
    gap: 8px 12px;
  }
  .tier-counts dd {
    font-size: 14px;
  }
  .tier-counts .overview-artwork {
    width: 22px;
    height: 24px;
  }
  .medal-wall {
    margin: 0 auto;
  }
  .glory-toolbar :deep(.el-select) {
    width: 190px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .reveal-button .el-icon {
    transition: none;
  }
}
</style>
