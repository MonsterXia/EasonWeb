<script setup lang="ts">
import { ref, computed, watch, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import type { MonolithData } from '@/common/api/gameOverview'
import hardGlow from '@/assets/skland/ef-monolith-hard-glow.png'
import hardIcon from '@/assets/skland/ef-monolith-hard.png'
import OverviewReveal from './OverviewReveal.vue'
import MonolithTheme from './MonolithTheme.vue'
import OverviewSelect from './OverviewSelect.vue'
import EndfieldRecordCard from './EndfieldRecordCard.vue'
const props = defineProps<{ data: MonolithData }>()
const { t } = useI18n()
const expanded = ref(false)
const selectedId = ref<string | null>(null)
const difficulty = ref<'normal' | 'hard'>('normal')
const current = computed(
  () => props.data.themes.find((x) => x.id === props.data.currentThemeId) ?? props.data.themes[0],
)
watch(
  () => props.data.themes,
  (themes) => {
    if (!themes.some((x) => x.id === selectedId.value)) selectedId.value = current.value?.id ?? null
  },
  { immediate: true },
)
const theme = computed(() => props.data.themes.find((x) => x.id === selectedId.value))
const id = useId()
</script>
<template>
  <div class="monolith">
    <MonolithTheme v-if="theme" :theme="theme">
      <template v-if="data.themes.length > 1" #title="{ title }">
        <OverviewSelect
          v-model="selectedId"
          appearance="heading"
          :selected-label="title"
          :label="t('game.overview.monolith.theme')"
          :options="
            data.themes.map((item) => ({
              value: item.id,
              label: item.name || t('game.overview.missing'),
            }))
          "
        />
      </template>
    </MonolithTheme>
    <p v-if="!data.detailAvailable" class="muted">
      {{ t('game.overview.monolith.detailUnavailable') }}
    </p>

    <OverviewReveal :expanded="expanded" :visible-count="0">
      <div
        :id="id"
        :inert="!expanded"
        :aria-hidden="!expanded"
        :class="{ 'overview-reveal-hidden': !expanded }"
        class="monolith-detail"
      >
        <template v-if="theme">
          <div class="difficulty-tabs">
            <strong>{{ t('game.overview.monolith.bestRecord') }}</strong>
            <div class="difficulty-control" :class="{ 'is-hard': difficulty === 'hard' }">
              <img class="hard-mode-icon" :src="hardIcon" alt="" aria-hidden="true" />
              <div
                class="difficulty-switch"
                role="group"
                :aria-label="t('game.overview.monolith.difficulty')"
              >
                <span class="difficulty-thumb" aria-hidden="true" />
                <button
                  v-for="mode in ['hard', 'normal'] as const"
                  :key="mode"
                  type="button"
                  :data-mode="mode"
                  :aria-pressed="difficulty === mode"
                  @click="difficulty = mode"
                >
                  {{
                    t(mode === 'hard' ? 'game.overview.monolith.hard' : 'game.overview.war.normal')
                  }}
                </button>
              </div>
            </div>
          </div>
          <div class="monolith-stages">
            <article
              v-for="stage in theme.stages"
              :key="`${theme.id}:${stage.id}:${difficulty}`"
              class="monolith-stage"
              :class="{ 'is-hard': difficulty === 'hard' }"
              :style="{ '--hard-glow': `url(${hardGlow})` }"
            >
              <EndfieldRecordCard
                :challenge="stage[difficulty]"
                :name="stage.name"
                :hard="difficulty === 'hard'"
              />
            </article>
          </div>
          <p v-if="!theme.stages?.length" class="muted">
            {{ t(theme.stages === null ? 'game.overview.missing' : 'game.overview.war.noStages') }}
          </p>
        </template>
      </div>
    </OverviewReveal>
    <button
      v-if="data.themes.length"
      class="reveal-button"
      :aria-expanded="expanded"
      :aria-controls="id"
      @click="expanded = !expanded"
    >
      {{ t(expanded ? 'game.overview.showLess' : 'game.overview.more')
      }}<ElIcon :class="{ expanded }"><ArrowDown /></ElIcon>
    </button>
    <p v-if="!data.themes.length" class="muted">{{ t('game.overview.monolith.noThemes') }}</p>
  </div>
</template>
<style scoped>
.monolith {
  margin-top: 12px;
  min-width: 0;
  font-size: 12px;
}
.muted {
  color: var(--muted);
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
.reveal-button .el-icon {
  transition: transform 260ms ease;
}
.reveal-button .expanded {
  transform: rotate(180deg);
}
.monolith-detail {
  display: flow-root;
}
.difficulty-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 12px 0 8px;
}
.difficulty-tabs strong {
  margin-right: auto;
}
.difficulty-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.hard-mode-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  opacity: 0.6;
  transition: opacity 200ms ease;
}
.is-hard .hard-mode-icon {
  opacity: 1;
}
.difficulty-switch {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(58px, 1fr));
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-background-mute);
}
.difficulty-thumb {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 6px) / 2);
  border-radius: inherit;
  background: var(--color-background-soft);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--color-heading) 12%, transparent);
  transform: translateX(100%);
  transition: transform 220ms cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: none;
}
.is-hard .difficulty-thumb {
  transform: translateX(0);
}
.difficulty-switch button {
  position: relative;
  border: 0;
  border-radius: 999px;
  padding: 5px 12px;
  min-height: 28px;
  font: inherit;
  line-height: 1.4;
  cursor: pointer;
  color: var(--muted);
  background: transparent;
  transition: color 160ms ease;
}
.difficulty-switch button[aria-pressed='true'] {
  color: var(--color-heading);
  font-weight: 600;
}
.difficulty-switch button:hover {
  color: var(--color-heading);
}
.difficulty-switch button:focus-visible {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.monolith-stages {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  padding-bottom: 2px;
}
.monolith-stage {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  overflow-wrap: anywhere;
}
.monolith-stage.is-hard::before {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(70%, 360px);
  height: 135px;
  background: var(--hard-glow) right bottom / 100% 100% no-repeat;
  opacity: 0.85;
  pointer-events: none;
  z-index: -1;
}
html.dark .monolith-stage.is-hard::before {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .reveal-button .el-icon,
  .difficulty-thumb,
  .hard-mode-icon,
  .difficulty-switch button {
    transition: none;
  }
}
</style>
