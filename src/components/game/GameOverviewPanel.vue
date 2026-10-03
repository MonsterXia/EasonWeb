<script setup lang="ts">
import { ElButton, ElSkeleton, ElIcon, ElInput } from 'element-plus'
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshRight, Search, Sunny, OfficeBuilding, Collection } from '@element-plus/icons-vue'
import type { GameAccount } from '@/common/api/accounts'
import type { GameOverview, OverviewMetric } from '@/common/api/gameOverview'
import { gameServerName } from '@/common/gameServers'
import OperatorAvatar from './OperatorAvatar.vue'
import OverviewArtwork from './OverviewArtwork.vue'
import { metricArt, sectionArt, facilityArt } from '@/common/overviewAssets'
import { operatorAvatar } from '@/common/operatorAvatars'
import EmptyState from '@/components/EmptyState.vue'
import { metricCurrent, overviewTime } from '@/common/resourceRecovery'
const props = defineProps<{
  account: GameAccount
  data: GameOverview | null
  loading: boolean
  failed: boolean
}>()
defineEmits<{ refresh: [] }>()
const { t, locale } = useI18n()
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
const search = ref(''),
  expanded = ref(false)
watch(
  () => props.data,
  () => {
    search.value = ''
    expanded.value = false
  },
)
const groups = [
  { key: 'daily', icon: Sunny },
  { key: 'base', icon: OfficeBuilding },
  { key: 'collection', icon: Collection },
] as const
const number = (value: number | null) =>
  value === null ? '—' : new Intl.NumberFormat(locale.value).format(value)
function date(value: number | null, dateOnly = false) {
  if (!value) return t('game.overview.missing')
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    ...(dateOnly ? {} : { timeStyle: 'short' as const }),
  }).format(value * 1000)
}
const filtered = computed(() =>
  (props.data?.operators ?? []).filter((char) =>
    char.name.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()),
  ),
)
const visible = computed(() =>
  expanded.value || search.value ? filtered.value : filtered.value.slice(0, 8),
)
const progress = (metric: OverviewMetric) =>
  metric.current !== null && metric.total !== null && metric.total > 0
    ? Math.min(100, (metric.current / metric.total) * 100)
    : null
</script>
<template>
  <section class="overview" :aria-label="t('game.overview.title')" :aria-busy="loading">
    <header class="overview-header">
      <div>
        <p class="role-meta">
          {{ t(account.appCode === 'endfield' ? 'game.endfieldName' : 'game.arknightsName') }}
          <span> / </span> {{ gameServerName(account, t) }}
        </p>
        <h2>{{ account.nickName }}</h2>
        <p class="role-uid">UID {{ account.uid }}</p>
      </div>
      <el-button
        :icon="RefreshRight"
        :loading="loading"
        :disabled="loading"
        @click="$emit('refresh')"
        >{{ t('game.overview.refresh') }}</el-button
      >
    </header>
    <div
      v-if="loading"
      class="overview-loading"
      role="status"
      :aria-label="t('game.overview.loading')"
    >
      <el-skeleton :rows="6" animated />
    </div>
    <EmptyState
      v-else-if="failed"
      kind="error"
      :title="t('game.overview.failed')"
      :description="t('game.overview.failureDescription')"
    />
    <template v-else-if="data">
      <dl class="profile-facts">
        <div>
          <dt>
            {{
              t(account.appCode === 'endfield' ? 'game.overview.authority' : 'game.overview.level')
            }}
          </dt>
          <dd>{{ number(data.profile.level) }}</dd>
        </div>
        <div v-if="account.appCode === 'endfield'">
          <dt>{{ t('game.overview.worldLevel') }}</dt>
          <dd>{{ number(data.profile.worldLevel) }}</dd>
        </div>
        <div class="story">
          <dt>{{ t('game.overview.progress') }}</dt>
          <dd>{{ data.profile.mainProgress ?? t('game.overview.missing') }}</dd>
        </div>
        <div>
          <dt>{{ t('game.overview.lastOnline') }}</dt>
          <dd>{{ date(data.profile.lastOnlineAt) }}</dd>
        </div>
        <div>
          <dt>
            {{
              t(
                account.appCode === 'endfield'
                  ? 'game.overview.awakening'
                  : 'game.overview.registered',
              )
            }}
          </dt>
          <dd>{{ date(data.profile.registeredAt, true) }}</dd>
        </div>
      </dl>
      <template v-for="group in groups" :key="group.key">
        <section
          v-if="liveMetrics.some((metric) => metric.group === group.key)"
          class="metric-section"
        >
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
          v-for="section in data.sections"
          :key="section.key"
          class="facility-group"
          :open="
            !/(Activities|Rogue|Tower|Campaign|Sandbox|Exploration|WarEchoes|Monolith)/.test(
              section.key,
            )
          "
        >
          <summary>
            <OverviewArtwork class="section-art" :art="sectionArt(section.key)" />
            {{ t(`game.overview.sections.${section.key}`) }}<span>{{ section.items.length }}</span>
          </summary>
          <ul v-if="section.items.length" class="facility-grid">
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
              <p v-if="item.subtitle" class="facility-subtitle">{{ item.subtitle }}</p>
              <p v-if="item.rating" class="facility-status">
                {{ t('game.overview.rating', { rating: item.rating }) }}
              </p>
              <p
                v-if="item.status !== 'unknown'"
                class="facility-status"
                :data-status="item.status"
              >
                {{
                  section.key === 'arknightsOffice' &&
                  (item.status === 'complete' ||
                    (item.completeAt && item.completeAt <= resourceTime))
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
                  }}<template v-if="item.total !== null">
                    / {{ number(item.total) }}</template
                  ></strong
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
      <section class="operator-section">
        <div class="operator-heading">
          <div>
            <h3>{{ t('game.overview.operators') }}</h3>
            <p>
              {{
                data.operators === null
                  ? t('game.overview.missing')
                  : t(
                      account.appCode === 'arknights'
                        ? 'game.overview.operatorRecords'
                        : 'game.overview.operatorCount',
                      { count: data.operators.length },
                    )
              }}
            </p>
          </div>
          <el-input
            v-if="data.operators?.length"
            v-model="search"
            :prefix-icon="Search"
            :placeholder="t('game.overview.search')"
            :aria-label="t('game.overview.search')"
            clearable
          />
        </div>
        <ul v-if="visible.length" class="operator-grid" :data-game="account.appCode">
          <li v-for="char in visible" :key="char.id" :data-operator-id="char.id">
            <OperatorAvatar
              :name="char.name"
              :src="operatorAvatar(account.appCode, char.id, data.profile.endministratorGender)"
            />
            <div>
              <strong>{{ char.name }}</strong>
              <p v-if="char.rarity != null || char.potential != null">
                <span v-if="char.rarity != null">{{
                  t('game.overview.rarity', { count: char.rarity })
                }}</span>
                <span v-if="char.potential != null">
                  · {{ t('game.overview.potential', { value: char.potential }) }}</span
                >
              </p>
              <p v-if="char.profession || char.element">
                {{ [char.profession, char.element].filter(Boolean).join(' · ') }}
              </p>
              <p>
                {{ t('game.overview.operatorLevel', { level: number(char.level) })
                }}<span v-if="char.phase !== null">
                  · {{ t('game.overview.phase', { phase: char.phase }) }}</span
                >
              </p>
            </div>
          </li>
        </ul>
        <p v-else class="operator-empty">
          {{ search ? t('game.overview.noMatch') : t('game.overview.noOperators') }}
        </p>
        <el-button v-if="!search && filtered.length > 8" text @click="expanded = !expanded">{{
          t(expanded ? 'game.overview.showLess' : 'game.overview.showAll')
        }}</el-button>
        <p v-if="locale === 'en'" class="source-note">{{ t('game.overview.namesNote') }}</p>
      </section>
      <footer class="snapshot-note">
        <p>
          {{
            t(
              account.appCode === 'arknights'
                ? 'game.overview.snapshot'
                : 'game.overview.recordNote',
            )
          }}
        </p>
        <p>
          {{
            data.updatedAt
              ? t('game.overview.updated', { time: date(data.updatedAt) })
              : t('game.overview.unknownTime')
          }}<span>{{ t('game.overview.fetched', { time: date(data.fetchedAt) }) }}</span>
        </p>
      </footer>
    </template>
  </section>
