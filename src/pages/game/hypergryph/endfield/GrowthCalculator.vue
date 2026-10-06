<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElDialog, ElIcon } from 'element-plus'
import { Plus, Delete, DataAnalysis, Check, CloseBold } from '@element-plus/icons-vue'
import DialogConfirmButton from '@/components/DialogConfirmButton.vue'
import EmptyState from '@/components/EmptyState.vue'
import GrowthEntityAvatar from './GrowthEntityAvatar.vue'
import GrowthFilterIcon from './GrowthFilterIcon.vue'
import OverviewArtwork from '@/components/game/OverviewArtwork.vue'
import { endfieldData, endfieldPortraitBadge, endfieldArt } from '@/common/endfieldResources'
import GrowthPlanEditor from './GrowthPlanEditor.vue'
import {
  growthHistoryKey,
  parseGrowthHistory,
  type GrowthRecord,
} from '@/common/endfieldGrowthHistory'
import {
  createPlan,
  entityFor,
  calculatePlan,
  calculateTotal,
  experienceGroups,
  convertedExperience,
  integer,
  type GrowthKind,
  type GrowthPlan,
  type LocalName,
  type CostMap,
} from '@/common/endfieldGrowth'
const { t, locale } = useI18n()
const mode = ref<GrowthKind>('characters')
const searchLabel = computed(() =>
  t(mode.value === 'characters' ? 'game.growth.searchCharacters' : 'game.growth.searchWeapons'),
)
const plans = ref<GrowthPlan[]>([])
const activePlans = computed(() => plans.value.filter((p) => p.kind === mode.value))
const activeIds = ref<Record<GrowthKind, string>>({ characters: '', weapons: '' })
const activePlan = computed(
  () => activePlans.value.find((p) => p.id === activeIds.value[mode.value]) ?? activePlans.value[0],
)
const selecting = ref(false)
const filtersExpanded = ref(false)
const search = ref('')
const rarities = ref<number[]>([])
const elements = ref<string[]>([])
const profession = ref('')
const weaponType = ref('')
const weaponTypeOrder = ['6', '3', '2', '1', '5']
const filterCount = computed(
  () =>
    rarities.value.length +
    elements.value.length +
    Number(Boolean(profession.value)) +
    Number(Boolean(weaponType.value)),
)
const pending = ref<string[]>([])
const inventory = ref<Record<string, number>>({})
const useInventory = ref(true)
const history = ref<GrowthRecord[]>([])
const storageUnavailable = ref(false)
try {
  history.value = parseGrowthHistory(localStorage.getItem(growthHistoryKey))
} catch {
  storageUnavailable.value = true
}
const calculated = ref<Record<GrowthKind, boolean>>({ characters: false, weapons: false })
const resultElement = ref<HTMLElement>()
const name = (value: LocalName) => value[locale.value === 'en' ? 'en' : 'zh-CN']
const characterFilterGroups = computed(() =>
  [
    {
      kind: 'element' as const,
      values: ['Physical', 'Natural', 'Cryst', 'Pulse', 'Fire'],
      labels: endfieldData.filters.elements,
    },
    {
      kind: 'profession' as const,
      values: ['2', '4', '5', '8', '7', '0'],
      labels: endfieldData.filters.professions,
    },
  ].map((group) => ({
    kind: group.kind,
    options: group.values.map((value) => {
      const label = name(group.labels[value]!)
      const badge = endfieldPortraitBadge(group.kind, label)
      return {
        value,
        label,
        art:
          badge && group.kind === 'profession' ? { ...badge, tone: 'light-ink' as const } : badge,
        background: group.kind === 'element' ? badge?.background : undefined,
      }
    }),
  })),
)
const number = (value: number) => value.toLocaleString(locale.value)
const catalog = computed(() =>
  endfieldData[mode.value]
    .filter(
      (entity) =>
        (!rarities.value.length || rarities.value.includes(entity.rarity)) &&
        (!elements.value.length || elements.value.includes(entity.element ?? '')) &&
        (!profession.value || entity.profession === profession.value) &&
        (!weaponType.value || entity.weaponType === weaponType.value) &&
        (!search.value.trim() ||
          Object.values(entity.name).some((n) =>
            n.toLowerCase().includes(search.value.trim().toLowerCase()),
          )),
    )
    .sort((a, b) => b.rarity - a.rarity || name(a.name).localeCompare(name(b.name), locale.value)),
)
const totals = computed(() =>
  calculateTotal(activePlans.value, useInventory.value ? inventory.value : {}),
)
const overview = computed(() =>
  totals.value.filter((row) => !useInventory.value || row.missing > 0),
)
const conversionGroups = computed(() =>
  experienceGroups.filter((group) => totals.value.some((row) => row.id === group.high)),
)
const costs = computed(() =>
  activePlans.value.map((p) => ({
    plan: p,
    name: name(entityFor(p).name),
    cost: calculatePlan(p),
  })),
)
const materialName = (id: string) => name(endfieldData.materials[id]!.name)
const costEntries = (map: CostMap) => Object.entries(map)
function openSelect() {
  filtersExpanded.value = false
  pending.value = activePlans.value.map((p) => p.id)
  search.value = ''
  rarities.value = []
  elements.value = []
  profession.value = ''
  weaponType.value = ''
  selecting.value = true
}
function toggle(id: string) {
  if (pending.value.includes(id)) pending.value = pending.value.filter((n) => n !== id)
  else if (pending.value.length < 8) pending.value.push(id)
}
function toggleRarity(value: number) {
  rarities.value = rarities.value.includes(value)
    ? rarities.value.filter((rarity) => rarity !== value)
    : [...rarities.value, value]
}
function toggleCharacterFilter(kind: 'element' | 'profession', value: string) {
  if (kind === 'profession') profession.value = profession.value === value ? '' : value
  else
    elements.value = elements.value.includes(value)
      ? elements.value.filter((element) => element !== value)
      : [...elements.value, value]
}
function confirmSelection() {
  const existing = new Map(activePlans.value.map((p) => [p.id, p]))
  plans.value = [
    ...plans.value.filter((p) => p.kind !== mode.value),
    ...pending.value.map((id) => existing.get(id) ?? createPlan(mode.value, id)),
  ]
  selecting.value = false
}
function remove(id: string) {
  const index = activePlans.value.findIndex((p) => p.id === id)
  plans.value = plans.value.filter((p) => p.kind !== mode.value || p.id !== id)
  activeIds.value[mode.value] = (activePlans.value[index] ?? activePlans.value[index - 1])?.id ?? ''
}
function clear() {
  plans.value = plans.value.filter((p) => p.kind !== mode.value)
  calculated.value[mode.value] = false
}
function updateInventory(id: string, event: Event) {
  const input = event.target as HTMLInputElement
  inventory.value[id] = integer(input.value, 0, 999999999)
  input.value = String(inventory.value[id])
}
async function calculate() {
  calculated.value[mode.value] = true
  const timestamp = Date.now()
  history.value = parseGrowthHistory(
    JSON.stringify([{ timestamp, kind: mode.value, plans: activePlans.value }, ...history.value]),
    timestamp,
  )
  try {
    localStorage.setItem(growthHistoryKey, JSON.stringify(history.value))
  } catch {
    storageUnavailable.value = true
  }
  await nextTick()
  resultElement.value?.scrollIntoView({ block: 'nearest' })
}
function restore(record: GrowthRecord) {
  const valid = parseGrowthHistory(JSON.stringify([record]))[0]
  if (!valid) {
    history.value = parseGrowthHistory(JSON.stringify(history.value))
    return
  }
  mode.value = valid.kind
  plans.value = [...plans.value.filter((p) => p.kind !== valid.kind), ...valid.plans]
  activeIds.value[valid.kind] = valid.plans[0]!.id
  calculated.value[valid.kind] = true
}
function clearHistory() {
  history.value = []
  try {
    localStorage.removeItem(growthHistoryKey)
  } catch {
    storageUnavailable.value = true
  }
}
</script>
<template>
  <section class="growth-calculator" :aria-label="t('game.growth.title')">
    <div class="growth-toolbar">
      <div class="mode-switch" role="group" :aria-label="t('game.growth.select')">
        <button
          v-for="kind in ['characters', 'weapons'] as const"
          :key="kind"
          type="button"
          :aria-pressed="mode === kind"
          @click="mode = kind"
        >
          {{ t(`game.growth.${kind}`) }}
        </button>
      </div>
      <span class="local-note">{{ t('game.calculator.localCalculation') }}</span>
    </div>
    <details v-if="history.length" class="recent-history">
      <summary>{{ t('game.growth.recent') }} · {{ history.length }}</summary>
      <p class="helper">{{ t('game.growth.historyNote') }}</p>
      <div class="recent-list">
        <button
          v-for="(record, index) in history"
          :key="index"
          type="button"
          @click="restore(record)"
        >
          <strong>{{ record.plans.map((p) => name(entityFor(p).name)).join(' / ') }}</strong>
          <small
            >{{ t(`game.growth.${record.kind}`) }} ·
            {{ new Date(record.timestamp).toLocaleString(locale) }}</small
          >
        </button>
      </div>
      <el-button text @click="clearHistory">{{ t('game.growth.clearHistory') }}</el-button>
    </details>
    <p v-if="storageUnavailable" class="helper" role="status">
      {{ t('game.growth.storageUnavailable') }}
    </p>
    <div class="growth-layout">
      <div class="planning-column">
        <div class="section-heading">
          <h2>
            {{ t(`game.growth.${mode}`) }} <span>{{ activePlans.length }} / 8</span>
          </h2>
          <div class="heading-actions">
            <el-button
              v-if="activePlans.length"
              text
              :aria-label="t('game.growth.clear')"
              @click="clear"
              ><el-icon><Delete /></el-icon
            ></el-button>
            <el-button v-if="activePlans.length" type="primary" @click="openSelect"
              ><el-icon><Plus /></el-icon>{{ t('game.growth.add') }}</el-button
            >
          </div>
        </div>
        <template v-if="activePlans.length">
          <div class="target-tabs" role="group" :aria-label="t('game.growth.editTarget')">
            <button
              v-for="plan in activePlans"
              :key="plan.id"
              type="button"
              :aria-pressed="activePlan?.id === plan.id"
              @click="activeIds[mode] = plan.id"
            >
              <GrowthEntityAvatar :entity="entityFor(plan)" :kind="plan.kind" />
              <span
                >{{ name(entityFor(plan).name)
                }}<small>LV. {{ plan.currentLevel }} → {{ plan.targetLevel }}</small></span
              >
            </button>
          </div>
          <p class="helper">{{ t('game.growth.stagesNote') }}</p>
          <div class="plans">
            <GrowthPlanEditor
              v-if="activePlan"
              :key="activePlan.id"
              :plan="activePlan"
              @remove="remove(activePlan!.id)"
            />
          </div>
          <div class="calculate-bar">
            <span>{{ t('game.growth.count', { count: activePlans.length }) }}</span
            ><el-button type="primary" size="large" @click="calculate"
              ><el-icon><DataAnalysis /></el-icon>{{ t('game.growth.calculate') }}</el-button
            >
          </div>
        </template>
        <EmptyState
          v-else
          kind="empty"
          :title="t('game.growth.emptyTitle')"
          :description="t('game.growth.emptyDescription')"
          ><template #actions
            ><el-button type="primary" @click="openSelect">{{
              t('game.growth.add')
            }}</el-button></template
          ></EmptyState
        >
      </div>
      <aside ref="resultElement" class="result-column" :aria-label="t('game.growth.result')">
        <div class="result-heading">
          <span class="eyebrow">RESOURCE PLAN</span>
          <h2>{{ t('game.growth.resources') }}</h2>
        </div>
        <p v-if="!activePlans.length || !calculated[mode]" class="result-placeholder">
          {{ t('game.growth.resultHint') }}
        </p>
        <template v-else>
          <div v-if="!totals.length" class="result-placeholder" role="status">
            <strong>{{ t('game.growth.achieved') }}</strong>
            <p>{{ t('game.growth.achievedNote') }}</p>
          </div>
          <template v-else>
            <label class="inventory-toggle"
              ><input v-model="useInventory" type="checkbox" />{{
                t('game.growth.useInventory')
              }}</label
            >
            <p class="helper">{{ t('game.growth.inventoryNote') }}</p>
            <details v-if="useInventory && conversionGroups.length" class="experience-inventory">
              <summary>{{ t('game.growth.lowTierInventory') }}</summary>
              <p class="helper">{{ t('game.growth.conversionNote') }}</p>
              <section
                v-for="group in conversionGroups"
                :key="group.high"
                :data-conversion="group.high"
              >
                <h4>{{ materialName(group.high) }}</h4>
                <label v-for="item in group.low" :key="item.id" class="low-tier-row">
                  <OverviewArtwork :art="endfieldArt(item.id)" class="material-icon" />
                  <span
                    >{{ materialName(item.id) }}<small>{{ number(item.exp) }} EXP</small></span
                  >
                  <input
                    type="number"
                    min="0"
                    max="999999999"
                    :value="inventory[item.id] ?? 0"
                    :aria-label="t('game.growth.inventoryLabel', { name: materialName(item.id) })"
                    @change="updateInventory(item.id, $event)"
                  />
                </label>
                <p class="helper">
                  {{
                    t('game.growth.conversionResult', {
                      count: number(convertedExperience(inventory, group.high).count),
                      name: materialName(group.high),
                      exp: number(convertedExperience(inventory, group.high).remainder),
                    })
                  }}
                </p>
              </section>
            </details>
            <h3 class="overview-heading">
              {{ t(useInventory ? 'game.growth.neededOverview' : 'game.growth.requiredOverview') }}
            </h3>
            <div class="resource-overview">
              <div v-for="row in overview" :key="row.id">
                <OverviewArtwork :art="endfieldArt(row.id)" class="material-icon overview-icon" />
                <span>{{ materialName(row.id) }}</span
                ><strong>{{ number(useInventory ? row.missing : row.count) }}</strong>
              </div>
            </div>
            <p v-if="!overview.length" class="helper" role="status">
              {{ t('game.growth.inventorySufficient') }}
            </p>
            <table class="resource-table">
              <thead>
                <tr>
                  <th>{{ t('game.growth.material') }}</th>
                  <th>{{ t('game.growth.total') }}</th>
                  <th v-if="useInventory">{{ t('game.growth.inventory') }}</th>
                  <th v-if="useInventory">{{ t('game.growth.difference') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in totals" :key="row.id" :data-material="row.id">
                  <th scope="row">
                    <OverviewArtwork :art="endfieldArt(row.id)" class="material-icon" />{{
                      materialName(row.id)
                    }}
                  </th>
                  <td>{{ number(row.count) }}</td>
                  <td v-if="useInventory">
                    <input
                      type="number"
                      min="0"
                      max="999999999"
                      :value="inventory[row.id] ?? 0"
                      :aria-label="t('game.growth.inventoryLabel', { name: materialName(row.id) })"
                      @change="updateInventory(row.id, $event)"
                    />
                    <small
                      v-if="convertedExperience(inventory, row.id).count"
                      class="converted-count"
                      >{{
                        t('game.growth.convertedCount', {
                          count: number(convertedExperience(inventory, row.id).count),
                        })
                      }}</small
                    >
                  </td>
                  <td v-if="useInventory" :class="{ satisfied: row.difference >= 0 }">
                    {{ row.difference > 0 ? '+' : '' }}{{ number(row.difference) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="useInventory" class="helper">{{ t('game.growth.differenceNote') }}</p>
            <p class="helper">{{ t('game.growth.expNote') }}</p>
          </template>
          <details v-if="totals.length" class="cost-details">
            <summary>{{ t('game.growth.detail') }}</summary>
            <section v-for="entry in costs" :key="entry.plan.id" class="entity-breakdown">
              <h3>{{ entry.name }}</h3>
              <template
                v-for="category in ['level', 'skill', 'talent', 'weapon'] as const"
                :key="category"
              >
                <div v-if="costEntries(entry.cost[category]).length" class="cost-category">
                  <h4>{{ t(`game.growth.${category}Cost`) }}</h4>
                  <dl>
                    <div v-for="[id, count] in costEntries(entry.cost[category])" :key="id">
                      <dt>
                        <OverviewArtwork :art="endfieldArt(id)" class="material-icon" />{{
                          materialName(id)
                        }}
                      </dt>
                      <dd>{{ number(count) }}</dd>
                    </div>
                  </dl>
                </div>
              </template>
              <p v-if="!costEntries(entry.cost.total).length" class="helper">
                {{ t('game.growth.noCost') }}
              </p>
            </section>
          </details>
        </template>
      </aside>
    </div>
    <details class="source-notes">
      <summary>{{ t('game.growth.source') }}</summary>
      <p>{{ t('game.growth.sourceNote') }}</p>
      <p>
        {{
          t('game.growth.dataVersion', {
            version: endfieldData.version,
            date: endfieldData.updatedAt,
          })
        }}
      </p>
      <div>
        <a
          href="https://game.skland.com/tools/endfield/cost-calculator"
          target="_blank"
          rel="noopener noreferrer"
          >{{ t('game.growth.official') }} ↗</a
        ><a
          href="https://github.com/cmyyx/cep/tree/286962b95408078ca91c99dece748d74166e74b1/src/generated"
          target="_blank"
          rel="noopener noreferrer"
          >{{ t('game.growth.dataSource') }} ↗</a
        >
      </div>
    </details>
    <el-dialog
      v-model="selecting"
      :title="t('game.growth.select')"
      :close-icon="CloseBold"
      width="760px"
      class="growth-select-dialog"
      append-to-body
      align-center
      :close-on-click-modal="false"
    >
      <div class="selection-filters">
        <input
          v-model="search"
          type="search"
          :placeholder="searchLabel"
          :aria-label="searchLabel"
        />
      </div>
      <details
        class="selection-filter-panel"
        :open="filtersExpanded"
        @toggle="filtersExpanded = ($event.target as HTMLDetailsElement).open"
      >
        <summary>
          {{ t('game.growth.filters') }}
          <span v-if="filterCount" class="active-filter-count">{{
            t('game.growth.activeFilters', { count: filterCount })
          }}</span>
        </summary>
        <div
          class="selection-filter-groups"
          :class="{ 'character-filter-groups': mode === 'characters' }"
        >
          <fieldset>
            <legend>{{ t('game.growth.starFilter') }}</legend>
            <div class="selection-filter-options rarity-options">
              <button
                v-for="value in mode === 'characters' ? [6, 5, 4] : [6, 5, 4, 3]"
                :key="value"
                type="button"
                :aria-label="t('game.growth.rarity', { count: value })"
                :aria-pressed="rarities.includes(value)"
                @click="toggleRarity(value)"
              >
                <GrowthFilterIcon kind="rarity" />
                <span>{{ value }}</span>
                <ElIcon v-if="rarities.includes(value)" class="filter-check"><Check /></ElIcon>
              </button>
            </div>
          </fieldset>
          <template v-if="mode === 'characters'">
            <fieldset
              v-for="group in characterFilterGroups"
              :key="group.kind"
              :class="`${group.kind}-options`"
            >
              <legend>{{ t(`game.growth.${group.kind}Group`) }}</legend>
              <div class="selection-filter-options">
                <button
                  v-for="option in group.options"
                  :key="option.value"
                  type="button"
                  :aria-pressed="
                    group.kind === 'element'
                      ? elements.includes(option.value)
                      : profession === option.value
                  "
                  @click="toggleCharacterFilter(group.kind, option.value)"
                >
                  <OverviewArtwork
                    :art="option.art"
                    :style="{ backgroundColor: option.background }"
                  />
                  <span>{{ option.label }}</span>
                  <ElIcon
                    v-if="
                      group.kind === 'element'
                        ? elements.includes(option.value)
                        : profession === option.value
                    "
                    class="filter-check"
                    ><Check
                  /></ElIcon>
                </button>
              </div>
            </fieldset>
          </template>
          <fieldset v-else>
            <legend>{{ t('game.growth.weaponTypeFilter') }}</legend>
            <div class="selection-filter-options">
              <button
                v-for="value in weaponTypeOrder"
                :key="value"
                type="button"
                :aria-pressed="weaponType === value"
                @click="weaponType = weaponType === value ? '' : value"
              >
                <GrowthFilterIcon :kind="value" />
                <span>{{ name(endfieldData.filters.weaponTypes[value]!) }}</span>
                <ElIcon v-if="weaponType === value" class="filter-check"><Check /></ElIcon>
              </button>
            </div>
          </fieldset>
        </div>
      </details>
      <p class="helper">{{ t('game.growth.limit') }}</p>
      <div class="selection-grid">
        <button
          v-for="entity in catalog"
          :key="entity.id"
          type="button"
          class="entity-choice"
          :class="{ chosen: pending.includes(entity.id) }"
          :aria-pressed="pending.includes(entity.id)"
          :aria-label="t('game.growth.selectionLabel', { name: name(entity.name) })"
          :disabled="pending.length >= 8 && !pending.includes(entity.id)"
          @click="toggle(entity.id)"
        >
          <span class="choice-portrait">
            <GrowthEntityAvatar :entity="entity" :kind="mode" />
            <span v-if="pending.includes(entity.id)" class="choice-check" aria-hidden="true">
              <ElIcon><Check /></ElIcon>
            </span>
          </span>
          <span class="choice-name">{{ name(entity.name) }}</span>
        </button>
      </div>
      <p v-if="!catalog.length" class="no-matches" role="status">
        {{ t('game.growth.noMatches') }}
      </p>
      <template #footer
        ><div class="selection-footer">
          <span>{{ t('game.growth.count', { count: pending.length }) }}</span
          ><DialogConfirmButton :disabled="!pending.length" @click="confirmSelection">{{
            t('game.growth.confirm')
          }}</DialogConfirmButton>
        </div></template
      >
    </el-dialog>
  </section>
</template>
<style scoped>
.material-icon {
  width: 28px;
  height: 28px;
  vertical-align: middle;
  border-radius: 4px;
  margin-right: 4px;
  background: transparent;
}
.overview-icon {
  width: 44px;
  height: 44px;
  align-self: center;
}
.converted-count {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-top: 4px;
}
.experience-inventory {
  font-size: 12px;
  margin: 14px 0;
}
.experience-inventory h4 {
  margin: 14px 0 8px;
}
.low-tier-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}
.low-tier-row > span:not(.overview-artwork) {
  flex: 1;
  min-width: 0;
}
.low-tier-row small {
  display: block;
  color: var(--muted);
  font-size: 10px;
}
.low-tier-row input {
  width: 78px;
  min-width: 0;
  padding: 7px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-background);
  color: var(--color-text);
  font: inherit;
  text-align: right;
}
.low-tier-row input:focus {
  border-color: var(--accent);
}
.target-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 16px 2px 4px;
}
.target-tabs button {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px;
  background: var(--color-background-soft);
  color: var(--color-text);
  text-align: left;
  font-size: 12px;
}
.target-tabs button[aria-pressed='true'] {
  border-color: var(--accent);
  background: var(--color-background-mute);
}
.target-tabs small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 10px;
}
.recent-history {
  margin-bottom: 20px;
  font-size: 13px;
}
.recent-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}
.recent-list button {
  display: grid;
  gap: 6px;
  text-align: left;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text);
}
.recent-list strong {
  font-weight: 500;
  overflow-wrap: anywhere;
}
.recent-list small {
  color: var(--muted);
}
.inventory-toggle {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 20px;
  font-size: 13px;
}
.inventory-toggle input {
  accent-color: var(--accent);
}
.overview-heading {
  font-size: 13px;
  margin: 20px 0 10px;
}
.resource-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 20px;
}
.resource-overview > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
  justify-content: space-between;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  border-radius: 6px;
  padding: 8px;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.resource-overview strong {
  color: var(--color-heading);
  font-size: 14px;
}

