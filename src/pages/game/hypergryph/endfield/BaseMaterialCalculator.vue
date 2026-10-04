<script lang="ts" setup>
import { Plus, Aim, Location, InfoFilled } from '@element-plus/icons-vue'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElButton,
  ElIcon,
  ElTag,
  type TagProps,
} from 'element-plus'
import {
  endfieldWeaponBaseMaterialRegion,
  endfieldWeapons,
  weaponMatchesRegion,
  type WeaponBaseMaterialRegion,
  type WeaponData,
} from '@/constant/game/hypergryph/endfield/weapons'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale, te } = useI18n()
// Translate display values only: matching and selections retain canonical data identifiers.
const displayAttribute = (value: string): string =>
  te(`game.attributes.${value}`) ? t(`game.attributes.${value}`) : value
const recommendedAttributeLabels = computed(() =>
  mainSelectedAttribute1.value
    .flatMap((item) => (item ? [displayAttribute(item[0])] : []))
    .join(t('game.calculator.attributeSeparator')),
)
const currentSelectWeapon = ref<string>('')
const options = endfieldWeapons.map((item) => ({
  label: item.name,
  value: item,
}))

const selectedWeapons = ref<WeaponData[]>([])

const addWeapon = (): void => {
  if (!currentSelectWeapon.value) {
    return
  }
  const weapon = endfieldWeapons.find((w) => w.name === currentSelectWeapon.value)
  if (weapon && !selectedWeapons.value.find((w) => w.name === weapon.name)) {
    selectedWeapons.value.push(weapon)
  }
}

const deleteWeapon = (weapon: WeaponData): void => {
  selectedWeapons.value = selectedWeapons.value.filter((w) => w.name !== weapon.name)
}

const attributeOptions = ref<any>({
  attribute1Array: new Map<string, number>(),
  attribute2Array: new Map<string, number>(),
  skillTypeArray: new Map<string, number>(),
})

const mainSelectedAttribute1 = ref<([string, number] | null)[]>([])
const mainSelectedSkillType = ref<[string, number] | null>(null)
const selectedMap = ref<WeaponBaseMaterialRegion | null>(null)
const currentMapContainsWeapons = ref<WeaponData[]>([])

const mainAttributesRecommands = computed((): string => {
  return mainSelectedAttribute1.value.map((item) => (item ? item[0] : '')).join(' ')
})

const currentMapContainsWeaponsNames = (weapon: WeaponData): TagProps['type'] => {
  if (currentMapContainsWeapons.value.find((w) => w.name === weapon.name)) {
    const currentSelectAttribute1 = mainAttributesRecommands.value.split(' ')
    const currentSelectSkill = mainSelectedSkillType.value?.[0]
    if (
      weapon.skill.type === currentSelectSkill &&
      currentSelectAttribute1.includes(weapon.attribute1)
    ) {
      return 'primary'
    }
  }
  return 'info'
}

watch(
  selectedWeapons,
  (newVal) => {
    let attribute1HashMap = new Map<string, number>()
    let attribute2HashMap = new Map<string, number>()
    let skillTypeHashMap = new Map<string, number>()

    newVal.forEach((weapon) => {
      attribute1HashMap.set(weapon.attribute1, (attribute1HashMap.get(weapon.attribute1) || 0) + 1)
      if (weapon.attribute2) {
        attribute2HashMap.set(
          weapon.attribute2,
          (attribute2HashMap.get(weapon.attribute2) || 0) + 1,
        )
      }
      skillTypeHashMap.set(weapon.skill.type, (skillTypeHashMap.get(weapon.skill.type) || 0) + 1)
    })

    attributeOptions.value = {
      attribute1Array: attribute1HashMap,
      attribute2Array: attribute2HashMap,
      skillTypeArray: skillTypeHashMap,
    }

    const regionMap = new Map<WeaponBaseMaterialRegion, WeaponData[]>()
    endfieldWeaponBaseMaterialRegion.forEach((region) => {
      let weaponList: WeaponData[] = []
      newVal.forEach((weapon) => {
        if (weaponMatchesRegion(weapon, region)) {
          weaponList.push(weapon)
        }
      })
      regionMap.set(region, weaponList)
    })

    const sortedRegionArray = new Map(
      [...regionMap.entries()].sort((a, b) => b[1].length - a[1].length),
    )
    selectedMap.value = Array.from(sortedRegionArray.entries())[0]![0] || null
    currentMapContainsWeapons.value = Array.from(sortedRegionArray.entries())[0]![1] || []
    if (selectedMap.value) {
      const activatedAttribute1HashMap = new Map<string, number>()
      const activatedAttribute2HashMap = new Map<string, number>()
      const activatedSkillTypeHashMap = new Map<string, number>()
      currentMapContainsWeapons.value.forEach((weapon) => {
        activatedAttribute1HashMap.set(
          weapon.attribute1,
          (activatedAttribute1HashMap.get(weapon.attribute1) || 0) + 1,
        )
        if (weapon.attribute2) {
          activatedAttribute2HashMap.set(
            weapon.attribute2,
            (activatedAttribute2HashMap.get(weapon.attribute2) || 0) + 1,
          )
        }
        activatedSkillTypeHashMap.set(
          weapon.skill.type,
          (activatedSkillTypeHashMap.get(weapon.skill.type) || 0) + 1,
        )
      })

      const sortedAttribute1Array = new Map(
        [...activatedAttribute1HashMap.entries()].sort((a, b) => b[1] - a[1]),
      )
      const sortedAttribute2Array = new Map(
        [...activatedAttribute2HashMap.entries()].sort((a, b) => b[1] - a[1]),
      )
      const sortedSkillTypeArray = new Map(
        [...activatedSkillTypeHashMap.entries()].sort((a, b) => b[1] - a[1]),
      )

      mainSelectedAttribute1.value =
        Array.from(sortedAttribute1Array.entries()).filter((_, index) => index < 3) || []
      mainSelectedSkillType.value = Array.from(sortedSkillTypeArray)[0] || null
    }
  },
  { deep: true },
)
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
              >
                <el-option
                  v-for="item in options"
                  :key="item.label"
                  :label="item.label"
                  :value="item.label"
                />
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
        <div v-if="selectedWeapons.length" class="selected-weapons-tags-div">
          <el-tag
            v-for="weapon in selectedWeapons"
            :key="weapon.name"
            closable
            :type="currentMapContainsWeaponsNames(weapon)"
            round
            @close="deleteWeapon(weapon)"
            ><span :class="[`rarity-${weapon.rarity}`]">{{ weapon.name }}</span></el-tag
          >
        </div>
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
      <template v-if="selectedWeapons.length && currentMapContainsWeapons.length">
        <span class="section-label">{{ t('game.calculator.recommendedRegion') }}</span>
        <h3 class="map-name">{{ selectedMap?.region }}</h3>
        <p class="coverage">
          {{
            t('game.calculator.coverage', {
              matched: currentMapContainsWeapons.length,
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
              ? displayAttribute(mainSelectedSkillType[0])
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
.selected-weapons-tags-div {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  min-height: 70px;
  align-content: start;
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
.rarity-3 {
  color: #6acdfb;
}
.rarity-4 {
  color: #b795ff;
}
.rarity-5 {
  color: #ffcb7b;
}
.rarity-6 {
  color: #ffad72;
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
