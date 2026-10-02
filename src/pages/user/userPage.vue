<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElCard, ElSkeleton, ElButton, ElIcon } from 'element-plus'
import EmptyState from '@/components/EmptyState.vue'
import { ArrowRight, Message, Iphone, RefreshRight, SwitchButton } from '@element-plus/icons-vue'
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
          <div class="avatar" aria-hidden="true">{{ user.username.slice(0, 1).toUpperCase() }}</div>
          <div class="identity">
            <div class="identity-heading">
              <h2>{{ user.username }}</h2>
              <span class="role-badge">{{
                user.isAdmin ? t('account.profile.admin') : t('account.profile.explorer')
              }}</span>
            </div>
            <p>
              {{ t('account.profile.welcome') }} <span class="user-id">#{{ user.id }}</span>
            </p>
          </div>
          <div class="profile-actions">
            <el-button text :disabled="loggingOut" @click="loadUser"
              ><el-icon><RefreshRight /></el-icon>{{ t('account.profile.refresh') }}</el-button
            >
            <el-button text :loading="loggingOut" @click="logout"
              ><el-icon><SwitchButton /></el-icon>{{ t('account.profile.logout') }}</el-button
            >
          </div>
        </div>
        <dl class="contact-details">
          <div>
            <dt>
              <el-icon><Message /></el-icon>{{ t('account.email') }}
            </dt>
            <dd>{{ user.email || t('account.profile.notSet') }}</dd>
          </div>
          <div>
            <dt>
              <el-icon><Iphone /></el-icon>{{ t('account.phone') }}
            </dt>
            <dd>{{ user.phone || t('account.profile.notSet') }}</dd>
          </div>
        </dl>
        <AccountBindings :user="user" @changed="loadUser" />
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.profile-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 6px 28px;
}
.avatar {
  display: grid;
  place-items: center;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  border-radius: 21px;
  background: color-mix(in srgb, var(--accent) 10%, var(--color-background-soft));
  border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
  color: var(--accent);
  font-size: 29px;
  font-weight: 650;
}
.identity {
  min-width: 0;
  flex: 1;
}
.identity-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.identity h2 {
  font-size: 27px;
  line-height: 1.35;
  letter-spacing: -0.025em;
  overflow-wrap: anywhere;
}
.identity p {
  margin-top: 7px;
  font-size: 13px;
  color: var(--muted);
}
.user-id {
  margin-left: 9px;
  font-family: ui-monospace, monospace;
  color: var(--muted);
}
.role-badge {
  padding: 3px 9px;
  border-radius: 6px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  font-size: 11px;
  white-space: nowrap;
}
.profile-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}
.profile-actions .el-button {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
.profile-actions :deep(.el-icon) {
  margin-right: 7px;
}
.contact-details {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  margin: 0;
  padding: 24px 6px 28px;
  border-top: 1px solid var(--color-border);
  gap: 24px;
}
.contact-details dt {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
}
.contact-details dd {
  margin: 9px 0 0;
  color: var(--color-heading);
  font-size: 14px;
  overflow-wrap: anywhere;
}
@media (max-width: 700px) {
  .profile-banner {
    flex-wrap: wrap;
    gap: 14px;
    padding-inline: 0;
  }
  .avatar {
    flex-basis: 52px;
    width: 52px;
    height: 52px;
    border-radius: 17px;
    font-size: 24px;
  }
  .identity h2 {
    font-size: 23px;
  }
  .identity p {
    font-size: 12px;
  }
  .profile-actions {
    width: 100%;
    justify-content: flex-start;
    margin-left: -12px;
  }
  .contact-details {
    grid-template-columns: 1fr;
    gap: 20px;
    padding-inline: 0;
  }
}
</style>
