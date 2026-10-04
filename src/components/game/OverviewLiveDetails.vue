<script setup lang="ts">
import { ElIcon } from 'element-plus'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sunny, OfficeBuilding, Collection } from '@element-plus/icons-vue'
import type { GameAccount } from '@/common/api/accounts'
import type { GameOverview, OverviewMetric } from '@/common/api/gameOverview'
import { metricCurrent, overviewTime } from '@/common/resourceRecovery'
import { metricArt, sectionArt, facilityArt } from '@/common/overviewAssets'
import { overviewSections } from '@/common/overviewSections'
import { operatorAvatar } from '@/common/operatorAvatars'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OperatorAvatar from './OperatorAvatar.vue'
import OverviewArtwork from './OverviewArtwork.vue'
import OverviewRecords from './OverviewRecords.vue'
import SandboxDetails from './SandboxDetails.vue'
const props = defineProps<{ account: GameAccount; data: GameOverview }>()
const sections = computed(() => overviewSections(props.data.sections))
const { t } = useI18n()
const { number, date } = useOverviewFormat()
const clock = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
const tick = () => {
  clock.value = Date.now()
}
onMounted(() => {
  timer = setInterval(tick, 1000)
  document.addEventListener('visibilitychange', tick)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', tick)
})
const resourceTime = computed(() =>
  props.data ? overviewTime(props.data, clock.value) : clock.value / 1000,
)
const liveMetrics = computed(() =>
  (props.data?.metrics ?? [])
    .filter(
      (metric) =>
        metric.key !== 'recruitRefresh' ||
        !props.data?.sections?.some((section) => section.key === 'arknightsOffice'),
    )
    .map((metric) => ({ ...metric, current: metricCurrent(metric, resourceTime.value) })),
)
const groups = [
  { key: 'daily', icon: Sunny },
  { key: 'base', icon: OfficeBuilding },
  { key: 'collection', icon: Collection },
] as const
const progress = (metric: OverviewMetric) =>
  metric.current !== null && metric.total !== null && metric.total > 0
    ? Math.min(100, (metric.current / metric.total) * 100)
    : null
</script>
<template>
  <template v-for="group in groups" :key="group.key">
    <section v-if="liveMetrics.some((metric) => metric.group === group.key)" class="metric-section">
      <h3>
        <el-icon><component :is="group.icon" /></el-icon>{{ t(`game.overview.${group.key}`) }}
      </h3>
      <div class="metric-grid" :class="group.key">
        <article
          v-for="metric in liveMetrics.filter((item) => item.group === group.key)"
          :key="metric.key"
          class="metric"
        >
          <div class="metric-heading">
            <OverviewArtwork :art="metricArt(account.appCode, metric.key)" />
            <h4>{{ t(`game.overview.metrics.${metric.key}`) }}</h4>
          </div>
          <p class="metric-value">
            <strong>{{ number(metric.current) }}</strong
            ><span v-if="metric.total !== null"> / {{ number(metric.total) }}</span>
          </p>
          <div v-if="progress(metric) !== null" class="meter" aria-hidden="true">
            <span :style="{ width: `${progress(metric)}%` }" />
          </div>
          <p v-if="metric.current === null" class="metric-note">
            {{ t('game.overview.missing') }}
          </p>
          <p
            v-else-if="
              metric.recoveryAt &&
              metric.recoveryAt > resourceTime &&
              metric.total !== null &&
              metric.current < metric.total
            "
            class="metric-note"
          >
            {{ t('game.overview.recovery', { time: date(metric.recoveryAt) }) }}
          </p>
        </article>
      </div>
    </section>
  </template>
  <section
    v-if="data.sections?.length"
    class="facility-section"
    :aria-label="t('game.overview.details')"
  >
    <details
      v-for="section in sections"
      :key="section.key"
      class="facility-group"
      :open="
        !/(Activities|Rogue|Tower|Campaign|BossRush|Sandbox|Exploration|WarEchoes|Monolith)/.test(
          section.key,
        )
      "
    >
      <summary>
        <OverviewArtwork class="section-art" :art="sectionArt(section.key)" />
        <span class="section-title">{{ t(`game.overview.sections.${section.key}`) }}</span
        ><span class="section-count">{{ section.items.length }}</span>
      </summary>
      <OverviewRecords
        v-if="
          section.items.length &&
          /^arknights(Activities|Rogue|RogueRelics|RogueBank|Tower|Campaign|BossRush)$/.test(
            section.key,
          )
        "
        :section="section"
      />
      <ul v-else-if="section.items.length" class="facility-grid">
        <li v-for="(item, index) in section.items" :key="item.id">
          <OverviewArtwork class="facility-art" :art="facilityArt(section.key, item)" />
          <header>
            <OperatorAvatar
              v-if="item.operatorId"
              :name="item.name || item.operatorId"
              :src="operatorAvatar(account.appCode, item.operatorId)"
            />
            <strong>{{
              item.nameKey
                ? t(`game.overview.facilityNames.${item.nameKey}`)
                : item.name || t('game.overview.slot', { index: index + 1 })
            }}</strong>
            <span v-if="item.level !== null">{{
              t('game.overview.facilityLevel', { level: number(item.level) })
            }}</span>
          </header>
          <SandboxDetails v-if="item.sandbox" :record="item.sandbox" />
          <p v-if="item.subtitle" class="facility-subtitle">{{ item.subtitle }}</p>
          <p v-if="item.rating" class="facility-status">
            {{ t('game.overview.rating', { rating: item.rating }) }}
          </p>
          <p v-if="item.status !== 'unknown'" class="facility-status" :data-status="item.status">
            {{
              section.key === 'arknightsOffice' &&
              (item.status === 'complete' || (item.completeAt && item.completeAt <= resourceTime))
                ? t('game.overview.officeReady')
                : t(
                    `game.overview.statuses.${item.status === 'working' && ['arknightsRecruitment', 'arknightsTraining', 'arknightsOffice', 'arknightsClues'].includes(section.key) && item.completeAt && item.completeAt <= resourceTime ? 'complete' : item.status}`,
                  )
            }}
          </p>
          <p
            v-if="
              (item.current !== null || item.total !== null) &&
              !(
                section.key === 'arknightsOffice' &&
                item.current === 0 &&
                item.completeAt &&
                item.completeAt <= resourceTime
              )
            "
            class="facility-value"
          >
            <span>{{ t(`game.overview.sectionValues.${section.key}`) }}</span>
            <strong v-if="section.key.startsWith('endfieldExploration') && item.total === 0"
              >—</strong
            ><strong v-else
              >{{ number(item.current)
              }}<template v-if="item.total !== null"> / {{ number(item.total) }}</template></strong
            >
          </p>
          <p v-if="item.completeAt && item.completeAt > resourceTime" class="metric-note">
            {{
              t(
                section.key === 'arknightsTrading'
                  ? 'game.overview.nextOrder'
                  : 'game.overview.completes',
                { time: date(item.completeAt) },
              )
            }}
          </p>
          <p
            v-if="
              !item.sandbox &&
              item.status === 'unknown' &&
              item.current === null &&
              item.level === null &&
              !item.subtitle
            "
            class="metric-note"
          >
            {{ t('game.overview.missing') }}
          </p>
        </li>
      </ul>
      <p v-else class="metric-note">{{ t('game.overview.noDetails') }}</p>
    </details>
  </section>
