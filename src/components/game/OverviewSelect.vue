<script setup lang="ts">
import { ElSelect, ElOption, ElIcon } from 'element-plus'
import { Check } from '@element-plus/icons-vue'

defineProps<{
  modelValue: string | null
  label: string
  options: { value: string; label: string }[]
  appearance?: 'field' | 'heading'
  selectedLabel?: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="overview-select" :class="{ 'is-heading': appearance === 'heading' }">
    <span v-if="appearance !== 'heading'">{{ label }}</span>
    <ElSelect
      :model-value="modelValue ?? undefined"
      :aria-label="label"
      :show-arrow="false"
      :offset="6"
      :popper-class="
        appearance === 'heading'
          ? 'overview-select-menu overview-select-heading-menu'
          : 'overview-select-menu'
      "
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #label="{ label: optionLabel }">{{ selectedLabel ?? optionLabel }}</template>
      <ElOption
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :label="option.label"
      >
        <span class="overview-select-option-label">{{ option.label }}</span>
        <ElIcon v-if="option.value === modelValue"><Check /></ElIcon>
      </ElOption>
    </ElSelect>
  </div>
</template>

<style scoped>
.overview-select {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 2px 0 10px;
  min-width: 0;
}
.el-select {
  width: 210px;
  max-width: 100%;
}
.el-select :deep(.el-select__wrapper) {
  min-height: 36px;
  border-radius: 8px;
  background: var(--color-background);
  font-size: 12px;
}
.el-select :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--accent) inset;
}
.is-heading {
  display: inline-flex;
  max-width: 100%;
  margin: 0;
}
.is-heading .el-select {
  width: auto;
}
.is-heading .el-select :deep(.el-select__wrapper) {
  padding: 2px 0;
  min-height: 30px;
  gap: 10px;
  background: transparent;
  box-shadow: none;
  font-size: 18px;
  font-weight: 600;
}
.is-heading .el-select :deep(.el-select__placeholder) {
  position: static;
  transform: none;
  width: auto;
  z-index: auto;
  color: var(--color-heading);
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.4;
}
.is-heading .el-select :deep(.el-select__wrapper:hover .el-select__placeholder),
.is-heading .el-select :deep(.el-select__wrapper.is-focused .el-select__placeholder) {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.is-heading .el-select :deep(.el-select__caret) {
  color: var(--color-heading);
}
</style>

<style>
/* The menu is teleported outside the overview card to avoid reveal clipping. */
.overview-select-menu.el-popper {
  max-width: calc(100vw - 24px);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background-soft);
  box-shadow: 0 8px 28px color-mix(in srgb, var(--color-heading) 12%, transparent);
  overflow: hidden;
}
.overview-select-heading-menu .el-select-dropdown {
  min-width: min(240px, calc(100vw - 24px));
}
.overview-select-menu .el-select-dropdown__list {
  padding: 5px;
}
.overview-select-menu .el-select-dropdown__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 38px;
  height: auto;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.5;
  transition:
    background-color 140ms,
    color 140ms;
}
.overview-select-menu .overview-select-option-label {
  white-space: normal;
  overflow-wrap: anywhere;
}
.overview-select-menu .el-select-dropdown__item.is-hovering {
  background: color-mix(in srgb, var(--accent) 9%, transparent);
}
.overview-select-menu .el-select-dropdown__item.is-selected {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  font-weight: 600;
}
.overview-select-menu .el-icon {
  flex-shrink: 0;
}
@media (prefers-reduced-motion: reduce) {
  .overview-select-menu .el-select-dropdown__item {
    transition: none;
  }
}
</style>
