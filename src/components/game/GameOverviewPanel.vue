<script setup lang="ts">
import { ElButton, ElSkeleton, ElIcon, ElInput } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshRight, Search, Sunny, OfficeBuilding, Collection } from '@element-plus/icons-vue'
import type { GameAccount } from '@/common/api/accounts'
import type { GameOverview, OverviewMetric } from '@/common/api/gameOverview'
import { gameServerName } from '@/common/gameServers'
import OperatorAvatar from './OperatorAvatar.vue'
import { operatorAvatar } from '@/common/operatorAvatars'
import EmptyState from '@/components/EmptyState.vue'
const props = defineProps<{
  account: GameAccount
  data: GameOverview | null
  loading: boolean
  failed: boolean
}>()
defineEmits<{ refresh: [] }>()
const { t, locale } = useI18n()
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
          <dt>{{ t('game.overview.registered') }}</dt>
          <dd>{{ date(data.profile.registeredAt, true) }}</dd>
        </div>
      </dl>
      <template v-for="group in groups" :key="group.key">
        <section
          v-if="data.metrics.some((metric) => metric.group === group.key)"
          class="metric-section"
        >
          <h3>
            <el-icon><component :is="group.icon" /></el-icon>{{ t(`game.overview.${group.key}`) }}
          </h3>
          <div class="metric-grid" :class="group.key">
            <article
              v-for="metric in data.metrics.filter((item) => item.group === group.key)"
              :key="metric.key"
              class="metric"
              :class="{ primary: metric.key === 'stamina' }"
            >
              <h4>{{ t(`game.overview.metrics.${metric.key}`) }}</h4>
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
                v-else-if="metric.recoveryAt && metric.recoveryAt > data.fetchedAt"
                class="metric-note"
              >
                {{ t('game.overview.recovery', { time: date(metric.recoveryAt) }) }}
              </p>
            </article>
          </div>
        </section>
      </template>
      <section class="operator-section">
        <div class="operator-heading">
          <div>
            <h3>{{ t('game.overview.operators') }}</h3>
            <p>
              {{
                data.operators === null
                  ? t('game.overview.missing')
                  : t('game.overview.operatorCount', { count: data.operators.length })
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
        <p>{{ t('game.overview.snapshot') }}</p>
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
.metric.primary {
  background: color-mix(in srgb, var(--accent) 7%, var(--color-background-soft));
  border-color: color-mix(in srgb, var(--accent) 28%, var(--color-border));
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
.metric.primary .metric-value strong {
  color: var(--accent);
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
