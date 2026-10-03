<script setup lang="ts">
import { ref, watch } from 'vue'
import type { OverviewArt } from '@/common/overviewAssets'
const props = defineProps<{ art?: OverviewArt }>()
const failed = ref(false)
watch(
  () => props.art?.src,
  () => {
    failed.value = false
  },
)
</script>
<template>
  <span
    v-if="art && !failed"
    class="overview-artwork"
    :class="[art.tone, art.kind]"
    aria-hidden="true"
  >
    <img
      :src="art.src"
      alt=""
      width="64"
      height="64"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    />
  </span>
</template>
<style scoped>
.overview-artwork {
  display: inline-flex;
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
}
/* Blend neutral icon pixels into the semantic surface, including the translucent
   white pixels baked into Endfield daily icons. Colored artwork is never inverted. */
.overview-artwork {
  background: var(--color-background-mute);
  isolation: isolate;
}
.light-ink img {
  filter: invert(1);
  mix-blend-mode: multiply;
}
.dark-ink img {
  mix-blend-mode: multiply;
}
html.dark .light-ink img {
  filter: none;
  mix-blend-mode: screen;
}
html.dark .dark-ink img {
  filter: invert(1);
  mix-blend-mode: screen;
}
.color.icon {
  background: color-mix(in srgb, #a79ca5 30%, var(--color-background-mute));
}
img {
  display: block;
  width: 80%;
  height: 80%;
  object-fit: contain;
}
.map img {
  width: 100%;
  height: 100%;
}
.landscape {
  width: 100%;
  height: 88px;
  border-radius: 8px;
}
.landscape img {
  mix-blend-mode: multiply;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
html.dark .landscape img {
  mix-blend-mode: soft-light;
}
</style>
