<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  loginAPI,
  registerAPI,
  registrationCodeAPI,
  resetCodeAPI,
  resetPasswordAPI,
  usernameExistsAPI,
  passwordError,
  apiError,
} from '@/common/api/accounts'
import OrbitScene from '@/components/OrbitScene.vue'
import { useCooldown } from '@/composables/useCooldown'
const route = useRoute(),
  router = useRouter()
const mode = computed(() =>
  route.path === '/register' ? 'register' : route.path === '/reset-password' ? 'reset' : 'login',
)
const title = computed(() =>
  mode.value === 'register' ? '注册账号' : mode.value === 'reset' ? '重置密码' : '登录',
)
const form = reactive({ username: '', email: '', password: '', confirm: '', code: '' })
const busy = ref(false),
  sending = ref(false),
  error = ref(''),
  notice = ref('')
const { remaining, start } = useCooldown()
watch(mode, () => {
  form.password = ''
  form.confirm = ''
  form.code = ''
  error.value = ''
  notice.value = ''
  start(0)
})
async function sendCode() {
  if (sending.value || remaining.value || busy.value) return
  error.value = ''
  notice.value = ''
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ||
    (mode.value === 'reset' && !form.username.trim())
  ) {
    error.value = '请先填写正确的邮箱和所需用户名。'
    return
  }
  sending.value = true
  try {
    if (mode.value === 'register') await registrationCodeAPI(form.email.trim())
    else await resetCodeAPI(form.username.trim(), form.email.trim())
    notice.value = '若账号信息符合要求，验证码将发送至邮箱，5 分钟内有效。'
    start(300)
  } catch (e) {
    error.value = apiError(e)
  } finally {
    sending.value = false
  }
}
async function submit() {
  if (busy.value || sending.value) return
  error.value = ''
  notice.value = ''
  const username = form.username.trim(),
    email = form.email.trim()
  if (!username || !form.password) {
    error.value = '请填写用户名和密码。'
    return
  }
  if (mode.value !== 'login') {
    if (mode.value === 'register' && (username.length < 3 || username.length > 30)) {
      error.value = '用户名长度为 3–30 个字符。'
      return
    }
    error.value = passwordError(form.password)
    if (error.value) return
    if (form.password !== form.confirm) {
      error.value = '两次输入的密码不一致。'
      return
    }
    if (!/^\d{6}$/.test(form.code)) {
      error.value = '请输入 6 位邮箱验证码。'
      return
    }
  }
  busy.value = true
  try {
    if (mode.value === 'login') await loginAPI(username, form.password)
    else if (mode.value === 'register') {
      if (await usernameExistsAPI(username)) {
        error.value = '用户名已存在。'
        return
      }
      await registerAPI({ username, email, password: form.password, registrationCode: form.code })
    } else {
      await resetPasswordAPI({ username, email, password: form.password, code: form.code })
      await router.push('/login')
      notice.value = '密码已重置，请使用新密码登录。'
      return
    }
    await router.push('/user')
  } catch (e) {
    error.value = apiError(e)
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
      <p class="eyebrow">YOUR NEXT CHAPTER</p>
      <h1>欢迎回到<br /><span>你的轨道。</span></h1>
      <p class="story-description">连接你的账号，继续你的冒险。<br />游戏与日常，在这里相遇。</p>
      <OrbitScene class="auth-orbit" />
      <router-link to="/" class="text-link">← 回到首页</router-link>
    </section>
    <el-card class="auth-card">
      <p class="section-label">EASON SPACE / ACCOUNT</p>
      <h2>{{ title }}<span> ✦</span></h2>
      <p class="form-description">
        {{
          mode === 'login'
            ? '很高兴再次见到你，准备好出发了吗？'
            : mode === 'register'
              ? '创建你的账号，开启全新探索。'
              : '验证你的邮箱，重新连接你的空间。'
        }}
      </p>
      <el-alert v-if="error" :title="error" type="error" :closable="false" role="alert" />
      <el-alert v-if="notice" :title="notice" type="success" :closable="false" role="status" />
      <el-form label-position="top" @submit.prevent="submit" :disabled="busy || sending">
        <el-form-item label="用户名"
          ><el-input
            v-model="form.username"
            aria-label="用户名"
            autocomplete="username"
            required
            maxlength="30"
        /></el-form-item>
        <el-form-item v-if="mode !== 'login'" label="邮箱"
          ><el-input
            v-model="form.email"
            aria-label="邮箱"
            type="email"
            autocomplete="email"
            required
        /></el-form-item>
        <el-form-item v-if="mode !== 'login'" label="邮箱验证码">
          <el-input
            v-model="form.code"
            aria-label="邮箱验证码"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
          />
          <el-button
            class="code-button"
            :disabled="remaining > 0"
            :loading="sending"
            @click="sendCode"
            >{{ remaining ? `${remaining} 秒后重发` : '发送验证码' }}</el-button
          >
        </el-form-item>
        <el-form-item :label="mode === 'reset' ? '新密码' : '密码'"
          ><el-input
            v-model="form.password"
            :aria-label="mode === 'reset' ? '新密码' : '密码'"
            type="password"
            show-password
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            required
        /></el-form-item>
        <el-form-item v-if="mode !== 'login'" label="确认密码"
          ><el-input
            v-model="form.confirm"
            aria-label="确认密码"
            type="password"
            show-password
            autocomplete="new-password"
            required
        /></el-form-item>
        <p v-if="mode !== 'login'" class="hint">
          密码至少 6 个字符，包含大小写字母和特殊字符；最多 72 个 UTF-8 字节。
        </p>
        <el-button type="primary" native-type="submit" :loading="busy">{{ title }}</el-button>
      </el-form>
      <div v-if="!busy && !sending" class="auth-links">
        <router-link v-if="mode !== 'login'" to="/login">返回登录</router-link>
        <router-link v-if="mode !== 'register'" to="/register">注册账号</router-link>
        <router-link v-if="mode !== 'reset'" to="/reset-password">忘记密码</router-link>
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
