<script setup lang="ts">
import { computed } from 'vue'
import { endfieldData } from '@/common/endfieldResources'
import { useI18n } from 'vue-i18n'
import OverviewSelect from '@/components/game/OverviewSelect.vue'
import GrowthEntityAvatar from './GrowthEntityAvatar.vue'
import GrowthFilterIcon from './GrowthFilterIcon.vue'
import GrowthUpgradeIcon from './GrowthUpgradeIcon.vue'
import GrowthRangePicker from './GrowthRangePicker.vue'
import GrowthTalentEditor from './GrowthTalentEditor.vue'
import {
  attachWeapon,
  entityFor,
  integer,
  presets,
  applyPreset,
  setLevel,
  setStage,
  stageRange,
  type GrowthPlan,
  type GrowthPreset,
  type LocalName,
} from '@/common/endfieldGrowth'
const props = defineProps<{ plan: GrowthPlan }>()
const emit = defineEmits<{ remove: [] }>()
const { t, locale } = useI18n()
const entity = computed(() => entityFor(props.plan))
const name = (value: LocalName) => value[locale.value === 'en' ? 'en' : 'zh-CN']
function presetDescription(key: GrowthPreset) {
  const preset = presets[key]
  return t('game.growth.presetDescription', {
    level: preset.level,
    skill:
      preset.skill > 9 ? t('game.growth.masteryRank', { rank: preset.skill - 9 }) : preset.skill,
  })
}
function levels(from: number, to: number) {
  if (from !== props.plan.currentLevel) setLevel(props.plan, 'current', from)
  if (to !== props.plan.targetLevel) setLevel(props.plan, 'target', to)
}
function stages(side: 'current' | 'target') {
  const range = stageRange(
    entity.value,
    side === 'current' ? props.plan.currentLevel : props.plan.targetLevel,
  )
  return Array.from({ length: range.max - range.min + 1 }, (_, i) => ({
    value: range.min + i,
    label: t('game.growth.stageValue', { stage: range.min + i }),
    disabled: side === 'target' && range.min + i < props.plan.currentStage,
  }))
}
function skillLevel(index: number, from: number, to: number) {
  props.plan.preset = 'custom'
  const skill = props.plan.skills[index]!
  skill.from = integer(from, 1, 12)
  skill.to = integer(to, skill.from, 12)
}
</script>
<template>
  <article class="growth-plan" :aria-label="name(entity.name)">
    <header class="plan-heading" :class="{ 'weapon-heading': plan.kind === 'weapons' }">
      <GrowthEntityAvatar class="plan-portrait" :entity="entity" :kind="plan.kind" />
      <div class="identity">
        <h3>{{ name(entity.name) }}</h3>
        <div
          v-if="plan.kind === 'weapons'"
          class="weapon-rarity"
          role="img"
          :aria-label="t('game.overview.rarity', { count: entity.rarity })"
        >
          <GrowthFilterIcon v-for="rank in entity.rarity" :key="rank" kind="rarity" />
        </div>
        <template v-else>
          <div class="preset-caption">
            <span>{{ t('game.growth.expectations') }}</span>
            <small v-if="plan.preset === 'custom'" class="custom-label">{{
              t('game.growth.custom')
            }}</small>
          </div>
          <div class="plan-presets" role="group" :aria-label="t('game.growth.expectations')">
            <button
              v-for="(_, key) in presets"
              :key="key"
              type="button"
              :aria-pressed="plan.preset === key"
              :title="presetDescription(key)"
              @click="applyPreset(plan, key)"
            >
              {{ t(`game.growth.${key}`) }}
            </button>
          </div>
          <p class="preset-summary" role="status">
            <template v-if="plan.preset !== 'custom'">{{
              presetDescription(plan.preset)
            }}</template>
          </p>
        </template>
      </div>
      <button
        type="button"
        class="remove"
        :aria-label="t('game.growth.remove', { name: name(entity.name) })"
        @click="emit('remove')"
      >
        ×
      </button>
    </header>
    <p v-if="plan.kind === 'characters'" class="preset-note">
      {{ t('game.growth.presetResetNote') }}
    </p>
    <section class="level-section">
      <h4 class="section-title">{{ t('game.growth.level') }}</h4>
      <div class="upgrade-row level-row">
        <span>{{
          t(plan.kind === 'characters' ? 'game.growth.operatorLevel' : 'game.growth.weaponLevel')
        }}</span>
        <GrowthRangePicker
          :from="plan.currentLevel"
          :to="plan.targetLevel"
          :max="90"
          :label="
            t(plan.kind === 'characters' ? 'game.growth.operatorLevel' : 'game.growth.weaponLevel')
          "
          @change="levels"
        />
      </div>
      <details class="stage-details">
        <summary>{{ t('game.growth.stageDetails') }}</summary>
        <div class="progress-grid">
          <span></span><span class="column-label">{{ t('game.growth.current') }}</span
          ><span class="column-label">{{ t('game.growth.target') }}</span>
          <span>{{ t('game.growth.stage') }}</span>
          <OverviewSelect
            appearance="control"
            :model-value="plan.currentStage"
            :label="t('game.growth.current') + ' ' + t('game.growth.stage')"
            :options="stages('current')"
            @update:model-value="setStage(plan, 'current', $event)"
          />
          <OverviewSelect
            appearance="control"
            :model-value="plan.targetStage"
            :label="t('game.growth.target') + ' ' + t('game.growth.stage')"
            :options="stages('target')"
            @update:model-value="setStage(plan, 'target', $event)"
          />
          <template v-if="entity.equipment.length">
            <span>{{ t('game.growth.equipment') }}</span>
            <OverviewSelect
              appearance="control"
              v-model="plan.currentEquipmentStage"
              @update:model-value="plan.preset = 'custom'"
              :label="t('game.growth.current') + ' ' + t('game.growth.equipment')"
              :options="
                Array.from(
                  { length: Math.min(plan.currentStage, entity.equipment.length) + 1 },
                  (_, stage) => ({ value: stage, label: t('game.growth.stageValue', { stage }) }),
                )
              "
            />
            <span class="equipment-target">{{
              t('game.growth.stageValue', {
                stage: Math.min(plan.targetStage, entity.equipment.length),
              })
            }}</span>
          </template>
        </div>
      </details>
    </section>
    <section v-if="entity.skills.length" class="skills-section">
      <h4 class="section-title">{{ t('game.growth.skills') }}</h4>
      <div class="skill-grid">
        <div v-for="(skill, index) in entity.skills" :key="skill.id" class="upgrade-row skill-row">
          <div class="skill-identity">
            <GrowthUpgradeIcon
              :icon="skill.icon"
              :label="name(skill.name)"
              :element="
                entity.element ? name(endfieldData.filters.elements[entity.element]!) : undefined
              "
              :ultimate="skill.type === '2'"
            />
            <span class="skill-name"
              ><small>{{ t(`game.growth.skillType.${skill.type}`) }}</small
              >{{ name(skill.name) }}</span
            >
          </div>
          <GrowthRangePicker
            :from="plan.skills[index]!.from"
            :to="plan.skills[index]!.to"
            :max="12"
            :label="name(skill.name)"
            skill
            @change="(from, to) => skillLevel(index, from, to)"
          />
        </div>
      </div>
      <p class="preset-note">{{ t('game.growth.skillMasteryNote') }}</p>
    </section>
    <GrowthTalentEditor :plan="plan" />
    <section v-if="plan.kind === 'characters'" class="linked-weapon">
      <label
        >{{ t('game.growth.linkedWeapon') }}
        <OverviewSelect
          appearance="control"
          :label="t('game.growth.linkedWeapon')"
          :model-value="plan.weapon?.id ?? ''"
          :options="[
            { value: '', label: t('game.growth.noWeapon') },
            ...endfieldData.weapons
              .filter((w) => w.weaponType === entity.weaponType)
              .map((weapon) => ({ value: weapon.id, label: name(weapon.name) })),
          ]"
          @update:model-value="attachWeapon(plan, $event)"
        />
      </label>
      <GrowthPlanEditor v-if="plan.weapon" :plan="plan.weapon" @remove="plan.weapon = undefined" />
    </section>
  </article>
