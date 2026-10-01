<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CurrentUser } from '@/common/api/user'
import {
  apiError,
  hypergryphSmsAPI,
  bindHypergryphAPI,
  unbindHypergryphAPI,
} from '@/common/api/accounts'
import { useCooldown } from '@/composables/useCooldown'
const { t } = useI18n()
const props = defineProps<{ user: CurrentUser }>()
const emit = defineEmits<{ changed: [] }>()
const hg = reactive({
  phone: props.user.hypergryphAccount?.phone ?? '',
  method: 'sms' as 'sms' | 'password',
  password: '',
  code: '',
})
const busy = ref(false),
  error = shallowRef<(() => string) | null>(null),
  notice = shallowRef<(() => string) | null>(null)
const errorMessage = computed(() => error.value?.() ?? '')
const noticeMessage = computed(() => notice.value?.() ?? '')
const { remaining, start } = useCooldown()
async function operate(action: () => Promise<unknown>, refresh = true) {
  if (busy.value) return
  busy.value = true
  error.value = null
  notice.value = null
  try {
    await action()
    notice.value = () => t('account.binding.success')
    if (refresh) emit('changed')
  } catch (e) {
    error.value = () => apiError(e)
  } finally {
    busy.value = false
    hg.password = ''
    hg.code = ''
  }
}
function sendSms() {
  if (remaining.value || !/^1\d{10}$/.test(hg.phone)) {
    error.value = () => t('account.binding.phoneRequired')
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
    error.value = () => t('account.binding.credentialsRequired')
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
      <h2>{{ t('account.binding.title') }}</h2>
      <p>{{ t('account.binding.description') }}</p>
    </div>
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
    <div class="binding-grid">
      <el-card class="binding-card" shadow="never">
        <h3><span class="binding-icon">H</span>{{ t('account.binding.hypergryph') }}</h3>
        <p v-if="user.hypergryphAccount">
          {{ t('account.binding.boundPhone', { phone: user.hypergryphAccount.phone }) }}
        </p>
        <el-form label-position="top" :disabled="busy" @submit.prevent="bindHg">
          <el-form-item :label="t('account.binding.phone')"
            ><el-input
              v-model="hg.phone"
              :aria-label="t('account.binding.phone')"
              inputmode="tel"
              autocomplete="tel"
              maxlength="11"
              :disabled="!!user.hypergryphAccount"
              required
          /></el-form-item>
          <el-form-item :label="t('account.binding.method')"
            ><el-radio-group v-model="hg.method"
              ><el-radio-button value="sms">{{ t('account.smsCode') }}</el-radio-button
              ><el-radio-button value="password">{{
                t('account.binding.passwordLogin')
              }}</el-radio-button></el-radio-group
            ></el-form-item
          >
          <el-form-item v-if="hg.method === 'sms'" :label="t('account.smsCode')">
            <el-input
              v-model="hg.code"
              :aria-label="t('account.smsCode')"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
            />
            <el-button class="spaced" :disabled="remaining > 0" @click="sendSms">{{
              remaining ? t('account.resendIn', { seconds: remaining }) : t('account.sendSms')
            }}</el-button>
          </el-form-item>
          <el-form-item v-else :label="t('account.binding.password')"
            ><el-input
              v-model="hg.password"
              :aria-label="t('account.binding.password')"
              type="password"
              show-password
              autocomplete="current-password"
          /></el-form-item>
          <el-button type="primary" native-type="submit" :loading="busy">{{
            user.hypergryphAccount ? t('account.binding.update') : t('account.binding.bind')
          }}</el-button>
          <el-popconfirm
            :confirm-button-text="t('account.binding.confirm')"
            :cancel-button-text="t('account.binding.cancel')"
            v-if="user.hypergryphAccount"
            :title="t('account.binding.unbindConfirm')"
            @confirm="operate(unbindHypergryphAPI)"
          >
            <template #reference
              ><el-button :disabled="busy" type="danger" plain>{{
                t('account.binding.unbind')
              }}</el-button></template
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
