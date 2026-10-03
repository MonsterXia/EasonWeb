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
    :class="[art.surface, art.kind]"
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
/* Original official icons include white/black artwork and baked-in translucency.
   Keep their original pixels on a stable contrasting surface in either site theme. */
.dark {
  background: #302e33;
}
.light {
  background: #eeeded;
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
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
