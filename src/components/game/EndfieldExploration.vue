<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { endfieldExplorationColumns, type DisplaySection } from '@/common/overviewSections'
import { facilityArt, sectionArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'
import OverviewReveal from './OverviewReveal.vue'

defineProps<{ section: DisplaySection }>()
const { t } = useI18n()
const { number } = useOverviewFormat()
const expanded = ref(false)
const id = useId()
</script>

<template>
  <div class="exploration-section">
    <div
      role="table"
      :aria-label="t('game.overview.sections.endfieldExploration')"
      class="exploration-table"
    >
      <div role="row" class="exploration-columns exploration-grid">
        <span role="columnheader">{{ t('game.overview.explorationRegion') }}</span>
        <span
          v-for="key in endfieldExplorationColumns"
          :key="key"
          role="columnheader"
          :aria-label="t(`game.overview.sections.${key}`)"
          :title="t(`game.overview.sections.${key}`)"
        >
          <OverviewArtwork :art="sectionArt(key)" />
        </span>
      </div>
      <OverviewReveal :expanded="expanded" :visible-count="5">
        <div :id="`${id}-rows`" role="rowgroup">
          <div
            v-for="(item, index) in section.items"
            :key="item.id"
            role="row"
            class="exploration-row exploration-grid"
            :class="{ 'overview-reveal-hidden': !expanded && index >= 5 }"
            :aria-hidden="!expanded && index >= 5"
            :inert="!expanded && index >= 5"
            :data-region="item.id"
          >
            <div role="rowheader" class="region-identity">
              <div class="region-art">
                <OverviewArtwork :art="facilityArt(section.key, item)" />
              </div>
              <div class="region-text">
                <strong>{{ item.name || t('game.overview.slot', { index: index + 1 }) }}</strong
                ><span v-if="item.subtitle">{{ item.subtitle }}</span>
              </div>
            </div>
            <div
              v-for="measure in item.measures"
              :key="measure.key"
              role="cell"
              class="exploration-measure"
              :data-measure="measure.key"
              :aria-label="`${t(`game.overview.sections.${measure.key}`)}: ${measure.total === 0 ? '—' : `${number(measure.current)}${measure.total === null ? '' : ` / ${number(measure.total)}`}`}`"
            >
              <strong>{{ measure.total === 0 ? '—' : number(measure.current) }}</strong>
              <span v-if="measure.total !== null && measure.total > 0"
                >/ {{ number(measure.total) }}</span
              >
            </div>
          </div>
        </div>
      </OverviewReveal>
    </div>
    <button
      v-if="section.items.length > 5"
      type="button"
      class="exploration-more"
      :aria-expanded="expanded"
      :aria-controls="`${id}-rows`"
      @click="expanded = !expanded"
    >
      {{ t(expanded ? 'game.overview.showLess' : 'game.overview.explorationMore') }}
      <el-icon :class="{ expanded }"><ArrowDown /></el-icon>
    </button>

    <p v-if="!section.items.length" class="empty-exploration">
      {{ t('game.overview.missing') }}
    </p>
  </div>
</template>

<style scoped>
.exploration-section {
  margin-top: 16px;
  min-width: 0;
}
.exploration-more {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  border-radius: 6px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.exploration-more:hover,
.exploration-more:active,
.exploration-more:focus-visible {
  color: var(--accent);
}
.exploration-more:focus-visible {
  outline: none;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.exploration-more .el-icon {
  transition: transform 260ms;
}
.exploration-more .expanded {
  transform: rotate(180deg);
}
.exploration-grid {
  display: grid;
  grid-template-columns: minmax(130px, 2.2fr) repeat(6, minmax(0, 1fr));
  gap: 8px;
  align-items: center;
}
.exploration-columns {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  color: var(--muted);
  font-size: 12px;
}
.exploration-columns > span:not(:first-child) {
  display: flex;
  justify-content: center;
}
.exploration-columns .overview-artwork {
  width: 22px;
  height: 22px;
  border-radius: 0;
  background: transparent;
}
.exploration-columns :deep(img) {
  width: 100%;
  height: 100%;
}
.exploration-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}
.region-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.region-art {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
}
.region-art .overview-artwork {
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 5px;
}
.region-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.region-text strong {
  color: var(--color-heading);
  font-size: 14px;
}
.region-text span {
  color: var(--muted);
  font-size: 12px;
}
.exploration-measure {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  font-variant-numeric: tabular-nums;
}
.exploration-measure strong {
  color: var(--color-heading);
  font-size: 18px;
  font-weight: 600;
}
.exploration-measure span {
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
}
.empty-exploration {
  color: var(--muted);
  font-size: 12px;
}
@media (max-width: 600px) {
  .exploration-grid {
    grid-template-columns: minmax(72px, 1.6fr) repeat(6, minmax(0, 1fr));
    gap: 4px;
  }
  .region-identity {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  .region-art {
    width: 36px;
    height: 36px;
    flex-basis: 36px;
  }
  .region-text strong {
    font-size: 12px;
  }
  .region-text span {
    font-size: 11px;
  }
  .exploration-measure strong {
    font-size: 14px;
  }
  .exploration-measure span {
    font-size: 10px;
  }
  .exploration-columns .overview-artwork {
    width: 18px;
    height: 18px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .exploration-more .el-icon {
    transition: none;
  }
}
</style>
