<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { endfieldPortraitBadge } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'
const props = defineProps<{
  level?: number | null
  element?: string | null
  profession?: string | null
  potential?: number | null
}>()
const { t } = useI18n()
const { number } = useOverviewFormat()
const badges = computed(() =>
  [
    { kind: 'element' as const, value: props.element, label: props.element },
    { kind: 'profession' as const, value: props.profession, label: props.profession },
    {
      kind: 'potential' as const,
      value: props.potential,
      label: t('game.overview.war.potential', { n: number(props.potential ?? null) }),
    },
  ]
    .filter((badge) => badge.value != null)
    .map((badge) => ({
      ...badge,
      art: endfieldPortraitBadge(badge.kind, badge.value ?? null),
    })),
)
</script>
<template>
  <span
    v-for="badge in badges"
    :key="badge.kind"
    class="member-badge"
    :class="`member-${badge.kind}`"
    :title="badge.label || undefined"
    :aria-label="badge.label || undefined"
    :style="{ backgroundColor: badge.art?.background }"
  >
    <OverviewArtwork v-if="badge.art" :art="badge.art" />
    <span v-else class="badge-fallback">{{ badge.value }}</span>
  </span>
  <span v-if="level !== undefined" class="member-level">{{ number(level) }}</span>
</template>
<style scoped>
.member-level {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0 4px;
  color: white;
  background: linear-gradient(90deg, #000b, #0006);
  font-size: 13px;
  line-height: 1.35;
  font-variant-numeric: tabular-nums;
}
.member-badge {
  position: absolute;
  width: 27%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 2px;
  color: white;
  background: #0009;
  pointer-events: none;
}
.member-element {
  top: 2px;
  left: 2px;
}
.member-profession {
  top: calc(27% + 4px);
  left: 2px;
  pointer-events: auto;
}
.member-potential {
  bottom: 1px;
  right: 1px;
  background: transparent;
  filter: drop-shadow(0 1px 2px #000);
}
.member-badge .overview-artwork {
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 0;
}
.member-badge :deep(img) {
  width: 100%;
  height: 100%;
}
.badge-fallback {
  font-size: 9px;
  line-height: 1;
  overflow-wrap: anywhere;
}

@media (max-width: 600px) {
  .member-level {
    font-size: 11px;
  }
}
</style>
