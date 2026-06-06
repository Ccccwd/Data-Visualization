<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useGlobalStore } from './stores/globalStore'
import InkMap from './components/A-Map/InkMap.vue'
import DocumentCard from './components/B-Narrative/DocumentCard.vue'
import RelationshipGraph from './components/C-Graph/RelationshipGraph.vue'
import TimelineRuler from './components/D-Timeline/TimelineRuler.vue'

const store = useGlobalStore()

// ═══ Atmospheric CSS variables ═══
const atmosphereStyle = computed(() => {
  const p = store.currentPressure || 0
  const t = p / 10

  const tintAlpha = (t * 0.08).toFixed(3)
  const warmthAlpha = (0.08 * (1 - t * 0.85)).toFixed(3)
  const coolAlpha = t > 0.3 ? ((t - 0.3) * 0.06).toFixed(3) : '0'

  return {
    '--atmo-tint-alpha': tintAlpha,
    '--atmo-warmth-alpha': warmthAlpha,
    '--atmo-cool-alpha': coolAlpha,
  }
})

function scaleVP() {
  const el = document.querySelector('.viewport-scale') as HTMLElement
  if (!el) return
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
  el.style.transform = `scale(${s})`
  el.style.left = Math.max(0, (window.innerWidth - 1920 * s) / 2) + 'px'
  el.style.top = Math.max(0, (window.innerHeight - 1080 * s) / 2) + 'px'
}

onMounted(() => {
  scaleVP()
  window.addEventListener('resize', scaleVP)
})

onUnmounted(() => {
  window.removeEventListener('resize', scaleVP)
})
</script>

<template>
  <div class="app-viewport">
    <!-- Loading screen -->
    <div class="loading-screen">
      <div class="loading-splash"></div>
      <div class="loading-text">黄宾虹年谱</div>
    </div>

    <div class="viewport-scale">
      <div class="dashboard" :style="atmosphereStyle">
        <!-- Horizontal divider -->
        <div class="divider-h"></div>

        <!-- A区: Map -->
        <div class="region region--map">
          <InkMap />
        </div>

        <!-- B区: Document Card -->
        <div class="region region--narrative">
          <DocumentCard />
        </div>

        <!-- C区: Relationship Graph -->
        <div class="region region--graph">
          <RelationshipGraph />
        </div>

        <!-- D区: Timeline -->
        <div class="region region--timeline">
          <TimelineRuler />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use './styles/variables' as *;

.app-viewport {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: $ink-burnt;
}

.viewport-scale {
  width: 1920px;
  height: 1080px;
  transform-origin: top left;
  position: absolute;
  top: 0;
  left: 0;
}

// ═══ Loading Screen ═══
.loading-screen {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: $ink-burnt;
  animation: loadFade 1s ease 3s forwards;
}
.loading-splash {
  width: 160px; height: 160px; border-radius: 50%;
  background: radial-gradient(circle, rgba($silk, 0.95) 0%, rgba($ink-wash, 0.5) 40%, transparent 70%);
  animation: splashExp 2.5s cubic-bezier(.25,.46,.45,.94) forwards;
}
.loading-text {
  position: absolute; bottom: 38%;
  color: $silk; font-family: $font-display;
  font-size: 32px; letter-spacing: 16px;
  opacity: 0; animation: textReveal 1s ease 0.8s forwards;
}
@keyframes splashExp {
  0%   { transform: scale(0); opacity: 0; }
  30%  { opacity: 1; }
  100% { transform: scale(14); opacity: 0.06; }
}
@keyframes textReveal {
  0%   { opacity: 0; letter-spacing: 28px; }
  100% { opacity: 0.5; letter-spacing: 16px; }
}
@keyframes loadFade {
  to { opacity: 0; pointer-events: none; }
}

// ═══ Dashboard with atmospheric variables ═══
.dashboard {
  width: 1920px;
  height: 1080px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1.3fr 0.7fr $timeline-height;
  grid-template-areas:
    "map narrative"
    "map graph"
    "timeline timeline";
  position: relative;
  overflow: hidden;
  background-color: $parchment;
  background-image:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E"),
    radial-gradient(ellipse at 20% 30%, rgba($gold, var(--atmo-warmth-alpha, 0.08)) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(74,107,138, var(--atmo-cool-alpha, 0)) 0%, transparent 45%),
    radial-gradient(ellipse at 80% 70%, rgba($frame-wood, 0.06) 0%, transparent 45%);
  opacity: 0;
  animation: dashReveal 1s ease 2.5s forwards;
}

// Atmospheric overlay tint
.dashboard::after {
  content: '';
  position: absolute; inset: 0; z-index: 1;
  pointer-events: none;
  background: $ink-burnt;
  opacity: var(--atmo-tint-alpha, 0);
  transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dashReveal { to { opacity: 1; } }

// ═══ Dividers ═══
.dashboard::before {
  content: ''; position: absolute;
  top: 0; bottom: $timeline-height;
  left: 50%; width: 4px; transform: translateX(-2px);
  background: linear-gradient(to bottom, transparent, rgba($frame-wood, 0.35) 12%, rgba($frame-wood, 0.35) 88%, transparent);
  z-index: 50;
}
.divider-h {
  position: absolute;
  top: calc((1080px - #{$timeline-height}) * 1.3 / 2);
  left: 50%; right: 0; height: 4px; z-index: 50;
  background: linear-gradient(to right, rgba($frame-wood, 0.06), rgba($frame-wood, 0.3) 15%, rgba($frame-wood, 0.3) 85%, rgba($frame-wood, 0.06));
  &::after {
    content: ''; position: absolute;
    top: 4px; left: 0; right: 0; height: 1px;
    background: linear-gradient(to right, transparent, rgba($frame-wood, 0.12) 15%, rgba($frame-wood, 0.12) 85%, transparent);
  }
}

// ═══ Region Slots ═══
.region {
  position: relative; overflow: hidden; z-index: 2;

  &--map { grid-area: map; animation: fadeInUp 1s ease 2.6s both; }
  &--narrative { grid-area: narrative; animation: fadeInUp 1s ease 2.8s both; }
  &--graph { grid-area: graph; animation: fadeInUp 1s ease 3s both; }
  &--timeline { grid-area: timeline; animation: fadeInUp 1s ease 3.2s both; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
