<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '../../stores/globalStore'

const store = useGlobalStore()
const chartContainer = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

interface GraphNode {
  name: string
  symbolSize: number
  x?: number
  y?: number
  itemStyle: {
    color: { type: string; x: number; y: number; x2: number; y2: number; colorStops: { offset: number; color: string }[] }
    borderColor?: string
    borderWidth?: number
  }
  label: { show: boolean; fontSize: number; color: string; fontFamily: string; fontWeight?: string }
}

interface GraphLink {
  source: string
  target: string
  lineStyle: { color: string; width: number; opacity: number; curveness: number; type?: string }
}

function buildGraphOptions(people: string[], selectedPerson: string | null) {
  const peopleData = store.people
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []

  people.forEach((person) => {
    const info = peopleData[person]
    const count = info?.count || 1
    const isSelected = person === selectedPerson
    const symbolSize = Math.max(30, Math.min(64, count * 5 + 20))

    const isActive = isSelected || (selectedPerson && info?.connections?.[selectedPerson])

    nodes.push({
      name: person,
      symbolSize: isSelected ? symbolSize * 1.3 : symbolSize,
      itemStyle: {
        color: {
          type: 'radial', x: 0.5, y: 0.5, x2: 0.5, y2: 0.5,
          colorStops: isActive
            ? [
                { offset: 0, color: 'rgba(184,58,46,0.85)' },
                { offset: 0.5, color: 'rgba(184,58,46,0.35)' },
                { offset: 0.8, color: 'rgba(184,58,46,0.08)' },
                { offset: 1, color: 'transparent' },
              ]
            : [
                { offset: 0, color: 'rgba(42,37,32,0.55)' },
                { offset: 0.55, color: 'rgba(74,67,58,0.22)' },
                { offset: 1, color: 'transparent' },
              ],
        },
        ...(isSelected ? { borderColor: '#B83A2E', borderWidth: 2 } : {}),
      },
      label: {
        show: true,
        fontSize: isSelected ? 13 : 10,
        color: isActive ? '#B83A2E' : 'rgba(74,67,58,0.7)',
        fontFamily: 'Noto Serif SC, serif',
        ...(isSelected ? { fontWeight: '600' } : {}),
      },
    })
  })

  const addedLinks = new Set<string>()
  people.forEach(person => {
    const info = peopleData[person]
    if (!info?.connections) return
    Object.entries(info.connections).forEach(([other, weight]) => {
      if (!people.includes(other)) return
      const key = [person, other].sort().join('-')
      if (addedLinks.has(key)) return
      addedLinks.add(key)

      const isHighlighted = selectedPerson && (person === selectedPerson || other === selectedPerson)
      links.push({
        source: person,
        target: other,
        lineStyle: {
          color: isHighlighted ? '#B83A2E' : 'rgba(74,67,58,0.2)',
          width: Math.min(3, weight * 0.4 + 1),
          opacity: isHighlighted ? 0.7 : 0.3,
          curveness: 0.2,
          type: 'dashed',
        },
      })
    })
  })

  return { nodes, links }
}

function handleResize() {
  chart?.resize()
}

onMounted(() => {
  if (!chartContainer.value) return
  chart = echarts.init(chartContainer.value)

  // Register click handler for graph nodes
  chart.on('click', { dataType: 'node' }, (params: any) => {
    if (params.name) {
      store.selectPerson(params.name)
    }
  })

  // Cursor style on hover
  chart.on('mouseover', { dataType: 'node' }, () => {
    if (chartContainer.value) chartContainer.value.style.cursor = 'pointer'
  })
  chart.on('mouseout', { dataType: 'node' }, () => {
    if (chartContainer.value) chartContainer.value.style.cursor = 'default'
  })

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})

watch(
  () => [store.activePeople, store.selectedPerson],
  () => {
    if (!chart) return
    if (store.activePeople.length === 0) {
      chart.clear()
      return
    }
    const { nodes, links } = buildGraphOptions(store.activePeople, store.selectedPerson)
    chart.setOption({
      backgroundColor: 'transparent',
      series: [{
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 200,
          gravity: 0.1,
          edgeLength: [80, 200],
        },
        data: nodes,
        links: links,
        roam: true,
        draggable: true,
        label: { position: 'bottom', distance: 8 },
        lineStyle: { opacity: 1 },
        emphasis: {
          focus: 'adjacency',
          itemStyle: { borderColor: '#B83A2E', borderWidth: 2 },
          lineStyle: { color: '#B83A2E', width: 3 },
        },
      }],
      animation: true,
      animationDuration: 800,
      animationEasingUpdate: 'quinticInOut',
    })
  },
  { deep: true }
)
</script>

<template>
  <div class="relationship-graph">
    <div class="relationship-graph__title">文人交游</div>
    <div ref="chartContainer" class="relationship-graph__chart"></div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.relationship-graph {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: $parchment-dark;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 36px, rgba($frame-wood, .05) 36px, rgba($frame-wood, .05) 37px),
    repeating-linear-gradient(90deg, transparent, transparent 36px, rgba($frame-wood, .05) 36px, rgba($frame-wood, .05) 37px),
    radial-gradient(ellipse at 30% 40%, rgba($aged-paper, .15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 70%, rgba($ink-wash, .12) 0%, transparent 45%);

  &__title {
    position: absolute;
    top: 14px;
    left: 20px;
    z-index: 5;
    font-family: $font-display;
    font-size: 16px;
    color: $ink-dan;
    opacity: .35;
    letter-spacing: 3px;
    pointer-events: none;
  }

  &__chart {
    width: 100%;
    height: 100%;
  }
}
</style>
