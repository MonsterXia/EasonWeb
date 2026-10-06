<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElAlert, ElButton } from 'element-plus'
import type { CheckInResults, GameAccount } from '@/common/api/accounts'
import { roleKey } from '@/common/sklandCache'
import { gameServerName } from '@/common/gameServers'
const props = defineProps<{ report: CheckInResults; busy: boolean }>()
const emit = defineEmits<{ retry: [roles: GameAccount[]] }>()
const { t, locale } = useI18n()
const rows = computed(() => props.report.results)
const counts = computed(() =>
  rows.value
    ? {
        success: rows.value.filter((r) => r.status === 'success').length,
        already: rows.value.filter((r) => r.status === 'already_checked_in').length,
        failed: rows.value.filter((r) => r.status === 'failed').length,
      }
    : {
        success: props.report.checkInResults.length,
        already: 0,
        failed: props.report.errorResults.length,
      },
)
const total = computed(() => counts.value.success + counts.value.already + counts.value.failed)
const tone = computed(() =>
  !total.value
    ? 'info'
    : counts.value.failed === total.value
      ? 'error'
      : counts.value.failed
        ? 'warning'
        : 'success',
)
const title = computed(() =>
  !total.value
    ? t('game.skland.noCharacters')
    : counts.value.failed === total.value
      ? t('game.skland.attendance.allFailed')
      : counts.value.failed
        ? t('game.skland.partialFailure')
        : t('game.skland.completed'),
)
const retryRoles = computed(
  () => rows.value?.filter((r) => r.status === 'failed' && r.retryable).map((r) => r.account) ?? [],
)
const completedAt = computed(() =>
  props.report.completedAt === undefined
    ? ''
    : new Date(props.report.completedAt * 1000).toLocaleString(locale.value),
)
</script>
<template>
  <section class="check-in-results" :aria-label="t('game.skland.results')" :aria-busy="busy">
    <div class="result-heading">
      <h2>{{ t('game.skland.results') }}</h2>
      <el-button
        v-if="retryRoles.length > 1"
        :disabled="busy"
        size="small"
        @click="emit('retry', retryRoles)"
        >{{ t('game.skland.attendance.retryFailed') }}</el-button
      >
    </div>
    <div role="status" aria-live="polite">
      <el-alert
        :type="tone"
        :title="title"
        :description="total ? t('game.skland.attendance.summary', counts) : undefined"
        :closable="false"
        show-icon
      />
    </div>
    <ul v-if="rows" class="result-list">
      <li
        v-for="row in rows"
        :key="roleKey(row.account)"
        class="result-row"
        :data-status="row.status"
      >
        <div class="role-heading">
          <div class="identity">
            <span class="game-name">{{
              row.account.appCode === 'arknights'
                ? t('game.arknightsName')
                : row.account.appCode === 'endfield'
                  ? t('game.endfieldName')
                  : row.account.appCode
            }}</span>
            <h3>{{ row.account.nickName }}</h3>
            <span class="role-meta">{{
              t('game.skland.accountDetails', {
                uid: row.account.uid,
                server: gameServerName(row.account, t),
              })
            }}</span>
          </div>
          <span class="status-label">{{ t(`game.skland.attendance.${row.status}`) }}</span>
        </div>
        <template v-if="row.status === 'success'">
          <ul v-if="row.rewards.length" class="reward-list">
            <li v-for="(reward, index) in row.rewards" :key="index">
              <span>{{ reward.name ?? t('game.skland.attendance.unknownReward') }}</span>
              <strong>{{
                reward.count === null
                  ? t('game.skland.attendance.unknownCount')
                  : `× ${reward.count}`
              }}</strong>
              <small v-if="reward.type === 'daily' || reward.type === 'first'">{{
                t(`game.skland.attendance.${reward.type}`)
              }}</small>
            </li>
          </ul>
          <p v-if="!row.rewards.length || !row.rewardsComplete" class="hint">
            {{ t(`game.skland.attendance.${row.rewards.length ? 'partialRewards' : 'noRewards'}`) }}
          </p>
        </template>
        <p v-else-if="row.status === 'already_checked_in'" class="hint">
          {{ t('game.skland.attendance.alreadyHint') }}
        </p>
        <div v-else class="row-failure">
          <p>{{ t(`game.skland.attendance.errors.${row.errorCode ?? 'upstream_error'}`) }}</p>
          <el-button
            v-if="row.retryable"
            :disabled="busy"
            size="small"
            @click="emit('retry', [row.account])"
            >{{ t('game.skland.attendance.retry') }}</el-button
          >
          <router-link v-if="row.errorCode === 'auth_expired'" to="/user">{{
            t('game.skland.updateLogin')
          }}</router-link>
        </div>
      </li>
    </ul>
    <div v-else class="legacy-results">
      <p v-for="(item, index) in report.checkInResults" :key="index">{{ item }}</p>
      <p v-for="item in report.errorResults" :key="roleKey(item)" class="legacy-failure">
        {{ t('game.skland.characterError', { name: item.nickName, error: item.error }) }}
      </p>
    </div>
    <details v-if="report.requestId" class="diagnostics">
      <summary>{{ t('game.skland.attendance.diagnostics') }}</summary>
      <p>{{ t('game.skland.attendance.latestRun') }}</p>
      <dl>
        <dt>{{ t('game.skland.attendance.requestId') }}</dt>
        <dd>{{ report.requestId }}</dd>
        <dt>{{ t('game.skland.attendance.completedAt') }}</dt>
        <dd>{{ completedAt }}</dd>
      </dl>
      <p v-if="report.durationMs !== undefined">
        {{
          t('game.skland.attendance.elapsed', { seconds: (report.durationMs / 1000).toFixed(1) })
        }}
      </p>
    </details>
  </section>
