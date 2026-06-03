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
  if (!store.activeEntry) return ''
  return store.activeEntry.locations.map(l => l.name).join(' · ')
})

const displayText = computed(() => {
  if (!store.activeEntry) return '请点击时间轴、地图标记或关系图谱中的人物开始探索'
  return store.activeEntry.text
})

const hasSeals = computed(() => {
  return store.activeEntry && store.activeEntry.seals.length > 0
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
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, $aged-paper 0%, $parchment 100%);
}

// Corner ornaments (gold L-shape)
.document-card__corner {
  position: absolute;
  width: 28px;
  height: 28px;
  z-index: 5;
  pointer-events: none;

  &::before, &::after {
    content: '';
    position: absolute;
    background: $gold;
    opacity: .22;
  }

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
  position: absolute;
  inset: 0;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
}

// Header
.document-card__header {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.doc-year {
  font-family: $font-display;
  font-size: 88px;
  line-height: 1;
  color: $ink-heavy;
  text-shadow: 0 0 50px rgba($ink-heavy, .1);
  transition: opacity .5s ease;

  &:not(.active) {
    opacity: .25;
  }
}

.doc-location {
  font-family: $font-sans;
  font-size: 10px;
  font-weight: 300;
  color: $ink-dan;
  margin-top: 3px;
  letter-spacing: 2px;
}

.doc-ganzhi-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding-top: 8px;
}
.doc-ganzhi-char {
  font-family: $font-display;
  font-size: 24px;
  color: $ink-nong;
  writing-mode: vertical-rl;
  line-height: 1.3;
}
.doc-ganzhi-age {
  font-family: $font-sans;
  font-size: 9px;
  font-weight: 300;
  color: $ink-dan;
  writing-mode: vertical-rl;
  margin-top: 6px;
}

// Separator
.doc-separator {
  width: 100%;
  height: 1px;
  flex-shrink: 0;
  margin-bottom: 14px;
  background: linear-gradient(to right, transparent, rgba($frame-wood, .22) 18%, rgba($frame-wood, .22) 82%, transparent);
}

// Body
.document-card__body {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  scrollbar-width: thin;
  scrollbar-color: $ink-wash transparent;

  &::-webkit-scrollbar { width: 2px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: $ink-zhong; border-radius: 1px; }
}

.doc-text {
  font-family: $font-body;
  font-size: 15px;
  line-height: 2;
  color: $ink-nong;
  text-align: justify;
  white-space: pre-wrap;
}

// Seals
.document-card__seals {
  position: absolute;
  bottom: 22px;
  right: 30px;
  display: flex;
  gap: 10px;
  z-index: 10;
}
</style>
