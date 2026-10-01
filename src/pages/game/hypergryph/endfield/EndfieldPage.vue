<script setup lang="ts">
import BaseMaterialCalculator from './BaseMaterialCalculator.vue'
import PageHeading from '@/components/PageHeading.vue'
</script>
<template>
  <div>
    <PageHeading
      eyebrow="ARKNIGHTS: ENDFIELD / TOOLKIT"
      title="基质计算器"
      description="把目标交给计算，把时间留给探索。选择武器，寻找适合你的基质刷取方案。"
      number="01"
    />
    <BaseMaterialCalculator />
  </div>
</template>
