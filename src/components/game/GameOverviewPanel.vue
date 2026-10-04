<script setup lang="ts">
import { ElButton, ElSkeleton, ElInput } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshRight, Search } from '@element-plus/icons-vue'
import type { GameAccount } from '@/common/api/accounts'
import type { GameOverview } from '@/common/api/gameOverview'
import { gameServerName } from '@/common/gameServers'
import OperatorAvatar from './OperatorAvatar.vue'
import OverviewLiveDetails from './OverviewLiveDetails.vue'
import OverviewReveal from './OverviewReveal.vue'
import OverviewArtwork from './OverviewArtwork.vue'
import { metricArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import { operatorAvatar } from '@/common/operatorAvatars'
import EmptyState from '@/components/EmptyState.vue'
import type { ApiFailureKind } from '@/common/api/errors'
import { authLocation } from '@/router/returnPath'
const props = defineProps<{
  account: GameAccount
  data: GameOverview | null
  loading: boolean
  failed: boolean
  errorKind?: ApiFailureKind
}>()
defineEmits<{ refresh: [] }>()
const { t, locale } = useI18n()
const collectionMetrics = computed(() =>
  (props.data?.metrics ?? []).filter((metric) => metric.group === 'collection'),
)
const mainProgress = computed(() => {
  const value = props.data?.profile.mainProgress
  return props.account.appCode === 'arknights' && value === ''
    ? t('game.overview.storyCompleted')
    : value || t('game.overview.missing')
})
const search = ref(''),
  expanded = ref(false)
const retainingOperators = ref(false)
watch(
  expanded,
  (value) => {
    if (value) retainingOperators.value = true
  },
  { flush: 'sync' },
)
watch(
  () => props.data,
  () => {
    search.value = ''
    expanded.value = false
    retainingOperators.value = false
  },
)
const { number, date } = useOverviewFormat()
const filtered = computed(() =>
  (props.data?.operators ?? []).filter((char) =>
    char.name.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()),
  ),
)
const visible = computed(() =>
  expanded.value || retainingOperators.value || search.value
    ? filtered.value
    : filtered.value.slice(0, 8),
)
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
      :kind="errorKind === 'session' ? 'login' : 'error'"
      :title="t('game.overview.failed')"
      :description="
        t(errorKind ? `game.overview.errors.${errorKind}` : 'game.overview.failureDescription')
      "
    >
      <template #actions>
        <router-link
          v-if="errorKind === 'session'"
          :to="authLocation('/login', '/game/hypergryph/skland')"
          >{{ t('game.overview.signInAgain') }}</router-link
        >
        <router-link
          v-else-if="errorKind === 'authorization' || errorKind === 'upstream'"
          to="/user"
          >{{ t('game.overview.manageAccount') }}</router-link
        >
      </template>
    </EmptyState>
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
          <dd>{{ mainProgress }}</dd>
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
      <dl
        v-if="collectionMetrics.length"
        class="profile-facts collection-facts"
        :aria-label="t('game.overview.collection')"
      >
        <div v-for="metric in collectionMetrics" :key="metric.key">
          <dt>
            <OverviewArtwork
              class="collection-icon"
              :art="metricArt(account.appCode, metric.key)"
            />
            <span>{{ t(`game.overview.metrics.${metric.key}`) }}</span>
          </dt>
          <dd>
            {{ number(metric.current) }}
            <span v-if="metric.total !== null"> / {{ number(metric.total) }}</span>
          </dd>
        </div>
      </dl>
      <OverviewLiveDetails :account="account" :data="data" />
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
        <OverviewReveal
          v-if="filtered.length"
          :expanded="expanded || !!search"
          :visible-count="8"
          @collapsed="retainingOperators = false"
        >
          <ul class="operator-grid" :data-game="account.appCode">
            <li
              v-for="(char, index) in visible"
              :key="char.id"
              :data-operator-id="char.id"
              :class="{ 'overview-reveal-hidden': !expanded && !search && index >= 8 }"
              :aria-hidden="!expanded && !search && index >= 8"
              :inert="!expanded && !search && index >= 8"
            >
              <OperatorAvatar
                :name="char.name"
                :src="operatorAvatar(account.appCode, char.id, char.avatarUrl, char.skinId)"
                :fallback-src="operatorAvatar(account.appCode, char.id, char.avatarUrl)"
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
        </OverviewReveal>
        <p v-else class="operator-empty">
          {{ search ? t('game.overview.noMatch') : t('game.overview.noOperators') }}
        </p>
        <el-button
          v-if="!search && filtered.length > 8"
          class="operator-toggle"
          text
          @click="expanded = !expanded"
          >{{ t(expanded ? 'game.overview.showLess' : 'game.overview.showAll') }}</el-button
        >
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
.operator-toggle.el-button,
.operator-toggle.el-button:hover,
.operator-toggle.el-button:active,
.operator-toggle.el-button:focus {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  outline: none;
  transform: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.operator-toggle.el-button:hover,
.operator-toggle.el-button:active,
.operator-toggle.el-button:focus-visible {
  color: var(--accent);
}
.operator-toggle.el-button:focus-visible {
  text-decoration: underline;
  text-underline-offset: 4px;
}

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
.profile-facts:has(+ .collection-facts) {
  padding-bottom: 14px;
  border-bottom: 0;
}
.profile-facts.collection-facts {
  padding: 0 0 18px;
  gap: 12px 28px;
}
.collection-facts > div {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.collection-facts dd {
  font-variant-numeric: tabular-nums;
}
.collection-facts dt {
  display: flex;
  align-items: center;
  gap: 6px;
}
.collection-icon {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
}
.collection-facts .collection-icon {
  background: transparent;
}
.collection-icon :deep(img) {
  width: 100%;
  height: 100%;
}
.collection-facts > div:has(.collection-icon) dd {
  padding-left: 24px;
}
.collection-facts dd span {
  color: var(--muted);
  font-weight: 400;
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
  .operator-grid {
    grid-template-columns: 1fr;
  }
}
</style>
