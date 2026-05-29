<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '../../stores/globalStore'

const store = useGlobalStore()
const chartContainer = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

interface GraphNode {
  name: string
  symbolSize: number
  itemStyle: {
    color: { type: string; x: number; y: number; x2: number; y2: number; colorStops: { offset: number; color: string }[] }
    borderColor?: string
    borderWidth?: number
  }
  label: { show: boolean; fontSize: number; color: string; fontFamily: string }
}

interface GraphLink {
  source: string
  target: string
  lineStyle: { color: string; width: number; opacity: number; curveness: number }
}

function buildGraphOptions(people: string[], selectedPerson: string | null) {
  const peopleData = store.people
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []

  // Build nodes
  people.forEach(person => {
    const info = peopleData[person]
    const count = info?.count || 1
    const isSelected = person === selectedPerson
    const symbolSize = Math.max(30, Math.min(80, count * 5 + 20))

    nodes.push({
      name: person,
      symbolSize: isSelected ? symbolSize * 1.3 : symbolSize,
      itemStyle: {
        color: {
          type: 'radial',
          x: 0.5, y: 0.5, x2: 0.5, y2: 0.5,
          colorStops: [
            { offset: 0, color: '#4A4A4A' },
            { offset: 0.7, color: '#7A7A7A' },
            { offset: 1, color: 'rgba(138,138,138,0)' },
          ],
        },
        ...(isSelected ? { borderColor: '#C24F4F', borderWidth: 3 } : {}),
      },
      label: {
        show: true,
        fontSize: isSelected ? 14 : 12,
        color: isSelected ? '#C24F4F' : '#333',
        fontFamily: 'KaiTi, STKaiti, serif',
      },
    })
  })

  // Build links from co-occurrence data
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
          color: isHighlighted ? '#C24F4F' : '#6B6B6B',
          width: Math.min(4, weight * 0.5 + 1),
          opacity: isHighlighted ? 0.8 : 0.3,
          curveness: 0.2,
        },
      })
    })
  })

  return {
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
      emphasis: {
        focus: 'adjacency',
        itemStyle: { borderColor: '#C24F4F', borderWidth: 2 },
      },
    }],
  }
}

onMounted(() => {
  if (!chartContainer.value) return
  chart = echarts.init(chartContainer.value)

  chart.on('click', { seriesType: 'graph', dataType: 'node' }, (params: any) => {
    if (params.data?.name) {
      store.selectPerson(params.data.name)
    }
  })
})

watch(
  () => [store.activePeople, store.selectedPerson],
  () => {
    if (!chart) return
    if (store.activePeople.length === 0) {
      chart.clear()
      return
    }
    const options = buildGraphOptions(store.activePeople, store.selectedPerson)
    chart.setOption({
      ...options,
      backgroundColor: 'transparent',
      animationDuration: 800,
      animationEasingUpdate: 'quinticInOut',
    })
  },
  { deep: true }
)
</script>

<template>
  <div ref="chartContainer" class="relationship-graph"></div>
</template>

<style lang="scss" scoped>
.relationship-graph {
  width: 100%;
  height: 100%;
}
</style>
