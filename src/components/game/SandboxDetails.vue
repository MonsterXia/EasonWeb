<script setup lang="ts">
import { useId } from 'vue'
import { sandboxChapterArt, sandboxDayArt } from '@/common/overviewAssets'
import OverviewArtwork from './OverviewArtwork.vue'
import { useI18n } from 'vue-i18n'
import type { SandboxRecord } from '@/common/api/gameOverview'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import SandboxMilestones from './SandboxMilestones.vue'
defineProps<{ record: SandboxRecord }>()
const { t } = useI18n()
const { number } = useOverviewFormat()
const gradientId = useId()
const state = (done: boolean | null) =>
  t(`game.overview.sandbox.${done === null ? 'unknown' : done ? 'complete' : 'unfinished'}`)
</script>
<template>
  <div class="sandbox-details">
    <section class="survival-section">
      <h5>{{ t('game.overview.sandbox.days') }}</h5>
      <dl class="survival-grid">
        <div
          v-for="key in ['maxDay', 'maxDayChallenge'] as const"
          :key="key"
          :class="{ challenge: key === 'maxDayChallenge' }"
        >
          <dt>{{ t(`game.overview.sandbox.${key}`) }}</dt>
          <dd>
            <div class="day-dial">
              <svg viewBox="0 0 180 100" aria-hidden="true" focusable="false">
                <defs v-if="key === 'maxDay'">
                  <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#94a45a" />
                    <stop offset=".5" stop-color="#1689a2" />
                    <stop offset="1" stop-color="#c67a16" />
                  </linearGradient>
                </defs>
                <path
                  d="M 8 92 A 82 82 0 0 1 172 92"
                  fill="none"
                  :stroke="key === 'maxDay' ? `url(#${gradientId})` : 'var(--survival-danger)'"
                  stroke-width="6"
                  stroke-linecap="round"
                />
              </svg>
              <OverviewArtwork class="day-emblem" :art="sandboxDayArt('maxDay')" />
              <strong>{{ number(record[key], false) }}</strong>
            </div>
            <span class="day-unit" :class="{ missing: record[key] === null }">{{
              t('game.overview.sandbox.dayUnit')
            }}</span>
          </dd>
        </div>
      </dl>
    </section>
    <section class="stories-section">
      <h5>{{ t('game.overview.sandbox.stories') }}</h5>
      <h6>{{ t('game.overview.sandbox.mainQuests') }}</h6>
      <ol class="chapter-grid">
        <li v-for="chapter in 3" :key="chapter">
          <div class="chapter-badge">
            <OverviewArtwork :art="sandboxChapterArt(chapter)" />
            <OverviewArtwork
              v-if="record.mainQuest !== null && record.mainQuest >= chapter"
              class="chapter-completed"
              :art="sandboxChapterArt('over')"
            />
          </div>
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
    <SandboxMilestones :record="record" />
  </div>
</template>
<style scoped>
.sandbox-details {
  --survival-accent: #756900;
  --survival-danger: #b13643;
  display: grid;
  gap: 24px;
  margin-top: 20px;
}
html.dark .sandbox-details {
  --survival-accent: #e4e23a;
  --survival-danger: #c43838;
}
h5 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  margin: 0 0 16px;
  color: var(--color-heading);
}
h5::before {
  content: '';
  width: 3px;
  height: 1em;
  background: var(--survival-accent);
}
h5::after {
  content: '';
  height: 1px;
  flex: 1;
  background: var(--color-border);
}
h6 {
  display: flex;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0 0 14px;
  color: var(--muted);
}
h6::before {
  content: '−';
  color: var(--survival-accent);
}
dl,
ol,
ul,
p {
  margin: 0;
  padding: 0;
}
.survival-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: color-mix(in srgb, var(--survival-accent) 2%, var(--color-background));
}
.survival-grid > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 12px 16px;
  min-width: 0;
}
.survival-grid > div + div {
  border-left: 1px solid var(--color-border);
}
dt {
  order: 1;
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
  margin-top: 10px;
  overflow-wrap: anywhere;
}
dd {
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-variant-numeric: tabular-nums;
}
.day-dial {
  position: relative;
  width: min(100%, 180px);
  aspect-ratio: 180 / 100;
  display: grid;
  align-items: end;
  justify-items: center;
}
.day-dial svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
/* The official 465×444 art includes labels and a ring. Show only its central
   165×165 emblem; keep the translated labels and responsive ring as live UI. */
