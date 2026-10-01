<template>
  <div class="orbit-scene" aria-hidden="true">
    <div class="coordinate coordinate-top">E / 001 <span>EXPLORE THE UNKNOWN</span></div>
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
    <div class="orbital-caption">MAKE ROOM<br /><strong>FOR WONDER.</strong></div>
    <div class="satellite satellite-one">✦</div>
    <div class="satellite satellite-two">+</div>
    <div class="floating-label label-one"><span>✧</span> CREATE. PLAY. REPEAT.</div>
    <div class="floating-label label-two"><span class="signal" /> 好奇心持续在线</div>
    <div class="coordinate coordinate-bottom">23° / PLAYGROUND <span>∞ POSSIBILITIES</span></div>
  </div>
</template>
<style scoped>
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
  width: 300px;
  height: 300px;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: conic-gradient(
    from 20deg,
    transparent 5%,
    #76f7d052,
    #9d78f560,
    transparent 50%,
    #ff78bd40,
    transparent 85%
  );
  filter: blur(24px);
  animation: halo-breathe 8s ease-in-out infinite;
}
.orbital-scale {
  position: absolute;
  width: 390px;
  height: 390px;
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
  width: 355px;
  height: 355px;
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
  background: #adffe6;
  box-shadow:
    0 0 8px #76f7d0,
    0 0 22px #76f7d099;
}
.traveler-two {
  width: 290px;
  height: 290px;
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
  min-height: 400px;
  height: 100%;
  overflow: hidden;
}
.orbit-glow {
  position: absolute;
  inset: 2%;
  background: radial-gradient(ellipse, #9866ee25, transparent 66%);
}
.planet {
  position: absolute;
  width: 226px;
  height: 226px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  border-radius: 50%;
  background: radial-gradient(circle at 32% 26%, #b1e8da, #6775ab 29%, #5b427e 50%, #181b36 75%);
  box-shadow:
    inset -20px -20px 35px #050b23,
    inset 3px 3px 14px #ddffe380,
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
  top: 4px;
  left: 57px;
  color: #effff9;
  font:
    italic 180px/1.1 Georgia,
    serif;
  text-shadow: 0 8px 20px #13222650;
}
.planet-letter span {
  font-size: 42px;
  position: absolute;
  top: 51px;
  left: 73px;
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
  width: 355px;
  height: 355px;
  transform: translate(-50%, -50%);
  border-style: dashed;
  animation: ring-spin 80s linear infinite;
}
.ring-two {
  width: 440px;
  height: 176px;
  transform: translate(-50%, -50%) rotate(-32deg);
  border-color: #a4f7db80;
  box-shadow: 0 0 16px #76f7d00b;
  animation: orbit-precess 18s ease-in-out infinite;
}
.ring-three {
  width: 320px;
  height: 370px;
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
  background: #192036c9;
  backdrop-filter: blur(12px);
  border: 1px solid #687a9844;
  border-radius: 10px;
  color: #d9e3f4;
  font:
    10px ui-monospace,
    monospace;
  letter-spacing: 0.06em;
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
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  color: #77829c;
  font:
    8px ui-monospace,
    monospace;
  letter-spacing: 0.1em;
}
.coordinate-top {
  top: 14px;
}
.coordinate-bottom {
  bottom: 8px;
}
@media (max-width: 600px) {
  .orbital-scale {
    width: 305px;
    height: 305px;
  }
  .orbital-halo {
    width: 240px;
    height: 240px;
    filter: blur(16px);
  }
  .orbit-traveler {
    width: 280px;
    height: 280px;
  }
  .traveler-two {
    width: 225px;
    height: 225px;
  }
  .starfield i:nth-child(n + 9) {
    display: none;
  }
  .orbital-caption {
    display: none;
  }
  .orbit-scene {
    min-height: 320px;
  }
  .planet {
    width: 190px;
    height: 190px;
  }
  .planet-letter {
    font-size: 150px;
    left: 46px;
  }
  .planet-letter span {
    top: 40px;
    left: 60px;
  }
  .ring-one {
    width: 280px;
    height: 280px;
  }
  .ring-two {
    width: 335px;
  }
  .ring-three {
    width: 260px;
    height: 300px;
  }
  .floating-label {
    font-size: 8px;
    padding: 8px;
  }
}
</style>
