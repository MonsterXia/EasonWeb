<script setup lang="ts">
import { ElIcon } from 'element-plus'
import { computed, ref, watch, useId, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sunny, OfficeBuilding, ArrowDown } from '@element-plus/icons-vue'
import type { GameAccount } from '@/common/api/accounts'
import type { GameOverview } from '@/common/api/gameOverview'
import { metricCurrent, overviewTime } from '@/common/resourceRecovery'
import { metricArt, sectionArt, facilityArt } from '@/common/overviewAssets'
import { overviewSections, endfieldSections } from '@/common/overviewSections'
import { overviewMetrics } from '@/common/overviewMetrics'
import { dailyStatus, durationParts, type DailyMetric } from '@/common/dailyStatus'
import { operatorAvatar } from '@/common/operatorAvatars'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OperatorAvatar from './OperatorAvatar.vue'
import OverviewArtwork from './OverviewArtwork.vue'
import EndfieldTitleIcon from './EndfieldTitleIcon.vue'
import OverviewRecords from './OverviewRecords.vue'
import SandboxDetails from './SandboxDetails.vue'
import OverviewReveal from './OverviewReveal.vue'
import ReceptionDetails from './ReceptionDetails.vue'
import RegionalDevelopment from './RegionalDevelopment.vue'
import MonolithDetails from './MonolithDetails.vue'
import EndfieldDetails from './EndfieldDetails.vue'
import WarEchoesDetails from './WarEchoesDetails.vue'
import GloryRoad from './GloryRoad.vue'
import EndfieldExploration from './EndfieldExploration.vue'
import { vAnimatedDetails } from '@/common/animatedDetails'
const props = defineProps<{ account: GameAccount; data: GameOverview }>()
const hasCollapsibleTitles = computed(() =>
  ['arknights', 'endfield'].includes(props.account.appCode),
)
const gloryRoad = computed(() => props.account.appCode !== 'endfield' ? null : props.data.gloryRoad ?? {
  count: props.data.metrics.find(m => m.key === 'achievements')?.current ?? null,
  tiers: [1,2,3].map(level => ({level, count: props.data.metrics.find(m => m.key === `medalLevel${level}`)?.current ?? null})),
  display: null,
  medals: null,
})
const sections = computed(() =>
  overviewSections(
    props.account.appCode === 'endfield' ? endfieldSections(props.data) : props.data.sections,
  ).filter(
    (section) =>
      !props.data.warEchoes ||
      !['endfieldWarEchoesWeeks', 'endfieldWarEchoesStages'].includes(section.key),
  ),
)
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
  gridObserver = new ResizeObserver(measureGrids)
  Object.values(gridElements).forEach((element) => {
    if (element) gridObserver?.observe(element)
  })
  measureGrids()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  gridObserver?.disconnect()
  document.removeEventListener('visibilitychange', tick)
})
const resourceTime = computed(() =>
  props.data ? overviewTime(props.data, clock.value) : clock.value / 1000,
)
const liveMetrics = computed(() =>
  dailyStatus(
    props.account.appCode,
    {
      ...props.data,
      metrics: overviewMetrics(props.account.appCode, props.data),
    },
    resourceTime.value,
  )
    .filter(
      (metric) =>
        !(
          props.account.appCode === 'endfield' &&
          metric.group === 'base' &&
          metric.key === 'cnsLevel'
        ),
    )
    .map((metric) => ({
      ...metric,
      current: metricCurrent(metric, resourceTime.value),
    })),
)
const duration = (seconds: number) => {
  const parts = durationParts(seconds)
  return (['days', 'hours', 'minutes'] as const)
    .filter((unit) => parts[unit] > 0)
    .map((unit) => t(`game.overview.dailyStatus.${unit}`, { count: parts[unit] }))
    .join('')
}
const metricNote = (metric: DailyMetric) => {
  if (!metric.note) return ''
  return metric.note.key === 'missing'
    ? t('game.overview.missing')
    : t(`game.overview.dailyStatus.${metric.note.key}`, {
        time: metric.note.seconds === undefined ? '' : duration(metric.note.seconds),
      })
}

