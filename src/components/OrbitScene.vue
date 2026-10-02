<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SakuraBlossom from './SakuraBlossom.vue'

const { t } = useI18n()
</script>

<template>
  <div class="orbit-scene" aria-hidden="true">
    <div class="coordinate coordinate-top">
      E / 001 <span>{{ t('home.orbit.explore') }}</span>
    </div>
    <div class="orbit-stage">
      <div class="orbit-glow" />
      <div class="starfield">
        <i
          v-for="n in 18"
          :key="n"
          :style="{
            '--x': `${((n * 37) % 96) + 2}%`,
            '--y': `${((n * 23) % 86) + 7}%`,
            '--delay': `${n * -0.7}s`,
          }"
        />
      </div>
      <div class="orbital-halo" />
      <div class="orbital-scale" />
      <div class="orbit-traveler traveler-one"><i /></div>
      <div class="orbit-traveler traveler-two"><i /></div>
      <div class="orbit-ring ring-one" />
      <div class="orbit-ring ring-two" />
      <div class="orbit-ring ring-three" />
      <div class="planet">
        <div class="planet-grid" />
        <span class="planet-letter">e<span>✦</span></span>
      </div>
      <div class="orbital-caption">
        {{ t('home.orbit.captionFirst') }}<br /><strong>{{ t('home.orbit.captionSecond') }}</strong>
      </div>
      <div class="satellite satellite-one"><SakuraBlossom class="orbit-blossom" /></div>
      <div class="satellite satellite-two"><SakuraBlossom /></div>
      <div class="floating-label label-one"><span>✧</span> {{ t('home.orbit.create') }}</div>
      <div class="floating-label label-two">
        <span class="signal" /> {{ t('home.orbit.curiosity') }}
      </div>
    </div>
    <div class="coordinate coordinate-bottom">
      <span>{{ t('home.orbit.playground') }}</span> <span>{{ t('home.orbit.possibilities') }}</span>
    </div>
  </div>
