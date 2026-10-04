<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DisplayItem, DisplaySection } from '@/common/overviewSections'
import { facilityArt, sectionArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'
const props = defineProps<{ section: DisplaySection }>()
function foregroundArt(item: DisplayItem) {
  if (item.bossRush) return sectionArt('arknightsBossRush')
  if (props.section.key === 'arknightsTower' || props.section.key === 'arknightsCampaign')
    return facilityArt(props.section.key, { ...item, artworkUrl: undefined })
}
function backgroundArt(item: DisplayItem) {
  const art = facilityArt(props.section.key, item)
  // Independent logos must remain visible when a cover loads or fails, without
  // also appearing as a duplicate fallback in the background.
  return foregroundArt(item)
    ? art?.kind === 'cover'
      ? { ...art, fallback: undefined }
      : undefined
    : art
}
const { t } = useI18n()
const { number } = useOverviewFormat()
</script>
<template>
  <ul class="record-list" :class="{ 'trial-list': section.key === 'arknightsBossRush' }">
    <li
      v-for="item in section.items"
      :key="item.id"
      class="record-row"
      :class="{
        'trial-record': !!item.bossRush,
        'tower-record': section.key === 'arknightsTower',
        'campaign-record': section.key === 'arknightsCampaign',
        'banner-end-record':
          section.key === 'arknightsRogue' || section.key === 'arknightsActivities',
      }"
    >
      <div class="banner-frame">
        <OverviewArtwork class="facility-art" :art="backgroundArt(item)" banner />
      </div>
      <OverviewArtwork v-if="foregroundArt(item)" class="record-logo" :art="foregroundArt(item)" />
      <div class="record-body">
        <div class="record-heading">
          <h4>
            {{
              item.name ??
              (section.key === 'arknightsBossRush'
                ? t('game.overview.sections.arknightsBossRush')
                : item.id)
            }}
          </h4>
          <span v-if="item.bossRush?.edition" class="record-edition"
            >#{{ item.bossRush.edition }}</span
          >
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
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}
.trial-list {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
}
.trial-record {
  max-width: 340px;
}
.record-row {
  --record-inset: 76px;
  position: relative;
  isolation: isolate;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background-mute);
}
.banner-frame {
  position: absolute;
  inset: 0;
  z-index: -2;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.banner-frame :deep(.overview-artwork) {
  margin-left: 10px;
  width: 48px;
  height: 48px;
}
.banner-frame :deep(.cover) {
  margin: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
}
/* The background covers the entire row, including rows expanded by wrapped text. */
.banner-frame :deep(.cover img) {
  object-fit: cover;
  object-position: left center;
  opacity: var(--skland-banner-opacity);
}
/* Text overlaps the texture; protect its contrast without reserving half a card. */
.record-row::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(
    to right,
    transparent 24px,
    color-mix(in srgb, var(--color-background-mute) 92%, transparent) var(--record-inset),
    color-mix(in srgb, var(--color-background-mute) 94%, transparent) 100%
  );
}
/* Every banner uses the same semantic theme surface and foreground colors. */
.record-row:has(.banner-frame .cover) {
  --record-heading: var(--color-heading);
  --record-text: var(--color-heading);
  --record-status: var(--el-color-primary);
}
.banner-frame :deep(.cover) {
  background: transparent;
}
.record-row:has(.banner-frame .cover)::after {
  /* Shared by all five banner modes in both themes; keep the official art visible. */
  opacity: var(--skland-banner-scrim-opacity);
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-background-mute) 28%, transparent),
    color-mix(in srgb, var(--color-background-mute) 60%, transparent) var(--record-inset),
    color-mix(in srgb, var(--color-background-mute) 60%, transparent)
  );
}
.record-logo {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: transparent;
  pointer-events: none;
}
.record-logo :deep(img) {
  width: 100%;
  height: 100%;
}
/* Keep only the patterned left half of the trial banner, without stretching it
   or cropping the independent foreground logo. */
.trial-record .banner-frame :deep(.cover) {
  width: 200%;
}
.record-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  margin-left: var(--record-inset);
  padding: 8px 12px 8px 0;
  gap: 12px;
}
.record-heading {
  min-width: 0;
  flex: 1 1 0;
}
h4,
p {
  margin: 0;
}
h4 {
  color: var(--record-heading, var(--color-heading));
  font-size: 0.95rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.subtitle,
.record-progress {
  font-size: 0.8rem;
  line-height: 1.45;
}
.subtitle,
.record-progress p > span {
  color: var(--record-text, var(--color-text));
}
.subtitle {
  margin-top: 2px;
  overflow-wrap: anywhere;
}
.record-progress {
  min-width: 0;
  max-width: 55%;
  flex: 0 1 auto;
  text-align: right;
}
.record-progress p {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0 6px;
}
.record-measure + .record-measure {
  margin-top: 2px;
}
.record-progress strong {
  color: var(--record-heading, var(--color-heading));
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.complete {
  display: block;
  color: var(--record-status, var(--el-color-primary));
  margin-top: 2px;
}
.record-edition {
  display: inline-block;
  padding: 0 5px;
  margin-top: 3px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--accent) 12%, var(--color-background-soft));
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.trial-record .record-body {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
}
.trial-record .record-heading {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
}
.trial-record .record-edition {
  margin-top: 0;
}
.trial-record .record-progress {
  max-width: 100%;
  flex: 0 1 auto;
  text-align: left;
}
.trial-record .record-progress p {
  justify-content: flex-start;
}
/* Activity and rogue banners contain their own title on the left. Fill the card and
   place record text over its empty right side, even when text makes a row taller. */
/* Keep the text column stable while covers load, fail, or are missing. */
.record-row.banner-end-record {
  --record-inset: 58%;
}
.banner-end-record:has(.banner-frame .cover)::after {
  background: linear-gradient(
    to right,
    transparent 35%,
    color-mix(in srgb, var(--color-background-mute) 60%, transparent) var(--record-inset),
    color-mix(in srgb, var(--color-background-mute) 85%, transparent)
  );
}
.banner-end-record .record-body {
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 3px;
  padding-left: 12px;
}
.banner-end-record .record-heading {
  flex: 0 1 auto;
}
.banner-end-record .record-progress {
  display: flex;
  flex-wrap: wrap;
  max-width: none;
  gap: 2px 12px;
  text-align: left;
}
.banner-end-record .record-progress p {
  justify-content: flex-start;
  margin: 0;
}
@media (max-width: 480px) {
  .record-logo {
    left: 6px;
    width: 42px;
    height: 42px;
  }
  .record-row {
    --record-inset: 60px;
  }
  .record-body {
    min-height: 64px;
    padding-right: 8px;
    gap: 8px;
  }
  .banner-frame :deep(.overview-artwork:not(.cover)) {
    margin-left: 6px;
    width: 42px;
    height: 42px;
  }
}
</style>
