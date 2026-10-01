<script setup lang="ts">
import { Connection, FolderOpened, RefreshRight, User } from '@element-plus/icons-vue'
withDefaults(
  defineProps<{
    kind?: 'login' | 'link' | 'empty' | 'error'
    title: string
    description: string
  }>(),
  { kind: 'empty' },
)
const icons = { login: User, link: Connection, empty: FolderOpened, error: RefreshRight }
</script>

<template>
  <div
    class="empty-state"
    :class="`empty-state--${kind}`"
    :role="kind === 'error' ? 'alert' : undefined"
  >
    <div class="state-visual" aria-hidden="true">
      <span class="state-orbit" />
      <span class="state-icon"><component :is="icons[kind]" /></span>
      <svg class="state-spark" viewBox="0 0 20 20" fill="none">
        <path d="M10 2v16M2 10h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <span class="state-dot" />
    </div>
    <div class="state-content">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
      <div v-if="$slots.actions" class="state-actions"><slot name="actions" /></div>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  --state-color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 44px;
  min-height: 300px;
  padding: 42px 28px;
}
.empty-state--error {
  --state-color: var(--el-color-warning);
}
.state-visual {
  position: relative;
  flex: 0 0 132px;
  width: 132px;
  height: 132px;
  display: grid;
  place-items: center;
  color: var(--state-color);
}
.state-orbit {
  position: absolute;
  inset: 4px;
  border: 1px solid color-mix(in srgb, var(--state-color) 20%, transparent);
  border-radius: 50%;
  transform: rotate(-28deg) scaleY(0.78);
}
.state-icon {
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--state-color) 22%, transparent);
  border-radius: 24px;
  background: color-mix(in srgb, var(--state-color) 7%, var(--color-background-soft));
  box-shadow: 0 8px 24px color-mix(in srgb, var(--state-color) 7%, transparent);
  transform: rotate(-6deg);
}
.state-icon svg {
  width: 32px;
  height: 32px;
  transform: rotate(6deg);
}
.state-spark {
  position: absolute;
  width: 18px;
  height: 18px;
  top: 6px;
  right: 7px;
}
.state-dot {
  position: absolute;
  bottom: 23px;
  left: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--state-color);
  opacity: 0.5;
}
.state-content {
  max-width: 420px;
  min-width: 0;
}
.state-content h3 {
  font-size: 23px;
  font-weight: 650;
  line-height: 1.45;
  letter-spacing: -0.025em;
}
.state-content p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.state-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 23px;
}
.state-actions :deep(a) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 18px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-heading);
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.state-actions :deep(a:first-child) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}
.state-actions :deep(a:hover) {
  border-color: var(--accent);
  background: var(--color-background-mute);
}
.state-actions :deep(a:first-child:hover) {
  background: var(--el-color-primary-dark-2);
}
.state-actions :deep(.el-button) {
  min-height: 42px;
  margin: 0;
  padding: 10px 18px;
}
.state-actions :deep(svg) {
  width: 16px;
  height: 16px;
}
@media (max-width: 600px) {
  .empty-state {
    flex-direction: column;
    gap: 18px;
    padding: 28px 0;
    min-height: 320px;
    text-align: center;
  }
  .state-visual {
    flex-basis: 112px;
    width: 112px;
    height: 112px;
  }
  .state-content h3 {
    font-size: 21px;
  }
  .state-content p {
    font-size: 13px;
    max-width: 30em;
  }
  .state-actions {
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
