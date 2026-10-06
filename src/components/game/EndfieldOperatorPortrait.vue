<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { endfieldRarityColor } from '@/common/overviewAssets'
import OperatorAvatar from './OperatorAvatar.vue'
import EndfieldPortraitBadges from './EndfieldPortraitBadges.vue'

defineProps<{
  name: string
  src?: string
  rarity?: number | null
  element?: string | null
  profession?: string | null
  level?: number | null
  potential?: number | null
}>()
const { t } = useI18n()
</script>

<template>
  <span
    class="endfield-operator-portrait"
    :style="{ borderBottomColor: endfieldRarityColor(rarity) }"
    :title="rarity == null ? undefined : t('game.overview.rarity', { count: rarity })"
  >
    <OperatorAvatar :name="name" :src="src" />
    <EndfieldPortraitBadges
      :level="level"
      :element="element"
      :profession="profession"
      :potential="potential"
    />
  </span>
</template>

<style scoped>
.endfield-operator-portrait {
  position: relative;
  display: block;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-bottom-width: 2px;
  border-radius: 5px;
}
.operator-avatar {
  width: 100%;
  height: 100%;
  border-radius: 0;
}
</style>