</template>
<style scoped>
.orbit-blossom {
  width: 54px;
  height: 54px;
  transform: rotate(12deg);
}
.starfield {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.starfield i {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: 3px;
  height: 3px;
  background: var(--accent);
  border-radius: 50%;
  opacity: 0.4;
  box-shadow: 0 0 10px currentColor;
  animation: star-breathe 5s ease-in-out var(--delay) infinite;
}
.starfield i:nth-child(3n) {
  width: 2px;
  height: 2px;
  background: var(--pink);
}
.orbital-halo {
  position: absolute;
  width: min(300px, 72cqw, 72cqh);
  height: min(300px, 72cqw, 72cqh);
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: conic-gradient(
    from 20deg,
    transparent 5%,
    #f3abc552,
    #d9a2c760,
    transparent 50%,
    #ff78bd40,
    transparent 85%
  );
  filter: blur(24px);
  animation: halo-breathe 8s ease-in-out infinite;
}
.orbital-scale {
  position: absolute;
  width: min(390px, 94cqw, 94cqh);
  height: min(390px, 94cqw, 94cqh);
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: repeating-conic-gradient(from 0deg, #96a4d145 0deg 1deg, transparent 1deg 6deg);
  mask-image: radial-gradient(circle, transparent 68%, #000 68.5% 70%, transparent 70.5%);
  transform: translate(-50%, -50%);
  animation: ring-spin 120s linear infinite reverse;
}
.orbit-traveler {
  position: absolute;
  width: min(355px, 86cqw, 86cqh);
  height: min(355px, 86cqw, 86cqh);
  left: 50%;
  top: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ring-spin 22s linear infinite;
}
.orbit-traveler i {
  position: absolute;
  width: 9px;
  height: 9px;
  top: 50%;
  left: -4px;
  border-radius: 50%;
  background: #ffe0eb;
  box-shadow:
    0 0 8px #f3abc5,
    0 0 22px #f3abc599;
}
.traveler-two {
  width: min(290px, 70cqw, 70cqh);
  height: min(290px, 70cqw, 70cqh);
  animation: ring-spin 31s linear infinite reverse;
}
.traveler-two i {
  width: 5px;
  height: 5px;
  background: #ffb6e0;
  box-shadow: 0 0 16px #ff78bd;
}
.orbital-caption {
  position: absolute;
  right: 5%;
  top: 12%;
  color: var(--muted);
  font:
    9px/1.7 ui-monospace,
    monospace;
  letter-spacing: 0.14em;
  transform: rotate(9deg);
}
.orbital-caption strong {
  color: var(--pink);
  font-weight: 500;
}
@keyframes ring-spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
@keyframes orbit-precess {
  0%,
  100% {
    transform: translate(-50%, -50%) rotate(-32deg);
  }
  50% {
    transform: translate(-50%, -50%) rotate(-15deg);
  }
}
@keyframes star-breathe {
  0%,
  100% {
    opacity: 0.2;
    transform: translateY(0);
  }
  50% {
    opacity: 0.75;
    transform: translateY(-9px);
  }
}
@keyframes halo-breathe {
  0%,
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(0.9);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.orbit-scene {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 12px;
  padding-block: 12px;
  box-sizing: border-box;
  min-height: 400px;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}
/* Keep animated paint separate from captions, including every rotation angle. */
.orbit-stage {
  position: relative;
  container-type: size;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  isolation: isolate;
}
.orbit-glow {
  position: absolute;
  inset: 2%;
  background: radial-gradient(ellipse, #ef9ec025, transparent 66%);
}
.planet {
  position: absolute;
  width: min(226px, 57cqw, 57cqh);
  height: min(226px, 57cqw, 57cqh);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  border-radius: 50%;
  background: radial-gradient(circle at 32% 26%, #ffdae6, #c486a5 29%, #834761 50%, #3a1c32 75%);
  box-shadow:
    inset -20px -20px 35px #280f22,
    inset 3px 3px 14px #fff0f680,
    0 0 80px #9176ff21;
  overflow: hidden;
}
.planet-grid {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  opacity: 0.2;
  background:
    repeating-linear-gradient(0deg, transparent 0 23px, #fff8 24px 25px),
    repeating-linear-gradient(90deg, transparent 0 30px, #fff8 31px 32px);
  transform: perspective(180px) rotateY(-25deg);
}
.planet-letter {
  position: absolute;
  top: 2%;
  left: 25%;
  color: #fff2f8;
  font:
    italic min(180px, 45cqw, 45cqh)/1.1 Georgia,
    serif;
  text-shadow: 0 8px 20px #4c1e3850;
}
.planet-letter span {
  font-size: 0.23em;
  position: absolute;
  top: 28%;
  left: 66%;
  color: var(--accent);
}
.orbit-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 1px solid #9ca8d133;
}
.ring-one {
  width: min(355px, 86cqw, 86cqh);
  height: min(355px, 86cqw, 86cqh);
  transform: translate(-50%, -50%);
  border-style: dashed;
  animation: ring-spin 80s linear infinite;
}
.ring-two {
  width: min(440px, 98cqw, 98cqh);
  height: min(176px, 40cqw, 40cqh);
  transform: translate(-50%, -50%) rotate(-32deg);
  border-color: #f3abc580;
  box-shadow: 0 0 16px #f3abc50b;
  animation: orbit-precess 18s ease-in-out infinite;
}
.ring-three {
  width: min(320px, 77cqw, 77cqh);
  height: min(370px, 89cqw, 89cqh);
  transform: translate(-50%, -50%) rotate(42deg);
  border-color: #ee92d32e;
}
.satellite {
  position: absolute;
  color: var(--pink);
  font-size: 38px;
  animation: drift 6s ease-in-out infinite;
}
.satellite-one {
  top: 18%;
  right: 19%;
}
.satellite-two {
  left: 18%;
  bottom: 19%;
  font-size: 23px;
  color: var(--accent);
  animation-delay: -3s;
}
.floating-label {
  position: absolute;
  padding: 10px 14px;
  background: #352333c9;
  backdrop-filter: blur(12px);
  border: 1px solid #aa6d8c44;
  border-radius: 10px;
  color: var(--color-text);
  font:
    10px ui-monospace,
    monospace;
  letter-spacing: 0.06em;
  max-width: 85%;
  box-sizing: border-box;
  animation: drift 7s ease-in-out infinite;
}
.label-one {
  top: 25%;
  left: 2%;
  transform: rotate(-8deg);
}
.label-one span {
  color: var(--accent);
  font-size: 19px;
  margin-right: 8px;
}
.label-two {
  right: 1%;
  bottom: 21%;
  animation-delay: -3s;
}
.signal {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 0 9px var(--accent);
}
.coordinate {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: space-between;
  padding-inline: 8px;
  color: var(--muted);
  font:
    8px ui-monospace,
    monospace;
  letter-spacing: 0.1em;
}
.coordinate-top {
  align-self: start;
}
.coordinate-bottom {
  align-self: end;
}
@media (max-width: 600px) {
  .orbital-halo {
    filter: blur(16px);
  }
  .starfield i:nth-child(n + 9),
  .orbital-caption {
    display: none;
  }
  .orbit-scene {
    min-height: 320px;
  }
  .floating-label {
    font-size: 8px;
    padding: 8px;
  }
  .orbit-blossom {
    width: 42px;
    height: 42px;
  }
}
</style>
