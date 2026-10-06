<script setup lang="ts">
import {
  ElButton,
  ElIcon,
  ElDialog,
  ElAlert,
  ElForm,
  ElFormItem,
  ElInput,
  ElRadioGroup,
  ElRadioButton,
  ElPopconfirm,
} from 'element-plus'
import { computed, reactive, ref, shallowRef } from 'vue'
import { ArrowRight, CloseBold } from '@element-plus/icons-vue'
import DialogConfirmButton from '@/components/DialogConfirmButton.vue'
import hypergryphIcon from '@/assets/brands/hypergryph.png'
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
const managing = ref(false)
const maskedPhone = computed(
  () => props.user.hypergryphAccount?.phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1••••$2') ?? '',
)
function clearCredentials() {
  hg.password = ''
  hg.code = ''
  error.value = null
  notice.value = null
}
function openManager() {
  clearCredentials()
  hg.phone = props.user.hypergryphAccount?.phone ?? ''
  managing.value = true
}
function closeManager(done?: () => void) {
  if (busy.value) return
  clearCredentials()
  managing.value = false
  done?.()
}
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
    if (refresh) {
      managing.value = false
      emit('changed')
    }
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
  <section class="connections">
    <div class="connections-heading">
      <h3>{{ t('account.profile.linkedAccounts') }}</h3>
      <p>{{ t('account.binding.overviewHint') }}</p>
    </div>
    <div class="connection-row">
      <img class="connection-icon" :src="hypergryphIcon" alt="" width="44" height="44" />
      <div class="connection-copy">
        <h4>{{ t('account.binding.hypergryph') }}</h4>
        <p>{{ user.hypergryphAccount ? maskedPhone : t('account.binding.notConnectedHint') }}</p>
      </div>
      <span class="connection-state" :class="{ connected: !!user.hypergryphAccount }"
        ><i aria-hidden="true" />{{
          user.hypergryphAccount ? t('account.binding.connected') : t('account.profile.notBound')
        }}</span
      >
      <el-button
        class="manage-button"
        :aria-label="t('account.binding.manageTitle')"
        @click="openManager"
        >{{ t('account.binding.manage') }}<el-icon><ArrowRight /></el-icon
      ></el-button>
    </div>
    <router-link v-if="user.hypergryphAccount" to="/game/hypergryph/skland" class="checkin-link"
      >{{ t('account.binding.goCheckIn') }}<ArrowRight
    /></router-link>
    <el-dialog
      v-model="managing"
      :title="t('account.binding.manageTitle')"
      width="min(520px, calc(100vw - 32px))"
      align-center
      :close-icon="CloseBold"
      append-to-body
      destroy-on-close
      :before-close="closeManager"
      :close-on-click-modal="!busy"
      :close-on-press-escape="!busy"
      :show-close="!busy"
    >
      <div class="manager-intro">
        <img class="connection-icon" :src="hypergryphIcon" alt="" width="44" height="44" />
        <p>
          {{
            user.hypergryphAccount
              ? t('account.binding.sessionHint')
              : t('account.binding.connectHint')
          }}
        </p>
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
          <el-button class="spaced" :disabled="busy || remaining > 0" @click="sendSms">{{
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
        <DialogConfirmButton native-type="submit" :loading="busy">{{
          user.hypergryphAccount ? t('account.binding.update') : t('account.binding.bind')
        }}</DialogConfirmButton>
        <div v-if="user.hypergryphAccount" class="disconnect-section">
          <p>{{ t('account.binding.disconnectHint') }}</p>
          <el-popconfirm
            :confirm-button-text="t('account.binding.confirm')"
            :cancel-button-text="t('account.binding.cancel')"
            :title="t('account.binding.unbindConfirm')"
            @confirm="operate(unbindHypergryphAPI)"
            :disabled="busy"
          >
            <template #reference
              ><el-button :disabled="busy" type="danger" plain>{{
                t('account.binding.unbind')
              }}</el-button></template
            >
          </el-popconfirm>
        </div>
      </el-form>
    </el-dialog>
  </section>
</template>
<style scoped>
.connections {
  border-top: 1px solid var(--color-border);
  padding: 26px 6px 6px;
}
.connections-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-bottom: 18px;
}
.connections-heading h3 {
  font-size: 16px;
  font-weight: 650;
}
.connections-heading p {
  color: var(--muted);
  font-size: 12px;
}
.connection-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-background-soft);
}
.connection-icon {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: #000; /* Official white brand mark keeps its black backing in either theme. */
  object-fit: contain;
}
.connection-copy {
  flex: 1;
  min-width: 0;
}
.connection-copy h4 {
  margin: 0;
  color: var(--color-heading);
  font-size: 15px;
  font-weight: 600;
}
.connection-copy p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.connection-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
}
.connection-state i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.connection-state.connected {
  color: var(--accent);
}
.manage-button {
  margin: 0 0 0 10px;
  font-size: 12px;
}
.manage-button :deep(.el-icon) {
  margin-left: 8px;
}
.checkin-link {
  display: flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  margin: 15px 0 0 auto;
  font-size: 12px;
  color: var(--accent);
}
.checkin-link svg {
  width: 14px;
  height: 14px;
}
.manager-intro {
  display: flex;
  gap: 14px;
  align-items: center;
  margin: 4px 0 24px;
}
.manager-intro p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}
.el-alert {
  margin-bottom: 18px;
}
.spaced {
  margin-top: 10px;
}
.disconnect-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.disconnect-section p {
  color: var(--muted);
  font-size: 12px;
  max-width: 260px;
}
.el-form > .el-button {
  max-width: 100%;
  height: auto;
  white-space: normal;
}
@media (max-width: 600px) {
  .connections {
    padding-inline: 0;
  }
  .connection-row {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 12px;
    padding: 16px;
  }
  .connection-state {
    grid-column: 2;
  }
  .manage-button {
    grid-column: 1 / -1;
    margin: 4px 0 0;
    width: 100%;
  }
}
</style>