.growth-toolbar,
.section-heading,
.heading-actions,
.selection-footer,
.calculate-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.growth-toolbar {
  margin: 24px 0;
  flex-wrap: wrap;
}
.mode-switch {
  display: flex;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background-soft);
}
button {
  font: inherit;
  cursor: pointer;
}
.mode-switch button {
  background: transparent;
  border: 0;
  padding: 9px 19px;
  border-radius: 7px;
  color: var(--muted);
  font-size: 13px;
}
.mode-switch button[aria-pressed='true'] {
  background: var(--color-background);
  color: var(--accent);
  box-shadow: 0 1px 4px #0000000a;
}
.local-note,
.helper {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.8;
}
.helper {
  margin: 12px 0;
}
.growth-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}
.planning-column,
.result-column {
  min-width: 0;
}
.section-heading h2,
.result-heading h2 {
  margin: 0;
  font-size: 20px;
  color: var(--color-heading);
}
.section-heading h2 span {
  font-size: 12px;
  color: var(--muted);
  font-weight: 400;
  white-space: nowrap;
}
.heading-actions {
  gap: 0;
}
.plans {
  display: grid;
  gap: 16px;
}
.calculate-bar {
  margin-top: 20px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  box-shadow: 0 5px 22px #0000000a;
  font-size: 12px;
  color: var(--muted);
}
.result-column {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 22px;
  background: var(--color-background-soft);
  scroll-margin-top: 90px;
}
.result-heading .eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--accent);
}
.result-heading h2 {
  margin-top: 8px;
}
.result-placeholder {
  color: var(--muted);
  font-size: 13px;
  padding: 36px 0;
  line-height: 1.9;
}
.result-placeholder strong {
  color: var(--color-heading);
}
.resource-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.resource-table th,
.resource-table td {
  padding: 10px 3px;
  text-align: right;
  border-bottom: 1px solid var(--color-border);
  overflow-wrap: anywhere;
}
.resource-table th:first-child {
  text-align: left;
  width: 34%;
  font-weight: 500;
}
.resource-table thead {
  color: var(--muted);
  font-size: 11px;
}
.resource-table input {
  width: 100%;
  min-width: 0;
  padding: 6px 3px;
  font: inherit;
  color: var(--color-text);
  text-align: right;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-background);
  appearance: textfield;
}
.resource-table input::-webkit-inner-spin-button {
  appearance: none;
}
.resource-table td:last-child {
  color: var(--accent);
  font-weight: 650;
}
.resource-table td.satisfied {
  color: var(--muted);
}
.resource-table input:focus {
  border-color: var(--accent);
}
.cost-details {
  border-top: 1px solid var(--color-border);
  padding-top: 15px;
  margin-top: 22px;
  font-size: 12px;
}
summary {
  cursor: pointer;
}
.entity-breakdown {
  margin-top: 18px;
}
.entity-breakdown h3 {
  font-size: 14px;
  color: var(--color-heading);
}
.cost-category h4 {
  color: var(--muted);
  margin: 12px 0 5px;
  font-size: 11px;
}
.cost-category dl {
  margin: 0;
}
.cost-category dl > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 3px 0;
}
.cost-category dd {
  margin: 0;
}
.source-notes {
  margin: 26px 0 0;
  padding: 18px 0;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--muted);
  line-height: 1.8;
}
.source-notes > div {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.selection-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}
.selection-filters input {
  width: 100%;
  min-width: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: 7px;
  padding: 10px;
  font: inherit;
}
.selection-filters input:focus {
  border-color: var(--accent);
}
.selection-filter-panel {
  margin-top: 8px;
}
.selection-filter-panel > summary {
  width: fit-content;
  padding: 5px 0;
  cursor: pointer;
  color: var(--muted);
  font-size: 12px;
}
.selection-filter-panel > summary:hover,
.selection-filter-panel > summary:focus-visible,
.active-filter-count {
  color: var(--accent);
}
.active-filter-count {
  margin-left: 6px;
}
.selection-filter-groups {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  gap: 16px;
  margin-top: 12px;
}
.selection-filter-groups.character-filter-groups {
  grid-template-columns: minmax(0, 0.8fr) repeat(2, minmax(0, 1.2fr));
}
.selection-filter-groups fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.selection-filter-groups legend {
  padding: 0;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 12px;
}
.selection-filter-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.selection-filter-options button {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  min-height: 36px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: var(--color-background-mute);
  color: var(--color-text);
  font: inherit;
  font-size: 12px;
  text-align: left;
  overflow-wrap: anywhere;
}
.selection-filter-options button > svg {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
}
.selection-filter-options .overview-artwork {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  background: transparent;
}
.selection-filter-options :deep(.overview-artwork img) {
  width: 100%;
  height: 100%;
}
.selection-filter-options button:hover,
.selection-filter-options button:focus-visible {
  border-color: var(--accent);
}
.selection-filter-options button[aria-pressed='true'] {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--color-background));
  color: var(--accent);
}
.filter-check {
  flex: 0 0 12px;
  margin-left: auto;
}
.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 8px 4px;
  padding: 2px;
}
.entity-choice {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  justify-items: center;
  gap: 4px;
  border: 0;
  padding: 2px;
  background: transparent;
  color: var(--color-text);
  text-align: center;
}
.entity-choice:hover:not(:disabled) .choice-name,
.entity-choice:focus-visible .choice-name {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.entity-choice.chosen .choice-name {
  color: var(--accent);
}
.entity-choice:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.choice-name {
  min-width: 0;
  width: 100%;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.choice-portrait {
  position: relative;
  width: 48px;
  height: 48px;
}
.chosen .choice-portrait::after {
  content: '';
  position: absolute;
  inset: -2px;
  border: 2px solid var(--accent);
  border-radius: 7px;
  pointer-events: none;
}
.choice-check {
  position: absolute;
  top: -1px;
  right: -1px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 0 5px 0 3px;
  font-size: 15px;
  line-height: 1;
  background: var(--accent);
  color: var(--on-accent);
  pointer-events: none;
}
.selection-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  font-size: 12px;
}
.no-matches {
  padding: 30px 0;
  text-align: center;
  color: var(--muted);
}
@media (max-width: 1000px) {
  .growth-layout {
    grid-template-columns: 1fr;
  }
  .result-column {
    margin-top: 8px;
  }
  .resource-table th:first-child {
    width: 40%;
  }
}
@media (max-width: 600px) {
  .selection-filter-groups,
  .selection-filter-groups.character-filter-groups {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  .section-heading h2 {
    font-size: 17px;
  }
  .heading-actions :deep(.el-button) {
    padding: 9px;
  }
  .result-column {
    padding: 15px;
  }
  .resource-table {
    font-size: 11px;
  }
  .resource-table th:first-child {
    width: 32%;
  }
}
</style>
<style>
.el-dialog.growth-select-dialog {
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 24px);
  max-height: calc(100dvh - 24px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
}
.growth-select-dialog > .el-dialog__header,
.growth-select-dialog > .el-dialog__footer {
  flex-shrink: 0;
}
.growth-select-dialog > .el-dialog__body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}
.growth-calculator .target-tabs,
.growth-select-dialog > .el-dialog__body {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--muted) 35%, transparent) transparent;
}
.growth-calculator .target-tabs::-webkit-scrollbar,
.growth-select-dialog > .el-dialog__body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.growth-calculator .target-tabs::-webkit-scrollbar-track,
.growth-select-dialog > .el-dialog__body::-webkit-scrollbar-track {
  background: transparent;
}
.growth-calculator .target-tabs::-webkit-scrollbar-thumb,
.growth-select-dialog > .el-dialog__body::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--muted) 35%, transparent);
  border-radius: 6px;
}
.growth-calculator .target-tabs::-webkit-scrollbar-thumb:hover,
.growth-select-dialog > .el-dialog__body::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--muted) 60%, transparent);
}
</style>