</template>
<style scoped>
.overview {
  margin-top: 28px;
  border-top: 1px solid var(--color-border);
  padding-top: 30px;
}
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
.facility-group summary > span:not(.overview-artwork) {
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
.overview-header,
.operator-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.role-meta {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}
.role-meta span {
  margin: 0 8px;
  color: var(--color-border);
}
.overview-header h2 {
  font-size: 28px;
  margin: 4px 0;
  overflow-wrap: anywhere;
}
.role-uid,
.source-note,
.operator-heading p {
  font-size: 12px;
  color: var(--muted);
}
.profile-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 36px;
  padding: 24px 0;
  margin: 0;
  border-bottom: 1px solid var(--color-border);
}
.profile-facts dt {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 4px;
}
.profile-facts dd {
  margin: 0;
  font-weight: 600;
  color: var(--color-heading);
  font-size: 13px;
}
.profile-facts .story {
  flex: 1;
  min-width: 140px;
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
.operator-section {
  margin-top: 30px;
}
.operator-heading {
  margin-bottom: 16px;
}
.operator-heading h3 {
  margin-bottom: 4px;
}
.operator-heading .el-input {
  max-width: 260px;
}
.operator-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 20px;
}
.operator-grid li {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}
.operator-grid strong {
  font-size: 13px;
  color: var(--color-heading);
  overflow-wrap: anywhere;
}
.operator-grid p,
.operator-empty {
  font-size: 12px;
  color: var(--muted);
}
.operator-section .el-button,
.source-note {
  margin-top: 12px;
}
.snapshot-note {
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
  margin-top: 30px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.9;
}
.snapshot-note span {
  display: inline-block;
  margin-left: 20px;
}
.overview-loading {
  padding: 32px 0;
  min-height: 400px;
}
@media (max-width: 1000px) {
  .metric-grid,
  .operator-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .overview-header,
  .operator-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
  .overview-header h2 {
    font-size: 24px;
  }
  .operator-heading .el-input {
    max-width: none;
  }
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
  .profile-facts {
    gap: 18px 24px;
  }
  .profile-facts .story {
    flex: auto;
  }
  .snapshot-note span {
    display: block;
    margin-left: 0;
  }
}
@media (max-width: 360px) {
  .metric-grid,
  .operator-grid {
    grid-template-columns: 1fr;
  }
}
</style>
