<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import { getCurrentUserAPI, type CurrentUser } from '@/common/api/user'
import {
  apiError,
  gameAccountsAPI,
  checkInAPI,
  type GameAccount,
  type CheckInResults,
} from '@/common/api/accounts'
const user = ref<CurrentUser | null>(null),
  loading = ref(true),
  busy = ref(false),
  error = ref('')
const games = ref<GameAccount[]>([]),
  results = ref<CheckInResults | null>(null)
async function load() {
  if (busy.value) return
  loading.value = true
  error.value = ''
  games.value = []
  results.value = null
  user.value = null
  try {
    user.value = await getCurrentUserAPI()
    if (user.value?.hypergryphAccount) games.value = await gameAccountsAPI()
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}
async function checkIn() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  results.value = null
  try {
    results.value = await checkInAPI()
  } catch (e) {
    error.value = apiError(e)
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
      title="森空岛签到"
      description="明日方舟、终末地，每一份日常奖励都值得期待。"
      number="02"
    />
    <div class="checkin-banner">
      <span class="banner-icon"
        ><el-icon><Calendar /></el-icon
      ></span>
      <div>
        <span class="section-label">A LITTLE RITUAL, EVERY DAY</span>
        <h2>今天，也别忘了签个到。</h2>
        <p>绑定鹰角账号后，查询角色并手动领取签到奖励。</p>
      </div>
      <span class="banner-star" aria-hidden="true">✳</span>
    </div>
    <el-card>
      <div class="panel-title">
        <h2>我的游戏角色</h2>
        <span>DAILY CHECK-IN</span>
      </div>
      <el-skeleton v-if="loading" :rows="4" animated />
      <template v-else>
        <el-alert v-if="error" :title="error" type="error" :closable="false" role="alert" />
        <el-result v-if="!user && !error" title="请先登录" icon="info"
          ><template #extra><router-link to="/login">前往登录</router-link></template></el-result
        >
        <el-result v-else-if="user && !user.hypergryphAccount" title="请先绑定鹰角账号" icon="info"
          ><template #extra
            ><router-link to="/user">前往用户中心绑定</router-link></template
          ></el-result
        >
        <template v-else-if="user?.hypergryphAccount">
          <div class="actions">
            <el-button :disabled="busy" @click="load">刷新游戏账号</el-button
            ><el-button
              type="primary"
              :loading="busy"
              :disabled="!games.length || !!error"
              @click="checkIn"
              >全部签到</el-button
            ><router-link to="/user">更新账号登录</router-link>
          </div>
          <el-empty v-if="!games.length && !error" description="未找到可签到的游戏角色" />
          <ul class="game-list">
            <li v-for="game in games" :key="`${game.appCode}:${game.gameId}:${game.uid}`">
              <span class="game-avatar"
                ><el-icon><Aim /></el-icon></span
              ><strong>{{ game.nickName }}</strong> ·
              {{ game.appCode === 'endfield' ? '终末地' : '明日方舟' }}<br />UID：{{ game.uid }} ·
              区服：{{ game.gameId }}
            </li>
          </ul>
          <section v-if="results" aria-label="签到结果">
            <h2>签到结果</h2>
            <el-alert
              :type="results.errorResults.length ? 'warning' : 'success'"
              :title="
                results.errorResults.length
                  ? '部分角色签到失败，请查看详情后重试。'
                  : results.checkInResults.length
                    ? '签到完成'
                    : '没有可签到的角色'
              "
              :closable="false"
            />
            <p v-for="(item, index) in results.checkInResults" :key="index">{{ item }}</p>
            <p
              v-for="item in results.errorResults"
              :key="`${item.appCode}:${item.uid}`"
              class="failure"
            >
              {{ item.nickName }}：{{ item.error }}
            </p>
          </section>
        </template>
        <el-button v-if="error" @click="load">重试</el-button>
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
