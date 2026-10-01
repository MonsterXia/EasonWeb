<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import EmptyState from '@/components/EmptyState.vue'
import { ArrowRight } from '@element-plus/icons-vue'
import PageHeading from '@/components/PageHeading.vue'
import AccountBindings from '@/components/account/AccountBindings.vue'
import { getCurrentUserAPI, logoutAPI, type CurrentUser } from '@/common/api/user'

const user = ref<CurrentUser | null>(null)
const loading = ref(true)
const failed = ref(false)
const loggingOut = ref(false)
let request: AbortController | undefined

async function loadUser() {
  request?.abort()
  const controller = new AbortController()
  request = controller
  loading.value = true
  failed.value = false
  user.value = null
  try {
    const result = await getCurrentUserAPI(controller.signal)
    if (!controller.signal.aborted) user.value = result
  } catch {
    if (!controller.signal.aborted) failed.value = true
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}

async function logout() {
  loggingOut.value = true
  try {
    await logoutAPI()
    user.value = null
  } catch {
    ElMessage.error('退出失败，请稍后重试。')
  } finally {
    loggingOut.value = false
  }
}

onMounted(loadUser)
onBeforeUnmount(() => request?.abort())
</script>

<template>
  <div>
    <PageHeading
      eyebrow="YOUR PERSONAL SPACE"
      title="用户中心"
      description="你的资料、你的账号、你的游戏日常，都在这里。"
      number="03"
    />
    <el-card class="profile-card">
      <el-skeleton v-if="loading" :rows="4" animated aria-label="正在加载用户资料" />
      <EmptyState
        v-else-if="failed"
        kind="error"
        title="资料暂时没能加载"
        description="连接似乎出了点小问题，稍后再试一次。"
      >
        <template #actions
          ><el-button type="primary" @click="loadUser">重新加载</el-button></template
        >
      </EmptyState>
      <EmptyState
        v-else-if="!user"
        kind="login"
        title="登录，回到你的空间"
        description="管理个人资料、连接鹰角账号，让游戏日常从这里开始。"
      >
        <template #actions>
          <router-link to="/login">登录账号 <ArrowRight /></router-link>
          <router-link to="/register">注册账号</router-link>
          <el-button text @click="loadUser">刷新登录状态</el-button>
        </template>
      </EmptyState>
      <template v-else>
        <div class="profile-banner">
          <div class="avatar">{{ user.username.slice(0, 1).toUpperCase() }}</div>
          <div>
            <p class="eyebrow">NICE TO SEE YOU</p>
            <h2>{{ user.username }}</h2>
            <p>欢迎回到你的专属空间。</p>
          </div>
          <span class="pill">{{ user.isAdmin ? '管理员' : '探索者' }}</span>
        </div>
        <div class="profile-details">
          <el-descriptions title="用户资料" :column="1" border>
            <el-descriptions-item label="ID">{{ user.id }}</el-descriptions-item>
            <el-descriptions-item label="用户名">{{ user.username }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ user.email || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ user.phone || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="身份">{{
              user.isAdmin ? '管理员' : '普通用户'
            }}</el-descriptions-item>
          </el-descriptions>
          <el-descriptions title="关联账号" :column="1" border class="linked-accounts">
            <el-descriptions-item label="鹰角账号">{{
              user.hypergryphAccount?.phone || '未绑定'
            }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <AccountBindings :user="user" @changed="loadUser" />
        <div class="actions">
          <el-button :disabled="loggingOut" @click="loadUser">刷新资料</el-button>
          <el-button type="primary" :loading="loggingOut" @click="logout">退出登录</el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.profile-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0 28px;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--color-border);
}
.avatar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 22px;
  background: linear-gradient(135deg, #76f7d0, #b8a3ff);
  color: #142b30;
  font-size: 30px;
  font-weight: 800;
  box-shadow: 0 0 30px #76f7d014;
}
.profile-banner h2 {
  margin: 4px 0;
  font-size: 24px;
  overflow-wrap: anywhere;
}
.profile-banner p:not(.eyebrow) {
  font-size: 12px;
  color: var(--muted);
}
.profile-banner > .pill {
  margin-left: auto;
  flex-shrink: 0;
}
.profile-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  border-top: 1px solid var(--color-border);
  padding-top: 24px;
}
.actions .el-button {
  margin: 0;
}
@media (max-width: 760px) {
  .profile-details {
    grid-template-columns: 1fr;
  }
  .profile-banner {
    gap: 13px;
  }
  .profile-banner > .pill {
    display: none;
  }
  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }
}
</style>
