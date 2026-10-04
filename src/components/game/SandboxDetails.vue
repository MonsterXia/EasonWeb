<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SandboxRecord } from '@/common/api/gameOverview'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
defineProps<{ record: SandboxRecord }>()
const { t } = useI18n()
const { number } = useOverviewFormat()
const milestones = ['baseLv', 'unlockNode', 'enemyKill', 'createRift'] as const
const state = (done: boolean | null) =>
  t(`game.overview.sandbox.${done === null ? 'unknown' : done ? 'complete' : 'unfinished'}`)
</script>
<template>
  <div class="sandbox-details">
    <section>
      <h5>{{ t('game.overview.sandbox.days') }}</h5>
      <dl class="survival-grid">
        <div v-for="key in ['maxDay', 'maxDayChallenge'] as const" :key="key">
          <dt>{{ t(`game.overview.sandbox.${key}`) }}</dt>
          <dd>
            <strong>{{ number(record[key]) }}</strong
            ><span v-if="record[key] !== null">{{ t('game.overview.sandbox.dayUnit') }}</span>
          </dd>
        </div>
      </dl>
    </section>
    <section>
      <h5>{{ t('game.overview.sandbox.stories') }}</h5>
      <ol class="chapter-grid">
        <li v-for="chapter in 3" :key="chapter">
          <span>{{ t(`game.overview.sandbox.chapter${chapter}`) }}</span>
          <strong>{{ t(`game.overview.sandbox.story${chapter}`) }}</strong>
          <span
            class="quest-state"
            :class="{ complete: record.mainQuest !== null && record.mainQuest >= chapter }"
            >{{ state(record.mainQuest === null ? null : record.mainQuest >= chapter) }}</span
          >
        </li>
      </ol>
      <h6>{{ t('game.overview.sandbox.sideQuests') }}</h6>
      <ul v-if="record.subQuests?.length" class="quest-list">
        <li v-for="(quest, index) in record.subQuests" :key="`${quest.id}:${index}`">
          <span>{{ quest.name ?? t('game.overview.slot', { index: index + 1 }) }}</span>
          <span class="quest-state" :class="{ complete: quest.done === true }">{{
            state(quest.done)
          }}</span>
        </li>
      </ul>
      <p v-else>
        {{ t(record.subQuests === null ? 'game.overview.missing' : 'game.overview.noDetails') }}
      </p>
    </section>
    <section>
      <h5>{{ t('game.overview.sandbox.milestones') }}</h5>
      <dl class="milestone-grid">
        <div v-for="key in milestones" :key="key">
          <dt>{{ t(`game.overview.sandbox.${key}`) }}</dt>
          <dd>
            {{ number(record[key])
            }}<span v-if="key !== 'baseLv' && record[key] !== null">
              {{ t('game.overview.sandbox.times') }}</span
            >
          </dd>
        </div>
        <div>
          <dt>{{ t('game.overview.sandbox.fixRift') }}</dt>
          <dd>{{ number(record.fixRift.current) }} / {{ number(record.fixRift.total) }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
<style scoped>
.sandbox-details {
  display: grid;
  gap: 24px;
  margin-top: 20px;
}
h5 {
  font-size: 1rem;
  margin: 0 0 12px;
}
h6 {
  font-size: 0.9rem;
  margin: 20px 0 8px;
  color: var(--color-text-secondary);
}
dl,
ol,
ul,
p {
  margin: 0;
  padding: 0;
}
.survival-grid,
.milestone-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
dl > div {
  padding: 16px;
  background: var(--color-background-mute);
  border-radius: 8px;
}
dt {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}
dd {
  margin: 8px 0 0;
  font-variant-numeric: tabular-nums;
}
dd strong {
  font-size: 1.8rem;
  font-weight: 600;
  margin-right: 8px;
}
.chapter-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.chapter-grid li {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}
.chapter-grid strong {
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}
.quest-list {
  list-style: none;
}
.quest-list li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}
.quest-state {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.quest-state.complete {
  color: var(--el-color-primary);
}
@media (max-width: 520px) {
  .chapter-grid {
    grid-template-columns: 1fr;
  }
  .chapter-grid li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
  }
}
</style>
