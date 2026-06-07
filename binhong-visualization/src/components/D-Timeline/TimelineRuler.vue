<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useGlobalStore } from '../../stores/globalStore'
import type { ViewTheme } from '../../types'

const store = useGlobalStore()
const rulerRef = ref<HTMLDivElement>()

const years = computed(() => store.timeline)
const viewTheme = computed(() => store.viewTheme)

const ganzhiTable = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥',
]

function getGanzhi(year: number): string {
  return ganzhiTable[(year - 4) % 60]
}

function getTickHeight(count: number): number {
  const maxCount = Math.max(...years.value.map(y => y.entryCount), 1)
  return Math.max(3, (count / maxCount) * 40)
}

function handleTickClick(year: number) {
  store.selectYear(year)
}

// Auto-scroll to selected year
watch(() => store.selectedYear, async (year) => {
  if (year === null || !rulerRef.value) return
  await nextTick()
  const tickEl = rulerRef.value.querySelector(`[data-year="${year}"]`) as HTMLElement
  if (tickEl) {
    tickEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
})

const showEveryNth = 10

// ═══ Pressure Wave SVG Path ═══
const pressureMap = computed(() => {
  const map = new Map<number, number>()
  store.historyContext.forEach((h: any) => {
    map.set(h.year, h.pressureIndex)
  })
  return map
})

function buildWavePath(): string {
  const allYears = years.value
  if (!allYears.length) return ''

  const WAVE_HEIGHT = 26
  const BASELINE_Y = 30

  const pressures = allYears.map((y: any) => {
    const p = pressureMap.value.get(y.year)
    return p !== undefined ? p / 10 : 0.02
  })

  const points = pressures.map((p: number, i: number) => ({
    x: (i / Math.max(allYears.length - 1, 1)) * 100,
    y: BASELINE_Y - p * WAVE_HEIGHT,
  }))

  let d = `M ${points[0].x},${BASELINE_Y} L ${points[0].x},${points[0].y} `

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const tension = 0.3
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `
  }

  d += `L ${points[points.length - 1].x},${BASELINE_Y} Z`
  return d
}

const activeWaveDot = computed(() => {
  if (!store.selectedYear) return null
  const idx = years.value.findIndex((y: any) => y.year === store.selectedYear)
  if (idx < 0) return null
  const x = (idx / Math.max(years.value.length - 1, 1)) * 100
  const pressure = pressureMap.value.get(store.selectedYear) ?? 0
  const y = 30 - (pressure / 10) * 26
  return { x, y }
})

// ═══ View-dependent tick logic ═══
function isTickDimmed(year: number): boolean {
  if (viewTheme.value === 'turmoil') return !store.warYears.has(year)
  if (viewTheme.value === 'politics') return !store.politicalYears.has(year)
  if (viewTheme.value === 'art') return !store.artMilestoneYears.has(year)
  return false
}

function isTickHighlighted(year: number): boolean {
  if (viewTheme.value === 'turmoil') return store.warYears.has(year)
  if (viewTheme.value === 'politics') return store.politicalYears.has(year)
  if (viewTheme.value === 'art') return store.artMilestoneYears.has(year)
  return false
}

const viewTabs: { theme: ViewTheme; label: string }[] = [
  { theme: 'chronology', label: '编年总览' },
  { theme: 'turmoil', label: '动荡与隐遁' },
  { theme: 'politics', label: '政治光谱' },
  { theme: 'art', label: '艺术脉络' },
]
</script>

<template>
  <div class="timeline-ruler">
    <!-- ═══ View Selector ═══ -->
    <div class="timeline-ruler__views">
      <button
        v-for="tab in viewTabs"
        :key="tab.theme"
        class="view-tab"
        :class="{ active: viewTheme === tab.theme }"
        @click="store.setViewTheme(tab.theme)"
      >
        <span class="view-tab__text">{{ tab.label }}</span>
      </button>
      <div class="timeline-ruler__era-range">同治·光绪·宣统·民国</div>
    </div>

    <!-- ═══ Pressure Wave SVG ═══ -->
    <div class="timeline-ruler__wave">
      <svg class="wave-svg" viewBox="0 0 100 30" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(74,67,58,0.18)" />
            <stop offset="60%" stop-color="rgba(74,67,58,0.06)" />
            <stop offset="100%" stop-color="transparent" />
          </linearGradient>
          <radialGradient id="activeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(184,58,46,0.6)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
        </defs>
        <path :d="buildWavePath()" fill="url(#waveGrad)" class="wave-path" />
        <g v-if="activeWaveDot">
          <circle :cx="activeWaveDot.x" :cy="activeWaveDot.y" r="3" fill="url(#activeGlow)" class="wave-marker__glow" />
          <circle :cx="activeWaveDot.x" :cy="activeWaveDot.y" r="0.8" fill="#B83A2E" class="wave-marker__dot" />
        </g>
      </svg>
    </div>

    <!-- ═══ Track ═══ -->
    <div class="timeline-ruler__track" ref="rulerRef">
      <div
        v-for="item in years"
        :key="item.year"
        class="tick"
        :class="{
          active: store.selectedYear === item.year,
          dimmed: isTickDimmed(item.year),
          highlighted: isTickHighlighted(item.year),
        }"
        :data-year="item.year"
        @click="handleTickClick(item.year)"
      >
        <div v-if="store.selectedYear === item.year" class="tick__indicator">
          <div class="tick__indicator-flag">{{ getGanzhi(item.year) }}</div>
          <div class="tick__indicator-line"></div>
        </div>
        <div v-if="item.entryCount > 0" class="tick__bar" :style="{ height: getTickHeight(item.entryCount) + 'px' }"></div>
        <div class="tick__mark" :class="{ 'has-entries': item.entryCount > 0 }"></div>
        <div class="tick__year" :class="{ 'hidden-year': item.year % showEveryNth !== 0 && store.selectedYear !== item.year }">{{ item.year }}</div>
        <div v-if="item.entryCount > 0" class="tick__tooltip">
          <div class="tick__tooltip-year">{{ item.year }}</div>
          <div class="tick__tooltip-ganzhi">{{ getGanzhi(item.year) }}</div>
          <div class="tick__tooltip-info">{{ item.entryCount }} 条历史记录</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.timeline-ruler {
  width: 100%; height: 100%;
  position: relative; overflow: hidden;
  background-color: $parchment-dark;
  background-image:
    linear-gradient(to right, rgba($frame-wood, .08) 0%, transparent 1.5%, transparent 98.5%, rgba($frame-wood, .08) 100%),
    repeating-linear-gradient(90deg, transparent, transparent 48px, rgba($frame-wood, .05) 48px, rgba($frame-wood, .05) 49px);
  border-top: 2px solid rgba($frame-wood, .22);
  box-shadow: inset 0 2px 10px rgba($frame-dark, .08);
}

// ═══ View Selector (compact horizontal tabs) ═══
.timeline-ruler__views {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 82px; z-index: 20;
  display: flex; flex-direction: column;
  align-items: stretch; justify-content: center; gap: 4px;
  background: linear-gradient(to right, $parchment-dark 65%, transparent);
  padding: 6px 6px;
}

.view-tab {
  background: none; border: none; cursor: pointer;
  padding: 6px 4px; position: relative; outline: none;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.4s ease;
  border-left: 2px solid transparent;

  &__text {
    font-family: $font-label; font-size: 12px;
    letter-spacing: 2px;
    color: $ink-zhong; opacity: 0.55;
    transition: all 0.4s ease;
    white-space: nowrap;
  }

  &.active {
    border-left-color: $cinnabar;
    .view-tab__text { color: $cinnabar; opacity: 0.9; font-weight: 600; }
  }

  &:not(.active):hover {
    .view-tab__text { color: $ink-nong; opacity: 0.75; }
    border-left-color: rgba($ink-dan, 0.4);
  }
}

.timeline-ruler__era-range {
  font-family: $font-sans; font-size: 7px; font-weight: 300;
  color: $ink-dan;
  opacity: .3; letter-spacing: 1px; margin-top: 4px;
  pointer-events: none; text-align: center; line-height: 1.5;
}

// ═══ Pressure Wave ═══
.timeline-ruler__wave {
  position: absolute; left: 74px; right: 0; top: 0;
  height: 35px; z-index: 15; pointer-events: none;
}

.wave-svg { width: 100%; height: 100%; }
.wave-path { transition: d 0.8s ease; }

.wave-marker__glow { animation: pulseGlow 2.5s ease-in-out infinite; }
.wave-marker__dot { filter: drop-shadow(0 0 2px rgba($cinnabar, 0.6)); }

@keyframes pulseGlow {
  0%, 100% { opacity: 0.5; r: 3; }
  50%      { opacity: 0.9; r: 4; }
}

// ═══ Track ═══
.timeline-ruler__track {
  position: absolute; inset: 0;
  display: flex; align-items: stretch;
  padding: 8px 34px 0 82px;
  overflow-x: auto; overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  &::before {
    content: ''; position: absolute;
    left: 82px; right: 34px; top: 66%; height: 1px;
    background: linear-gradient(to right, transparent, rgba($frame-wood, .18) 3%, rgba($frame-wood, .18) 97%, transparent);
    z-index: 0;
  }
}

// ═══ Tick ═══
.tick {
  display: flex; flex-direction: column; align-items: center;
  flex: 1 1 0; flex-shrink: 0; cursor: pointer;
  position: relative; min-width: 12px; z-index: 1;
  transition: opacity 0.5s ease;

  &.dimmed {
    opacity: 0.18; pointer-events: none;
    .tick__bar { background: $ink-wash; }
    .tick__mark { background: $ink-wash; }
  }

  &.highlighted:not(.active) {
    .tick__mark.has-entries {
      background: rgba($cinnabar, 0.5); width: 5px; height: 5px;
      box-shadow: 0 0 4px rgba($cinnabar, 0.2);
    }
    .tick__bar { background: linear-gradient(to top, rgba($cinnabar, 0.35), rgba($cinnabar, 0.06)); }
    .tick__year { color: rgba($cinnabar, 0.7); }
  }
}

.tick__bar {
  width: 4px; min-height: 2px; border-radius: 1px 1px 0 0;
  position: absolute; bottom: 38%; transition: all .3s; align-self: center;
  background: linear-gradient(to top, rgba($ink-zhong, .28), rgba($ink-zhong, .06));
}
.tick:hover:not(.dimmed) .tick__bar {
  background: linear-gradient(to top, rgba($ink-zhong, .5), rgba($ink-zhong, .12)); width: 6px;
}
.tick.active .tick__bar {
  background: linear-gradient(to top, rgba($cinnabar, .65), rgba($cinnabar, .12));
  width: 8px; box-shadow: 0 -2px 10px rgba($cinnabar, .12);
}

.tick__mark {
  width: 3px; height: 3px; border-radius: 50%; background: $ink-wash;
  position: absolute; top: 66%; left: 50%; transform: translate(-50%, -50%);
  transition: all .3s;
  &.has-entries { background: $ink-dan; width: 4px; height: 4px; }
}
.tick:hover:not(.dimmed) .tick__mark.has-entries {
  background: $ink-zhong; transform: translate(-50%, -50%) scale(1.5);
}
.tick.active .tick__mark {
  background: $cinnabar; width: 5px; height: 5px;
  box-shadow: 0 0 8px rgba($cinnabar, .35);
}

.tick__year {
  position: absolute; top: calc(66% + 10px); left: 50%; transform: translateX(-50%);
  font-family: $font-sans; font-size: 11px; font-weight: 300;
  color: $ink-dan; transition: all .3s; white-space: nowrap;
  &.hidden-year { visibility: hidden; }
}
.tick:hover:not(.dimmed) .tick__year { color: $ink-zhong; }
.tick.active .tick__year { color: $cinnabar; font-weight: 500; font-size: 14px; }

.tick__indicator {
  position: absolute; top: 4px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center;
}
.tick__indicator-line { width: 1px; height: 10px; background: $cinnabar; opacity: .4; }
.tick__indicator-flag {
  font-family: $font-display; font-size: 12px; color: $cinnabar;
  background: rgba($cinnabar, .08); padding: 2px 7px;
  border: 1px solid rgba($cinnabar, .18); white-space: nowrap;
}

.tick__tooltip {
  position: absolute; bottom: calc(38% + 8px); left: 50%; transform: translateX(-50%);
  background: $parchment; border: 1px solid rgba($frame-wood, .22);
  padding: 7px 11px; min-width: 105px; z-index: 100;
  opacity: 0; pointer-events: none; transition: opacity .2s;
  box-shadow: 0 2px 10px rgba($ink-heavy, .1);
  &::after {
    content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    border: 3px solid transparent; border-top-color: $parchment;
  }
}
.tick:hover:not(.dimmed) .tick__tooltip { opacity: 1; }
.tick__tooltip-year { font-family: $font-display; font-size: 18px; color: $ink-heavy; line-height: 1; }
.tick__tooltip-ganzhi { font-family: $font-sans; font-size: 9px; color: $ink-zhong; margin-top: 2px; }
.tick__tooltip-info { font-family: $font-sans; font-size: 9px; font-weight: 300; color: $ink-dan; margin-top: 2px; }
</style>
