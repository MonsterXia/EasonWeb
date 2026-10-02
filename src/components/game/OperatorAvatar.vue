<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{ name: string; src?: string }>()
const loaded = ref(false),
  failed = ref(false)
watch(
  () => props.src,
  () => {
    loaded.value = false
    failed.value = false
  },
)
function imageFailed() {
  failed.value = true
  loaded.value = false
}
</script>
<template>
  <span class="operator-avatar" aria-hidden="true">
    <span v-if="!loaded" class="operator-initial">{{ name.slice(0, 1) }}</span>
    <img
      v-if="src && !failed"
      :key="src"
      :src="src"
      alt=""
      width="48"
      height="48"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      :class="{ loaded }"
      @load="loaded = true"
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
  background: var(--color-background-mute);
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
