<script lang="ts" setup>
import { Plus, Aim, Location, InfoFilled, Close } from '@element-plus/icons-vue'
import { ElCard, ElForm, ElFormItem, ElSelect, ElOption, ElButton, ElIcon } from 'element-plus'
import {
  endfieldData,
  endfieldWeapons,
  weaponById,
  endfieldRarityColor,
  type WeaponData,
} from '@/common/endfieldResources'
import { computed, ref } from 'vue'
import { recommendEssencePlan } from '@/common/endfieldEssence'
import GrowthEntityAvatar from './GrowthEntityAvatar.vue'
import GrowthFilterIcon from './GrowthFilterIcon.vue'
import { useI18n } from 'vue-i18n'
const { t, locale, te } = useI18n()
// Translate display values only: matching and selections retain canonical data identifiers.
const displayAttribute = (value: string): string =>
  te(`game.attributes.${value}`) ? t(`game.attributes.${value}`) : value
const weaponTypeName = (type: string) =>
  endfieldData.filters.weaponTypes[type]?.[locale.value === 'en' ? 'en' : 'zh-CN'] ?? type
const currentSelectWeapon = ref<string>('')
const selectedWeapons = ref<WeaponData[]>([])
const availableWeapons = computed(() => {
  const selectedNames = new Set(selectedWeapons.value.map((weapon) => weapon.name))
  return endfieldWeapons.filter((weapon) => !selectedNames.has(weapon.name))
})

const addWeapon = (): void => {
  if (!currentSelectWeapon.value) {
    return
  }
  const weapon = endfieldWeapons.find((w) => w.name === currentSelectWeapon.value)
  if (weapon && !selectedWeapons.value.find((w) => w.name === weapon.name)) {
    selectedWeapons.value.push(weapon)
    currentSelectWeapon.value = ''
  }
}

const deleteWeapon = (weapon: WeaponData): void => {
  selectedWeapons.value = selectedWeapons.value.filter((w) => w.name !== weapon.name)
}

const recommendation = computed(() => recommendEssencePlan(selectedWeapons.value))
const coveredWeapons = computed(() => recommendation.value?.coveredWeapons ?? [])
const coveredNames = computed(() => new Set(coveredWeapons.value.map((weapon) => weapon.name)))
const isRecommendedWeapon = (weapon: WeaponData) => coveredNames.value.has(weapon.name)
const selectedMap = computed(() => recommendation.value?.region)
const mainSelectedSkillType = computed(() => recommendation.value?.skillType)
const recommendedAttributeLabels = computed(() =>
  (recommendation.value?.primaryAttributes ?? [])
    .map(displayAttribute)
    .join(t('game.calculator.attributeSeparator')),
)
const attributeOptions = computed(() => {
  const attribute1Array = new Map<string, number>()
  const attribute2Array = new Map<string, number>()
  const skillTypeArray = new Map<string, number>()
  for (const weapon of selectedWeapons.value) {
    attribute1Array.set(weapon.attribute1, (attribute1Array.get(weapon.attribute1) ?? 0) + 1)
    if (weapon.attribute2) {
      attribute2Array.set(weapon.attribute2, (attribute2Array.get(weapon.attribute2) ?? 0) + 1)
    }
    skillTypeArray.set(weapon.skill.type, (skillTypeArray.get(weapon.skill.type) ?? 0) + 1)
  }
  return { attribute1Array, attribute2Array, skillTypeArray }
})
</script>

