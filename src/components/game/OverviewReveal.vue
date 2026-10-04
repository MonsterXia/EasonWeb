<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ expanded: boolean; visibleCount: number }>()
const emit = defineEmits<{ collapsed: [] }>()
const viewport = ref<HTMLElement>()
const heights = ref<{ full: number; collapsed: number }>()
let observer: ResizeObserver | undefined
const height = computed(() => {
  if (!heights.value) return undefined
  return `${props.expanded ? heights.value.full : heights.value.collapsed}px`
})
function measure() {
  const grid = viewport.value?.firstElementChild as HTMLElement | null
  if (!grid) return
  const box = grid.getBoundingClientRect()
  const last = grid.children[Math.min(grid.children.length, props.visibleCount) - 1]
  heights.value = {
    full: box.height,
    collapsed: last ? Math.min(box.height, last.getBoundingClientRect().bottom - box.top) : 0,
  }
}
onMounted(() => {
  observer = new ResizeObserver(measure)
  const grid = viewport.value?.firstElementChild
  if (grid) observer.observe(grid)
  measure()
})
watch(() => props.visibleCount, measure, { flush: 'post' })
watch(
  () => props.expanded,
  async (expanded) => {
    await nextTick()
    measure()
    if (
      !expanded &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        heights.value?.full === heights.value?.collapsed)
    )
      emit('collapsed')
  },
)
function onTransitionEnd(event: TransitionEvent) {
  if (event.target === viewport.value && event.propertyName === 'height' && !props.expanded)
    emit('collapsed')
}
onBeforeUnmount(() => observer?.disconnect())
</script>
<template>
  <div ref="viewport" class="overview-reveal" :style="{ height }" @transitionend="onTransitionEnd">
    <slot />
  </div>
</template>
<style>
.overview-reveal {
  --overview-reveal-duration: 260ms;
  overflow: hidden;
  transition: height var(--overview-reveal-duration) cubic-bezier(0.25, 0.8, 0.25, 1);
}
/* Keep outgoing cards painted while their viewport closes, then hide them. */
.overview-reveal-hidden {
  visibility: hidden;
  transition: visibility 0s var(--overview-reveal-duration);
}
@media (prefers-reduced-motion: reduce) {
  .overview-reveal {
    --overview-reveal-duration: 0ms;
  }
}
</style>
