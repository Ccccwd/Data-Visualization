<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGlobalStore } from '../../stores/globalStore'
import SealStamp from './SealStamp.vue'

const store = useGlobalStore()

const displayYear = computed(() => {
  if (!store.activeEntry) return { year: '', ganzhi: '' }
  const entry = store.activeEntry
  const year = entry.year ? String(entry.year) : '—'
  const ganzhi = entry.ganzhi || ''
  return { year, ganzhi }
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
  <div class="document-card parchment-bg">
    <div class="document-card__header">
      <div class="year-display" :class="{ active: !!store.activeEntry }">
        {{ displayYear.year }}
      </div>
      <div class="ganzhi-display" v-if="displayYear.ganzhi">
        {{ displayYear.ganzhi }}
      </div>
    </div>
    <div class="document-card__body hide-scrollbar">
      <p class="narrative-text">{{ displayText }}</p>
    </div>
    <div class="document-card__footer" v-if="hasSeals && showSeal">
      <SealStamp
        v-for="seal in store.activeEntry!.seals"
        :key="seal.name"
        :name="seal.name"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.document-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px 32px;
  position: relative;

  &__header {
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
  }

  &__footer {
    position: absolute;
    bottom: 24px;
    right: 32px;
    display: flex;
    gap: 12px;
  }
}

.year-display {
  font-family: $font-calligraphy;
  font-size: 80px;
  line-height: 1;
  color: $ink-light;
  transition: color 0.5s ease;

  &.active {
    color: $ink-black;
  }
}

.ganzhi-display {
  font-family: $font-calligraphy;
  font-size: 20px;
  color: $ink-medium;
  margin-top: 4px;
}

.narrative-text {
  font-family: $font-body;
  font-size: 16px;
  line-height: 1.8;
  color: $ink-dark;
  white-space: pre-wrap;
  text-align: justify;
}
</style>
