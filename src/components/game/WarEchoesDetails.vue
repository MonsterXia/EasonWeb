<script setup lang="ts">
import { computed, ref, watch, useId, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import type { WarEchoesData, WarEchoesSeason } from '@/common/api/gameOverview'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import { warEchoesArt } from '@/common/overviewAssets'
import { officialArtworkUrl } from '@/common/officialArtwork'
import OverviewArtwork from './OverviewArtwork.vue'
import OverviewSelect from './OverviewSelect.vue'
import OverviewReveal from './OverviewReveal.vue'
import EndfieldRecordCard from './EndfieldRecordCard.vue'
import { vHonorDisclosure } from '@/common/honorDisclosure'
const props = defineProps<{ data: WarEchoesData; resourceTime: number }>()
const { t } = useI18n()
const { number, date } = useOverviewFormat()
const expanded = ref(false)
const detailId = useId()
const seasonId = ref('')
const weekId = ref('')
const current = <T extends { startAt: number | null; endAt: number | null }>(items: T[]) => {
  const sorted = [...items].sort((a, b) => (a.startAt ?? 0) - (b.startAt ?? 0))
  return (
    sorted.find(
      (s) =>
        s.startAt !== null &&
        s.endAt !== null &&
        s.startAt <= props.resourceTime &&
        props.resourceTime <= s.endAt,
    ) ??
    (sorted[0]?.startAt && props.resourceTime < sorted[0].startAt
      ? sorted[0]
      : sorted[sorted.length - 1])
  )
}
const season = computed(
  () => props.data.seasons.find((s) => s.id === seasonId.value) ?? current(props.data.seasons),
)
watch(
  () => season.value?.id,
  () => {
    weekId.value = ''
  },
)
const week = computed(
  () =>
    season.value?.weeks?.find((w) => w.id === weekId.value) ?? current(season.value?.weeks ?? []),
)
const activeStageId = ref('')
const stageElements = new Map<string, HTMLElement>()
const selectedStageId = computed(() =>
  week.value?.stages?.some((stage) => stage.id === activeStageId.value)
    ? activeStageId.value
    : week.value?.stages?.[0]?.id,
)
watch(
  () => week.value?.id,
  () => {
    activeStageId.value = ''
    stageElements.clear()
  },
)
function setStageElement(id: string, element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLElement) stageElements.set(id, element)
  else stageElements.delete(id)
}
function jumpToStage(id: string) {
  activeStageId.value = id
  stageElements.get(id)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  })
}
const badge = (rating: string | null) =>
  warEchoesArt(`rating-${rating === 'S+' ? 'S-plus' : (rating ?? 'empty')}`)