<template>
  <div class="calculator-layout">
    <div class="calculator-inputs">
      <el-card>
        <div class="panel-title">
          <h2><span class="step-number">01</span>{{ t('game.calculator.buildList') }}</h2>
          <span class="pill">{{ t('game.calculator.localCalculation') }}</span>
        </div>
        <el-form label-position="top" @submit.prevent="addWeapon">
          <el-form-item :label="t('game.calculator.searchLabel')">
            <div class="weapon-select-add-div">
              <el-select
                v-model="currentSelectWeapon"
                filterable
                :placeholder="t('game.calculator.searchPlaceholder')"
                :aria-label="t('game.calculator.selectWeapon')"
                :no-data-text="t('game.calculator.allWeaponsSelected')"
                :no-match-text="t('game.calculator.noAvailableWeaponMatch')"
              >
                <el-option
                  v-for="weapon in availableWeapons"
                  :key="weapon.name"
                  :label="weapon.name"
                  :value="weapon.name"
                >
                  <span class="weapon-option">
                    <GrowthFilterIcon
                      v-if="weaponById.get(weapon.id)"
                      class="weapon-option-icon"
                      :kind="weaponById.get(weapon.id)!.weaponType"
                    />
                    <span
                      class="weapon-option-name"
                      :class="`rarity-${weapon.rarity}`"
                      :style="{ '--weapon-rarity-color': endfieldRarityColor(weapon.rarity) }"
                      >{{ weapon.name }}</span
                    >
                  </span>
                </el-option>
              </el-select>
              <el-button
                type="primary"
                native-type="submit"
                :disabled="
                  !currentSelectWeapon ||
                  selectedWeapons.some((w) => w.name === currentSelectWeapon)
                "
                ><el-icon><Plus /></el-icon>{{ t('game.calculator.addWeapon') }}</el-button
              >
            </div>
          </el-form-item>
        </el-form>
        <p v-if="locale === 'en'" class="server-name-note">{{ t('game.calculator.namesNote') }}</p>
        <div class="selection-heading">
          <span>{{ t('game.calculator.selectedWeapons') }}</span
          ><span>{{
            t('game.calculator.selectedCount', {
              count: selectedWeapons.length.toString().padStart(2, '0'),
            })
          }}</span>
        </div>
        <ul
          v-if="selectedWeapons.length"
          class="selected-weapons"
          :aria-label="t('game.calculator.selectedWeapons')"
        >
          <li
            v-for="weapon in selectedWeapons"
            :key="weapon.name"
            class="selected-weapon"
            :class="{ 'is-recommended': isRecommendedWeapon(weapon) }"
          >
            <div v-if="weaponById.get(weapon.id)" class="weapon-artwork">
              <GrowthEntityAvatar :entity="weaponById.get(weapon.id)!" kind="weapons" />
              <span
                class="weapon-type"
                :title="weaponTypeName(weaponById.get(weapon.id)!.weaponType)"
                :aria-label="weaponTypeName(weaponById.get(weapon.id)!.weaponType)"
              >
                <GrowthFilterIcon :kind="weaponById.get(weapon.id)!.weaponType" />
              </span>
            </div>
            <div class="weapon-copy">
              <strong
                class="weapon-name"
                :class="`rarity-${weapon.rarity}`"
                :style="{ '--weapon-rarity-color': endfieldRarityColor(weapon.rarity) }"
                >{{ weapon.name }}</strong
              >
              <p class="weapon-attributes">
                {{
                  [weapon.attribute1, weapon.attribute2, weapon.skill.type]
                    .filter((value): value is string => !!value)
                    .map(displayAttribute)
                    .join(' · ')
                }}
              </p>
            </div>
            <button
              type="button"
              class="remove-weapon"
              :aria-label="t('game.calculator.removeWeapon', { name: weapon.name })"
              :title="t('game.calculator.removeWeapon', { name: weapon.name })"
              @click="deleteWeapon(weapon)"
            >
              <ElIcon><Close /></ElIcon>
            </button>
          </li>
        </ul>
        <div v-else class="selection-empty">
          <el-icon><Aim /></el-icon>
          <h3>{{ t('game.calculator.emptyTitle') }}</h3>
          <p>{{ t('game.calculator.emptyDescription') }}</p>
        </div>
        <p v-if="selectedWeapons.length" class="selection-note">
          {{ t('game.calculator.highlightNote') }}
        </p>
      </el-card>
      <el-card class="stats-card">
        <div class="panel-title">
          <h2><span class="step-number">02</span>{{ t('game.calculator.statsTitle') }}</h2>
          <span>ATTRIBUTE OVERVIEW</span>
        </div>
        <div class="weapon-attribute-summary-div">
          <section
            v-for="(group, index) in [
              {
                title: t('game.calculator.primaryAttribute'),
                data: attributeOptions.attribute1Array,
              },
              {
                title: t('game.calculator.secondaryAttribute'),
                data: attributeOptions.attribute2Array,
              },
              { title: t('game.calculator.skill'), data: attributeOptions.skillTypeArray },
            ]"
            :key="group.title"
          >
            <h3>
              <span>{{ ['◈', '◇', '✧'][index] }}</span
              >{{ group.title }}
            </h3>
            <p v-if="!group.data.size" class="stat-empty">
              {{ t('game.calculator.waitingWeapons') }}
            </p>
            <div v-for="item in group.data" :key="item[0]" class="stat-row">
              <span>{{ displayAttribute(item[0]) }}</span
              ><b>{{ item[1] }}</b>
            </div>
          </section>
        </div>
      </el-card>
    </div>
    <aside class="recommendation" aria-live="polite">
      <div class="recommendation-top">
        <p class="eyebrow">YOUR EXPLORATION PLAN</p>
        <span aria-hidden="true">↗</span>
      </div>
      <h2>{{ t('game.calculator.planTitle') }}</h2>
      <div class="map-visual" aria-hidden="true">
        <i /><i /><i /><el-icon><Location /></el-icon>
      </div>
      <template v-if="selectedWeapons.length && coveredWeapons.length">
        <span class="section-label">{{ t('game.calculator.recommendedRegion') }}</span>
        <h3 class="map-name">{{ selectedMap?.region }}</h3>
        <p class="coverage">
          {{
            t('game.calculator.coverage', {
              matched: coveredWeapons.length,
              total: selectedWeapons.length,
            })
          }}
        </p>
        <div class="ticket">
          <p class="section-label">{{ t('game.calculator.attributeTicket') }}</p>
          <strong>{{ recommendedAttributeLabels || t('game.calculator.noRecommendation') }}</strong>
        </div>
        <div class="ticket">
          <p class="section-label">{{ t('game.calculator.skillTicket') }}</p>
          <strong>{{
            mainSelectedSkillType
              ? displayAttribute(mainSelectedSkillType)
              : t('game.calculator.noRecommendation')
          }}</strong>
        </div>
      </template>
      <div v-else class="recommendation-empty">
        <h3>
          {{
            t(selectedWeapons.length ? 'game.calculator.noRegion' : 'game.calculator.waitingList')
          }}
        </h3>
        <p>
          {{
            selectedWeapons.length
              ? t('game.calculator.adjustSelection')
              : t('game.calculator.recommendationDescription')
          }}
        </p>
      </div>
      <p class="recommendation-footnote">
        <el-icon><InfoFilled /></el-icon>{{ t('game.calculator.footnote') }}
      </p>
    </aside>
  </div>
