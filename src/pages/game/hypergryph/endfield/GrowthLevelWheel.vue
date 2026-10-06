<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GrowthSkillLevel from './GrowthSkillLevel.vue'
const props = defineProps<{
  modelValue: number
  min: number
  max: number
  label: string
  skill?: boolean
  active: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const { t } = useI18n()
const wheel = ref<HTMLElement>()
const id = useId()
const options = computed(() => Array.from({ length: props.max }, (_, i) => i + 1))
const rowHeight = 44
const dragging = ref(false)
let drag: { id: number; y: number; top: number; capture: Element; moved: boolean } | undefined
let suppressClick = false
let settling: ReturnType<typeof setTimeout> | undefined
function centeredValue() {
  return Math.max(
    props.min,
    Math.min(props.max, Math.round((wheel.value?.scrollTop ?? 0) / rowHeight) + 1),
  )
}
function pointerDown(event: PointerEvent) {
  // Touch keeps native momentum scrolling; only primary mouse drags need emulation.
  if (!props.active || event.pointerType !== 'mouse' || event.button !== 0 || drag || !wheel.value)
    return
  clearTimeout(settling)
  settling = undefined
  suppressClick = false
  const capture = (event.target as Element).closest('.wheel-option') ?? wheel.value
  drag = {
    id: event.pointerId,
    y: event.clientY,
    top: wheel.value.scrollTop,
    capture,
    moved: false,
  }
  capture.setPointerCapture(event.pointerId)
  dragging.value = true
  wheel.value.focus({ preventScroll: true })
  event.preventDefault()
}
function pointerMove(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id || !wheel.value) return
  const distance = drag.y - event.clientY
  if (!drag.moved && Math.abs(distance) < 4) return
  drag.moved = true
  suppressClick = true
  wheel.value.scrollTop = Math.max(
    (props.min - 1) * rowHeight,
    Math.min((props.max - 1) * rowHeight, drag.top + distance),
  )
  scroll()
}
function pointerEnd(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id) return
  const ended = drag
  drag = undefined
  dragging.value = false
  if (ended.capture.hasPointerCapture(ended.id)) ended.capture.releasePointerCapture(ended.id)
  if (ended.moved) choose(centeredValue())
  else void nextTick(align)
}
function click(event: MouseEvent) {
  // Releasing a drag may synthesize a click on the original option.
  if (suppressClick && event.detail > 0) {
    event.preventDefault()
    event.stopPropagation()
    suppressClick = false
  }
}
function align() {
  if (wheel.value) wheel.value.scrollTop = (props.modelValue - 1) * rowHeight
}
function choose(value: number) {
  clearTimeout(settling)
  settling = undefined
  emit('update:modelValue', Math.max(props.min, Math.min(props.max, value)))
  void nextTick(align)
}
function scroll() {
  // Hidden/reopening dialogs may restore an old scroll offset. Only user-visible
  // scrolling after initial alignment is allowed to change the draft.
  if (!wheel.value || !props.active) return
  clearTimeout(settling)
  // Read the centered row immediately so confirming during momentum uses the visible value.
  const value = centeredValue()
  if (!dragging.value)
    settling = setTimeout(() => {
      settling = undefined
      align()
    }, 140)
  if (value !== props.modelValue) emit('update:modelValue', value)
}
function keydown(event: KeyboardEvent) {
  if (!props.active) return
  const values: Record<string, number> = {
    ArrowUp: props.modelValue - 1,
    ArrowDown: props.modelValue + 1,
    PageUp: props.modelValue - 5,
    PageDown: props.modelValue + 5,
    Home: props.min,
    End: props.max,
  }
  if (values[event.key] === undefined) return
  event.preventDefault()
  choose(values[event.key]!)
}
watch(
  () => [props.modelValue, props.min],
  () => {
    if (!settling && !dragging.value) void nextTick(align)
  },
)
onMounted(align)
onBeforeUnmount(() => {
  clearTimeout(settling)
  if (drag?.capture.hasPointerCapture(drag.id)) drag.capture.releasePointerCapture(drag.id)
  drag = undefined
})
defineExpose({ align })
</script>

<template>
  <div
    ref="wheel"
    class="level-wheel"
    :class="{ dragging }"
    :inert="!active"
    role="listbox"
    tabindex="0"
    :aria-label="label"
    :aria-activedescendant="`${id}-${modelValue}`"
    @scroll="scroll"
    @keydown="keydown"
    @pointerdown="pointerDown"
    @pointermove="pointerMove"
    @pointerup="pointerEnd"
    @pointercancel="pointerEnd"
    @lostpointercapture="pointerEnd"
    @click.capture="click"
  >
    <button
      v-for="value in options"
      :id="`${id}-${value}`"
      :key="value"
      class="wheel-option"
      type="button"
      role="option"
      tabindex="-1"
      :aria-selected="value === modelValue"
      :aria-disabled="value < min"
      :aria-label="
        skill && value > 9 ? t('game.growth.masteryRank', { rank: value - 9 }) : `LV. ${value}`
      "
      :style="{
        opacity:
          value < min
            ? 0.15
            : Math.abs(value - modelValue) > 1
              ? 0.35
              : value === modelValue
                ? 1
                : 0.7,
      }"
      @click="value >= min && choose(value)"
    >
      <GrowthSkillLevel :value="value" :skill="skill" />
    </button>
  </div>
</template>

<style scoped>
.level-wheel {
  height: 220px;
  padding-block: 88px;
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  touch-action: pan-y;
  cursor: grab;
  user-select: none;
  mask-image: linear-gradient(transparent, black 24%, black 76%, transparent);
}
.level-wheel.dragging {
  cursor: grabbing;
  scroll-snap-type: none;
}
.level-wheel::-webkit-scrollbar {
  display: none;
}
.wheel-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  min-height: 44px;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--color-text);
  background: transparent;
  font: inherit;
  font-size: 24px;
  cursor: inherit;
  scroll-snap-align: center;
}
.wheel-option[aria-selected='true'] {
  color: var(--color-heading);
  font-weight: 600;
}
.wheel-option[aria-disabled='true'] {
  cursor: default;
}
.level-wheel:focus-visible {
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}
</style>
