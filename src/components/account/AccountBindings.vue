<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { CurrentUser } from '@/common/api/user'
import {
  apiError,
  hypergryphSmsAPI,
  bindHypergryphAPI,
  unbindHypergryphAPI,
} from '@/common/api/accounts'
import { useCooldown } from '@/composables/useCooldown'
const props = defineProps<{ user: CurrentUser }>()
const emit = defineEmits<{ changed: [] }>()
const hg = reactive({
  phone: props.user.hypergryphAccount?.phone ?? '',
  method: 'sms' as 'sms' | 'password',
  password: '',
  code: '',
})
const busy = ref(false),
  error = ref(''),
  notice = ref('')
const { remaining, start } = useCooldown()
async function operate(action: () => Promise<unknown>, refresh = true) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await action()
    notice.value = '操作成功。'
    if (refresh) emit('changed')
  } catch (e) {
    error.value = apiError(e)
  } finally {
    busy.value = false
    hg.password = ''
    hg.code = ''
  }
}
function sendSms() {
  if (remaining.value || !/^1\d{10}$/.test(hg.phone)) {
    error.value = '请输入 11 位大陆手机号。'
    return
  }
  return operate(async () => {
    await hypergryphSmsAPI(hg.phone)
    start(60)
  }, false)
}
function bindHg() {
  if (
    !/^1\d{10}$/.test(hg.phone) ||
    (hg.method === 'sms' ? !/^\d{6}$/.test(hg.code) : !hg.password)
  ) {
    error.value = '请填写正确的手机号及验证码或密码。'
    return
  }
  return operate(() =>
    bindHypergryphAPI({
      phone: hg.phone,
      method: hg.method,
      ...(hg.method === 'sms' ? { code: hg.code } : { password: hg.password }),
    }),
  )
}
</script>
<template>
  <section class="bindings">
    <div class="binding-heading">
      <h2>连接你的世界</h2>
      <p>绑定账号，让游戏工具准备就绪。</p>
    </div>
    <el-alert v-if="error" :title="error" type="error" :closable="false" role="alert" />
    <el-alert v-if="notice" :title="notice" type="success" :closable="false" role="status" />
    <div class="binding-grid">
      <el-card class="binding-card" shadow="never">
        <h3><span class="binding-icon">H</span>鹰角账号</h3>
        <p v-if="user.hypergryphAccount">
          当前绑定：{{ user.hypergryphAccount.phone }}。会话失效时可重新登录更新。
        </p>
        <el-form label-position="top" :disabled="busy" @submit.prevent="bindHg">
          <el-form-item label="鹰角手机号"
            ><el-input
              v-model="hg.phone"
              aria-label="鹰角手机号"
              inputmode="tel"
              autocomplete="tel"
              maxlength="11"
              :disabled="!!user.hypergryphAccount"
              required
          /></el-form-item>
          <el-form-item label="登录方式"
            ><el-radio-group v-model="hg.method"
              ><el-radio-button value="sms">短信验证码</el-radio-button
              ><el-radio-button value="password">密码登录</el-radio-button></el-radio-group
            ></el-form-item
          >
          <el-form-item v-if="hg.method === 'sms'" label="短信验证码">
            <el-input
              v-model="hg.code"
              aria-label="短信验证码"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
            />
            <el-button class="spaced" :disabled="remaining > 0" @click="sendSms">{{
              remaining ? `${remaining} 秒后重发` : '发送短信验证码'
            }}</el-button>
          </el-form-item>
          <el-form-item v-else label="鹰角密码"
            ><el-input
              v-model="hg.password"
              aria-label="鹰角密码"
              type="password"
              show-password
              autocomplete="current-password"
          /></el-form-item>
          <el-button type="primary" native-type="submit" :loading="busy">{{
            user.hypergryphAccount ? '更新鹰角登录' : '登录并绑定鹰角'
          }}</el-button>
          <el-popconfirm
            confirm-button-text="确认"
            cancel-button-text="取消"
            v-if="user.hypergryphAccount"
            title="确认解除鹰角账号绑定？"
            @confirm="operate(unbindHypergryphAPI)"
          >
            <template #reference
              ><el-button :disabled="busy" type="danger" plain>解绑鹰角账号</el-button></template
            >
          </el-popconfirm>
        </el-form>
      </el-card>
    </div>
  </section>
</template>
<style scoped>
.bindings {
  margin-top: 32px;
}
.binding-heading {
  margin-bottom: 20px;
}
.binding-heading h2 {
  font-size: 19px;
}
.binding-heading p {
  font-size: 12px;
  color: var(--muted);
  margin: 5px 0 0;
}
.binding-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
.binding-card {
  border-radius: 14px;
  background: #0d1320;
}
.el-alert {
  margin-bottom: 16px;
}
h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 16px;
}
p {
  margin-bottom: 16px;
  color: var(--muted);
  font-size: 12px;
}
.binding-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: var(--accent);
  background: #76f7d014;
  border: 1px solid #76f7d029;
  border-radius: 8px;
  font:
    14px ui-monospace,
    monospace;
}
.spaced {
  margin-top: 8px;
}
@media (max-width: 760px) {
  .el-form > .el-button,
  .el-form > :deep(.el-tooltip__trigger) {
    margin: 4px 8px 4px 0;
  }
}
</style>
