<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import EmptyState from '@/components/EmptyState.vue'
import { ArrowRight } from '@element-plus/icons-vue'
import PageHeading from '@/components/PageHeading.vue'
import { getCurrentUserAPI, type CurrentUser } from '@/common/api/user'
import {
  apiError,
  gameAccountsAPI,
  checkInAPI,
  type GameAccount,
  type CheckInResults,
} from '@/common/api/accounts'
const { t } = useI18n()
const caughtError = shallowRef<unknown>(null)
const error = computed(() => (caughtError.value === null ? '' : apiError(caughtError.value)))
const user = ref<CurrentUser | null>(null),
  loading = ref(false),
  busy = ref(false)
const games = ref<GameAccount[]>([]),
  results = ref<CheckInResults | null>(null)
async function load() {
  if (busy.value || loading.value) return
  loading.value = true
  caughtError.value = null
  games.value = []
  results.value = null
  try {
    user.value = await getCurrentUserAPI()
    if (user.value?.hypergryphAccount) games.value = await gameAccountsAPI()
  } catch (e) {
    caughtError.value = e
  } finally {
    loading.value = false
  }
}
async function checkIn() {
  if (busy.value || loading.value || !games.value.length || error.value) return
  busy.value = true
  caughtError.value = null
  results.value = null
  try {
    results.value = await checkInAPI()
  } catch (e) {
    caughtError.value = e
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<template>
  <div>
    <PageHeading
      eyebrow="DAILY QUEST / SKLAND"
      :title="t('game.skland.title')"
      :description="t('game.skland.description')"
      number="02"
    />
    <div class="checkin-banner">
      <span class="banner-icon"
        ><el-icon><Calendar /></el-icon
      ></span>
      <div>
        <span class="section-label">A LITTLE RITUAL, EVERY DAY</span>
        <h2>{{ t('game.skland.bannerTitle') }}</h2>
        <p>{{ t('game.skland.bannerDescription') }}</p>
      </div>
      <span class="banner-star" aria-hidden="true">✳</span>
    </div>
    <el-card>
      <div class="panel-title">
        <h2>{{ t('game.skland.characters') }}</h2>
        <span>DAILY CHECK-IN</span>
      </div>
      <div v-if="user?.hypergryphAccount" class="actions">
        <el-button :loading="loading" :disabled="busy || loading" @click="load">{{
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
            <el-button type="primary" @click="load">{{ t('game.skland.reload') }}</el-button>
          </template>
        </EmptyState>
        <EmptyState
          v-else-if="!user"
          kind="login"
          :title="t('game.skland.loginTitle')"
          :description="t('game.skland.loginDescription')"
        >
          <template #actions
            ><router-link to="/login">{{ t('game.skland.login') }} <ArrowRight /></router-link
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
          <ul class="game-list">
            <li v-for="game in games" :key="`${game.appCode}:${game.gameId}:${game.uid}`">
              <span class="game-avatar"
                ><el-icon><Aim /></el-icon></span
              ><strong>{{ game.nickName }}</strong> ·
              {{ t(game.appCode === 'endfield' ? 'game.endfieldName' : 'game.arknightsName')
              }}<br />
              {{ t('game.skland.accountDetails', { uid: game.uid, server: game.gameId }) }}
            </li>
          </ul>
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
        </template>
      </template>
    </el-card>
  </div>
</template>
<style scoped>
.checkin-banner {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 30px;
  margin-bottom: 25px;
  border: 1px solid #54416c;
  border-radius: 20px;
  background:
    radial-gradient(ellipse at 85% 40%, #8e5bd633, transparent 50%),
    linear-gradient(120deg, #211a34, #171626);
}
.banner-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  color: #c8aaff;
  border: 1px solid #b9a4ff40;
  background: #b9a4ff10;
  border-radius: 18px;
  font-size: 29px;
}
.checkin-banner h2 {
  font-size: 23px;
  margin: 7px 0;
}
.checkin-banner p {
  color: #b0a2c7;
  font-size: 12px;
}
.banner-star {
  margin-left: auto;
  color: #bda0ff;
  font-size: 65px;
  line-height: 1;
  animation: orbit 40s linear infinite;
}
.el-alert {
  margin-bottom: 16px;
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
.game-list {
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  list-style: none;
}
.game-list li {
  position: relative;
  padding: 20px 20px 20px 65px;
  border: 1px solid #30364c;
  border-radius: 12px;
  background: #181e2e;
  overflow-wrap: anywhere;
  color: var(--muted);
  font-size: 12px;
}
.game-list strong {
  color: #f1f4fc;
  font-size: 15px;
}
.game-avatar {
  position: absolute;
  left: 18px;
  top: 25px;
  color: #c8aaff;
  font-size: 25px;
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
  .checkin-banner {
    padding: 22px;
    gap: 15px;
  }
  .banner-icon {
    display: none;
  }
  .checkin-banner h2 {
    font-size: 20px;
  }
  .banner-star {
    font-size: 35px;
  }
  .game-list {
    grid-template-columns: 1fr;
  }
  .actions a {
    margin-left: 0;
  }
}
</style>