</template>
<style scoped>
.check-in-results {
  margin-top: 24px;
}
.result-heading,
.role-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.result-heading {
  align-items: center;
  margin-bottom: 12px;
}
h2 {
  font-size: 18px;
  margin: 0;
}
h3 {
  font-size: 15px;
  margin: 2px 0;
  color: var(--color-heading);
}
.result-list,
.reward-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.result-list {
  margin-top: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}
.result-row {
  padding: 16px;
  background: var(--color-background-soft);
  overflow-wrap: anywhere;
}
.result-row + .result-row {
  border-top: 1px solid var(--color-border);
}
.identity {
  min-width: 0;
}
.game-name,
.role-meta,
.hint,
.diagnostics {
  font-size: 12px;
  color: var(--muted);
}
.role-meta {
  display: block;
}
.status-label {
  font-size: 12px;
  color: var(--el-color-success);
  flex-shrink: 0;
}
[data-status='failed'] .status-label,
.legacy-failure {
  color: var(--el-color-danger);
}
[data-status='already_checked_in'] .status-label {
  color: var(--muted);
}
.reward-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 12px;
}
.reward-list li {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 14px;
}
.reward-list strong {
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
}
.reward-list small {
  font-size: 11px;
  color: var(--muted);
}
.hint {
  margin: 10px 0 0;
}
.row-failure {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.row-failure p {
  flex: 1 1 240px;
  font-size: 13px;
  margin: 0;
}
.row-failure a {
  color: var(--accent);
  font-size: 12px;
}
.diagnostics {
  margin-top: 12px;
  overflow-wrap: anywhere;
}
.diagnostics summary {
  cursor: pointer;
  width: fit-content;
}
.diagnostics dl {
  margin: 8px 0;
}
.diagnostics dd {
  margin: 2px 0 8px;
  font-family: monospace;
}
.diagnostics p {
  margin: 6px 0;
}
.legacy-results p {
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  overflow-wrap: anywhere;
}
@media (max-width: 400px) {
  .result-row {
    padding: 12px;
  }
}
</style>
