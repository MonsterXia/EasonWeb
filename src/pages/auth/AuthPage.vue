<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  loginAPI,
  registerAPI,
  registrationCodeAPI,
  resetCodeAPI,
  resetPasswordAPI,
  usernameExistsAPI,
  passwordErrorKey,
  apiError,
} from '@/common/api/accounts'
import OrbitScene from '@/components/OrbitScene.vue'
import { useCooldown } from '@/composables/useCooldown'
const { t } = useI18n()
const route = useRoute(),
  router = useRouter()
const mode = computed(() =>
  route.path === '/register' ? 'register' : route.path === '/reset-password' ? 'reset' : 'login',
)
const title = computed(() => t(`account.${mode.value}`))
const form = reactive({ username: '', email: '', password: '', confirm: '', code: '' })
const busy = ref(false),
  sending = ref(false),
  error = shallowRef<(() => string) | null>(null),
  notice = shallowRef<(() => string) | null>(null)
const errorMessage = computed(() => error.value?.() ?? '')
const noticeMessage = computed(() => notice.value?.() ?? '')
const { remaining, start } = useCooldown()
watch(mode, () => {
  form.password = ''
  form.confirm = ''
  form.code = ''
  error.value = null
  notice.value = null
  start(0)
})
async function sendCode() {
  if (sending.value || remaining.value || busy.value) return
  error.value = null
  notice.value = null
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ||
    (mode.value === 'reset' && !form.username.trim())
  ) {
    error.value = () => t('account.auth.codeFieldsRequired')
    return
  }
  sending.value = true
  try {
    if (mode.value === 'register') await registrationCodeAPI(form.email.trim())
    else await resetCodeAPI(form.username.trim(), form.email.trim())
    notice.value = () => t('account.auth.codeSent')
    start(300)
  } catch (e) {
    error.value = () => apiError(e)
  } finally {
    sending.value = false
  }
}
async function submit() {
  if (busy.value || sending.value) return
  error.value = null
  notice.value = null
  const username = form.username.trim(),
    email = form.email.trim()
  if (!username || !form.password) {
    error.value = () => t('account.auth.credentialsRequired')
    return
  }
  if (mode.value !== 'login') {
    if (mode.value === 'register' && (username.length < 3 || username.length > 30)) {
      error.value = () => t('account.auth.usernameLength')
      return
    }
    const passwordIssue = passwordErrorKey(form.password)
    if (passwordIssue) {
      error.value = () => t(passwordIssue)
      return
    }
    if (form.password !== form.confirm) {
      error.value = () => t('account.auth.passwordMismatch')
      return
    }
    if (!/^\d{6}$/.test(form.code)) {
      error.value = () => t('account.auth.codeRequired')
      return
    }
  }
  busy.value = true
  try {
    if (mode.value === 'login') await loginAPI(username, form.password)
    else if (mode.value === 'register') {
      if (await usernameExistsAPI(username)) {
        error.value = () => t('account.auth.usernameExists')
        return
      }
      await registerAPI({ username, email, password: form.password, registrationCode: form.code })
    } else {
      await resetPasswordAPI({ username, email, password: form.password, code: form.code })
      await router.push('/login')
      notice.value = () => t('account.auth.passwordReset')
      return
    }
    await router.push('/user')
  } catch (e) {
    error.value = () => apiError(e)
  } finally {
    busy.value = false
    form.password = ''
    form.confirm = ''
  }
}
</script>