</template>
<style scoped>
.facility-section {
  margin-top: 30px;
}
.facility-group {
  border-top: 1px solid var(--color-border);
  padding: 18px 0;
}
.facility-group summary {
  cursor: pointer;
  color: var(--color-heading);
  font-weight: 600;
  font-size: 15px;
}
.facility-group summary:focus {
  outline: none;
}
.facility-group summary:focus-visible .section-title {
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
}
.facility-group summary > .section-count {
  margin-left: 12px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
}
.facility-grid {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px;
}
.facility-grid li {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  min-width: 0;
}
.facility-grid header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.facility-grid header strong {
  font-size: 14px;
  color: var(--color-heading);
  overflow-wrap: anywhere;
}
.facility-grid header span,
.facility-subtitle {
  font-size: 12px;
  color: var(--muted);
}
.facility-status {
  color: var(--accent);
  font-size: 12px;
  margin-top: 10px;
}
.facility-status[data-status='locked'],
.facility-status[data-status='idle'] {
  color: var(--muted);
}
.facility-value {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  font-size: 12px;
}
.facility-value > span {
  color: var(--muted);
}
.facility-value strong {
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
}
.metric-section {
  margin-top: 28px;
}
h3 {
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 14px;
}
h3 .el-icon {
  color: var(--muted);
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.metric {
  padding: 20px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 14px;
}
.metric-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.metric-heading h4 {
  margin: 0;
  overflow-wrap: anywhere;
}
.section-art {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  vertical-align: middle;
  margin-right: 8px;
}
.facility-art {
  margin-bottom: 14px;
}
h4 {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}
.metric-value {
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.metric-value strong {
  font-size: 29px;
  font-weight: 650;
  letter-spacing: -1px;
  color: var(--color-heading);
}
.metric-value span {
  font-size: 13px;
  color: var(--muted);
}
.meter {
  height: 4px;
  background: var(--color-border);
  border-radius: 4px;
  margin-top: 18px;
  overflow: hidden;
}
.meter span {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
}
.metric-note {
  font-size: 11px;
  color: var(--muted);
  margin-top: 10px;
}
.collection .metric,
.base .metric {
  padding: 16px 20px;
}
.collection .metric-value strong,
.base .metric-value strong {
  font-size: 24px;
}
@media (max-width: 1000px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .metric {
    padding: 16px 12px;
  }
  .metric-value strong {
    font-size: 25px;
  }
  .collection .metric,
  .base .metric {
    padding: 14px 12px;
  }
}
@media (max-width: 360px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
