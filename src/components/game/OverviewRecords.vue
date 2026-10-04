<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DisplaySection } from '@/common/overviewSections'
import { facilityArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'
defineProps<{ section: DisplaySection }>()
const { t } = useI18n()
const { number } = useOverviewFormat()
</script>
<template>
  <ul class="record-list">
    <li v-for="item in section.items" :key="item.id" class="record-row">
      <div class="banner-frame">
        <OverviewArtwork class="facility-art" :art="facilityArt(section.key, item)" banner />
      </div>
      <div class="record-body">
        <div class="record-heading">
          <h4>
            {{
              item.name ??
              (section.key === 'arknightsBossRush'
                ? t('game.overview.sections.arknightsBossRush')
                : item.id)
            }}
            <span v-if="item.bossRush?.edition" class="edition">#{{ item.bossRush.edition }}</span>
          </h4>
          <p v-if="item.subtitle" class="subtitle">{{ item.subtitle }}</p>
        </div>
        <div class="record-progress">
          <template v-if="item.measures">
            <p v-for="measure in item.measures" :key="measure.key" class="record-measure">
              <span>{{ t(`game.overview.sectionValues.${measure.key}`) }}</span>
              <strong
                >{{ number(measure.current)
                }}<template v-if="measure.total !== null">
                  / {{ number(measure.total) }}</template
                ></strong
              >
            </p>
          </template>
          <template v-else-if="item.bossRush">
            <p v-if="item.bossRush.played === true">
              <span>{{ t('game.overview.sectionValues.arknightsBossRush') }}</span>
              <strong
                >{{
                  item.bossRush.difficulty
                    ? t(`game.overview.bossRush.${item.bossRush.difficulty}`)
                    : t('game.overview.missing')
                }}
                {{ item.bossRush.stageCode }}</strong
              >
            </p>
            <p v-else>
              {{
                t(
                  item.bossRush.played === false
                    ? 'game.overview.bossRush.unplayed'
                    : 'game.overview.missing',
                )
              }}
            </p>
          </template>
          <template v-else>
            <p>
              <span>{{ t(`game.overview.sectionValues.${section.key}`) }}</span>
              <strong
                >{{ number(item.current)
                }}<template v-if="item.total !== null">
                  / {{ number(item.total) }}</template
                ></strong
              >
            </p>
            <span
              v-if="
                item.status === 'complete' ||
                (section.key === 'arknightsCampaign' &&
                  item.current !== null &&
                  item.current >= 400)
              "
              class="complete"
              >{{ t('game.overview.statuses.complete') }}</span
            >
          </template>
        </div>
      </div>
    </li>
  </ul>
</template>
<style scoped>
.record-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: 12px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}
.record-row {
  position: relative;
  isolation: isolate;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-background-mute);
}
.banner-frame {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.banner-frame :deep(.overview-artwork) {
  margin-left: 18px;
  width: 64px;
  height: 64px;
}
.banner-frame :deep(.cover) {
  margin: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
}
/* Keep the official mark on the left; excess transparent pixels may extend
   beyond the right edge. Cap scaling when unusually long text grows the row. */
.banner-frame :deep(.cover img) {
  object-fit: cover;
  object-position: left center;
  max-height: 144px;
}
/* A semantic scrim protects text even if a future banner is fully opaque. */
.record-row::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(
    to right,
    transparent 24%,
    color-mix(in srgb, var(--color-background-mute) 96%, transparent) 48%,
    var(--color-background-mute) 72%
  );
}
.banner-frame {
  z-index: -2;
}
.record-body {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-height: 120px;
  margin-left: 48%;
  padding: 14px 16px 14px 0;
  gap: 8px;
}
h4,
p {
  margin: 0;
}
h4 {
  color: var(--color-heading);
  font-size: 1rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.subtitle,
.record-progress {
  font-size: 0.85rem;
}
.subtitle,
.record-progress p > span {
  color: var(--muted);
}
.subtitle {
  margin-top: 4px;
  overflow-wrap: anywhere;
}
.record-progress {
  max-width: 100%;
}
.record-progress p {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 10px;
}
.record-measure + .record-measure {
  margin-top: 4px;
}
.record-progress strong {
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.complete {
  display: block;
  color: var(--el-color-primary);
  margin-top: 4px;
}
.edition {
  color: var(--el-color-primary);
  white-space: nowrap;
}
@media (max-width: 480px) {
  .record-body {
    min-height: 112px;
    margin-left: 44%;
    padding-right: 12px;
  }
  .record-row::after {
    background: linear-gradient(
      to right,
      transparent 18%,
      color-mix(in srgb, var(--color-background-mute) 96%, transparent) 44%,
      var(--color-background-mute) 72%
    );
  }
}
</style>
