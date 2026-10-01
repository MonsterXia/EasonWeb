<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BaseMaterialCalculator from './BaseMaterialCalculator.vue'
import PageHeading from '@/components/PageHeading.vue'
const { t } = useI18n()
</script>
<template>
  <div>
    <PageHeading
      eyebrow="ARKNIGHTS: ENDFIELD / TOOLKIT"
      :title="t('game.calculator.title')"
      :description="t('game.calculator.description')"
      number="01"
    />
    <BaseMaterialCalculator />
  </div>
</template>