.day-emblem {
  position: absolute;
  top: 13%;
  left: 27%;
  width: 46%;
  height: auto;
  aspect-ratio: 1;
  mask-image: radial-gradient(circle at 50% 52%, #000 42%, transparent 65%);
  background: transparent;
  border-radius: 0;
  --emblem-ink: #a69b1f;
  opacity: 1;
  filter: brightness(0.68);
  pointer-events: none;
}
.day-emblem :deep(img) {
  position: absolute;
  left: -90.9091%;
  top: -45.4545%;
  width: 281.8182%;
  height: 269.0909%;
  max-width: none;
  object-fit: fill;
  /* Enhance only the shared official emblem, never the baked-in red glow. */
  filter: drop-shadow(0 0 0 var(--emblem-ink)) drop-shadow(0 0 0 var(--emblem-ink))
    drop-shadow(0 0 0 var(--emblem-ink));
}
.challenge .day-emblem {
  filter: hue-rotate(-52deg) saturate(1.6) brightness(0.68);
}
html.dark .day-emblem {
  filter: none;
  opacity: 0.85;
}
html.dark .challenge .day-emblem {
  filter: hue-rotate(-52deg) saturate(1.6);
}
/* A separate, fully feathered glow avoids magnifying the noisy edge in the
   official challenge raster when increasing the emblem's visibility. */
.challenge .day-dial::before {
  content: '';
  position: absolute;
  top: 9%;
  left: 24%;
  width: 52%;
  aspect-ratio: 1;
  background: radial-gradient(
    ellipse,
    rgb(201 38 54 / 18%) 0%,
    rgb(201 38 54 / 8%) 40%,
    transparent 72%
  );
  pointer-events: none;
}
html.dark .challenge .day-dial::before {
  background: radial-gradient(
    ellipse,
    rgb(238 44 56 / 28%) 0%,
    rgb(238 44 56 / 10%) 40%,
    transparent 72%
  );
}
.day-dial strong {
  position: relative;
  font-size: clamp(26px, 5vw, 40px);
  line-height: 1.15;
  font-weight: 600;
  color: var(--survival-accent);
  max-width: 100%;
  overflow-wrap: anywhere;
}
.day-unit.missing {
  visibility: hidden;
}
.day-unit {
  min-height: 1.5em;
  min-width: 70px;
  margin-top: 8px;
  padding: 1px 16px;
  border-radius: 20px;
  background: var(--color-background-mute);
  color: var(--color-text);
  text-align: center;
  font-size: 0.85rem;
}
.chapter-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}
.chapter-grid li {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  min-width: 0;
  color: var(--muted);
  font-size: 0.8rem;
}
.chapter-badge {
  position: relative;
  width: 68px;
  height: 68px;
  margin: 2px 0 4px;
}
.chapter-badge .overview-artwork {
  width: 100%;
  height: 100%;
}
html.dark .chapter-completed {
  filter: none;
}
.chapter-completed {
  filter: brightness(0.58);
  position: absolute;
  inset: 0;
}
.chapter-badge :deep(.overview-artwork) {
  background: transparent;
  border-radius: 0;
}
.chapter-badge :deep(img) {
  width: 100%;
  height: 100%;
}
.chapter-grid strong {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading);
  overflow-wrap: anywhere;
}
.quest-list {
  list-style: none;
}
.quest-list li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.85rem;
}
.quest-list li > :first-child {
  overflow-wrap: anywhere;
  min-width: 0;
}
.quest-state {
  font-size: 0.75rem;
  color: var(--muted);
  flex-shrink: 0;
}
.quest-state.complete {
  color: var(--survival-accent);
}
p {
  font-size: 0.85rem;
  color: var(--muted);
}
@media (max-width: 520px) {
  .survival-grid > div {
    padding: 12px 8px;
  }
  dt {
    font-size: 0.75rem;
  }
  .chapter-grid {
    gap: 8px;
  }
  .chapter-badge {
    width: 52px;
    height: 52px;
  }
  .chapter-grid strong {
    font-size: 0.75rem;
  }
}
</style>
