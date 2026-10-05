<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { CircleCheck, Clock, ArrowRight } from '@element-plus/icons-vue'
import type { WarEchoesDifficulty } from '@/common/api/gameOverview'
import { useOverviewFormat } from '@/composables/useOverviewFormat'
import { endfieldPlainText } from '@/common/endfieldText'
import { officialArtworkUrl } from '@/common/officialArtwork'
import { endfieldRarityColor } from '@/common/overviewAssets'
import emptyPortraitIcon from '@/assets/skland/ef-record-empty.png'
import OperatorAvatar from './OperatorAvatar.vue'
import EndfieldPortraitBadges from './EndfieldPortraitBadges.vue'
import EndfieldOperatorFacts from './EndfieldOperatorFacts.vue'
import OverviewArtwork from './OverviewArtwork.vue'
import OverviewReveal from './OverviewReveal.vue'
const props = withDefaults(
  defineProps<{
    challenge?: WarEchoesDifficulty | null
    name?: string | null
    hard?: boolean
    mode?: 'war' | 'monolith'
  }>(),
  { name: null, hard: false, mode: 'monolith' },
)
const { t } = useI18n()
const { number, date } = useOverviewFormat()
const panel = ref<'enemies' | 'mechanics' | 'team' | null>(null)
const record = computed(() => props.challenge?.record)
const team = computed(() => record.value?.team ?? [])
const slots = computed(() =>
  Array.from({ length: Math.max(4, team.value.length) }, (_, i) => team.value[i] ?? null),
)
const title = computed(() => {
  const name = props.challenge?.name || props.name || t('game.overview.missing')
  const difficulty =
    props.mode === 'war' && props.challenge
      ? t(`game.overview.war.${props.challenge.difficulty}`)
      : props.hard
        ? t('game.overview.monolith.hard')
        : null
  return difficulty && !name.includes(difficulty) ? `${name} · ${difficulty}` : name
})
const duration = computed(() => {
  const seconds = record.value?.durationSeconds
  return seconds == null
    ? '—'
    : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
})
type Member = NonNullable<NonNullable<WarEchoesDifficulty['record']>['team']>[number]
const memberLabel = (member: Member) =>
  [
    member.name || t('game.overview.unknownOperator'),
    t('game.overview.operatorLevel', { level: number(member.level) }),
    t('game.overview.war.phase', { n: number(member.phase) }),
    t('game.overview.war.potential', { n: number(member.potential) }),
    member.element,
    t('game.overview.monolith.teamDetails'),
  ]
    .filter(Boolean)
    .join(' · ')
