<!-- Official Endfield home title icons: bn (realtime / ks), yn (operators / ao).
     Source: https://assets.skland.com/_static_assets/game-tools/GameData-CKtD4-ed.js
     Module SHA-256: cb36ceb2a3756fa5b12cc6df5f6da88e4a7847da2d0252ab129b01e3ac1cbf32
     Original paths preserved; currentColor adapts the official monochrome ink. -->
<script setup lang="ts">
defineProps<{ kind: 'daily' | 'operators' }>()
</script>
<template>
  <svg class="endfield-title-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      v-if="kind === 'daily'"
      d="M5.52515 16.9684H2.80054V11.2048H5.52515V16.9684ZM9.41675 16.9684H6.69214V12.2429H9.41675V16.9684ZM13.3083 16.9684H10.5847V10.3034H13.3083V16.9684ZM17.2009 16.9684H14.4763V7.66083H17.2009V16.9684ZM17.2009 6.38544H15.2029V5.25165L11.0066 9.26532L8.60913 6.97235L5.62573 9.82587H2.80054L8.60913 4.26923L11.0066 6.56317L13.7898 3.90009H12.6052V1.98895H17.2009V6.38544Z"
    />
    <g v-else>
      <path
        d="M13.9784 13.235L13.973 13.2296V18.1928H6.01621V13.2529L9.9787 17.2154L13.9683 13.225L11.984 11.2406L13.9784 9.24618V13.235Z"
      />
      <path d="M5.98673 13.2692L2.84497 16.4102L0.851318 14.4165L3.9923 11.2755L5.98673 13.2692Z" />
      <path d="M19.1487 14.4165L17.1551 16.4102L14.0133 13.2692L16.0078 11.2755L19.1487 14.4165Z" />
      <path d="M8.01607 11.2406L6.02164 13.235V9.24618L8.01607 11.2406Z" />
      <path d="M7.16974 8.09808L4.04582 11.222L3.42601 10.603L6.54992 7.47904L7.16974 8.09808Z" />
      <path d="M16.5741 10.603L15.9542 11.222L12.8303 8.09808L13.4501 7.47904L16.5741 10.603Z" />
      <path d="M13.8644 5.14328L10.0051 9.0026L6.14576 5.14328L10.0051 1.28397L13.8644 5.14328Z" />
    </g>
  </svg>
</template>
<style scoped>
.endfield-title-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  color: var(--color-heading);
}
</style>
