<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useGlobalStore } from '../../stores/globalStore'

const store = useGlobalStore()
const rulerRef = ref<HTMLDivElement>()
const tooltipData = ref<{ year: number; count: number; people: number } | null>(null)
const tooltipX = ref(0)

const years = computed(() => store.timeline)

function getTickHeight(count: number): number {
  const maxCount = Math.max(...years.value.map(y => y.entryCount), 1)
  return Math.max(20, (count / maxCount) * 60)
}

function handleTickHover(year: number, event: MouseEvent) {
  const yearData = years.value.find(y => y.year === year)
  if (!yearData) return

  const yearEntries = store.entries.filter(e => e.year === year)
  const peopleSet = new Set<string>()
  yearEntries.forEach(e => e.people.forEach(p => peopleSet.add(p)))

  tooltipData.value = { year, count: yearData.entryCount, people: peopleSet.size }
  tooltipX.value = (event.target as HTMLElement).getBoundingClientRect().left
}

function handleTickLeave() {
  tooltipData.value = null
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
</script>

<template>
  <div class="timeline-ruler" :class="{ dimmed: isDimmed }" ref="rulerRef">
    <div class="timeline-ruler__track">
      <div
        v-for="item in years"
        :key="item.year"
        class="timeline-tick"
        :class="{ active: store.selectedYear === item.year }"
        :data-year="item.year"
        @click="handleTickClick(item.year)"
        @mouseenter="handleTickHover(item.year, $event)"
        @mouseleave="handleTickLeave"
      >
        <div
          class="timeline-tick__line"
          :style="{ height: getTickHeight(item.entryCount) + 'px' }"
        ></div>
        <span class="timeline-tick__label">{{ item.year }}</span>
      </div>
    </div>

    <!-- Special label for geography mode -->
    <div v-if="isDimmed" class="timeline-ruler__special-label">
      游蜀行旅区间（时序考证中）
    </div>

    <!-- Hover tooltip -->
    <Transition name="tooltip">
      <div
        v-if="tooltipData"
        class="timeline-tooltip"
        :style="{ left: tooltipX + 'px' }"
      >
        <div class="timeline-tooltip__year">{{ tooltipData.year }}</div>
        <div class="timeline-tooltip__info">{{ tooltipData.count }} 条历史记录</div>
        <div class="timeline-tooltip__info">涉及 {{ tooltipData.people }} 位人物</div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.timeline-ruler {
  width: 100%;
  height: 100%;
  padding: 8px 24px;
  position: relative;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(to bottom, $rice-paper 0%, $parchment-shadow 100%);
  transition: opacity 0.5s ease;

  &.dimmed {
    opacity: 0.3;
  }

  &__track {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;

    &::-webkit-scrollbar {
      display: none;
    }
    scrollbar-width: none;
  }

  &__special-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: $font-calligraphy;
    font-size: 24px;
    color: $cinnabar;
    background: rgba($rice-paper, 0.9);
    padding: 8px 24px;
    border: 1px solid $cinnabar;
    border-radius: 4px;
    white-space: nowrap;
    z-index: 10;
  }
}

.timeline-tick {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0 4px;
  transition: all 0.3s ease;

  &__line {
    width: 2px;
    background: $ink-faint;
    transition: all 0.3s ease;
    border-radius: 1px;
  }

  &__label {
    font-family: $font-sans;
    font-size: 11px;
    color: $ink-light;
    margin-top: 4px;
    transition: color 0.3s ease;
    white-space: nowrap;
  }

  &:hover {
    .timeline-tick__line {
      background: $ink-medium;
      width: 3px;
    }
    .timeline-tick__label {
      color: $ink-dark;
    }
  }

  &.active {
    .timeline-tick__line {
      background: $cinnabar;
      width: 3px;
    }
    .timeline-tick__label {
      color: $cinnabar;
      font-weight: bold;
    }
  }
}

.timeline-tooltip {
  position: absolute;
  bottom: 100%;
  background: rgba($ink-black, 0.85);
  color: $rice-paper;
  padding: 8px 14px;
  border-radius: 6px;
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: none;
  white-space: nowrap;

  &__year {
    font-family: $font-calligraphy;
    font-size: 18px;
    font-weight: bold;
    color: $cinnabar-light;
  }

  &__info {
    font-size: 12px;
    color: $ink-faint;
    margin-top: 2px;
  }
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.2s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
