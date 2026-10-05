<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { OverviewArt } from '@/common/overviewAssets'
const props = defineProps<{ art?: OverviewArt; banner?: boolean }>()
const failed = ref<string[]>([])
const current = computed(() => {
  let art = props.art
  const seen = new Set<string>()
  while (art && failed.value.includes(art.src)) {
    if (seen.has(art.src)) return undefined
    seen.add(art.src)
    art = art.fallback
  }
  return art
})
watch(
  () => props.art?.src,
  () => {
    failed.value = []
  },
)
function onError(event: Event) {
  const src = (event.target as HTMLImageElement).getAttribute('src')
  if (src && !failed.value.includes(src)) failed.value.push(src)
}
</script>
<template>
  <span
    v-if="current"
    class="overview-artwork"
    :class="[current.tone, current.kind, current.presentation, { banner }]"
    aria-hidden="true"
  >
    <img
      :key="current.src"
      :src="current.src"
      alt=""
      width="64"
      height="64"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="onError"
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
.cover {
  width: 100%;
  height: 112px;
  border-radius: 8px;
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.banner.cover {
  height: 100%;
  width: 100%;
}
.banner.cover img {
  object-position: left center;
}
/* Preserve the official artwork, enlarging its central mark on the same
   theme-aware surface used by the other icons. */
.official-logo img {
  width: 100%;
  height: 100%;
  transform: scale(1.5);
}
/* Official 264×60 title strips: the symbol occupies x=30, y=6, 48×48.
   Keep the source intact and hide its blue bullet and baked-in Chinese text. */
.official-title-icon {
  position: relative;
}
.official-title-icon img {
  position: absolute;
  width: 550%;
  height: 125%;
  max-width: none;
  left: -62.5%;
  top: -12.5%;
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
