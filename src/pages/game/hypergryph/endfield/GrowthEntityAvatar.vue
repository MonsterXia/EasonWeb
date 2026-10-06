<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import OperatorAvatar from '@/components/game/OperatorAvatar.vue'
import EndfieldOperatorPortrait from '@/components/game/EndfieldOperatorPortrait.vue'
import {
  endfieldData,
  endfieldRarityColor,
  endfieldArt,
  type GrowthEntity,
  type GrowthKind,
} from '@/common/endfieldResources'
import { operatorAvatar } from '@/common/operatorAvatars'

const props = defineProps<{ entity: GrowthEntity; kind: GrowthKind }>()
const { locale, t } = useI18n()
const language = computed(() => (locale.value === 'en' ? 'en' : 'zh-CN'))
const element = computed(
  () => endfieldData.filters.elements[props.entity.element ?? '']?.[language.value],
)
const profession = computed(
  () => endfieldData.filters.professions[props.entity.profession ?? '']?.[language.value],
)
</script>

<template>
  <EndfieldOperatorPortrait
    v-if="kind === 'characters'"
    :name="entity.name[language]"
    :src="operatorAvatar('endfield', entity.id, entity.avatar)"
    :rarity="entity.rarity"
    :element="element"
    :profession="profession"
  />
  <span
    v-else
    class="growth-weapon-portrait"
    :style="{ borderBottomColor: endfieldRarityColor(entity.rarity) }"
    :title="t('game.overview.rarity', { count: entity.rarity })"
  >
    <OperatorAvatar
      :name="entity.name[language]"
      :src="entity.avatar ?? endfieldArt(entity.id)?.src"
      fit="contain"
    />
  </span>
</template>

<style scoped>
.growth-weapon-portrait {
  display: block;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-bottom-width: 2px;
  border-radius: 5px;
}
.growth-weapon-portrait .operator-avatar {
  width: 100%;
  height: 100%;
  border-radius: 0;
}
</style>