const toggle = (value: typeof panel.value) => {
  panel.value = panel.value === value ? null : value
}
</script>
<template>
  <div class="endfield-record-card" :class="{ cleared: challenge?.isPassed }">
    <header class="record-heading">
      <div class="record-identity">
        <h4>
          <ElIcon v-if="challenge?.isPassed" :aria-label="t('game.overview.war.passed')"
            ><CircleCheck /></ElIcon
          >{{ title }}
        </h4>
        <p v-if="record" class="record-date">{{ date(record.recordedAt) }}</p>
      </div>
      <span
        v-if="record"
        class="record-time"
        :aria-label="`${t('game.overview.war.duration')} ${duration}`"
        ><ElIcon><Clock /></ElIcon>{{ duration }}</span
      >
      <span v-else class="record-empty">{{
        t(
          challenge?.isPassed === false
            ? 'game.overview.war.noRecord'
            : 'game.overview.war.recordUnavailable',
        )
      }}</span>
    </header>
    <div class="record-body">
      <nav class="record-actions" :aria-label="t('game.overview.war.challengeDetails')">
        <button :aria-expanded="panel === 'enemies'" @click="toggle('enemies')">
          {{ t('game.overview.monolith.enemies')
          }}<ElIcon :class="{ expanded: panel === 'enemies' }"><ArrowRight /></ElIcon>
        </button>
        <button :aria-expanded="panel === 'mechanics'" @click="toggle('mechanics')">
          {{ t('game.overview.monolith.feature')
          }}<ElIcon :class="{ expanded: panel === 'mechanics' }"><ArrowRight /></ElIcon>
        </button>
      </nav>
      <ul class="record-team" :aria-label="t('game.overview.monolith.teamDetails')">
        <li v-for="(member, index) in slots" :key="index" :class="{ 'empty-slot': !member }">
          <button
            v-if="member"
            class="member-portrait"
            :style="{ '--member-rarity': endfieldRarityColor(member.rarity) }"
            :title="memberLabel(member)"
            :aria-label="memberLabel(member)"
            :aria-expanded="panel === 'team'"
            @click="toggle('team')"
          >
            <OperatorAvatar
              :name="member.name || t('game.overview.unknownOperator')"
              :src="member.avatarUrl || undefined"
            />
            <EndfieldPortraitBadges
              :level="member.level"
              :element="member.element"
              :potential="member.potential"
            />
          </button>
          <span
            v-else
            class="empty-portrait"
            :aria-label="
              t(record ? 'game.overview.war.teamUnavailable' : 'game.overview.war.noRecord')
            "
            ><span
              class="empty-slot-icon"
              :style="{ maskImage: `url(${emptyPortraitIcon})` }"
              aria-hidden="true"
            />
          </span>
        </li>
      </ul>
    </div>
    <OverviewReveal :expanded="panel !== null" :visible-count="0">
      <div
        class="record-detail"
        :class="{ 'overview-reveal-hidden': panel === null }"
        :aria-hidden="panel === null"
        :inert="panel === null"
      >
        <template v-if="panel === 'enemies'">
          <h5>{{ t('game.overview.monolith.enemies') }}</h5>
          <ul v-if="challenge?.enemies?.length" class="enemies">
            <li v-for="enemy in challenge.enemies" :key="enemy.id">
              <OverviewArtwork
                :art="
                  officialArtworkUrl(enemy.artworkUrl)
                    ? { src: officialArtworkUrl(enemy.artworkUrl)!, tone: 'color', kind: 'icon' }
                    : undefined
                "
              />
              <div>
                <strong>{{ enemy.name || t('game.overview.missing') }}</strong
                ><span> Lv. {{ number(enemy.level) }}</span>
                <p v-if="enemy.description">{{ endfieldPlainText(enemy.description) }}</p>
                <p v-if="enemy.ability">{{ endfieldPlainText(enemy.ability) }}</p>
              </div>
            </li>
          </ul>
          <p v-else>
            {{
              t(
                challenge?.enemies?.length === 0
                  ? 'game.overview.war.noEnemies'
                  : 'game.overview.missing',
              )
            }}
          </p>
        </template>
        <template v-else-if="panel === 'mechanics'">
          <h5>{{ t('game.overview.monolith.feature') }}</h5>
          <dl>
            <dt>{{ t('game.overview.war.challengeName') }}</dt>
            <dd>{{ challenge?.name || name || t('game.overview.missing') }}</dd>
            <template v-if="mode === 'war'">
              <template v-if="challenge?.plusTask != null">
                <dt>{{ t('game.overview.war.bonus') }}</dt>
                <dd>
                  {{
                    t(
                      challenge.plusTask
                        ? 'game.overview.war.bonusDone'
                        : 'game.overview.war.bonusPending',
                    )
                  }}
                </dd>
              </template>
              <dt>{{ t('game.overview.war.firstPass') }}</dt>
              <dd>{{ date(challenge?.firstPassAt ?? null) }}</dd>
              <dt>{{ t('game.overview.war.target') }}</dt>
              <dd>{{ endfieldPlainText(challenge?.target) || t('game.overview.missing') }}</dd>
            </template>
            <dt>{{ t('game.overview.war.recommendLevel') }}</dt>
            <dd>{{ number(challenge?.recommendLevel ?? null) }}</dd>
            <dt>{{ t('game.overview.war.description') }}</dt>
            <dd>{{ endfieldPlainText(challenge?.description) || t('game.overview.missing') }}</dd>
            <dt>{{ t('game.overview.monolith.feature') }}</dt>
            <dd>{{ endfieldPlainText(challenge?.feature) || t('game.overview.missing') }}</dd>
          </dl>
        </template>
        <template v-else-if="panel === 'team'">
          <h5>{{ t('game.overview.monolith.teamDetails') }}</h5>
          <ul class="team-details">
            <li v-for="(member, index) in team" :key="index">
              <strong>{{ member.name || t('game.overview.unknownOperator') }}</strong>
              <EndfieldOperatorFacts
                :level="member.level"
                :phase="member.phase"
                :rarity="member.rarity"
                :potential="member.potential"
                :element="member.element"
              />
            </li>
          </ul>
        </template>
      </div>
    </OverviewReveal>
  </div>
