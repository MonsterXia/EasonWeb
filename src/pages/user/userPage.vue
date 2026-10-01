<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import EmptyState from '@/components/EmptyState.vue'
import { ArrowRight } from '@element-plus/icons-vue'
import PageHeading from '@/components/PageHeading.vue'
import AccountBindings from '@/components/account/AccountBindings.vue'
import { getCurrentUserAPI, logoutAPI, type CurrentUser } from '@/common/api/user'

const { t, locale } = useI18n()
let logoutMessage: ReturnType<typeof ElMessage.error> | undefined
watch(locale, () => logoutMessage?.close())
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
    logoutMessage = ElMessage.error(t('account.profile.logoutFailed'))
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
      :eyebrow="t('account.profile.eyebrow')"
      :title="t('account.profile.title')"
      :description="t('account.profile.description')"
      number="03"
    />
    <el-card class="profile-card">
      <el-skeleton v-if="loading" :rows="4" animated :aria-label="t('account.profile.loading')" />
      <EmptyState
        v-else-if="failed"
        kind="error"
        :title="t('account.profile.failedTitle')"
        :description="t('account.profile.failedDescription')"
      >
        <template #actions
          ><el-button type="primary" @click="loadUser">{{
            t('account.profile.reload')
          }}</el-button></template
        >
      </EmptyState>
      <EmptyState
        v-else-if="!user"
        kind="login"
        :title="t('account.profile.loginTitle')"
        :description="t('account.profile.loginDescription')"
      >
        <template #actions>
          <router-link to="/login">{{ t('account.profile.login') }} <ArrowRight /></router-link>
          <router-link to="/register">{{ t('account.register') }}</router-link>
          <el-button text @click="loadUser">{{ t('account.profile.refreshSession') }}</el-button>
        </template>
      </EmptyState>
      <template v-else>
        <div class="profile-banner">
          <div class="avatar">{{ user.username.slice(0, 1).toUpperCase() }}</div>
          <div>
            <p class="eyebrow">{{ t('account.profile.greeting') }}</p>
            <h2>{{ user.username }}</h2>
            <p>{{ t('account.profile.welcome') }}</p>
          </div>
          <span class="pill">{{
            user.isAdmin ? t('account.profile.admin') : t('account.profile.explorer')
          }}</span>
        </div>
        <div class="profile-details">
          <el-descriptions :title="t('account.profile.details')" :column="1" border>
            <el-descriptions-item :label="t('account.profile.id')">{{
              user.id
            }}</el-descriptions-item>
            <el-descriptions-item :label="t('account.username')">{{
              user.username
            }}</el-descriptions-item>
            <el-descriptions-item :label="t('account.email')">{{
              user.email || t('account.profile.notSet')
            }}</el-descriptions-item>
            <el-descriptions-item :label="t('account.phone')">{{
              user.phone || t('account.profile.notSet')
            }}</el-descriptions-item>
            <el-descriptions-item :label="t('account.profile.role')">{{
              user.isAdmin ? t('account.profile.admin') : t('account.profile.member')
            }}</el-descriptions-item>
          </el-descriptions>
          <el-descriptions
            :title="t('account.profile.linkedAccounts')"
            :column="1"
            border
            class="linked-accounts"
          >
            <el-descriptions-item :label="t('account.binding.hypergryph')">{{
              user.hypergryphAccount?.phone || t('account.profile.notBound')
            }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <AccountBindings :user="user" @changed="loadUser" />
        <div class="actions">
          <el-button :disabled="loggingOut" @click="loadUser">{{
            t('account.profile.refresh')
          }}</el-button>
          <el-button type="primary" :loading="loggingOut" @click="logout">{{
            t('account.profile.logout')
          }}</el-button>
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
