<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '../../stores/globalStore'
import { buildInkMapOptions } from '../../composables/useInkMapOptions'
import Landmarks from './Landmarks.vue'

const store = useGlobalStore()
const chartContainer = ref<HTMLDivElement>()
const chartInstance = ref<echarts.ECharts | null>(null)
const mapReady = ref(false)
const loadError = ref(false)
const viewRevision = ref(0)

function handleResize() {
  chartInstance.value?.resize()
}

onMounted(async () => {
  if (!chartContainer.value) return

  // Wait for layout to settle (Grid + viewport-scale)
  await nextTick()
  setTimeout(async () => {
    await initMap()
  }, 300)
})

async function initMap() {
  if (!chartContainer.value) return

  // Verify container has dimensions
  const rect = chartContainer.value.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    console.warn('Map container has zero dimensions, retrying...')
    setTimeout(() => initMap(), 500)
    return
  }

  // Load China GeoJSON
  try {
    const response = await fetch('/data/china.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const geoJson = await response.json()

    // Register map with ECharts
    echarts.registerMap('china', geoJson)

    // Create ECharts instance
    const chart = echarts.init(chartContainer.value)
    chartInstance.value = chart

    // Build and set initial options
    const options = buildInkMapOptions(
      store.geodata.locations,
      store.activeLocations,
      store.selectedLocation,
      store.activeEntry,
      store.filteredEntries
    )
    chart.setOption(options, true)

    // Register click handler for scatter (location markers)
    chart.on('click', { seriesType: 'scatter' }, (params: any) => {
      if (params.componentType === 'series' && params.name) {
        store.selectLocation(params.name)
      }
    })

    // Reposition landmarks on geo animation finish
    chart.on('georoam', () => {
      viewRevision.value++
    })

    // Cursor style on hover
    chart.on('mouseover', { seriesType: 'scatter' }, () => {
      chartContainer.value && (chartContainer.value.style.cursor = 'pointer')
    })
    chart.on('mouseout', { seriesType: 'scatter' }, () => {
      chartContainer.value && (chartContainer.value.style.cursor = 'default')
    })

    mapReady.value = true
  } catch (err) {
    console.error('Failed to load map:', err)
    loadError.value = true
  }

  // Listen for window resize
  window.addEventListener('resize', handleResize)
}

// Watch store changes and update map
watch(
  () => [
    store.activeEntry,
    store.filteredEntries,
    store.selectedLocation,
    store.activeLocations,
    store.geodata,
  ],
  () => {
    if (!chartInstance.value || !mapReady.value) return
    const options = buildInkMapOptions(
      store.geodata.locations,
      store.activeLocations,
      store.selectedLocation,
      store.activeEntry,
      store.filteredEntries
    )
    chartInstance.value.setOption(options, false)
    viewRevision.value++
  },
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})
</script>

<template>
  <div class="ink-map">
    <div ref="chartContainer" class="ink-map__chart"></div>
    <Landmarks
      v-if="mapReady"
      :chart="chartInstance"
      :visible="mapReady"
      :view-revision="viewRevision"
    />
    <div v-if="loadError" class="ink-map__error">
      <span>地图数据加载失败</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ink-map {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: transparent;

  &__chart {
    width: 100%;
    height: 100%;
  }

  &__error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Noto Sans SC', sans-serif;
    font-size: 14px;
    color: rgba(74, 67, 58, 0.5);
  }
}
</style>
