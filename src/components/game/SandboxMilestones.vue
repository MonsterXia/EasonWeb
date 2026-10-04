<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SandboxRecord } from '@/common/api/gameOverview'
import { sandboxMilestoneArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'
defineProps<{ record: SandboxRecord }>()
const { t } = useI18n()
const { number } = useOverviewFormat()
const counters = ['unlockNode', 'enemyKill', 'createRift'] as const
</script>

<template>
  <section class="sandbox-milestones">
    <h5>{{ t('game.overview.sandbox.milestones') }}</h5>
    <dl class="milestone-grid">
      <div class="milestone-base">
        <dt>{{ t('game.overview.sandbox.baseInfo') }}</dt>
        <dd>
          <OverviewArtwork class="base-art" :art="sandboxMilestoneArt('baseLv')" />
          <span class="base-level"
            ><span>Lv.</span><strong>{{ number(record.baseLv, false) }}</strong></span
          >
          <span class="base-caption">{{ t('game.overview.sandbox.baseLv') }}</span>
        </dd>
      </div>
      <div v-for="key in counters" :key="key" :class="`milestone-${key}`">
        <dt>{{ t(`game.overview.sandbox.${key}`) }}</dt>
        <dd class="milestone-counter">
          <OverviewArtwork class="counter-art" :art="sandboxMilestoneArt(key)" />
          <span class="counter-value">
            <span v-if="record[key] !== null" class="counter-prefix" aria-hidden="true">×</span>
            <strong>{{ number(record[key], false) }}</strong>
            <span v-if="record[key] !== null" class="counter-unit">{{
              t('game.overview.sandbox.times')
            }}</span>
          </span>
        </dd>
      </div>
      <div class="milestone-commissions">
        <dt>{{ t('game.overview.sandbox.fixRift') }}</dt>
        <dd class="milestone-counter">
          <span class="commission-value"
            ><strong>{{ number(record.fixRift.current, false) }}</strong
            ><span> / {{ number(record.fixRift.total, false) }}</span></span
          >
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.sandbox-milestones {
  --milestone-accent: #756900;
  --milestone-danger: #b13643;
  --milestone-tint: rgba(170, 157, 54, 0.045);
}
html.dark .sandbox-milestones {
  --milestone-accent: #e4e23a;
  --milestone-danger: #ed7b82;
  --milestone-tint: rgba(228, 226, 58, 0.025);
}
h5 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  font-size: 1rem;
  color: var(--color-heading);
}
h5::before {
  content: '';
  width: 3px;
  height: 16px;
  background: var(--milestone-accent);
}
h5::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.milestone-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-areas: 'base explore' 'base defense' 'rift commissions';
  grid-auto-rows: minmax(92px, auto);
  gap: 1px;
  margin: 0;
  padding: 1px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}
.milestone-grid > div {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 12px 14px;
  background:
    linear-gradient(var(--milestone-tint), var(--milestone-tint)), var(--color-background);
}
.milestone-base {
  grid-area: base;
}
.milestone-unlockNode {
  grid-area: explore;
}
.milestone-enemyKill {
  grid-area: defense;
}
.milestone-createRift {
  grid-area: rift;
}
.milestone-commissions {
  grid-area: commissions;
}
dt {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
dt::before {
  content: '−';
  flex-shrink: 0;
  color: var(--milestone-accent);
  font-weight: 600;
}
dd {
  margin: 8px 0 0;
  flex: 1;
  font-variant-numeric: tabular-nums;
}
.milestone-base dd {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.base-art {
  width: min(100%, 170px);
  height: auto;
  aspect-ratio: 527 / 420;
  background: transparent;
  border-radius: 0;
  filter: brightness(0.66);
}
.base-level {
  display: flex;
  align-items: baseline;
  gap: 2px;
  color: var(--muted);
  line-height: 1.1;
}
.base-level strong {
  font-size: 30px;
  color: var(--color-heading);
}
.base-caption {
  font-size: 12px;
  color: var(--muted);
}
.milestone-counter {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 2px 8px;
}
.counter-art {
  width: 42px;
  height: 42px;
  background: transparent;
  border-radius: 0;
}
.counter-art :deep(img) {
  width: 100%;
  height: 100%;
}
.milestone-enemyKill .counter-art {
  filter: brightness(0.65);
}
html.dark .base-art,
html.dark .milestone-enemyKill .counter-art {
  filter: none;
}
.counter-value,
.commission-value {
  color: var(--milestone-accent);
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.counter-value strong,
.commission-value strong {
  font-size: 28px;
  font-weight: 600;
}
.counter-prefix,
.commission-value > span {
  color: var(--muted);
  font-size: 20px;
}
.counter-prefix {
  margin-right: 3px;
}
.counter-unit {
  font-size: 12px;
  margin-left: 2px;
}
.milestone-enemyKill .counter-value {
  color: var(--milestone-danger);
}
.commission-value::before,
.commission-value::after {
  color: var(--muted);
  font-size: 26px;
}
.commission-value::before {
  content: '[';
  margin-right: 3px;
}
.commission-value::after {
  content: ']';
  margin-left: 3px;
}
@media (max-width: 520px) {
  .milestone-grid > div {
    padding: 10px 8px;
  }
  .base-art {
    max-width: 130px;
  }
  .counter-art {
    width: 34px;
    height: 34px;
  }
  .milestone-counter {
    column-gap: 3px;
  }
  .counter-value strong,
  .commission-value strong {
    font-size: 24px;
  }
  .counter-prefix,
  .commission-value > span {
    font-size: 16px;
  }
}
</style>
