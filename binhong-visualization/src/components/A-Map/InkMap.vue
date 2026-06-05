<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '../../stores/globalStore'
import { buildInkMapOptions } from '../../composables/useInkMapOptions'

const store = useGlobalStore()
const chartContainer = ref<HTMLDivElement>()
const chartInstance = ref<echarts.ECharts | null>(null)
const mapReady = ref(false)
const loadError = ref(false)

const provinceNames = ref<string[]>([])

function handleResize() {
  chartInstance.value?.resize()
}

onMounted(async () => {
  if (!chartContainer.value) return
  await nextTick()
  setTimeout(async () => { await initMap() }, 300)
})

async function initMap() {
  if (!chartContainer.value) return

  const rect = chartContainer.value.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    console.warn('Map container has zero dimensions, retrying...')
    setTimeout(() => initMap(), 500)
    return
  }

  try {
    const response = await fetch('/data/china.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const geoJson = await response.json()

    if (geoJson.features) {
      provinceNames.value = geoJson.features
        .map((f: any) => f.properties?.name)
        .filter((n: any) => n && n !== '南海诸岛')
    }

    echarts.registerMap('china', geoJson)

    const chart = echarts.init(chartContainer.value)
    chartInstance.value = chart

    const options = buildInkMapOptions(
      store.geodata.locations,
      store.activeLocations,
      store.selectedLocation,
      store.activeEntry,
      store.filteredEntries,
      provinceNames.value
    )
    chart.setOption(options, true)

    // Click handlers for both scatter and effectScatter
    chart.on('click', { seriesType: 'scatter' }, (params: any) => {
      if (params.componentType === 'series' && params.name) {
        store.selectLocation(params.name)
      }
    })
    chart.on('click', { seriesType: 'effectScatter' }, (params: any) => {
      if (params.componentType === 'series' && params.name) {
        store.selectLocation(params.name)
      }
    })

    chart.on('mouseover', (params: any) => {
      if (params.componentType === 'series') {
        chartContainer.value && (chartContainer.value.style.cursor = 'pointer')
      }
    })
    chart.on('mouseout', () => {
      chartContainer.value && (chartContainer.value.style.cursor = 'default')
    })

    mapReady.value = true
  } catch (err) {
    console.error('Failed to load map:', err)
    loadError.value = true
  }

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
      store.filteredEntries,
      provinceNames.value
    )
    chartInstance.value.setOption(options, false)
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
