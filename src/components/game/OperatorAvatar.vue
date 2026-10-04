<script setup lang="ts">
import { computed, ref, watch } from 'vue'
const props = defineProps<{ name: string; src?: string; fallbackSrc?: string }>()
const loaded = ref(false)
const failed = ref<string[]>([])
const current = computed(() =>
  [props.src, props.fallbackSrc].find((src) => src && !failed.value.includes(src)),
)
watch(
  () => [props.src, props.fallbackSrc],
  () => {
    failed.value = []
    loaded.value = false
  },
)
watch(
  current,
  () => {
    loaded.value = false
  },
  { flush: 'sync' },
)
function imageFailed(event: Event) {
  const src = (event.target as HTMLImageElement).getAttribute('src')
  if (src && !failed.value.includes(src)) failed.value.push(src)
}
function imageLoaded(event: Event) {
  if ((event.target as HTMLImageElement).getAttribute('src') === current.value) loaded.value = true
}
</script>
<template>
  <span class="operator-avatar" aria-hidden="true">
    <span v-if="!loaded" class="operator-initial">{{ name.slice(0, 1) }}</span>
    <img
      v-if="current"
      :key="current"
      :src="current"
      alt=""
      width="48"
      height="48"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      :class="{ loaded }"
      @load="imageLoaded"
      @error="imageFailed"
    />
  </span>
</template>
<style scoped>
.operator-avatar {
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
}
.operator-avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0;
}
.operator-avatar img.loaded {
  opacity: 1;
}
.operator-initial {
  font-size: 15px;
}
</style>
