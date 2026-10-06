<script setup lang="ts">
import { ElButton, ElIcon } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import confirmTexture from '@/assets/skland/ef-growth-confirm-texture.png'

defineProps<{ disabled?: boolean; loading?: boolean }>()
</script>

<template>
  <ElButton
    type="primary"
    class="dialog-confirm"
    :disabled="disabled"
    :loading="loading"
    :style="{ '--confirm-texture': `url(${confirmTexture})` }"
  >
    <span class="confirm-label"><slot /></span>
    <span class="confirm-check" aria-hidden="true"
      ><ElIcon><Check /></ElIcon
    ></span>
  </ElButton>
</template>

<style scoped>
.dialog-confirm {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  min-height: 48px;
  height: auto;
  min-width: 0;
  margin: 0;
  padding: 10px 56px;
  border: 0;
  border-radius: 999px;
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  font-size: 16px;
  font-weight: 700;
}
.dialog-confirm::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid currentColor;
  border-radius: inherit;
  opacity: 0.28;
  pointer-events: none;
}
.dialog-confirm::after {
  content: '';
  position: absolute;
  inset: 0 0 0 auto;
  width: 190px;
  max-width: 48%;
  background: currentColor;
  mask-image: var(--confirm-texture);
  mask-size: auto 160%;
  mask-position: right center;
  mask-repeat: no-repeat;
  filter: drop-shadow(0 0 0.35px currentColor);
  opacity: 0.9;
  pointer-events: none;
}
.dialog-confirm:not(.is-disabled):not(.is-loading):hover,
.dialog-confirm:focus-visible {
  background: var(--button-primary-hover);
  color: var(--button-primary-text);
}
.dialog-confirm:not(.is-disabled):not(.is-loading):active {
  background: var(--button-primary-active);
}
.confirm-label {
  position: relative;
  z-index: 1;
}
.confirm-check {
  position: absolute;
  z-index: 1;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--button-primary-text);
  color: var(--button-primary-bg);
  font-size: 20px;
}
.confirm-check :deep(path) {
  stroke: currentColor;
  stroke-width: 32;
}
.dialog-confirm.is-disabled {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  opacity: 0.5;
}
.dialog-confirm.is-loading .confirm-check {
  visibility: hidden;
}
.dialog-confirm .confirm-label {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.4;
}
.dialog-confirm:not(.is-disabled):hover {
  transform: none;
}
</style>
