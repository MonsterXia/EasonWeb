<script setup lang="ts">
defineProps<{ eyebrow: string; title: string; description: string; number?: string }>()
</script>
<template>
  <header class="page-heading">
    <div>
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}<span> /</span></h1>
      <p class="description">{{ description }}</p>
    </div>
    <span class="page-number" aria-hidden="true">{{ number || '✦' }}</span>
  </header>
</template>
<style scoped>
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}
.page-heading h1 {
  font-size: clamp(28px, 4vw, 40px);
  letter-spacing: -0.04em;
  margin: 10px 0;
  font-weight: 750;
}
.page-heading h1 span {
  color: var(--accent);
  margin-left: 8px;
}
.description {
  color: var(--muted);
  font-size: 13px;
  max-width: 600px;
}
.page-number {
  color: color-mix(in srgb, var(--accent) 13%, transparent);
  font:
    italic 90px/1 ui-monospace,
    monospace;
  letter-spacing: -0.1em;
}
@media (max-width: 600px) {
  .page-number {
    display: none;
  }
}
</style>
