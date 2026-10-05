<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import type { RegionalDevelopment } from '@/common/api/gameOverview'
import { developmentArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'
import OverviewReveal from './OverviewReveal.vue'
import OperatorAvatar from './OperatorAvatar.vue'
defineProps<{ data: RegionalDevelopment }>()
const { t } = useI18n()
const { number } = useOverviewFormat()
const expanded = ref<Record<string, boolean>>({})
const id = useId()
const currency = (id: string) =>
  t(
    `game.overview.development.${id === 'domain_1' ? 'valleyBills' : id === 'domain_2' ? 'wulingBills' : 'bills'}`,
  )
</script>
<template>
  <div class="development">
    <article v-for="region in data.regions" :key="region.id" class="region-card">
      <div class="region-heading">
        <header>
          <OverviewArtwork :art="developmentArt(`build-${region.id}`)" />
          <strong>{{ region.name || t('game.overview.missing') }}</strong>
          <span>Lv. {{ number(region.level) }}</span>
        </header>
        <p class="balance">
          <OverviewArtwork :art="developmentArt(`bill-${region.id}`)" />
          <span>{{ currency(region.id) }}</span>
          <strong>{{ number(region.money) }} / {{ number(region.moneyMax) }}</strong>
        </p>
      </div>
      <ul v-if="region.settlements?.length" :id="`${id}-${region.id}`" class="settlements">
        <li
          v-for="item in region.settlements"
          :key="item.id"
          class="settlement"
          :data-locked="item.unlocked === false"
        >
          <header>
            <strong>{{ item.name || t('game.overview.missing') }}</strong>
            <span v-if="item.unlocked === false">{{ t('game.overview.development.locked') }}</span>
            <span v-else>Lv. {{ number(item.level) }}</span>
          </header>
          <OverviewReveal :expanded="!!expanded[region.id]" :visible-count="0">
            <div
              :inert="!expanded[region.id]"
              :aria-hidden="!expanded[region.id]"
              :class="{ 'overview-reveal-hidden': !expanded[region.id] }"
            >
              <div class="settlement-content">
                <div v-if="item.officer" class="officer">
                  <OperatorAvatar
                    :name="item.officer.name || t('game.overview.unknownOperator')"
                    :src="item.officer.avatarUrl || undefined"
                  />
                  <div>
                    <span>{{ t('game.overview.development.officer') }}</span
                    ><strong>{{ item.officer.name || t('game.overview.unknownOperator') }}</strong>
                  </div>
                </div>
                <p v-else class="muted">
                  {{
                    t(
                      item.unlocked === false
                        ? 'game.overview.development.locked'
                        : 'game.overview.staffUnavailable',
                    )
                  }}
                </p>
                <div class="settlement-facts">
                  <p>
                    <span>{{ t('game.overview.development.experience') }}</span
                    ><strong v-if="item.isMaxLevel === true">MAX</strong
                    ><strong v-else
                      >{{ number(item.experience) }} / {{ number(item.experienceMax) }}</strong
                    >
                  </p>
                  <p>
                    <OverviewArtwork
                      class="stock-icon"
                      :art="
                        developmentArt(
                          item.money !== null && item.money > 0 ? 'stock-full' : 'stock-empty',
                        )
                      "
                    /><span>{{ t('game.overview.development.stock') }}</span
                    ><strong>{{ number(item.money) }} / {{ number(item.moneyMax) }}</strong>
                  </p>
                </div>
              </div>
            </div>
          </OverviewReveal>
        </li>
      </ul>
      <p v-else class="muted">
        {{
          t(
            region.settlements === null
              ? 'game.overview.missing'
              : 'game.overview.development.noSettlements',
          )
        }}
      </p>
      <button
        v-if="region.settlements?.length"
        class="reveal-button"
        :aria-expanded="!!expanded[region.id]"
        :aria-controls="`${id}-${region.id}`"
        @click="expanded[region.id] = !expanded[region.id]"
      >
        {{ t(expanded[region.id] ? 'game.overview.showLess' : 'game.overview.more') }}
        <ElIcon :class="{ expanded: expanded[region.id] }"><ArrowDown /></ElIcon>
      </button>
    </article>
    <p v-if="!data.regions.length" class="muted">{{ t('game.overview.development.noRegions') }}</p>
  </div>
</template>
<style scoped>
.development {
  display: grid;
  gap: 12px;
  margin-top: 12px;
  min-width: 0;
  font-size: 12px;
}
.region-card {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  min-width: 0;
  overflow-wrap: anywhere;
}
header,
.balance {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}
header strong {
  font-size: 14px;
  color: var(--color-heading);
}
header span,
.muted,
.balance,
.settlement-facts span {
  color: var(--muted);
}
.overview-artwork {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  background: transparent;
}
.balance .overview-artwork {
  width: 28px;
  flex-basis: 28px;
}
.balance strong,
.settlement-facts strong {
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
}
p {
  margin: 8px 0;
}
ul {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
}
.region-heading {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 4px 24px;
}
.reveal-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 6px;
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
.settlements {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 12px 24px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
.settlement {
  min-width: 0;
}
.settlement header strong {
  font-size: 13px;
}
.settlement-content {
  display: grid;
  gap: 12px;
  padding: 12px 0 6px;
}
.officer {
  display: flex;
  align-items: center;
  gap: 8px;
}
.officer .operator-avatar {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 50%;
}
.officer > div {
  display: grid;
  gap: 2px;
}
.officer span {
  font-size: 11px;
  color: var(--muted);
}
.settlement-facts {
  display: grid;
  gap: 6px;
}
.settlement-facts p {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
}
.stock-icon {
  width: 12px;
  height: 16px;
  flex-basis: 12px;
}
@media (prefers-reduced-motion: reduce) {
  .reveal-button .el-icon {
    transition: none;
  }
}
</style>
