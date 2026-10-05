<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElTooltip } from 'element-plus'
import type { MonolithData } from '@/common/api/gameOverview'
import { officialArtworkUrl } from '@/common/officialArtwork'
import { developmentArt, sectionArt, type OverviewArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import { vAnimatedDetails } from '@/common/animatedDetails'
import OverviewArtwork from './OverviewArtwork.vue'
import progressIcon from '@/assets/skland/ef-monolith-progress-icon.png'
import progressHard from '@/assets/skland/ef-monolith-progress-hard.png'
import progressNormal from '@/assets/skland/ef-monolith-progress-normal.png'
import progressLocked from '@/assets/skland/ef-monolith-progress-locked.png'
const props = defineProps<{ theme: MonolithData['themes'][number] }>()
const { t } = useI18n()
const { number, date } = useOverviewFormat()
const artwork = (url: string | null, fallback?: OverviewArt): OverviewArt | undefined =>
  officialArtworkUrl(url)
    ? { src: officialArtworkUrl(url)!, tone: 'color', kind: 'cover', fallback }
    : fallback
const status = (value: boolean | null | undefined) =>
  t(`game.overview.war.${value === true ? 'passed' : value === false ? 'notPassed' : 'unknown'}`)
type Stage = NonNullable<MonolithData['themes'][number]['stages']>[number]
const stageState = (stage: Stage) =>
  stage.hard?.isPassed === true
    ? 'hard'
    : stage.normal?.isPassed === true
      ? 'normal'
      : stage.normal?.isPassed === false && stage.hard?.isPassed === false
        ? 'locked'
        : 'unknown'
const stageLabel = (stage: Stage) =>
  `${stage.name || t('game.overview.missing')} · ${t('game.overview.war.normal')}：${status(stage.normal?.isPassed)} · ${t('game.overview.monolith.hard')}：${status(stage.hard?.isPassed)}`
const progressImage = (stage: Stage) =>
  ({ hard: progressHard, normal: progressNormal, locked: progressLocked, unknown: progressLocked })[
    stageState(stage)
  ]
const medalStatus = computed(() =>
  t(
    props.theme.medal?.acquired === true
      ? 'game.overview.monolith.obtained'
      : props.theme.medal?.acquired === false
        ? 'game.overview.monolith.notObtained'
        : 'game.overview.war.unknown',
  ),
)
const platingStatus = computed(() =>
  t(
    props.theme.medal?.plated === true
      ? 'game.overview.monolith.plated'
      : props.theme.medal?.plated === false
        ? 'game.overview.monolith.notPlated'
        : 'game.overview.monolith.platingUnknown',
  ),
)
</script>
<template>
  <div class="monolith-theme">
    <div class="theme-cover">
      <OverviewArtwork :art="artwork(theme.artworkUrl, sectionArt('endfieldMonolith'))" />
    </div>
    <div class="theme-content">
      <slot
        name="title"
        :title="
          (theme.isInActivity ? theme.activityName : theme.name) ||
          theme.name ||
          t('game.overview.missing')
        "
      >
        <h4>
          {{
            (theme.isInActivity ? theme.activityName : theme.name) ||
            theme.name ||
            t('game.overview.missing')
          }}
        </h4>
      </slot>
      <p v-if="theme.isInActivity" class="activity-date muted">
        {{ date(theme.startAt) }} — {{ date(theme.endAt) }}
      </p>
      <div v-if="theme.stages?.length" class="theme-progress">
        <span
          class="progress-icon"
          :style="{ maskImage: `url(${progressIcon})` }"
          aria-hidden="true"
        />
        <ul class="stage-progress">
          <li v-for="stage in theme.stages" :key="stage.id">
            <ElTooltip
              :content="stageLabel(stage)"
              placement="top"
              trigger="hover"
              :show-after="150"
            >
              <span
                class="progress-segment"
                :data-state="stageState(stage)"
                tabindex="0"
                :aria-label="stageLabel(stage)"
                :style="{ backgroundImage: `url(${progressImage(stage)})` }"
              >
                <span
                  v-if="stageState(stage) === 'unknown'"
                  class="unknown-progress"
                  aria-hidden="true"
                  >?</span
                >
              </span>
            </ElTooltip>
          </li>
        </ul>
      </div>
      <p v-else class="muted">
        {{ t(theme.stages === null ? 'game.overview.missing' : 'game.overview.war.noStages') }}
      </p>
      <details v-animated-details class="medal">
        <summary>
          <span class="medal-label">
            <strong
              >{{ t('game.overview.monolith.medal')
              }}<span v-if="theme.medal?.plated === true">
                · {{ t('game.overview.monolith.plated') }}</span
              ><span v-else-if="theme.medal?.acquired === true">
                · {{ t('game.overview.monolith.obtained') }}</span
              ></strong
            >
          </span>
          <OverviewArtwork
            :art="
              theme.medal?.acquired === true
                ? artwork(theme.medal.artworkUrl, developmentArt('monolith-unearned'))
                : developmentArt('monolith-unearned')
            "
          />
        </summary>
        <div class="facility-content medal-details">
          <p>{{ medalStatus }} · {{ platingStatus }}</p>
          <p v-if="theme.medal?.acquired">
            {{ theme.medal.name || t('game.overview.missing') }} · Lv.
            {{ number(theme.medal.level) }} · {{ date(theme.medal.acquiredAt) }}
          </p>
        </div>
      </details>
    </div>
  </div>
</template>
<style scoped>
.monolith-theme {
  display: grid;
  grid-template-columns: clamp(90px, 26%, 150px) minmax(0, 1fr);
  /* Reserve room inside the disclosure for the transparent artwork overhang. */
  margin: 28px 28px 26px;
  overflow-wrap: anywhere;
}
.theme-cover {
  position: relative;
  min-width: 0;
  aspect-ratio: 3 / 4;
  align-self: center;
}
.theme-cover .overview-artwork {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 0;
  overflow: visible;
}
/* Official layout: a 90 × 120 poster inside a 122 × 152 image box,
   offset by 16 on each side. Keep the PNG's transparent decoration intact. */
.theme-cover .overview-artwork.cover {
  inset: -13.333333% -17.777778%;
  width: 135.555556%;
  height: 126.666667%;
  z-index: 1;
  pointer-events: none;
}
.theme-cover :deep(img) {
  object-fit: contain;
  mix-blend-mode: normal;
  width: 100%;
  height: 100%;
}
h4 {
  margin: 0;
  font-size: 17px;
  line-height: 1.4;
  color: var(--color-heading);
}
.theme-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 14px 16px;
  /* The poster supplies the left edge; framing it adds a visible 1px seam. */
  border: 1px solid var(--color-border);
  border-left: 0;
  border-radius: 0 8px 8px 0;
  background: var(--color-background);
}
.muted {
  color: var(--muted);
  font-size: 11px;
  margin: 0;
}
.activity-date {
  margin-top: -6px;
}
.theme-progress {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
}
.progress-icon {
  flex: 0 0 22px;
  height: 24px;
  background: var(--color-heading);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}
