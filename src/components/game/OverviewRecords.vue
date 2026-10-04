<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GameOverview } from '@/common/api/gameOverview'
import { facilityArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'
defineProps<{ section: NonNullable<GameOverview['sections']>[number] }>()
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
          <template v-if="item.bossRush">
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
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-background-soft);
}
.banner-frame {
  position: relative;
  aspect-ratio: 6;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: var(--color-background-mute);
}
.banner-frame :deep(.overview-artwork) {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 0;
}
.record-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 12px 16px;
}
h4,
p {
  margin: 0;
}
h4 {
  font-size: 1rem;
  overflow-wrap: anywhere;
}
.subtitle,
.record-progress {
  font-size: 0.85rem;
}
.subtitle,
.record-progress p > span {
  color: var(--color-text-secondary);
}
.record-progress p {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.record-progress strong {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
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
</style>
