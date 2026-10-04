<script setup lang="ts">
import { ElCard, ElButton, ElSkeleton, ElAlert } from 'element-plus'
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import { authLocation } from '@/router/returnPath'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { sklandCache, roleKey } from '@/common/sklandCache'
import GameOverviewPanel from '@/components/game/GameOverviewPanel.vue'
import { gameOverviewAPI, type GameOverview } from '@/common/api/gameOverview'
import EmptyState from '@/components/EmptyState.vue'
import { ArrowRight } from '@element-plus/icons-vue'
import PageHeading from '@/components/PageHeading.vue'
import { gameServerName } from '@/common/gameServers'
import { sortGameAccounts } from '@/common/gameAccountOrder'
import { apiFailureKind, type ApiFailureKind } from '@/common/api/errors'
import { getCurrentUserAPI, type CurrentUser } from '@/common/api/user'
import {
  apiError,
  gameAccountsAPI,
  checkInAPI,
  type GameAccount,
  type CheckInResults,
} from '@/common/api/accounts'
const { t } = useI18n()
const route = useRoute()
const caughtError = shallowRef<unknown>(null)
const error = computed(() => (caughtError.value === null ? '' : apiError(caughtError.value)))
const user = ref<CurrentUser | null>(null),
  loading = ref(false),
  busy = ref(false)
const games = ref<GameAccount[]>([]),
  results = ref<CheckInResults | null>(null)
const selected = ref<GameAccount | null>(null)
const overview = shallowRef<GameOverview | null>(null)
const detailLoading = ref(false),
  detailFailed = ref(false)