const groups = [
  { key: 'daily', icon: Sunny, artwork: 'arknightsDaily' },
  { key: 'base', icon: OfficeBuilding, artwork: 'arknightsBase' },
] as const
type MetricGroup = (typeof groups)[number]['key']
const gridId = useId()
const expandedGroups = ref<Record<MetricGroup, boolean>>({
  daily: false,
  base: false,
})
const gridColumns = ref<Record<MetricGroup, number>>({ daily: 2, base: 2 })
const gridElements: Partial<Record<MetricGroup, HTMLElement>> = {}
let gridObserver: ResizeObserver | undefined
const groupMetrics = computed(() => ({
  daily: liveMetrics.value.filter((metric) => metric.group === 'daily'),
  base: liveMetrics.value.filter((metric) => metric.group === 'base'),
}))
function measureGrids() {
  for (const { key } of groups) {
    const element = gridElements[key]
    if (!element) continue
    // Read the actual CSS grid, including its mobile layout and container width.
    const columns = getComputedStyle(element)
      .gridTemplateColumns.split(/\s+/)
      .filter(Boolean).length
    gridColumns.value[key] = Math.max(1, columns)
  }
}
function setGrid(key: MetricGroup, element: HTMLElement | null) {
  if (gridElements[key] === element) return
  const previous = gridElements[key]
  if (previous) gridObserver?.unobserve(previous)
  if (element) {
    gridElements[key] = element
    gridObserver?.observe(element)
  } else delete gridElements[key]
}
watch(
  () => [props.account.appCode, props.account.gameId, props.account.uid],
  () => {
    expandedGroups.value = { daily: false, base: false }
  },
)
</script>
<template>
  <template v-for="group in groups" :key="group.key">
    <component
      :is="hasCollapsibleTitles ? 'details' : 'section'"
      :key="`${account.appCode}:${account.gameId}:${account.uid}:${group.key}`"
      v-animated-details
      v-if="liveMetrics.some((metric) => metric.group === group.key)"
      class="metric-section compact-metrics"
      :open="hasCollapsibleTitles ? true : undefined"
    >
      <component :is="hasCollapsibleTitles ? 'summary' : 'div'" class="metric-summary">
      <h3>
        <OverviewArtwork
          v-if="account.appCode === 'arknights'"
          class="metric-title-art"
          :art="sectionArt(group.artwork)"
        />
        <span
          v-else-if="account.appCode === 'endfield' && group.key === 'daily'"
          class="endfield-title-art"
        ><EndfieldTitleIcon kind="daily" /></span>
        <el-icon v-else><component :is="group.icon" /></el-icon>
        {{
          t(
            account.appCode === 'arknights'
              ? `game.overview.arknightsTitles.${group.key}`
              : account.appCode === 'endfield' && group.key === 'daily'
                ? 'game.overview.endfieldTitles.daily'
                : `game.overview.${group.key}`,
          )
        }}
      </h3>
      </component>
      <div class="facility-content">
      <OverviewReveal
        :expanded="group.key === 'base' || expandedGroups[group.key]"
        :visible-count="gridColumns[group.key] * 2"
      >
        <div
          :id="`${gridId}-${group.key}`"
          :ref="(element) => setGrid(group.key, element as HTMLElement | null)"
          class="metric-grid"
          :class="group.key"
        >
          <article
            v-for="(metric, index) in groupMetrics[group.key]"
            :class="{
              'overview-reveal-hidden':
                group.key === 'daily' &&
                !expandedGroups[group.key] &&
                index >= gridColumns[group.key] * 2,
            }"
            :aria-hidden="
              group.key === 'daily' &&
              !expandedGroups[group.key] &&
              index >= gridColumns[group.key] * 2
            "
            :inert="
              group.key === 'daily' &&
              !expandedGroups[group.key] &&
              index >= gridColumns[group.key] * 2
            "
            :key="metric.key"
            class="metric"
            :data-metric="metric.key"
          >
            <div class="metric-heading">
              <OverviewArtwork :art="metricArt(account.appCode, metric.key)" />
              <h4>{{ t(`game.overview.metrics.${metric.key}`) }}</h4>
            </div>
            <p class="metric-value" :class="{ 'text-value': metric.text || metric.textKey }">
              <strong>{{
                metric.text ||
                (metric.textKey
                  ? t(`game.overview.dailyStatus.${metric.textKey}`)
                  : number(metric.current, false))
              }}</strong
              ><span v-if="!metric.text && !metric.textKey && metric.total !== null">
                / {{ number(metric.total, false) }}</span
              >
            </p>
            <p v-if="metric.note" class="metric-note">
              {{ metricNote(metric) }}
            </p>
            <p v-else-if="metric.current === null" class="metric-note">
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
      </OverviewReveal>
      <button
        v-if="group.key === 'daily' && groupMetrics[group.key].length > gridColumns[group.key] * 2"
        type="button"
        class="metrics-toggle"
        :aria-expanded="expandedGroups[group.key]"
        :aria-controls="`${gridId}-${group.key}`"
        @click="expandedGroups[group.key] = !expandedGroups[group.key]"
      >
        {{ t(expandedGroups[group.key] ? 'game.overview.showLess' : 'game.overview.expand') }}
        <el-icon class="toggle-chevron" :class="{ expanded: expandedGroups[group.key] }"
          ><ArrowDown
        /></el-icon>
      </button>
      </div>
    </component>
  </template>
  <section v-if="sections.length || gloryRoad" class="facility-section" :aria-label="t('game.overview.details')">
    <details v-if="gloryRoad" :key="`${account.appCode}:${account.gameId}:${account.uid}:glory`" v-animated-details class="facility-group" data-section="endfieldGloryRoad" open>
      <summary>
        <OverviewArtwork class="section-art" :art="metricArt('endfield', 'achievements')" />
        <span class="section-title">{{ t('game.overview.glory.title') }}</span>
      </summary>
      <div class="facility-content"><GloryRoad :data="gloryRoad" /></div>
    </details>
    <template v-for="section in sections" :key="`${account.appCode}:${account.gameId}:${account.uid}:${section.key}`">
      <details
        v-animated-details
        class="facility-group"
        :class="{
          'paired-facility': section.key === 'arknightsOfficeTraining',
        }"
        :data-section="section.key"
        :open="
          !['endfieldSpaceship', 'endfieldDomains'].includes(section.key) &&
          !/(Activities|Rogue|Tower|Campaign|BossRush|Sandbox|Exploration|WarEchoes|Monolith)/.test(
            section.key,
          )
        "
      >
        <summary>
          <span
            v-if="section.key === 'arknightsOfficeTraining'"
            class="section-title paired-section-title"
          >
            <span class="paired-facility-label">
              <OverviewArtwork class="section-art" :art="sectionArt('arknightsOffice')" />
              <span>{{ t('game.overview.sections.arknightsOffice') }}</span>
            </span>
            <span>{{ t('game.overview.facilityAnd') }}</span>
            <span class="paired-facility-label">
              <OverviewArtwork class="section-art" :art="sectionArt('arknightsTraining')" />
              <span>{{ t('game.overview.sections.arknightsTraining') }}</span>
            </span>
          </span>
          <template v-else>
            <OverviewArtwork class="section-art" :art="sectionArt(section.key)" />
            <span class="section-title">{{ t(`game.overview.sections.${section.key}`) }}</span>
          </template>
          <span v-if="section.key !== 'arknightsClues'" class="section-count">{{
            section.items.length
          }}</span>
        </summary>
        <div class="facility-content">
          <EndfieldExploration
            v-if="section.key === 'endfieldExploration'"
            :key="`${account.appCode}:${account.gameId}:${account.uid}:exploration`"
            :section="section"
          />
          <ReceptionDetails
            v-else-if="section.key === 'arknightsClues' && section.items.length"
            :items="section.items"
            :resource-time="resourceTime"
          />
          <OverviewRecords
            v-else-if="
              section.items.length &&
              /^arknights(Activities|Rogue|RogueRelics|RogueBank|Tower|Campaign|BossRush)$/.test(
                section.key,
              )
            "
            :section="section"
          />
          <WarEchoesDetails
            v-else-if="section.key === 'endfieldWarEchoes' && data.warEchoes"
            :key="`${account.appCode}:${account.gameId}:${account.uid}:war`"
            :data="data.warEchoes"
            :resource-time="resourceTime"
          />
          <RegionalDevelopment
            v-else-if="section.key === 'endfieldDomains' && data.regionalDevelopment"
            :key="`${account.appCode}:${account.gameId}:${account.uid}:development`"
            :data="data.regionalDevelopment"
          />
          <MonolithDetails
            v-else-if="section.key === 'endfieldMonolith' && data.monolith"
            :key="`${account.appCode}:${account.gameId}:${account.uid}:monolith`"
            :data="data.monolith"
          />
          <EndfieldDetails
            v-else-if="
              account.appCode === 'endfield' &&
              section.key.startsWith('endfield') &&
              section.items.length
            "
            :section="section"
            :resource-time="resourceTime"
          />
          <ul
            v-else-if="section.items.length"
            class="facility-grid"
            :class="{
              'recruitment-grid': section.key === 'arknightsRecruitment',
              'support-grid': section.key === 'arknightsSupport',
              'base-facility-grid': [
                'arknightsTrading',
                'arknightsDormitories',
                'arknightsManufacturing',
              ].includes(section.key),
              'compact-facility-grid': [
                'arknightsRecruitment',
                'arknightsOfficeTraining',
                'arknightsTrading',
                'arknightsDormitories',
                'arknightsManufacturing',
              ].includes(section.key),
            }"
          >
            <li
              v-for="(item, index) in section.items"
              :key="`${item.sourceSection ?? section.key}:${item.id}`"
              :class="{ 'sandbox-card': section.key === 'arknightsSandbox' }"
            >
              <OverviewArtwork
                class="facility-art"
                :art="facilityArt(item.sourceSection ?? section.key, item)"
              />
              <header>
                <OperatorAvatar
                  v-if="item.operatorId"
                  :name="item.name || item.operatorId"
                  :src="operatorAvatar(account.appCode, item.operatorId, undefined, item.skinId)"
                  :fallback-src="operatorAvatar(account.appCode, item.operatorId)"
                />
                <strong>{{
                  item.nameKey
                    ? t(`game.overview.facilityNames.${item.nameKey}`)
                    : item.name || t('game.overview.slot', { index: index + 1 })
                }}</strong>
                <span v-if="item.level !== null">{{
                  t('game.overview.facilityLevel', {
                    level: number(item.level),
                  })
                }}</span>
              </header>
              <SandboxDetails v-if="item.sandbox" :record="item.sandbox" />
              <p v-if="item.subtitle" class="facility-subtitle">
                {{ item.subtitle }}
              </p>
              <p v-if="item.rating" class="facility-status">
                {{ t('game.overview.rating', { rating: item.rating }) }}
              </p>
              <p
                v-if="item.status !== 'unknown'"
                class="facility-status"
                :data-status="item.status"
              >
                {{
                  (item.sourceSection ?? section.key) === 'arknightsOffice' &&
                  (item.status === 'complete' ||
                    (item.completeAt && item.completeAt <= resourceTime))
                    ? t('game.overview.officeReady')
                    : t(
                        `game.overview.statuses.${item.status === 'working' && ['arknightsRecruitment', 'arknightsTraining', 'arknightsOffice', 'arknightsClues'].includes(item.sourceSection ?? section.key) && item.completeAt && item.completeAt <= resourceTime ? 'complete' : item.status}`,
                      )
                }}
              </p>
              <p
                v-if="
                  (item.current !== null || item.total !== null) &&
                  !(
                    (item.sourceSection ?? section.key) === 'arknightsOffice' &&
                    item.current === 0 &&
                    item.completeAt &&
                    item.completeAt <= resourceTime
                  )
                "
                class="facility-value"
              >
                <span>{{
                  t(`game.overview.sectionValues.${item.sourceSection ?? section.key}`)
                }}</span>
                <strong
                  v-if="
                    (item.sourceSection ?? section.key).startsWith('endfieldExploration') &&
                    item.total === 0
                  "
                  >—</strong
                ><strong v-else
                  >{{ number(item.current)
                  }}<template v-if="item.total !== null">
                    / {{ number(item.total) }}</template
                  ></strong
                >
              </p>
              <p v-if="item.completeAt && item.completeAt > resourceTime" class="metric-note">
                {{
                  t(
                    (item.sourceSection ?? section.key) === 'arknightsTrading'
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
        </div>
      </details>
    </template>
  </section>
</template>
<style scoped>
.toggle-chevron {
  transition: transform 260ms ease;
}
.toggle-chevron.expanded {
  transform: rotate(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .toggle-chevron {
    transition: none;
  }
}

.metrics-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.metrics-toggle {
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  box-shadow: none;
}
.metrics-toggle:hover,
.metrics-toggle:active,
.metrics-toggle:focus-visible {
  color: var(--accent);
}
.metrics-toggle:focus-visible {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.facility-section {
  margin-top: 30px;
}
.facility-content {
  display: flow-root;
  overflow: hidden;
}
.facility-group {
  min-width: 0;
  border-top: 1px solid var(--color-border);
  padding: 18px 0;
}
.paired-facility .facility-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
}
.facility-group summary {
  list-style: none;
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
/* The sandbox mark decorates the card header without taking its own row. */
.facility-grid > .sandbox-card {
  position: relative;
  isolation: isolate;
}
.sandbox-card > .facility-art {
  position: absolute;
  top: 12px;
  right: 16px;
  width: 80px;
  height: 64px;
  margin: 0;
  background: transparent;
  border-radius: 0;
  opacity: 0.22;
  filter: brightness(0.65);
  pointer-events: none;
  z-index: -1;
}
.sandbox-card > .facility-art :deep(img) {
  width: 100%;
  height: 100%;
  transform: none;
}
html.dark .sandbox-card > .facility-art {
  filter: none;
  opacity: 0.28;
}
.facility-grid > .sandbox-card > header {
  min-height: 40px;
  align-items: center;
  padding-right: 88px;
}
.facility-grid > .sandbox-card > header strong {
  font-size: 20px;
  font-weight: 650;
  line-height: 1.4;
}
@media (max-width: 520px) {
  .facility-grid > .sandbox-card > header strong {
    font-size: 18px;
  }
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
.metric-title-art {
  width: 28px;
  height: 28px;
  vertical-align: middle;
  transform: scale(0.6);
  background: transparent;
  border-radius: 0;
}
.endfield-title-art {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
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
  background: transparent;
  border-radius: 0;
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
.metric-note {
  font-size: 11px;
  color: var(--muted);
  margin-top: 10px;
}
.base .metric {
  padding: 16px 20px;
}
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
  .base .metric {
    padding: 14px 12px;
  }
}
@media (max-width: 360px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
/* Daily/base metrics are quick-read indicators; detailed records retain their layout. */
.compact-metrics {
  margin-top: 18px;
}
.compact-metrics h3 {
  margin: 0 0 8px;
}
details.compact-metrics {
  min-width: 0;
  margin-top: 0;
  border-top: 1px solid var(--color-border);
  padding: 18px 0;
}
details.compact-metrics + .facility-section {
  margin-top: 0;
}
.compact-metrics > summary {
  cursor: pointer;
  color: var(--color-heading);
  font-size: 15px;
  font-weight: 600;
}
.compact-metrics > summary h3 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  vertical-align: middle;
  margin: 0;
}
.compact-metrics > summary:focus {
  outline: none;
}
.compact-metrics > summary:focus-visible h3 {
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
}
.compact-metrics > summary + .facility-content > .overview-reveal {
  margin-top: 8px;
}
.compact-metrics .metric-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr));
  gap: 8px;
  grid-auto-rows: 1fr;
  align-items: stretch;
}
.compact-metrics .metric {
  position: relative;
  isolation: isolate;
  display: grid;
  align-content: start;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  row-gap: 2px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 8px;
}
.compact-metrics .metric-heading {
  display: contents;
}
.compact-metrics .metric-heading > .overview-artwork {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 64px;
  height: 64px;
  background: transparent;
  border-radius: 0;
  opacity: 0.14;
  pointer-events: none;
  z-index: -1;
}
.compact-metrics h4 {
  grid-column: 1;
  line-height: 1.4;
}
.compact-metrics .metric-value {
  grid-column: 1;
  align-self: start;
  margin: 0;
  overflow-wrap: anywhere;
}
.compact-metrics .metric-value strong {
  font-size: 23px;
  letter-spacing: -0.4px;
}
.compact-metrics .text-value strong {
  font-size: 16px;
  letter-spacing: 0;
  line-height: 1.4;
}
.compact-metrics .metric-value span {
  font-size: 12px;
}
.compact-metrics .metric-note {
  grid-column: 1 / -1;
  margin: 4px 0 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
@media (max-width: 600px) {
  .compact-metrics .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
  .compact-metrics .metric {
    padding: 9px 10px;
  }
  .compact-metrics .metric-heading > .overview-artwork {
    right: 6px;
    width: 56px;
    height: 56px;
  }
  .compact-metrics h4 {
    align-self: center;
  }
  .compact-metrics .metric-value {
    grid-column: 1 / -1;
  }
}

/* Compact facility cards share a decorative watermark and left-aligned details. */
.facility-grid.recruitment-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr));
  gap: 8px;
}
.compact-facility-grid li {
  position: relative;
  isolation: isolate;
  min-height: 74px;
  padding: 12px 14px;
  border-radius: 8px;
}
.compact-facility-grid .facility-art {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  margin: 0;
  background: transparent;
  opacity: 0.14;
  pointer-events: none;
  z-index: -1;
}
.compact-facility-grid header,
.compact-facility-grid .facility-status {
  padding-right: 44px;
}
.compact-facility-grid .facility-status {
  margin: 5px 0 0;
}
.compact-facility-grid .metric-note {
  margin: 6px 0 0;
  overflow-wrap: anywhere;
}
@media (max-width: 600px) {
  .facility-grid.recruitment-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
  .compact-facility-grid li {
    padding: 10px;
  }
  .compact-facility-grid .facility-art {
    right: 4px;
    width: 48px;
    height: 48px;
  }
  .compact-facility-grid header,
  .compact-facility-grid .facility-status {
    padding-right: 36px;
  }
}
/* Support operators are compact identity rows, with level beside the avatar. */
.facility-grid.support-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
  gap: 8px;
  margin-top: 12px;
}
.support-grid li {
  padding: 10px;
  border-radius: 8px;
}
.support-grid header {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  column-gap: 10px;
  row-gap: 2px;
  align-items: center;
}
.support-grid header .operator-avatar {
  grid-column: 1;
  grid-row: 1 / 3;
  width: 40px;
  height: 40px;
  border-radius: 8px;
}
.support-grid header strong {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  line-height: 1.35;
}
.support-grid header > span:not(.operator-avatar) {
  grid-column: 2;
  grid-row: 2;
  align-self: start;
  line-height: 1.35;
}
/* Keep production status and its count together instead of stacking sparse rows. */
.base-facility-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 8px;
}
.base-facility-grid li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-content: start;
  align-items: baseline;
  gap: 6px 12px;
  min-height: 0;
  padding: 10px 12px;
}
.base-facility-grid header {
  grid-column: 1 / -1;
  padding-right: 0;
  gap: 4px 8px;
}
.base-facility-grid .facility-status {
  grid-column: 1;
  grid-row: 2;
  padding: 0;
  margin: 0;
}
.base-facility-grid .facility-value {
  grid-column: 1 / -1;
  grid-row: 2;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 2px 6px;
  margin: 0;
}
.base-facility-grid .facility-status ~ .facility-value {
  grid-column: 2;
}
.base-facility-grid .metric-note {
  grid-column: 1 / -1;
  margin: 0;
  line-height: 1.45;
}
.paired-facility .compact-facility-grid header {
  padding-right: 0;
  gap: 4px 8px;
}
@media (max-width: 600px) {
  .paired-facility .facility-grid {
    gap: 6px;
  }
  .paired-facility .section-art {
    width: 22px;
    height: 22px;
    margin-right: 4px;
  }
  .paired-facility summary > .section-count {
    margin-left: 4px;
  }
}
.paired-section-title {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  vertical-align: middle;
}
.paired-facility-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.paired-facility-label .section-art {
  margin-right: 0;
  background: transparent;
  border-radius: 0;
}
</style>