</template>
<style scoped>
.endfield-record-card {
  min-width: 0;
}
.record-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.record-identity {
  min-width: 0;
}
h4 {
  margin: 0;
  font-size: 15px;
  line-height: 1.45;
  color: var(--color-heading);
  overflow-wrap: anywhere;
}
h4 .el-icon {
  vertical-align: -2px;
  margin-right: 5px;
}
.record-date {
  display: inline-block;
  margin: 5px 0 0;
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--color-background-soft);
  color: var(--muted);
  font-size: 11px;
}
.record-time {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  color: var(--color-heading);
}
.record-empty {
  color: var(--muted);
  font-size: 11px;
  text-align: right;
}
.record-body {
  display: grid;
  grid-template-columns: minmax(80px, 1fr) minmax(0, 292px);
  gap: 16px;
  align-items: end;
  margin-top: 18px;
}
.record-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 9px;
}
.record-actions button {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  cursor: pointer;
  text-align: left;
}
.record-actions button:hover,
.record-actions button[aria-expanded='true'] {
  color: var(--accent);
}
.record-actions .el-icon {
  transition: transform 260ms ease;
}
.record-actions .expanded {
  transform: rotate(90deg);
}
.record-team {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.record-team li {
  min-width: 0;
}
.member-portrait,
.empty-portrait {
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-background-soft);
}
.member-portrait {
  cursor: pointer;
  border-bottom: 2px solid var(--member-rarity, var(--color-border));
}
.member-portrait .operator-avatar {
  width: 100%;
  height: 100%;
  border-radius: 0;
}
.empty-portrait {
  place-items: center;
  color: var(--muted);
}
.empty-slot-icon {
  width: 34%;
  aspect-ratio: 1;
  background: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}
.member-portrait:focus-visible {
  border-color: var(--accent);
  border-bottom-color: var(--member-rarity, var(--color-border));
}
.record-actions button:focus-visible {
  text-decoration: underline;
}
.record-detail {
  padding-top: 14px;
  color: var(--muted);
  overflow-wrap: anywhere;
}
.record-detail::before {
  content: '';
  display: block;
  border-top: 1px solid var(--color-border);
  margin-bottom: 12px;
}
h5 {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--color-heading);
}
.enemies,
.team-details {
  padding: 0;
  margin: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}
.enemies li {
  display: flex;
  gap: 10px;
}
.enemies .overview-artwork {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  background: transparent;
}
.enemies p {
  margin: 5px 0;
  white-space: pre-line;
}
.team-details {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.team-details li {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.team-details strong {
  color: var(--color-heading);
}
dl {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px 12px;
  margin: 0;
}
dd {
  margin: 0;
  white-space: pre-line;
}
@media (max-width: 420px) {
  .record-body {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 8px;
  }
  .record-team {
    gap: 4px;
  }
  .record-time {
    font-size: 13px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .record-actions .el-icon {
    transition: none;
  }
}
</style>
