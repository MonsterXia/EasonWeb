<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOverviewFormat } from '@/composables/useOverviewFormat'

const props = defineProps<{
  level: number | null
  phase?: number | null
  rarity?: number | string | null
  potential?: number | null
  profession?: string | null
  element?: string | null
}>()
const { t } = useI18n()
const { number } = useOverviewFormat()
const rarity = computed(() =>
  props.rarity == null ? null : String(props.rarity).replace(/^rarity_/, ''),
)
</script>

<template>
  <div class="operator-facts">
    <span>{{ t('game.overview.operatorLevel', { level: number(level) }) }}</span>
    <span v-if="phase != null">{{ t('game.overview.war.phase', { n: phase }) }}</span>
    <span v-if="rarity != null">{{ t('game.overview.rarity', { count: rarity }) }}</span>
    <span v-if="potential != null">{{ t('game.overview.potential', { value: potential }) }}</span>
    <span v-if="profession">{{ profession }}</span>
    <span v-if="element">{{ element }}</span>
  </div>
</template>

<style scoped>
.operator-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 11px;
  color: var(--muted);
}
</style>