const honorCounts = computed(() => {
  const honors = props.data.honors
  if (honors === null || honors.some((h) => h.stars === null || h.acquired === null))
    return [null, null, null]
  return [3, 2, 1].map(
    (tier) => honors.filter((h) => h.acquired === true && (h.stars ?? 0) >= tier).length,
  )
})
const remaining = computed(() => {
  if (week.value?.endAt == null) return t('game.overview.missing')
  if (week.value.startAt !== null && week.value.startAt > props.resourceTime)
    return t('game.overview.war.upcoming')
  const seconds = week.value.endAt - props.resourceTime
  if (seconds < 0) return t('game.overview.war.ended')
  if (seconds < 3600) return t('game.overview.war.lessHour')
  return t('game.overview.war.remaining', {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
  })
})
const cover = (s: WarEchoesSeason) => {
  const src = officialArtworkUrl(s.artworkUrl)
  return src ? { src, kind: 'landscape' as const, tone: 'color' as const } : undefined
}
</script>
<template>
  <div class="war-echoes">
    <p v-if="!data.detailAvailable" class="muted">{{ t('game.overview.war.partial') }}</p>
    <template v-if="season">
      <header class="season-banner">
        <OverviewArtwork :art="cover(season)" />
        <div class="season-identity">
          <OverviewSelect
            v-if="data.seasons.length > 1"
            appearance="heading"
            :model-value="season.id"
            :label="t('game.overview.war.season')"
            :options="data.seasons.map((s) => ({ value: s.id, label: s.name || s.id }))"
            @update:model-value="seasonId = $event"
          />
          <h4 v-else>{{ season.name || t('game.overview.missing') }}</h4>
          <p>{{ date(season.startAt, true) }} – {{ date(season.endAt, true) }}</p>
        </div>
      </header>
      <div class="season-facts">
        <div class="rating-summary">
          <span>{{ t('game.overview.war.seasonRating') }}</span>
          <OverviewArtwork class="rating-art" :art="badge(season.rating)" />
          <strong>{{ season.rating || '—' }}</strong
          ><span>{{ number(season.stars) }} / 9</span>
        </div>
        <details v-honor-disclosure class="honors">
          <summary>
            <span>{{ t('game.overview.war.honors') }}</span>
            <span
              v-for="(tier, index) in ['gold', 'silver', 'bronze']"
              :key="tier"
              class="honor-count"
              :aria-label="`${t(`game.overview.war.${tier}`)} ${number(honorCounts[index] ?? null)}`"
              ><OverviewArtwork :art="warEchoesArt(tier)" />{{
                number(honorCounts[index] ?? null)
              }}</span
            >
          </summary>
          <div class="facility-content">
            <ul v-if="data.honors?.length" class="honor-list">
              <li
                v-for="(honor, index) in data.honors"
                :key="index"
                :class="{ 'is-locked': honor.acquired !== true }"
              >
                <div class="honor-info">
                  <strong>{{
                    honor.acquired === true
                      ? honor.name || t('game.overview.missing')
                      : t(
                          honor.acquired === false
                            ? 'game.overview.war.unexplored'
                            : 'game.overview.missing',
                        )
                  }}</strong>
                  <span
                    v-if="honor.acquired === true && honor.acquiredAt != null"
                    class="honor-date"
                  >
                    {{ date(honor.acquiredAt) }}
                  </span>
                </div>
                <OverviewArtwork
                  :art="
                    warEchoesArt(
                      honor.acquired !== true
                        ? 'unearned'
                        : honor.stars === 3
                          ? 'gold'
                          : honor.stars === 2
                            ? 'silver'
                            : 'bronze',
                    )
                  "
                />
              </li>
            </ul>
            <p v-else class="muted">
              {{ t(data.honors === null ? 'game.overview.missing' : 'game.overview.war.noHonors') }}
            </p>
          </div>
        </details>
      </div>
      <OverviewReveal :expanded="expanded" :visible-count="0">
        <div
          :id="detailId"
          class="war-details"
          :class="{ 'overview-reveal-hidden': !expanded }"
          :inert="!expanded"
          :aria-hidden="!expanded"
        >
          <div
            v-if="season.weeks?.length"
            class="week-tabs"
            role="group"
            :aria-label="t('game.overview.war.rotation')"
          >
            <button
              v-for="w in season.weeks"
              :key="w.id"
              type="button"
              :aria-pressed="w.id === week?.id"
              @click="weekId = w.id"
            >
              {{ w.name || w.id }}
            </button>
          </div>
          <template v-if="week">
            <div class="week-summary">
              <div>
                <span>{{ t('game.overview.war.cycle') }}</span>
                <p>{{ date(week.startAt, true) }} – {{ date(week.endAt, true) }}</p>
                <span>{{ remaining }}</span>
              </div>
              <div class="week-rating">
                <span>{{ t('game.overview.war.roundRating') }}</span
                ><OverviewArtwork class="rating-art" :art="badge(week.rating)" /><strong>{{
                  week.rating || '—'
                }}</strong
                ><span>{{ number(week.stars) }} / 9</span>
              </div>
            </div>
            <nav
              v-if="week.stages?.length"
              class="stage-navigation"
              :aria-label="t('game.overview.war.stageNavigation')"
            >
              <button
                v-for="stage in week.stages"
                :key="stage.id"
                type="button"
                :aria-current="selectedStageId === stage.id ? 'location' : undefined"
                :title="
                  stage.plusTask === null
                    ? undefined
                    : t(
                        stage.plusTask
                          ? 'game.overview.war.bonusDone'
                          : 'game.overview.war.bonusPending',
                      )
                "
                @click="jumpToStage(stage.id)"
              >
                <span class="stage-score">
                  <OverviewArtwork
                    v-if="stage.stars !== null"
                    :art="
                      warEchoesArt(
                        `star-${stage.stars === 3 && stage.plusTask ? 'plus' : stage.stars}`,
                      )
                    "
                  />
                  <span>{{ number(stage.stars) }} / 3</span>
                </span>
                <strong>{{ stage.name || t('game.overview.missing') }}</strong>
              </button>
            </nav>
            <div class="stages">
              <section
                v-for="stage in week.stages"
                :key="`${season.id}:${week.id}:${stage.id}`"
                :ref="(el) => setStageElement(stage.id, el)"
                class="stage"
                :data-stage-id="stage.id"
              >
                <h4 class="stage-heading">
                  {{ stage.name || t('game.overview.missing') }} ·
                  {{ t('game.overview.monolith.bestRecord') }}
                </h4>
                <div class="stage-challenges">
                  <article
                    v-for="challenge in stage.difficulties"
                    :key="challenge.difficulty"
                    class="challenge"
                    :class="{ 'is-cruel': challenge.difficulty === 'cruel' }"
                  >
                    <EndfieldRecordCard :challenge="challenge" :name="stage.name" mode="war" />
                  </article>
                </div>
                <p v-if="!stage.difficulties" class="muted">
                  {{ t('game.overview.war.recordUnavailable') }}
                </p>
              </section>
            </div>
            <p v-if="!week.stages?.length" class="muted">
              {{ t(week.stages === null ? 'game.overview.missing' : 'game.overview.war.noStages') }}
            </p>
          </template>
          <p v-else class="muted">{{ t('game.overview.war.noRotations') }}</p>
        </div>
      </OverviewReveal>
      <button
        class="reveal-button"
        type="button"
        :aria-expanded="expanded"
        :aria-controls="detailId"
        @click="expanded = !expanded"
      >
        {{ t(expanded ? 'game.overview.showLess' : 'game.overview.more') }}
        <ElIcon :class="{ expanded }"><ArrowDown /></ElIcon>
      </button>
    </template>
    <p v-else class="muted">{{ t('game.overview.war.noSeasons') }}</p>
  </div>