</template>
<style scoped>
.plan-presets button[aria-pressed='true'] {
  color: var(--button-primary-text);
  border-color: var(--button-primary-bg);
  background: var(--button-primary-bg);
}
.preset-note,
.custom-label {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.6;
}
.preset-summary {
  margin: 6px 0 0;
  color: var(--accent);
  font-size: 12px;
  line-height: 1.6;
}
.preset-summary:empty {
  display: none;
}
.linked-weapon {
  border-top: 1px solid var(--color-border);
  margin-top: 18px;
  padding-top: 14px;
}
.linked-weapon > label {
  display: block;
  font-size: 12px;
}
.linked-weapon > label > .overview-select {
  margin: 8px 0 14px;
}
.linked-weapon :deep(.growth-plan) {
  padding: 12px;
  background: var(--color-background);
}
.growth-plan {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-background-soft);
  padding: 20px;
  min-width: 0;
}
.plan-heading {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 8px;
}
.plan-portrait {
  flex: 0 0 96px;
  width: 96px;
  height: 104px;
  border-bottom-width: 3px;
}
.identity {
  flex: 1;
  min-width: 0;
}
.identity h3 {
  margin: 0;
  padding-right: 36px;
  min-height: 28px;
  font-size: 17px;
  overflow-wrap: anywhere;
  color: var(--color-heading);
}
.weapon-heading .identity {
  align-self: center;
}
.weapon-heading .plan-portrait {
  flex-basis: 80px;
  width: 80px;
  height: 80px;
}
.weapon-rarity {
  display: flex;
  gap: 3px;
  margin-top: 8px;
  color: var(--color-heading);
}
.weapon-rarity svg {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}
button:not(.growth-range-trigger) {
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  color: var(--color-text);
  padding: 6px 10px;
  font: inherit;
}
.plan-heading > .remove {
  position: absolute;
  top: -4px;
  right: -4px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  font-size: 26px;
  line-height: 1;
  border: 0;
  color: var(--muted);
}
button:not(.growth-range-trigger):hover {
  color: var(--accent);
  border-color: var(--accent);
}
.plan-presets {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
  font-size: 12px;
}
.preset-caption {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 2px 0 6px;
  color: var(--muted);
  font-size: 11px;
}
.plan-presets button {
  border-radius: 999px;
  min-height: 32px;
  padding: 4px 14px;
  background: var(--color-background-mute);
}
.plan-presets button:focus-visible {
  border-color: var(--accent);
  text-decoration: underline;
}
.progress-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.equipment-target {
  text-align: center;
}
.column-label {
  color: var(--muted);
  font-size: 11px;
  text-align: center;
}
.section-title {
  margin: 18px 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--accent);
  font-size: 14px;
  color: var(--color-heading);
}
.upgrade-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  min-width: 0;
  background: var(--color-background-mute);
  font-size: 13px;
}
.level-row {
  border-radius: 6px;
}
.skill-grid {
  border-radius: 6px;
  overflow: hidden;
}
.skill-row + .skill-row {
  border-top: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
}
.skill-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.skill-name {
  overflow-wrap: anywhere;
  color: var(--color-heading);
}
.skill-name small {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-bottom: 2px;
}
.stage-details {
  margin-top: 8px;
}
.stage-details summary {
  width: fit-content;
  cursor: pointer;
  font-size: 11px;
  color: var(--muted);
}
.stage-details .progress-grid {
  margin-top: 10px;
}
@media (max-width: 480px) {
  .growth-plan {
    padding: 12px;
  }
  .upgrade-row {
    gap: 6px;
    padding: 8px;
  }
  .skill-identity {
    gap: 6px;
    --upgrade-icon-size: 32px;
  }
  .skill-name {
    font-size: 12px;
  }
  .progress-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
    --select-inline-padding: 6px;
    --select-gap: 4px;
  }
  .plan-heading {
    gap: 10px;
  }
  .plan-portrait {
    flex-basis: 64px;
    width: 64px;
    height: 80px;
  }
  .weapon-heading .plan-portrait {
    flex-basis: 64px;
    width: 64px;
    height: 64px;
  }
  .weapon-rarity {
    gap: 2px;
  }
  .weapon-rarity svg {
    width: 18px;
    height: 18px;
  }
  .plan-presets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 260px;
  }
  .plan-presets button:not(.growth-range-trigger) {
    padding-inline: 6px;
    overflow-wrap: anywhere;
  }
}
</style>
