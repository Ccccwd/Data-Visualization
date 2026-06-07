<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGlobalStore } from '../../stores/globalStore'
import SealStamp from './SealStamp.vue'

const store = useGlobalStore()

const displayYear = computed(() => {
  if (!store.activeEntry) return { year: '', ganzhi: '', age: '' }
  const entry = store.activeEntry
  const birthYear = store.metadata.birthYear
  const age = entry.year ? entry.year - birthYear : null
  let ageLabel = ''
  if (age !== null && age > 0) {
    if (age >= 60) {
      ageLabel = `${age}叟`
    } else if (age >= 40) {
      ageLabel = `${age}叟`
    } else if (age >= 10) {
      ageLabel = `${age}岁`
    }
  }
  return {
    year: entry.year ? String(entry.year) : '—',
    ganzhi: entry.ganzhi || '',
    age: ageLabel,
  }
})

const displayLocation = computed(() => {
  // Prefer year summary locations, fallback to activeLocations
  if (store.currentYearSummary && store.currentYearSummary.locations.length > 0) {
    return store.currentYearSummary.locations.map(l => l.name).join(' · ')
  }
  if (store.activeLocations.length > 0) {
    return store.activeLocations.map(l => l.name).join(' · ')
  }
  return ''
})

const displayText = computed(() => {
  // Show actual chronology text from 年谱
  if (store.currentYearSummary) return store.currentYearSummary.text
  if (store.activeEntry) return store.activeEntry.text
  return '请点击时间轴、地图标记或关系图谱中的人物开始探索'
})

const hasSeals = computed(() => {
  return store.activeEntry && store.activeEntry.seals.length > 0
})

// ═══ Era Context ═══
const eraContext = computed(() => {
  if (!store.activeEntry?.year) return null
  return store.currentEraContext
})

const showEraContext = ref(false)

watch(() => store.selectedYear, () => {
  showEraContext.value = false
  if (eraContext.value) {
    setTimeout(() => { showEraContext.value = true }, 400)
  }
})

const showSeal = ref(false)

watch(() => store.activeEntry, () => {
  showSeal.value = false
  if (hasSeals.value) {
    setTimeout(() => { showSeal.value = true }, 600)
  }
})
</script>

<template>
  <div class="document-card">
    <!-- Corner ornaments -->
    <div class="document-card__corner document-card__corner--tl"></div>
    <div class="document-card__corner document-card__corner--tr"></div>
    <div class="document-card__corner document-card__corner--bl"></div>
    <div class="document-card__corner document-card__corner--br"></div>

    <div class="document-card__inner">
      <!-- Header -->
      <div class="document-card__header">
        <div>
          <div class="doc-year" :class="{ active: !!store.activeEntry }">
            {{ displayYear.year }}
          </div>
          <div class="doc-location">{{ displayLocation }}</div>
        </div>
        <div class="doc-ganzhi-column" v-if="displayYear.ganzhi">
          <div class="doc-ganzhi-char">{{ displayYear.ganzhi }}</div>
          <div class="doc-ganzhi-age" v-if="displayYear.age">{{ displayYear.age }}</div>
        </div>
      </div>

      <!-- Separator -->
      <div class="doc-separator"></div>

      <!-- Body -->
      <div class="document-card__body">
        <p class="doc-text">{{ displayText }}</p>
      </div>

      <!-- ═══ Era Footnote (时代注脚) ═══ -->
      <Transition name="era-slide">
        <div v-if="eraContext && showEraContext" class="doc-era-context">
          <div class="doc-era-context__margin-line"></div>
          <div class="doc-era-context__content">
            <div class="doc-era-context__header">
              <span class="doc-era-context__seal">时代注脚</span>
              <span class="doc-era-context__era">{{ eraContext.era }}</span>
            </div>
            <div class="doc-era-context__events">
              <span v-for="(event, i) in eraContext.events" :key="i" class="doc-era-context__event">
                {{ event }}
              </span>
            </div>
            <p class="doc-era-context__summary">{{ eraContext.summary }}</p>
            <p v-if="eraContext.personalNote" class="doc-era-context__personal">
              <span class="doc-era-context__label">个人回应</span>
              {{ eraContext.personalNote }}
            </p>
            <p v-if="eraContext.insight" class="doc-era-context__insight">
              <span class="doc-era-context__label">规律洞察</span>
              {{ eraContext.insight }}
            </p>
          </div>
        </div>
      </Transition>

      <!-- Seals -->
      <div class="document-card__seals" v-if="hasSeals && showSeal">
        <SealStamp
          v-for="(seal, i) in store.activeEntry!.seals"
          :key="seal.name"
          :name="seal.name"
          :delay="i * 0.2"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.document-card {
  width: 100%; height: 100%;
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, $aged-paper 0%, $parchment 100%);
}

.document-card__corner {
  position: absolute; width: 28px; height: 28px; z-index: 5; pointer-events: none;
  &::before, &::after { content: ''; position: absolute; background: $gold; opacity: .22; }
  &--tl { top: 18px; left: 18px;
    &::before { top: 0; left: 0; width: 28px; height: 1.5px; }
    &::after  { top: 0; left: 0; width: 1.5px; height: 28px; }
  }
  &--tr { top: 18px; right: 18px;
    &::before { top: 0; right: 0; width: 28px; height: 1.5px; }
    &::after  { top: 0; right: 0; width: 1.5px; height: 28px; }
  }
  &--bl { bottom: 18px; left: 18px;
    &::before { bottom: 0; left: 0; width: 28px; height: 1.5px; }
    &::after  { bottom: 0; left: 0; width: 1.5px; height: 28px; }
  }
  &--br { bottom: 18px; right: 18px;
    &::before { bottom: 0; right: 0; width: 28px; height: 1.5px; }
    &::after  { bottom: 0; right: 0; width: 1.5px; height: 28px; }
  }
}

