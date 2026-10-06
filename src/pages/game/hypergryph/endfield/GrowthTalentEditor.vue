<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElDialog, ElIcon } from 'element-plus'
import { Check, EditPen, CloseBold } from '@element-plus/icons-vue'
import { entityFor, setTalent, type GrowthPlan, type LocalName } from '@/common/endfieldGrowth'
import { endfieldArt } from '@/common/endfieldResources'
import OverviewArtwork from '@/components/game/OverviewArtwork.vue'
import GrowthUpgradeIcon from './GrowthUpgradeIcon.vue'

const props = defineProps<{ plan: GrowthPlan }>()
const { t, locale } = useI18n()
const editing = ref(false)
const side = ref<'current' | 'target'>('target')
const entity = computed(() => entityFor(props.plan))
const name = (value: LocalName) => value[locale.value === 'en' ? 'en' : 'zh-CN']
type Node = ReturnType<typeof entityFor>['nodes'][number]
const branches = computed(() => {
  const groups = new Map<string, { name: LocalName; group: string; nodes: Node[] }>()
  for (const group of ['attribute', 'talent', 'logistics']) {
    for (const node of entity.value.nodes.filter((node) => node.group === group)) {
      const key = group === 'attribute' ? `${group}:${node.name['zh-CN']}` : node.chain
      if (!groups.has(key))
        groups.set(key, {
          name: {
            'zh-CN': node.name['zh-CN'].replace(/·[αβγδ]$/, ''),
            en: node.name.en.replace(/ [αβγδ]$/, ''),
          },
          group,
          nodes: [],
        })
      groups.get(key)!.nodes.push(node)
    }
  }
  return [...groups.values()].map((branch) => ({
    ...branch,
    nodes: branch.nodes.sort((a, b) => a.stage - b.stage),
  }))
})
const summaryNodes = computed(() =>
  branches.value.flatMap((branch) => branch.nodes).filter((node) => status(node.id) !== 'none'),
)
const eligible = computed(() =>
  entity.value.nodes.filter(
    (node) =>
      node.stage <= (side.value === 'current' ? props.plan.currentStage : props.plan.targetStage),
  ),
)
const allSelected = computed(
  () => eligible.value.length > 0 && eligible.value.every((node) => selected(node.id)),
)
function status(id: string) {
  return props.plan.ownedNodes.includes(id)
    ? 'owned'
    : props.plan.targetNodes.includes(id)
      ? 'planned'
      : 'none'
}
function selected(id: string) {
  return side.value === 'current' ? status(id) === 'owned' : status(id) !== 'none'
}
function disabled(node: Node) {
  return (
    node.stage > (side.value === 'current' ? props.plan.currentStage : props.plan.targetStage) ||
    (side.value === 'target' && status(node.id) === 'owned')
  )
}
function toggle(node: Node) {
  if (!disabled(node))
    setTalent(
      props.plan,
      node.id,
      selected(node.id) ? 'none' : side.value === 'current' ? 'owned' : 'planned',
    )
}
function toggleAll() {
  const remove = allSelected.value
  for (const node of eligible.value) {
    if (!disabled(node))
      setTalent(
        props.plan,
        node.id,
        remove ? 'none' : side.value === 'current' ? 'owned' : 'planned',
      )
  }
}
function clearPlanned() {
  props.plan.preset = 'custom'
  props.plan.targetNodes = []
}
function open() {
  side.value = 'target'
  editing.value = true
}
function nodeLabel(node: Node) {
  return `${name(node.name)} · ${t('game.growth.talentStage', { stage: node.stage })}`
}
function statusLabel(id: string) {
  return t(`game.growth.${status(id) === 'none' ? 'notSelected' : status(id)}`)
}
watch(
  () => props.plan.id,
  () => {
    editing.value = false
  },
)
</script>

