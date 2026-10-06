<script setup lang="ts">
import { computed } from 'vue'
import OperatorAvatar from '@/components/game/OperatorAvatar.vue'
import { endfieldPortraitBadge, endfieldArt } from '@/common/endfieldResources'

const props = defineProps<{
  icon?: string
  label: string
  square?: boolean
  element?: string
  ultimate?: boolean
}>()
const elementColor = computed(
  () => endfieldPortraitBadge('element', props.element ?? null)?.background,
)
</script>

<template>
  <span
    class="upgrade-icon"
    :class="{ square, elemental: elementColor, ultimate }"
    :style="{ '--upgrade-element': elementColor }"
  >
    <OperatorAvatar :name="label" :src="icon ? endfieldArt(icon)?.src : undefined" fit="contain" />
  </span>
</template>

<style scoped>
.upgrade-icon {
  display: grid;
  place-items: center;
  flex: 0 0 var(--upgrade-icon-size, 42px);
  width: var(--upgrade-icon-size, 42px);
  height: var(--upgrade-icon-size, 42px);
  border: 2px solid #ffffff70;
  border-radius: 50%;
  background: #606060;
  overflow: hidden;
}
.upgrade-icon.elemental {
  background: conic-gradient(
    from 120deg,
    var(--upgrade-element) 0deg 120deg,
    #606060 120deg 360deg
  );
}
.upgrade-icon.ultimate {
  background: var(--upgrade-element, #606060);
}
.upgrade-icon.square {
  border-radius: 7px;
}
.operator-avatar {
  width: 85%;
  height: 85%;
  color: white;
  border-radius: 0;
}
</style>
