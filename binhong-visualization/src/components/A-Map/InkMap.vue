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

let mapRegistered = false

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
  const sources = [