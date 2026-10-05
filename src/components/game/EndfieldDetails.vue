<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DisplaySection } from '@/common/overviewSections'
import { facilityArt } from '@/common/overviewAssets'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import OverviewArtwork from './OverviewArtwork.vue'
import OperatorAvatar from './OperatorAvatar.vue'

const props = defineProps<{ section: DisplaySection; resourceTime: number }>()
const { t } = useI18n()
const { number, date } = useOverviewFormat()
const isSpaceship = computed(() => props.section.key === 'endfieldSpaceship')
const isExploration = computed(() => props.section.key.startsWith('endfieldExploration'))
</script>

<template>
  <ul class="endfield-grid" :class="{ 'spaceship-grid': isSpaceship }">
    <li v-for="(item, index) in section.items" :key="item.id" class="endfield-card">
      <!-- Keep the media slot even after the entire fallback chain fails. -->
      <div class="card-art" aria-hidden="true">
        <OverviewArtwork class="facility-art" :art="facilityArt(section.key, item)" />
      </div>
      <div class="card-content">
        <header>
          <strong>{{
            item.nameKey
              ? t(`game.overview.facilityNames.${item.nameKey}`)
              : item.name || t('game.overview.slot', { index: index + 1 })
          }}</strong>
          <span v-if="item.level !== null || isSpaceship" class="facility-level"
            >{{ t('game.overview.facilityLevel', { level: number(item.level) })
            }}<template v-if="isSpaceship && item.maxLevel != null">
              / {{ number(item.maxLevel) }}</template
            ></span
          >
        </header>
        <p v-if="item.subtitle" class="facility-subtitle">{{ item.subtitle }}</p>
        <div class="card-facts">
          <p class="facility-value">
            <span>{{ t(`game.overview.sectionValues.${section.key}`) }}</span>
            <strong v-if="isExploration && item.total === 0">—</strong>
            <strong v-else>
              {{ number(item.current)
              }}<template v-if="item.total !== null"> / {{ number(item.total) }}</template>
            </strong>
          </p>
          <p v-if="item.rating" class="facility-rating">
            {{ t('game.overview.rating', { rating: item.rating }) }}
          </p>
          <p v-if="item.status !== 'unknown'" class="facility-status" :data-status="item.status">
            {{ t(`game.overview.statuses.${item.status}`) }}
          </p>
        </div>
        <template v-if="isSpaceship">
          <ul
            v-if="item.staff?.length"
            class="room-staff"
            :aria-label="t('game.overview.sectionValues.endfieldSpaceship')"
          >
            <li
              v-for="(member, staffIndex) in item.staff"
              :key="`${member.id}:${staffIndex}`"
              class="staff-member"
            >
              <OperatorAvatar
                :name="member.name || t('game.overview.unknownOperator')"
                :src="member.avatarUrl || undefined"
              />
              <span>{{ member.name || t('game.overview.unknownOperator') }}</span>
            </li>
          </ul>
          <p v-else class="staff-note">
            {{
              t(
                item.staff?.length === 0 || item.current === 0
                  ? 'game.overview.noStaff'
                  : 'game.overview.staffUnavailable',
              )
            }}
          </p>
        </template>
        <p v-if="item.completeAt && item.completeAt > resourceTime" class="metric-note">
          {{ t('game.overview.completes', { time: date(item.completeAt) }) }}
        </p>
        <p
          v-else-if="
            item.status === 'unknown' &&
            item.current === null &&
            item.level === null &&
            !item.subtitle &&
            !item.rating
          "
          class="metric-note"
        >
          {{ t('game.overview.missing') }}
        </p>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.endfield-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 8px;
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}
.endfield-card {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
}
.card-art {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 72px;
  pointer-events: none;
}
.card-art .facility-art {
  width: 100%;
  height: 72px;
  border-radius: 4px;
  background: transparent;
}
.card-art :deep(.cover img),
.card-art :deep(.landscape img) {
  object-fit: cover;
  mix-blend-mode: normal;
}
.card-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  overflow-wrap: anywhere;
}
header,
.card-facts,
.facility-value {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
}
header strong {
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-heading);
}
p {
  margin: 0;
}
.facility-level,
.facility-subtitle,
.facility-value,
.facility-status,
.facility-rating {
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted);
}
.card-facts {
  column-gap: 12px;
}
.facility-value strong {
  color: var(--color-heading);
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.facility-rating,
.facility-status[data-status='working'],
.facility-status[data-status='complete'] {
  color: var(--accent);
}
.metric-note {
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted);
  margin-top: auto;
}
.spaceship-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
}
.spaceship-grid .endfield-card {
  grid-template-columns: minmax(0, 1fr);
  min-height: 86px;
}
.spaceship-grid .card-content {
  justify-content: flex-start;
}
.spaceship-grid .card-art {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  min-height: 0;
  opacity: 0.16;
  z-index: -1;
}
.spaceship-grid .facility-art {
  height: 100%;
  border-radius: 0;
}
.room-staff {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}
.staff-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 56px;
  text-align: center;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.4;
}
.staff-member .operator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.staff-note {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
}
@media (max-width: 600px) {
  .endfield-card {
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 10px;
    padding: 10px;
  }
  .spaceship-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  }
}
</style>