.document-card__inner {
  position: absolute; inset: 0;
  padding: 28px 32px;
  display: flex; flex-direction: column;
}

.document-card__header {
  display: flex; align-items: flex-start; gap: 18px;
  margin-bottom: 14px; flex-shrink: 0;
}

.doc-year {
  font-family: $font-display; font-size: 88px; line-height: 1;
  color: $ink-heavy; text-shadow: 0 0 50px rgba($ink-heavy, .1);
  transition: opacity .5s ease;
  &:not(.active) { opacity: .25; }
}

.doc-location {
  font-family: $font-label; font-size: 13px; font-weight: 400;
  color: $ink-zhong; margin-top: 4px; letter-spacing: 3px;
}

.doc-ganzhi-column {
  display: flex; flex-direction: column; align-items: center; gap: 2px; padding-top: 8px;
}
.doc-ganzhi-char {
  font-family: $font-display; font-size: 24px; color: $ink-nong;
  writing-mode: vertical-rl; line-height: 1.3;
}
.doc-ganzhi-age {
  font-family: $font-sans; font-size: 9px; font-weight: 300;
  color: $ink-dan; writing-mode: vertical-rl; margin-top: 6px;
}

.doc-separator {
  width: 100%; height: 1px; flex-shrink: 0; margin-bottom: 14px;
  background: linear-gradient(to right, transparent, rgba($frame-wood, .22) 18%, rgba($frame-wood, .22) 82%, transparent);
}

.document-card__body {
  flex: 1; overflow-y: auto; padding-right: 10px;
  scrollbar-width: thin; scrollbar-color: $ink-wash transparent;
  &::-webkit-scrollbar { width: 2px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: $ink-zhong; border-radius: 1px; }
}

.doc-text {
  font-family: $font-body; font-size: 15px; line-height: 2;
  color: $ink-nong; text-align: justify; white-space: pre-wrap;
}

// ═══ Era Footnote ═══
.doc-era-context {
  flex-shrink: 0; display: flex; gap: 0; margin-top: 12px;
  position: relative; max-height: 200px; overflow-y: auto;
  scrollbar-width: thin; scrollbar-color: rgba($cinnabar, .2) transparent;
  &::-webkit-scrollbar { width: 2px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba($cinnabar, .25); border-radius: 1px; }
}

.doc-era-context__margin-line {
  width: 1.5px; flex-shrink: 0; margin-right: 12px;
  background: linear-gradient(to bottom, transparent 0%, rgba($cinnabar, 0.55) 8%, rgba($cinnabar, 0.55) 92%, transparent 100%);
}

.doc-era-context__content { flex: 1; min-width: 0; padding: 2px 0 6px 0; }

.doc-era-context__header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }

.doc-era-context__seal {
  font-family: $font-display; font-size: 12px;
  color: rgba($cinnabar, 0.9); letter-spacing: 2px;
  padding: 2px 6px; border: 1px solid rgba($cinnabar, 0.35);
  background: rgba($cinnabar, 0.04); white-space: nowrap;
  box-shadow: inset 0 0 2px rgba($cinnabar, 0.06), 0 0 3px rgba($cinnabar, 0.05);
}

.doc-era-context__era {
  font-family: $font-display; font-size: 18px;
  color: rgba($ink-nong, 0.7); letter-spacing: 3px;
}

.doc-era-context__events { display: flex; flex-wrap: wrap; gap: 4px 6px; margin-bottom: 6px; }

.doc-era-context__event {
  font-family: $font-sans; font-size: 12px; font-weight: 300;
  color: rgba($ink-dan, 0.8); letter-spacing: 0.5px;
  & + &::before { content: '·'; margin-right: 2px; color: rgba($cinnabar, 0.3); }
}

.doc-era-context__summary {
  font-family: $font-body; font-size: 13px; line-height: 1.9;
  color: $ink-zhong; margin: 0 0 4px 0; text-align: justify;
}

.doc-era-context__personal {
  font-family: $font-body; font-size: 12.5px; line-height: 1.7;
  color: rgba($ink-zhong, 0.65); margin: 4px 0 0 0; text-align: justify;
}

.doc-era-context__insight {
  font-family: $font-body; font-size: 12.5px; line-height: 1.7;
  color: rgba($ink-zhong, 0.55); margin: 4px 0 0 0; text-align: justify;
  border-top: 1px dashed rgba($ink-wash, 0.2); padding-top: 4px;
}

.doc-era-context__label {
  font-family: $font-label; font-size: 11px;
  color: rgba($cinnabar, 0.7); letter-spacing: 2px; margin-right: 6px;
  display: inline-block;
}

// Era footnote transition
.era-slide-enter-active { transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.era-slide-leave-active { transition: all 0.3s ease; }
.era-slide-enter-from { opacity: 0; transform: translateY(12px); }
.era-slide-leave-to { opacity: 0; transform: translateY(-8px); }

// Seals
.document-card__seals {
  position: absolute; bottom: 22px; right: 30px;
  display: flex; gap: 10px; z-index: 10;
}
</style>
