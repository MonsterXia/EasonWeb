<template>
  <svg class="sakura-blossom" viewBox="-28 -28 56 56" aria-hidden="true" focusable="false">
    <g v-for="angle in [0, 72, 144, 216, 288]" :key="angle" :transform="`rotate(${angle})`">
      <path class="petal" d="M0-3C-5-7-12-13-9-20C-7-25-2-24 0-21C2-24 7-25 9-20C12-13 5-7 0-3Z" />
      <path class="stamen" d="M0-2V-12M0-8L-3-11M0-8L3-11" />
      <circle class="pollen" cy="-12" r="1" />
    </g>
    <circle class="pollen" r="2.5" />
  </svg>
</template>

<style scoped>
.sakura-blossom {
  display: inline-block;
  width: 1em;
  height: 1em;
  flex: none;
  overflow: visible;
  pointer-events: none;
}
.petal {
  fill: color-mix(in srgb, var(--sakura) 72%, var(--color-background-soft));
  stroke: color-mix(in srgb, var(--accent) 45%, transparent);
  stroke-width: 0.7;
}
.stamen {
  fill: none;
  stroke: var(--accent);
  stroke-width: 0.6;
  stroke-linecap: round;
  opacity: 0.55;
}
.pollen {
  fill: var(--accent);
}
</style>