<template>
  <div class="auth-layout">
    <section class="auth-story">
      <p class="eyebrow">{{ t('account.auth.eyebrow') }}</p>
      <h1>
        {{ t('account.auth.heading') }}<br /><span>{{ t('account.auth.headingAccent') }}</span>
      </h1>
      <p class="story-description">
        {{ t('account.auth.story') }}<br />{{ t('account.auth.storySecond') }}
      </p>
      <OrbitScene class="auth-orbit" />
      <router-link to="/" class="text-link">{{ t('account.auth.backHome') }}</router-link>
    </section>
    <el-card class="auth-card">
      <p class="section-label">{{ t('account.auth.section') }}</p>
      <h2>{{ title }}<span> ✦</span></h2>
      <p class="form-description">
        {{
          mode === 'login'
            ? t('account.auth.loginDescription')
            : mode === 'register'
              ? t('account.auth.registerDescription')
              : t('account.auth.resetDescription')
        }}
      </p>
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        :closable="false"
        role="alert"
      />
      <el-alert
        v-if="noticeMessage"
        :title="noticeMessage"
        type="success"
        :closable="false"
        role="status"
      />
      <el-form label-position="top" @submit.prevent="submit" :disabled="busy || sending">
        <el-form-item :label="t('account.username')"
          ><el-input
            v-model="form.username"
            :aria-label="t('account.username')"
            autocomplete="username"
            required
            maxlength="30"
        /></el-form-item>
        <el-form-item v-if="mode !== 'login'" :label="t('account.email')"
          ><el-input
            v-model="form.email"
            :aria-label="t('account.email')"
            type="email"
            autocomplete="email"
            required
        /></el-form-item>
        <el-form-item v-if="mode !== 'login'" :label="t('account.emailCode')">
          <el-input
            v-model="form.code"
            :aria-label="t('account.emailCode')"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
          />
          <el-button
            class="code-button"
            :disabled="remaining > 0"
            :loading="sending"
            @click="sendCode"
            >{{
              remaining ? t('account.resendIn', { seconds: remaining }) : t('account.sendCode')
            }}</el-button
          >
        </el-form-item>
        <el-form-item :label="mode === 'reset' ? t('account.newPassword') : t('account.password')"
          ><el-input
            v-model="form.password"
            :aria-label="mode === 'reset' ? t('account.newPassword') : t('account.password')"
            type="password"
            show-password
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            required
        /></el-form-item>
        <el-form-item v-if="mode !== 'login'" :label="t('account.confirmPassword')"
          ><el-input
            v-model="form.confirm"
            :aria-label="t('account.confirmPassword')"
            type="password"
            show-password
            autocomplete="new-password"
            required
        /></el-form-item>
        <p v-if="mode !== 'login'" class="hint">
          {{ t('account.passwordHint') }}
        </p>
        <el-button type="primary" native-type="submit" :loading="busy">{{ title }}</el-button>
      </el-form>
      <div v-if="!busy && !sending" class="auth-links">
        <router-link v-if="mode !== 'login'" to="/login">{{
          t('account.backToLogin')
        }}</router-link>
        <router-link v-if="mode !== 'register'" to="/register">{{
          t('account.register')
        }}</router-link>
        <router-link v-if="mode !== 'reset'" to="/reset-password">{{
          t('account.forgotPassword')
        }}</router-link>
      </div>
    </el-card>
  </div>
</template>
<style scoped>
.auth-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  max-width: 1040px;
  margin: 20px auto;
  align-items: center;
}
.auth-story h1 {
  font-size: clamp(36px, 4vw, 54px);
  line-height: 1.25;
  margin: 20px 0;
  letter-spacing: -0.05em;
}
.auth-story h1 span {
  color: var(--accent);
}
.story-description {
  color: var(--muted);
  line-height: 1.9;
}
.auth-orbit {
  min-height: 300px;
  height: 310px;
  margin-top: 12px;
}
.auth-story > .text-link {
  margin-top: 15px;
  font-size: 12px;
}
.auth-card {
  width: 100%;
  box-shadow: 0 25px 90px #0003;
  position: relative;
}
.auth-card::before {
  content: '';
  position: absolute;
  inset: 0 30% auto 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
}
.auth-card :deep(.el-card__body) {
  padding: 36px;
}
.auth-card h2 {
  font-size: 28px;
  margin: 13px 0 7px;
}
.auth-card h2 span {
  color: var(--pink);
  font-size: 20px;
}
.form-description {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 28px;
}
.el-alert {
  margin-bottom: 20px;
}
.auth-links {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 25px;
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
  font-size: 12px;
}
.hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-bottom: 16px;
}
.code-button {
  margin-top: 8px;
}
.el-button[native-type],
.el-button[type='submit'] {
  width: 100%;
}
@media (max-width: 850px) {
  .auth-layout {
    gap: 30px;
  }
  .auth-card :deep(.el-card__body) {
    padding: 25px;
  }
}
@media (max-width: 700px) {
  .auth-layout {
    grid-template-columns: 1fr;
    margin: 0 auto;
    max-width: 480px;
  }
  .auth-orbit {
    display: none;
  }
  .auth-story h1 {
    font-size: 32px;
  }
  .auth-story h1 br {
    display: none;
  }
  .story-description,
  .auth-story > .text-link {
    display: none;
  }
}
</style>
