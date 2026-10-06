<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, defineAsyncComponent, h } from 'vue'
import { useRoute } from 'vue-router'
import BaseMaterialCalculator from './BaseMaterialCalculator.vue'
import PageHeading from '@/components/PageHeading.vue'
const { t } = useI18n()
const route = useRoute()
const isGrowth = computed(() => route.query.tool === 'growth')
const GrowthCalculator = defineAsyncComponent({
  loader: () => import('./GrowthCalculator.vue'),
  loadingComponent: () => h('p', { role: 'status' }, t('game.growth.loading')),
  errorComponent: () => h('p', { role: 'alert' }, t('game.growth.loadFailed')),
})
</script>
<template>
  <div>
    <PageHeading
      eyebrow="ARKNIGHTS: ENDFIELD / TOOLKIT"
      :title="t(isGrowth ? 'game.growth.title' : 'game.calculator.title')"
      :description="t(isGrowth ? 'game.growth.description' : 'game.calculator.description')"
      number="01"
    />
    <nav class="calculator-tabs" :aria-label="t('game.growth.tools')">
      <router-link
        :to="{ path: '/game/hypergryph/endfield' }"
        :class="{ selected: !isGrowth }"
        :aria-current="!isGrowth ? 'page' : undefined"
        >{{ t('game.calculator.title') }}</router-link
      >
      <router-link
        :to="{ path: '/game/hypergryph/endfield', query: { tool: 'growth' } }"
        :class="{ selected: isGrowth }"
        :aria-current="isGrowth ? 'page' : undefined"
        >{{ t('game.growth.title') }}</router-link
      >
    </nav>
    <KeepAlive><component :is="isGrowth ? GrowthCalculator : BaseMaterialCalculator" /></KeepAlive>
  </div>
</template>

<style scoped>
.calculator-tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 24px;
}
.calculator-tabs a {
  padding: 0 0 13px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 2px solid transparent;
}
.calculator-tabs a.selected {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
.calculator-tabs a:focus-visible {
  text-decoration: underline;
}
</style>