<template>
  <section v-if="entity.nodes.length" class="talent-section">
    <div class="talent-heading">
      <h4>{{ t('game.growth.talents') }}</h4>
      <button type="button" class="edit-talents" @click="open">
        <ElIcon><EditPen /></ElIcon>{{ t('game.growth.editTalents') }}
      </button>
    </div>
    <div class="talent-preview">
      <span
        v-for="node in summaryNodes"
        :key="node.id"
        class="preview-node"
        :class="status(node.id)"
        :title="`${nodeLabel(node)} · ${statusLabel(node.id)}`"
      >
        <GrowthUpgradeIcon
          :icon="node.icon"
          :label="name(node.name)"
          :square="node.group === 'logistics'"
        />
        <span class="node-rank">{{ node.rank }}</span>
      </span>
      <span v-if="!summaryNodes.length" class="talent-empty">{{ t('game.growth.noTalents') }}</span>
    </div>
    <ElDialog
      v-model="editing"
      :title="t('game.growth.chooseTalents')"
      :close-icon="CloseBold"
      width="760px"
      class="growth-select-dialog growth-talent-dialog"
      append-to-body
      align-center
      :close-on-click-modal="false"
    >
      <div class="talent-toolbar">
        <div class="talent-side" :aria-label="t('game.growth.talentEditingSide')">
          <button type="button" :aria-pressed="side === 'current'" @click="side = 'current'">
            {{ t('game.growth.current') }}
          </button>
          <button type="button" :aria-pressed="side === 'target'" @click="side = 'target'">
            {{ t('game.growth.target') }}
          </button>
        </div>
        <div class="talent-actions">
          <button
            type="button"
            class="select-all"
            :aria-pressed="allSelected"
            :disabled="!eligible.length"
            @click="toggleAll"
          >
            <ElIcon><Check /></ElIcon>{{ t('game.growth.selectAll') }}
          </button>
          <ElButton text @click="clearPlanned">{{ t('game.growth.clearTalents') }}</ElButton>
        </div>
      </div>
      <p class="talent-hint">
        {{
          t(side === 'current' ? 'game.growth.currentTalentsHint' : 'game.growth.targetTalentsHint')
        }}
      </p>
      <div class="talent-branches">
        <div
          v-for="branch in branches"
          :key="branch.nodes[0]!.id"
          class="talent-branch"
          :class="{ independent: branch.group === 'attribute' }"
        >
          <div class="branch-label">
            <OverviewArtwork class="branch-icon" :art="endfieldArt(`group-${branch.group}`)" />
            <span class="branch-copy">
              <small>{{ t(`game.growth.talentGroups.${branch.group}`) }}</small>
              <strong>{{ name(branch.name) }}</strong>
            </span>
          </div>
          <div class="branch-nodes">
            <div v-for="node in branch.nodes" :key="node.id" class="node-step">
              <button
                type="button"
                class="talent-node"
                :class="status(node.id)"
                :data-node="node.id"
                :aria-label="nodeLabel(node)"
                :aria-pressed="selected(node.id)"
                :title="`${nodeLabel(node)} · ${statusLabel(node.id)}`"
                :disabled="disabled(node)"
                @click="toggle(node)"
              >
                <GrowthUpgradeIcon
                  :icon="node.icon"
                  :label="name(node.name)"
                  :square="node.group === 'logistics'"
                />
                <span class="node-rank">{{ node.rank }}</span>
                <span v-if="selected(node.id)" class="node-check" aria-hidden="true"
                  ><ElIcon><Check /></ElIcon
                ></span>
              </button>
              <small>{{ t('game.growth.talentStage', { stage: node.stage }) }}</small>
            </div>
          </div>
        </div>
      </div>
      <p class="talent-hint">{{ t('game.growth.talentChainNote') }}</p>
    </ElDialog>
  </section>
</template>