</template>
<style scoped>
.war-echoes {
  margin-top: 12px;
  font-size: 12px;
  min-width: 0;
}
.war-details {
  display: flow-root;
  padding-bottom: 2px;
}
.reveal-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 9px 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}
.reveal-button:hover {
  color: var(--accent);
}
.reveal-button:focus-visible {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.reveal-button .el-icon {
  transition: transform 260ms ease;
}
.reveal-button .expanded {
  transform: rotate(180deg);
}
.muted {
  color: var(--muted);
}

.season-banner {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 112px;
  display: flex;
  align-items: flex-end;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  padding: 16px;
}
.season-banner > .overview-artwork {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  background: transparent;
  border-radius: 0;
}
.season-banner :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: right center;
  mix-blend-mode: normal;
}
.season-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    90deg,
    var(--color-background) 0%,
    color-mix(in srgb, var(--color-background) 88%, transparent) 35%,
    transparent 100%
  );
}
h4 {
  margin: 0;
  font-size: 14px;
  color: var(--color-heading);
}
.season-banner h4 {
  font-size: 18px;
}
.season-identity {
  min-width: 0;
  max-width: 100%;
}
p {
  margin: 6px 0;
}
.season-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
  align-items: start;
}
.season-facts[data-honors-layout='expanded'] {
  grid-template-columns: 1fr;
}
.rating-summary,
.honors {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
}
.rating-summary,
.week-rating {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.rating-art {
  width: 68px;
  height: 32px;
  background: transparent;
}
.rating-art :deep(img) {
  width: 100%;
  height: 100%;
}
.honors summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-height: 32px;
}
.honor-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.honor-count .overview-artwork {
  width: 26px;
  height: 30px;
  background: transparent;
  flex: 0 0 26px;
}
.facility-content {
  display: flow-root;
  overflow: hidden;
}
.honor-list {
  list-style: none;
  padding: 8px 0 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 8px;
}
.honor-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  min-height: 64px;
  padding: 10px 12px;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-mute);
}
.honor-info {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;
}
.honor-info strong {
  overflow-wrap: anywhere;
}
.honor-list .is-locked strong {
  color: var(--muted);
}
.honor-date {
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--color-background);
  color: var(--muted);
  font-size: 12px;
}
.honor-list .overview-artwork {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  background: transparent;
}
.honor-list .overview-artwork :deep(img) {
  width: 100%;
  height: 100%;
}
.week-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 10px;
}
.week-tabs button {
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted);
  padding: 8px 10px;
  font: inherit;
  cursor: pointer;
}
.week-tabs button[aria-pressed='true'] {
  border-color: var(--accent);
  color: var(--color-heading);
  font-weight: 600;
}
.week-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 8px 0 12px;
  color: var(--muted);
}
.stage-navigation {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.stage-navigation button {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 9px 10px;
  border: 1px solid var(--color-border);
  border-left: 3px solid transparent;
  border-radius: 6px;
  background: var(--color-background-mute);
  color: var(--muted);
  font: inherit;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}
.stage-navigation button[aria-current='location'] {
  border-left-color: var(--accent);
  background: var(--color-background-soft);
  color: var(--color-heading);
}
.stage-navigation button:hover {
  color: var(--color-heading);
}
.stage-navigation button:focus-visible strong {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.stage-navigation strong {
  font-size: 13px;
}
.stages {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 22px;
  margin-top: 18px;
  align-items: start;
}
.stage {
  min-width: 0;
  scroll-margin-top: 150px;
  overflow-wrap: anywhere;
}
.stage-heading {
  margin-bottom: 10px;
  padding-left: 9px;
  border-left: 2px solid var(--color-border);
  font-size: 14px;
}
.stage-challenges {
  display: grid;
  gap: 8px;
}
.challenge {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
}
/* Official stage-detail base and left grain; cruel adds its own full-card overlay. */
.challenge::before,
.challenge.is-cruel::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-repeat: no-repeat;
}
.challenge::before {
  background-image:
    url('@/assets/skland/ef-record-left-bg.png'), url('@/assets/skland/ef-war-record-bg.png');
  background-size:
    auto 100%,
    cover;
  background-position:
    left top,
    center;
  filter: invert(1);
  mix-blend-mode: multiply;
  opacity: 0.65;
}
.challenge.is-cruel::after {
  background: url('@/assets/skland/ef-war-cruel-bg.png') center / cover no-repeat;
  opacity: 0.7;
}
html.dark .challenge::before {
  filter: none;
  mix-blend-mode: normal;
  opacity: 0.85;
}
html.dark .challenge.is-cruel::after {
  opacity: 1;
}
.stage-score {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  flex-shrink: 0;
}
.stage-score .overview-artwork {
  width: 62px;
  height: 22px;
  background: transparent;
}
.stage-score :deep(img) {
  width: 100%;
  height: 100%;
}
@media (max-width: 600px) {
  .stage-navigation {
    gap: 5px;
  }
  .stage-navigation button {
    padding: 7px 6px;
  }
  .stage-navigation .stage-score {
    flex-wrap: wrap;
    gap: 2px;
  }
  .season-facts {
    grid-template-columns: minmax(0, 1fr);
  }
  .season-banner {
    padding: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .reveal-button .el-icon,
  .stage-navigation button {
    transition: none;
  }
}
</style>
