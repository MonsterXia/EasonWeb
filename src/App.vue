<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import Navigator from './components/Navigator.vue'
import SakuraBlossom from './components/SakuraBlossom.vue'
const { t, locale } = useI18n()
const elementLocale = computed(() => (locale.value === 'en' ? en : zhCn))
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <div class="ambient" aria-hidden="true">
      <i /><i />
      <div class="aurora-ribbon" />
      <div class="ambient-stars" />
      <div class="sakura-garden">
        <SakuraBlossom class="ambient-blossom blossom-one" />
        <SakuraBlossom class="ambient-blossom blossom-two" />
        <i
          v-for="n in 6"
          :key="n"
          class="falling-petal"
          :style="{
            '--petal-x': `${(n * 17) % 100}%`,
            '--petal-y': `${(n * 23) % 90}%`,
            '--petal-delay': `${n * -4}s`,
            '--petal-angle': `${n * 37}deg`,
          }"
        />
      </div>
    </div>
    <a class="skip-link" href="#main-content">{{ t('shell.skip') }}</a>
    <Navigator />
    <main id="main-content" class="site-main" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <component :is="Component" class="route-page" />
      </RouterView>
    </main>
    <footer class="site-footer">
      <router-link to="/" class="footer-brand">EASON<span> / </span>PLAYGROUND</router-link>
      <span>{{ t('shell.footer') }}</span>
      <span class="footer-note">STAY CURIOUS <b>✦</b></span>
    </footer>
  </el-config-provider>
</template>

<style scoped>
.sakura-garden {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ambient-blossom {
  position: absolute;
  width: 82px;
  height: 82px;
  opacity: 0.2;
}
.blossom-one {
  top: 18%;
  right: -22px;
  transform: rotate(18deg);
}
.blossom-two {
  top: 72%;
  left: -26px;
  transform: rotate(-24deg);
}
.sakura-garden .falling-petal {
  position: absolute;
  left: var(--petal-x);
  top: var(--petal-y);
  right: auto;
  width: 10px;
  height: 17px;
  border-radius: 80% 12% 75% 25%;
  background: linear-gradient(
    145deg,
    var(--sakura),
    color-mix(in srgb, var(--accent) 35%, var(--sakura))
  );
  opacity: 0.24;
  animation: petal-fall 26s linear var(--petal-delay) infinite;
}
@keyframes petal-fall {
  0% {
    transform: translate3d(0, -55px, 0) rotate(var(--petal-angle));
    opacity: 0;
  }
  20%,
  75% {
    opacity: 0.3;
  }
  100% {
    transform: translate3d(38px, 100px, 0) rotate(calc(var(--petal-angle) + 120deg));
    opacity: 0;
  }
}
@media (max-width: 700px) {
  .sakura-garden .falling-petal:nth-of-type(n + 4) {
    display: none;
  }
  .ambient-blossom {
    width: 56px;
    height: 56px;
    opacity: 0.15;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sakura-garden .falling-petal {
    animation: none;
    opacity: 0.18;
    transform: rotate(var(--petal-angle));
  }
}

.aurora-ribbon {
  position: absolute;
  width: 140%;
  height: 48vh;
  top: 6%;
  left: -20%;
  background: linear-gradient(
    120deg,
    transparent 15%,
    #f3abc510 35%,
    #a889ff22 52%,
    #ff78bd12 65%,
    transparent 80%
  );
  filter: blur(40px);
  transform: rotate(-18deg);
  animation: aurora-drift 24s ease-in-out infinite;
}
.ambient-stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 17% 23%, #b4c9ff88 98%, transparent),
    radial-gradient(1px 1px at 77% 16%, #ffb1db88 98%, transparent),
    radial-gradient(1px 1px at 55% 63%, #ffd1e188 98%, transparent),
    radial-gradient(1px 1px at 89% 77%, #b4c9ff77 98%, transparent);
  background-size: 450px 390px;
  opacity: 0.5;
}
@keyframes aurora-drift {
  0%,
  100% {
    transform: translate3d(-3%, -4%, 0) rotate(-18deg);
    opacity: 0.5;
  }
  50% {
    transform: translate3d(3%, 6%, 0) rotate(-12deg);
    opacity: 1;
  }
}
@media (max-width: 700px) {
  .aurora-ribbon {
    animation: none;
    filter: blur(20px);
  }
  .ambient-stars {
    opacity: 0.25;
  }
}

.ambient {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
  background-image:
    linear-gradient(#93a7d104 1px, transparent 1px),
    linear-gradient(90deg, #93a7d104 1px, transparent 1px);
  background-size: 54px 54px;
}
.ambient > i {
  position: absolute;
  width: 750px;
  height: 750px;
  border-radius: 50%;
  background: radial-gradient(circle, #6443b326, transparent 65%);
  top: -250px;
  right: -150px;
}
.ambient > i + i {
  background: radial-gradient(circle, #a74d761a, transparent 65%);
  left: -400px;
  top: 300px;
}
.site-main {
  width: min(1200px, calc(100% - 80px));
  margin: 0 auto;
  min-height: calc(100vh - 198px);
  padding: 46px 0 64px;
}
.route-page {
  animation: appear 0.55s ease both;
}
.site-footer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 25px 0;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  color: var(--muted);
  font-size: 11px;
}
.footer-brand {
  color: var(--color-heading);
  letter-spacing: 0.1em;
  font-weight: 700;
}
.footer-brand span {
  color: var(--accent);
}
.footer-note {
  letter-spacing: 0.12em;
}
.footer-note b {
  color: var(--pink);
  margin-left: 12px;
}
.skip-link {
  position: fixed;
  top: -60px;
  left: 20px;
  z-index: 100;
  background: var(--accent);
  color: var(--on-accent);
  padding: 10px;
  border-radius: 8px;
}
.skip-link:focus {
  top: 10px;
}
@media (max-width: 1280px) {
  .site-footer {
    margin-inline: 40px;
  }
}
@media (max-width: 700px) {
  .site-main {
    width: calc(100% - 36px);
    padding: 30px 0 42px;
  }
  .site-footer {
    margin-inline: 18px;
    flex-wrap: wrap;
    gap: 8px 20px;
  }
  .footer-note {
    display: none;
  }
}
</style>