<style scoped>
.talent-section {
  margin-top: 18px;
}
.talent-heading,
.talent-toolbar,
.talent-side,
.talent-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.talent-heading,
.talent-toolbar {
  justify-content: space-between;
}
.talent-heading h4 {
  margin: 0;
  border-left: 3px solid var(--accent);
  padding-left: 8px;
  font-size: 14px;
  color: var(--color-heading);
}
button:not(.el-button) {
  cursor: pointer;
  font: inherit;
  color: var(--color-text);
}
.edit-talents,
.select-all {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  padding: 5px 0;
  background: transparent;
  font-size: 12px;
}
button:not(.el-button):hover:not(:disabled),
button:not(.el-button):focus-visible {
  color: var(--accent);
}
.talent-preview {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  width: 100%;
  margin-top: 10px;
  padding: 10px;
  border: 0;
  border-radius: 6px;
  background: var(--color-background-mute);
  scrollbar-width: thin;
  scrollbar-color: var(--muted) transparent;
}
.preview-node {
  position: relative;
  flex-shrink: 0;
  --upgrade-icon-size: 34px;
}
.talent-empty,
.talent-hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}
.talent-side {
  gap: 0;
}
.talent-side button {
  border: 1px solid var(--color-border);
  background: transparent;
  padding: 6px 14px;
  font-size: 12px;
}
.talent-side button:first-child {
  border-radius: 6px 0 0 6px;
}
.talent-side button:last-child {
  border-radius: 0 6px 6px 0;
}
.talent-side button[aria-pressed='true'],
.select-all[aria-pressed='true'] {
  color: var(--accent);
}
.talent-side button[aria-pressed='true'] {
  background: var(--color-background-mute);
  border-color: var(--accent);
}
.talent-branches {
  display: grid;
  gap: 6px;
}
.talent-branch {
  display: grid;
  grid-template-columns: minmax(0, 140px) minmax(0, 1fr);
  background: var(--color-background-mute);
  border-radius: 6px;
}
.branch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: color-mix(in srgb, var(--muted) 5%, transparent);
  overflow-wrap: anywhere;
}
.branch-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #555;
}
.branch-icon :deep(img) {
  width: 100%;
  height: 100%;
}
.branch-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.branch-label small {
  font-size: 10px;
  color: var(--muted);
}
.branch-label strong {
  font-size: 13px;
  color: var(--color-heading);
}
.branch-nodes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  align-items: start;
  padding: 12px;
}
.node-step {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 6px;
  min-width: 0;
}
.node-step:not(:first-child)::before {
  content: '';
  position: absolute;
  top: 24px;
  right: calc(50% + 23px);
  width: calc(100% - 38px);
  border-top: 1px dashed var(--muted);
}
.independent .node-step::before {
  display: none;
}
.node-step > small {
  font-size: 10px;
  color: var(--muted);
  text-align: center;
}
.talent-node {
  position: relative;
  border: 2px solid transparent;
  border-radius: 50%;
  padding: 2px;
  background: transparent;
  --upgrade-icon-size: 42px;
}
.talent-node:has(.square) {
  border-radius: 9px;
}
.talent-node.planned,
.talent-node.owned,
.talent-node:focus-visible {
  border-color: var(--accent);
}
.owned :deep(.upgrade-icon:not(.square)) {
  background: var(--accent);
}
.talent-node:not(.owned) :deep(.upgrade-icon.square img),
.preview-node:not(.owned) :deep(.upgrade-icon.square img) {
  filter: grayscale(1);
}
.talent-node:disabled {
  cursor: default;
}
.talent-node:disabled:not(.owned) {
  opacity: 0.35;
}
.node-rank {
  position: absolute;
  right: -3px;
  bottom: -3px;
  min-width: 13px;
  padding: 0 2px;
  border-radius: 3px;
  background: var(--color-background);
  color: var(--color-heading);
  font-size: 10px;
  line-height: 1.4;
  text-align: center;
}
.node-check {
  position: absolute;
  top: -3px;
  right: -3px;
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 13px;
}
.talent-toolbar {
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.talent-actions {
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.talent-actions > .el-button {
  font-size: 12px;
  padding-inline: 8px;
}
@media (max-width: 480px) {
  .talent-branch {
    grid-template-columns: minmax(0, 1fr);
  }
  .branch-label {
    padding: 8px 10px;
  }
  .branch-nodes {
    padding: 10px;
    gap: 6px;
  }
}
</style>