.stage-progress {
  flex: 1;
  display: flex;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
  min-width: 0;
}
.stage-progress li {
  flex: 1;
  min-width: 0;
}
.progress-segment {
  display: block;
  position: relative;
  height: 12px;
  background-size: cover;
  background-position: right center;
  background-repeat: no-repeat;
}
.progress-segment[data-state='hard'] {
  filter: drop-shadow(0 0 3px #ffe04180);
}
.progress-segment[data-state='unknown'] {
  opacity: 0.65;
}
.progress-segment:focus-visible {
  box-shadow: 0 0 0 1px var(--accent);
}
.unknown-progress {
  display: block;
  font-size: 10px;
  line-height: 12px;
  text-align: center;
  color: white;
}
.medal {
  background: var(--color-background-mute);
  color: var(--muted);
  min-width: 0;
}
.medal summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 6px 0 12px;
  min-height: 44px;
  cursor: pointer;
  list-style: none;
}
.medal summary::-webkit-details-marker {
  display: none;
}
.medal summary::before {
  display: none;
}
.medal summary:hover strong,
.medal summary:focus-visible strong {
  color: var(--color-heading);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.medal-label {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.medal-label strong {
  font-size: 13px;
  font-weight: 500;
}
.medal .overview-artwork {
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  margin: -5px 0;
  background: transparent;
}
.medal :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.medal-details {
  padding: 10px 12px;
  font-size: 11px;
}
.medal-details p {
  margin: 0;
}
.medal-details p + p {
  margin-top: 4px;
}
@media (max-width: 600px) {
  .monolith-theme {
    grid-template-columns: clamp(68px, 26%, 100px) minmax(0, 1fr);
    margin: 20px 18px;
  }
  .theme-content {
    gap: 8px;
    padding: 10px 8px 10px 10px;
  }
  .theme-content :deep(.is-heading .el-select__wrapper) {
    font-size: 14px;
    gap: 4px;
  }
  h4 {
    font-size: 14px;
  }
  .progress-icon {
    flex-basis: 17px;
    height: 20px;
  }
  .stage-progress {
    gap: 3px;
  }
  .progress-segment {
    height: 10px;
  }
  .unknown-progress {
    line-height: 10px;
  }
  .medal summary {
    padding-left: 8px;
    min-height: 38px;
  }
  .medal-label strong {
    font-size: 11px;
  }
  .medal .overview-artwork {
    width: 44px;
    height: 44px;
    flex-basis: 44px;
    margin: -3px 0;
  }
}
</style>
