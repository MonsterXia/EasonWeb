<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElIcon } from 'element-plus'
import { ArrowDown, CloseBold } from '@element-plus/icons-vue'
import DialogConfirmButton from '@/components/DialogConfirmButton.vue'
import GrowthLevelWheel from './GrowthLevelWheel.vue'
import GrowthSkillLevel from './GrowthSkillLevel.vue'
const props = defineProps<{
  from: number
  to: number
  max: number
  label: string
  skill?: boolean
}>()
const emit = defineEmits<{ change: [from: number, to: number] }>()
const { t } = useI18n()
const opened = ref(false)
const ready = ref(false)
const from = ref(1)
const to = ref(1)
const currentWheel = ref<InstanceType<typeof GrowthLevelWheel>>()
const targetWheel = ref<InstanceType<typeof GrowthLevelWheel>>()
function open() {
  ready.value = false
  from.value = props.from
  to.value = props.to
  opened.value = true
}
function setCurrent(value: number) {
  from.value = value
  to.value = Math.max(value, to.value)
}
async function align() {
  await nextTick()
  currentWheel.value?.align()
  targetWheel.value?.align()
  ready.value = true
}
function confirm() {
  emit('change', from.value, Math.max(from.value, to.value))
  opened.value = false
}
</script>

<template>
  <button
    type="button"
    class="growth-range-trigger"
    :data-from="props.from"
    :data-to="props.to"
    :aria-label="t('game.growth.chooseRange', { name: label })"
    aria-haspopup="dialog"
    :aria-expanded="opened"
    @click="open"
  >
    <GrowthSkillLevel :value="props.from" :skill="skill" prefix /><span
      class="range-arrow"
      aria-hidden="true"
      >»</span
    ><GrowthSkillLevel :value="props.to" :skill="skill" prefix /><ElIcon class="range-chevron"
      ><ArrowDown
    /></ElIcon>
  </button>
  <ElDialog
    v-model="opened"
    :title="t('game.growth.chooseRange', { name: label })"
    width="460px"
    class="growth-select-dialog growth-range-dialog"
    append-to-body
    align-center
    :close-icon="CloseBold"
    :close-on-click-modal="false"
    :data-ready="ready"
    @close="ready = false"
    @opened="align"
  >
    <div class="wheel-labels">
      <span>{{ t('game.growth.current') }}</span
      ><span>{{ t('game.growth.target') }}</span>
    </div>
    <div class="range-wheels">
      <div class="wheel-highlight" aria-hidden="true"><span>»</span></div>
      <GrowthLevelWheel
        ref="currentWheel"
        :active="ready"
        :model-value="from"
        :min="1"
        :max="max"
        :label="t('game.growth.current')"
        :skill="skill"
        @update:model-value="setCurrent"
      />
      <GrowthLevelWheel
        ref="targetWheel"
        :active="ready"
        v-model="to"
        :min="from"
        :max="max"
        :label="t('game.growth.target')"
        :skill="skill"
      />
    </div>
    <p class="wheel-hint">{{ t('game.growth.wheelHint') }}</p>
    <template #footer>
      <DialogConfirmButton class="range-confirm" @click="confirm">
        {{ t('game.growth.confirmRange') }}
      </DialogConfirmButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.growth-range-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  gap: 5px;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: color-mix(in srgb, var(--muted) 12%, var(--color-background));
  color: var(--color-heading);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.growth-range-trigger:hover,
.growth-range-trigger:focus-visible {
  border-color: var(--accent);
}
.range-arrow {
  font-size: 18px;
  color: var(--muted);
}
.range-chevron {
  font-size: 10px;
  color: var(--muted);
}
.wheel-labels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
}
.range-wheels {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;
  margin-top: 6px;
}
.wheel-highlight {
  position: absolute;
  top: 88px;
  left: 0;
  right: 0;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: var(--color-background-mute);
  color: var(--muted);
  font-size: 32px;
  pointer-events: none;
}
.wheel-hint {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 11px;
  text-align: center;
}
@media (max-width: 480px) {
  .growth-range-trigger {
    gap: 3px;
    padding-inline: 6px;
    font-size: 12px;
  }
}
</style>