const detailErrorKind = ref<ApiFailureKind | undefined>()
const checkInError = shallowRef<unknown>(null)
const checkInMessage = computed(() =>
  checkInError.value === null ? '' : apiError(checkInError.value),
)
let detailVersion = 0
let accountRequest: AbortController | null = null
let alive = true
function cancelDetail() {
  detailVersion++
  detailLoading.value = false
  detailFailed.value = false
  detailErrorKind.value = undefined
  overview.value = null
}
function selectRole(game: GameAccount) {
  if (selected.value && roleKey(selected.value) === roleKey(game)) return
  void loadOverview(game)
}
async function loadOverview(game = selected.value, force = false) {
  if (!game) return
  cancelDetail()
  selected.value = game
  const version = detailVersion
  const cached = force ? undefined : sklandCache.peekOverview(game)
  if (cached) {
    overview.value = cached
    return
  }
  detailLoading.value = true
  try {
    const data = await sklandCache.loadOverview(
      game,
      (signal) => gameOverviewAPI(game, signal),
      force,
    )
    if (version === detailVersion && alive) overview.value = data
  } catch (error) {
    if (version === detailVersion && alive) {
      detailFailed.value = true
      detailErrorKind.value = apiFailureKind(error)
    }
  } finally {
    if (version === detailVersion && alive) detailLoading.value = false
  }
}
async function load(force = false) {
  if (busy.value || loading.value) return
  if (force) sklandCache.clear()
  const previous = selected.value && roleKey(selected.value)
  cancelDetail()
  selected.value = null
  loading.value = true
  caughtError.value = null
  checkInError.value = null
  games.value = []
  results.value = null
  const request = new AbortController()
  accountRequest = request
  try {
    const current = await getCurrentUserAPI(request.signal)
    if (request.signal.aborted || !alive) return
    sklandCache.setUser(current)
    user.value = current
    if (current?.hypergryphAccount) {
      const accounts = await sklandCache.loadAccounts((signal) => gameAccountsAPI(signal))
      if (request.signal.aborted || !alive) return
      games.value = sortGameAccounts(accounts)
      const next = games.value.find((game) => roleKey(game) === previous) ?? games.value[0]
      if (next) void loadOverview(next)
    }
  } catch (e) {
    if (!request.signal.aborted && alive) {
      sklandCache.clear()
      caughtError.value = e
    }
  } finally {
    if (!request.signal.aborted) loading.value = false
  }
}
async function checkIn() {
  if (busy.value || loading.value || !games.value.length || error.value) return
  busy.value = true
  checkInError.value = null
  results.value = null
  try {
    const data = await checkInAPI()
    if (alive) results.value = data
  } catch (e) {
    if (alive) checkInError.value = e
  } finally {
    if (alive) busy.value = false
  }
}
onBeforeUnmount(() => {
  alive = false
  accountRequest?.abort()
  sklandCache.cancelPending()
  cancelDetail()
})
onMounted(() => load())
</script>
<template>
  <div>
    <PageHeading
      eyebrow="GAME TOOLS / SKLAND"
      :title="t('game.skland.title')"
      :description="t('game.skland.description')"
      number="02"
    />
    <el-card>
      <div class="panel-title">
        <h2>{{ t('game.skland.characters') }}</h2>
        <span>SKLAND</span>
      </div>
      <div v-if="user?.hypergryphAccount" class="actions">
        <el-button :loading="loading" :disabled="busy || loading" @click="load(true)">{{
          t('game.skland.refresh')
        }}</el-button>
        <el-button
          type="primary"
          :loading="busy"
          :disabled="loading || busy || !games.length || !!error"
          @click="checkIn"
          >{{ t('game.skland.checkInAll') }}</el-button
        ><router-link to="/user">{{ t('game.skland.updateLogin') }}</router-link>
      </div>
      <el-skeleton v-if="loading" :rows="4" animated />
      <template v-else>
        <EmptyState
          v-if="error && !games.length"
          kind="error"
          :title="t('game.skland.loadFailed')"
          :description="error"
        >
          <template v-if="!user?.hypergryphAccount" #actions>
            <el-button type="primary" @click="load(true)">{{ t('game.skland.reload') }}</el-button>
          </template>
        </EmptyState>
        <EmptyState
          v-else-if="!user"
          kind="login"
          :title="t('game.skland.loginTitle')"
          :description="t('game.skland.loginDescription')"
        >
          <template #actions
            ><router-link :to="authLocation('/login', route.fullPath)"
              >{{ t('game.skland.login') }} <ArrowRight /></router-link
          ></template>
        </EmptyState>
        <EmptyState
          v-else-if="!user.hypergryphAccount"
          kind="link"
          :title="t('game.skland.linkTitle')"
          :description="t('game.skland.linkDescription')"
        >
          <template #actions
            ><router-link to="/user">{{ t('game.skland.link') }} <ArrowRight /></router-link
          ></template>
        </EmptyState>
        <template v-else-if="user?.hypergryphAccount">
          <el-alert v-if="error" :title="error" type="error" :closable="false" role="alert" />
          <EmptyState
            v-if="!games.length && !error"
            :title="t('game.skland.emptyTitle')"
            :description="t('game.skland.emptyDescription')"
          />
          <div
            v-if="games.length"
            class="role-selector"
            role="group"
            :aria-label="t('game.overview.select')"
          >
            <button
              v-for="game in games"
              :key="roleKey(game)"
              type="button"
              class="role-option"
              :aria-pressed="selected !== null && roleKey(selected) === roleKey(game)"
              @click="selectRole(game)"
            >
              <span class="role-game">{{
                t(game.appCode === 'endfield' ? 'game.endfieldName' : 'game.arknightsName')
              }}</span>
              <strong>{{ game.nickName }}</strong>
              <span>{{ gameServerName(game, t) }} · {{ game.uid }}</span>
            </button>
          </div>
          <el-alert
            v-if="checkInMessage"
            :title="checkInMessage"
            type="error"
            :closable="false"
            role="alert"
          />
          <section v-if="results" :aria-label="t('game.skland.results')">
            <h2>{{ t('game.skland.results') }}</h2>
            <el-alert
              :type="results.errorResults.length ? 'warning' : 'success'"
              :title="
                results.errorResults.length
                  ? t('game.skland.partialFailure')
                  : results.checkInResults.length
                    ? t('game.skland.completed')
                    : t('game.skland.noCharacters')
              "
              :closable="false"
            />
            <p v-for="(item, index) in results.checkInResults" :key="index">{{ item }}</p>
            <p
              v-for="item in results.errorResults"
              :key="`${item.appCode}:${item.uid}`"
              class="failure"
            >
              {{ t('game.skland.characterError', { name: item.nickName, error: item.error }) }}
            </p>
          </section>
          <GameOverviewPanel
            v-if="selected"
            :account="selected"
            :data="overview"
            :loading="detailLoading"
            :failed="detailFailed"
            :error-kind="detailErrorKind"
            @refresh="loadOverview(selected, true)"
          />
        </template>
      </template>
    </el-card>
  </div>
</template>
<style scoped>
.el-alert {
  margin: 16px 0;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 20px 0;
}
.actions a {
  color: var(--accent);
  font-size: 12px;
  margin-left: auto;
}
.actions .el-button {
  margin-left: 0;
}
.role-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}
.role-option {
  text-align: left;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-soft);
  color: var(--muted);
  padding: 16px 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.role-option strong {
  color: var(--color-heading);
  font-size: 15px;
}
.role-game {
  font-size: 10px;
  letter-spacing: 0.04em;
}
.role-option[aria-pressed='true'] {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 6%, var(--color-background-soft));
  box-shadow: inset 3px 0 var(--accent);
}
.role-option[aria-pressed='true'] .role-game {
  color: var(--accent);
}
.role-option:hover {
  border-color: var(--accent);
}
section[aria-label] {
  margin-top: 28px;
}
section[aria-label] h2 {
  font-size: 18px;
  margin-bottom: 16px;
}
section[aria-label] p {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  overflow-wrap: anywhere;
}
.failure {
  color: var(--el-color-danger);
}
@media (max-width: 650px) {
  .role-selector {
    grid-template-columns: 1fr 1fr;
  }
  .role-option {
    padding: 12px;
  }
  .actions a {
    margin-left: 0;
  }
}
@media (max-width: 400px) {
  .role-selector {
    grid-template-columns: 1fr;
  }
}
</style>