</template>
<style scoped>
.weapon-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.weapon-option-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  color: var(--muted);
}
.weapon-option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--weapon-rarity-color, var(--color-heading));
}
.calculator-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 24px;
  align-items: start;
}
.calculator-inputs {
  display: grid;
  gap: 24px;
  min-width: 0;
}
.panel-title {
  flex-wrap: wrap;
}
.panel-title h2 {
  display: flex;
  align-items: center;
  gap: 10px;
}
.step-number {
  color: var(--accent) !important;
  font:
    12px ui-monospace,
    monospace;
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  background: color-mix(in srgb, var(--accent) 4%, transparent);
  padding: 5px 6px;
  border-radius: 6px;
}
.panel-title .pill {
  font-size: 10px;
}
.weapon-select-add-div {
  display: flex;
  gap: 12px;
  width: 100%;
}
.weapon-select-add-div .el-select {
  flex: 1;
  min-width: 0;
}
.weapon-select-add-div .el-button {
  height: 44px;
}
.weapon-select-add-div .el-icon {
  margin-right: 6px;
}
.selection-heading {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: var(--color-text);
  font-size: 12px;
  margin-bottom: 15px;
}
.selection-heading > span + span {
  color: var(--muted);
  font:
    10px ui-monospace,
    monospace;
}
.selected-weapons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.selected-weapon {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 12px 32px 12px 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-soft);
}
.selected-weapon.is-recommended {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--color-border));
  background: color-mix(in srgb, var(--accent) 8%, var(--color-background-soft));
}
.weapon-artwork {
  position: relative;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
}
.weapon-artwork :deep(.growth-weapon-portrait) {
  width: 100%;
  height: 100%;
  border-bottom-width: 3px;
}
.weapon-type {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background-soft) 92%, transparent);
  color: var(--color-heading);
  border-radius: 3px;
}
.weapon-type {
  top: 3px;
  left: 3px;
  width: 19px;
  height: 19px;
}
.weapon-type svg {
  width: 16px;
  height: 16px;
}
.weapon-copy {
  min-width: 0;
}
.weapon-name {
  display: block;
  color: var(--weapon-rarity-color, var(--color-heading));
  font-size: 13px;
  overflow-wrap: anywhere;
}
.weapon-attributes {
  margin-top: 5px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
  overflow-wrap: anywhere;
}
.remove-weapon {
  position: absolute;
  top: 1px;
  right: 1px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
}
.remove-weapon:hover,
.remove-weapon:focus-visible {
  color: var(--accent);
  background: var(--color-background-mute);
}
.selection-empty {
  border: 1px dashed var(--color-border);
  background: #160f1644;
  border-radius: 12px;
  text-align: center;
  padding: 30px 12px;
}
.selection-empty > .el-icon {
  font-size: 31px;
  color: var(--muted);
}
.selection-empty h3 {
  font-size: 14px;
  font-weight: 500;
  margin: 10px 0 4px;
  color: var(--color-text);
}
.selection-empty p,
.server-name-note,
.selection-note {
  color: var(--muted);
  font-size: 11px;
}
.server-name-note,
.selection-note {
  margin-top: 15px;
}
.weapon-attribute-summary-div {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.weapon-attribute-summary-div section {
  background: #211821b3;
  border: 1px solid var(--color-border);
  padding: 15px;
  border-radius: 12px;
}
.weapon-attribute-summary-div h3 {
  font-size: 13px;
  margin-bottom: 18px;
}
.weapon-attribute-summary-div h3 > span {
  color: var(--pink);
  margin-right: 8px;
}
.stat-empty {
  color: var(--muted);
  font-size: 11px;
  padding: 10px 0;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  padding: 8px 0;
  border-top: 1px solid #ffffff09;
}
.stat-row > span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.stat-row b {
  flex-shrink: 0;
  color: var(--accent);
  font:
    12px ui-monospace,
    monospace;
}
.recommendation {
  border: 1px solid #775063;
  background:
    radial-gradient(ellipse at 90% 0%, #b5678b38, transparent 55%),
    linear-gradient(145deg, #392433, #261b25 60%);
  border-radius: 20px;
  padding: 26px;
  overflow: hidden;
}
.recommendation-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.recommendation-top .eyebrow {
  font-size: 9px;
  letter-spacing: 0.13em;
}
.recommendation-top > span {
  color: var(--accent);
  font-size: 25px;
}
.recommendation > h2 {
  white-space: pre-line;
  font-size: 29px;
  line-height: 1.4;
  margin-top: 18px;
  letter-spacing: -0.04em;
}
.map-visual {
  position: relative;
  height: 145px;
}
.map-visual i {
  position: absolute;
  width: 105px;
  height: 105px;
  left: calc(50% - 52px);
  top: 11px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, transparent), #522c40);
  border: 1px solid color-mix(in srgb, var(--accent) 47%, transparent);
  transform: rotateX(60deg) rotateZ(45deg);
}
.map-visual i:nth-child(2) {
  top: 28px;
  opacity: 0.5;
}
.map-visual i:nth-child(3) {
  top: 45px;
  opacity: 0.25;
}
.map-visual > .el-icon {
  position: absolute;
  top: 25px;
  left: calc(50% - 21px);
  font-size: 42px;
  color: var(--accent);
  filter: drop-shadow(0 0 15px color-mix(in srgb, var(--accent) 20%, transparent));
  animation: drift 5s ease-in-out infinite;
}
.map-name {
  margin-top: 8px;
  color: #ffd2e4;
  font-size: 25px;
}
.coverage {
  color: var(--muted);
  margin: 8px 0 20px;
  font-size: 12px;
}
.ticket {
  padding: 16px 0;
  border-top: 1px solid color-mix(in srgb, var(--accent) 13%, transparent);
}
.ticket strong {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
}
.recommendation-empty h3 {
  font-size: 16px;
  color: var(--color-heading);
}
.recommendation-empty p {
  margin-top: 10px;
  color: var(--muted);
  font-size: 12px;
}
.recommendation-footnote {
  display: flex;
  align-items: start;
  gap: 7px;
  margin-top: 22px;
  border-top: 1px solid color-mix(in srgb, var(--accent) 13%, transparent);
  padding-top: 18px;
  color: var(--muted);
  font-size: 10px;
}
.recommendation-footnote .el-icon {
  flex-shrink: 0;
  margin-top: 3px;
}
@media (max-width: 1050px) {
  .calculator-layout {
    grid-template-columns: minmax(0, 1fr) 285px;
    gap: 18px;
  }
  .weapon-attribute-summary-div {
    grid-template-columns: 1fr;
  }
  .panel-title .pill {
    display: none;
  }
}
@media (max-width: 760px) {
  .calculator-layout {
    grid-template-columns: 1fr;
  }
  .weapon-select-add-div {
    flex-wrap: wrap;
  }
  .weapon-select-add-div .el-select {
    min-width: 150px;
  }
  .weapon-attribute-summary-div {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .weapon-attribute-summary-div section {
    padding: 12px;
  }
  .panel-title > span {
    font-size: 9px;
  }
  .recommendation {
    padding: 24px;
  }
  .map-visual {
    height: 120px;
  }
}
@media (max-width: 420px) {
  .weapon-attribute-summary-div {
    grid-template-columns: 1fr;
  }
  .panel-title > span {
    display: none;
  }
  .weapon-select-add-div .el-select {
    flex-basis: 100%;
  }
}
</style>
