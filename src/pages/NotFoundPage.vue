<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import EmptyState from '@/components/EmptyState.vue'
import PageHeading from '@/components/PageHeading.vue'
const { t } = useI18n()
</script>

<template>
  <div>
    <PageHeading
      eyebrow="404"
      :title="t('shell.notFoundTitle')"
      :description="t('shell.notFoundDescription')"
    />
    <EmptyState :title="t('shell.notFoundHint')" :description="t('shell.notFoundAction')">
      <template #actions>
        <router-link to="/">{{ t('shell.backHome') }}</router-link>
        <router-link to="/game/hypergryph/endfield">{{ t('shell.endfield') }}</router-link>
      </template>
    </EmptyState>
  </div>
</template>
