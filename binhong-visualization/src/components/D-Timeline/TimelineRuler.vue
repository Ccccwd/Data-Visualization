<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useGlobalStore } from '../../stores/globalStore'

const store = useGlobalStore()
const rulerRef = ref<HTMLDivElement>()

const years = computed(() => store.timeline)
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
  return Math.max(3, (count / maxCount) * 30)
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

const isDimmed = computed(() => store.activeMode === 'geography')
const showEveryNth = 5
</script>

<template>
  <div class="timeline-ruler" :class="{ dimmed: isDimmed }">
    <!-- Era label -->
    <div class="timeline-ruler__era">
      <div class="timeline-ruler__era-label">编年总览</div>
      <div class="timeline-ruler__era-range">同治·光绪·宣统·民国</div>
    </div>

    <!-- Track -->
    <div class="timeline-ruler__track" ref="rulerRef">
      <div
        v-for="item in years"
        :key="item.year"
        class="tick"
        :class="{ active: store.selectedYear === item.year }"
        :data-year="item.year"
        @click="handleTickClick(item.year)"
      >
        <!-- Active indicator flag -->
        <div v-if="store.selectedYear === item.year" class="tick__indicator">
          <div class="tick__indicator-flag">{{ getGanzhi(item.year) }}</div>
          <div class="tick__indicator-line"></div>
        </div>

        <!-- Bar -->
        <div
          v-if="item.entryCount > 0"
          class="tick__bar"
          :style="{ height: getTickHeight(item.entryCount) + 'px' }"
        ></div>

        <!-- Mark dot -->
        <div class="tick__mark" :class="{ 'has-entries': item.entryCount > 0 }"></div>

        <!-- Year label -->
        <div
          class="tick__year"
          :class="{ 'hidden-year': item.year % showEveryNth !== 0 && store.selectedYear !== item.year }"
        >
          {{ item.year }}
        </div>

        <!-- Tooltip -->
        <div v-if="item.entryCount > 0" class="tick__tooltip">
          <div class="tick__tooltip-year">{{ item.year }}</div>
          <div class="tick__tooltip-ganzhi">{{ getGanzhi(item.year) }}</div>
          <div class="tick__tooltip-info">{{ item.entryCount }} 条历史记录</div>
        </div>
      </div>
    </div>

    <!-- Geography mode overlay label -->
    <div v-if="isDimmed" class="timeline-ruler__special-label">
      游蜀行旅区间（时序考证中）
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.timeline-ruler {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: $parchment-dark;
  background-image:
    linear-gradient(to right, rgba($frame-wood, .08) 0%, transparent 1.5%, transparent 98.5%, rgba($frame-wood, .08) 100%),
    repeating-linear-gradient(90deg, transparent, transparent 48px, rgba($frame-wood, .05) 48px, rgba($frame-wood, .05) 49px);
  border-top: 2px solid rgba($frame-wood, .22);
  box-shadow: inset 0 2px 10px rgba($frame-dark, .08);
  transition: opacity .5s ease;

  &.dimmed { opacity: .3; }
}

// Era label area
.timeline-ruler__era {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
  background: linear-gradient(to right, $parchment-dark 55%, transparent);
  padding: 8px;
}
.timeline-ruler__era-label {
  font-family: $font-display;
  font-size: 13px;
  color: $ink-zhong;
  letter-spacing: 4px;
  writing-mode: vertical-rl;
  opacity: .55;
}
.timeline-ruler__era-range {
  font-family: $font-sans;
  font-size: 7px;
  font-weight: 300;
  color: $ink-dan;
  writing-mode: vertical-rl;
  margin-top: 6px;
  opacity: .45;
}

// Special label for geography mode
.timeline-ruler__special-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: $font-display;
  font-size: 24px;
  color: $cinnabar;
  background: rgba($rice-paper, .9);
  padding: 8px 24px;
  border: 1px solid $cinnabar;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 10;
}

// Track
.timeline-ruler__track {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: stretch;
  padding: 8px 34px 0 96px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  // Horizontal baseline
  &::before {
    content: '';
    position: absolute;
    left: 96px;
    right: 34px;
    top: 62%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba($frame-wood, .18) 3%, rgba($frame-wood, .18) 97%, transparent);
    z-index: 0;
  }
}

// Tick
.tick {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
  min-width: 18px;
  width: 18px;
  z-index: 1;
}

// Bar
.tick__bar {
  width: 4px;
  min-height: 2px;
  border-radius: 1px 1px 0 0;
  position: absolute;
  bottom: 38%;
  transition: all .3s;
  align-self: center;
  background: linear-gradient(to top, rgba($ink-zhong, .28), rgba($ink-zhong, .06));
}
.tick:hover .tick__bar {
  background: linear-gradient(to top, rgba($ink-zhong, .5), rgba($ink-zhong, .12));
  width: 6px;
}
.tick.active .tick__bar {
  background: linear-gradient(to top, rgba($cinnabar, .65), rgba($cinnabar, .12));
  width: 8px;
  box-shadow: 0 -2px 10px rgba($cinnabar, .12);
}

// Mark dot
.tick__mark {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: $ink-wash;
  position: absolute;
  top: 62%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: all .3s;

  &.has-entries {
    background: $ink-dan;
    width: 4px;
    height: 4px;
  }
}
.tick:hover .tick__mark.has-entries {
  background: $ink-zhong;
  transform: translate(-50%, -50%) scale(1.5);
}
.tick.active .tick__mark {
  background: $cinnabar;
  width: 5px;
  height: 5px;
  box-shadow: 0 0 8px rgba($cinnabar, .35);
}

// Year label
.tick__year {
  position: absolute;
  top: calc(62% + 10px);
  left: 50%;
  transform: translateX(-50%);
  font-family: $font-sans;
  font-size: 8px;
  font-weight: 300;
  color: $ink-dan;
  transition: all .3s;
  white-space: nowrap;

  &.hidden-year { visibility: hidden; }
}
.tick:hover .tick__year { color: $ink-zhong; }
.tick.active .tick__year {
  color: $cinnabar;
  font-weight: 500;
  font-size: 10px;
}

// Active indicator
.tick__indicator {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 1;
}
.tick__indicator-line {
  width: 1px;
  height: 10px;
  background: $cinnabar;
  opacity: .4;
}
.tick__indicator-flag {
  font-family: $font-display;
  font-size: 12px;
  color: $cinnabar;
  background: rgba($cinnabar, .08);
  padding: 2px 7px;
  border: 1px solid rgba($cinnabar, .18);
  white-space: nowrap;
}

// Tooltip
.tick__tooltip {
  position: absolute;
  bottom: calc(38% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: $parchment;
  border: 1px solid rgba($frame-wood, .22);
  padding: 7px 11px;
  min-width: 105px;
  z-index: 100;
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s;
  box-shadow: 0 2px 10px rgba($ink-heavy, .1);

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 3px solid transparent;
    border-top-color: $parchment;
  }
}
.tick:hover .tick__tooltip { opacity: 1; }
.tick__tooltip-year {
  font-family: $font-display;
  font-size: 18px;
  color: $ink-heavy;
  line-height: 1;
}
.tick__tooltip-ganzhi {
  font-family: $font-sans;
  font-size: 9px;
  color: $ink-zhong;
  margin-top: 2px;
}
.tick__tooltip-info {
  font-family: $font-sans;
  font-size: 9px;
  font-weight: 300;
  color: $ink-dan;
  margin-top: 2px;
}
</style>
