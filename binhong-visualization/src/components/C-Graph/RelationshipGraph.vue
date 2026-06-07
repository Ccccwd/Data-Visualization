<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '../../stores/globalStore'

const store = useGlobalStore()
const chartContainer = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

const HUB_NAME = '黄宾虹'

// ═══ Mineral Pigment Colors ═══
const PIGMENT_COLORS: Record<string, { center: string; mid: string; label: string }> = {
  revolutionary: { center: 'rgba(139,69,19,0.85)', mid: 'rgba(139,69,19,0.35)', label: '革命先驱' },
  reformist:     { center: 'rgba(90,138,106,0.85)', mid: 'rgba(90,138,106,0.30)', label: '维新改良' },
  kmt:           { center: 'rgba(74,107,138,0.85)', mid: 'rgba(74,107,138,0.30)', label: '国民党系' },
  leftist:       { center: 'rgba(184,58,46,0.85)',  mid: 'rgba(184,58,46,0.30)',  label: '左翼进步' },
  traditionalist:{ center: 'rgba(168,136,74,0.85)', mid: 'rgba(168,136,74,0.30)', label: '传统遗老' },
  apolitical:    { center: 'rgba(168,158,146,0.55)', mid: 'rgba(168,158,146,0.18)', label: '未详' },
}

const politicalMap = computed(() => {
  const map = new Map<string, string>()
  store.politicalProfiles.forEach((p: any) => {
    map.set(p.name, p.affiliation)
  })
  return map
})

const isPoliticsView = computed(() => store.viewTheme === 'politics')

// ═══ Hub-and-spoke positions: 黄宾虹 always at center ═══
function computeHubLayout(people: string[], selectedPerson: string | null) {
  const positions: Record<string, [number, number]> = {}

  // Graph area: ~960×332, center with padding
  const cx = 480, cy = 168
  const maxPeople = 12
  const others = people.filter(p => p !== HUB_NAME).slice(0, maxPeople)
  const count = others.length
  if (count === 0) {
    positions[HUB_NAME] = [cx, cy]
    return { positions, spokes: [] }
  }

  // 黄宾虹 at center
  positions[HUB_NAME] = [cx, cy]

  // Adaptive radius: tighter for few people, wider for many
  const radius = Math.min(125, Math.max(70, count * 12))

  // Sort: selected person first, then by connection weight
  const sorted = [...others]
  if (selectedPerson && sorted.includes(selectedPerson)) {
    const idx = sorted.indexOf(selectedPerson)
    sorted.splice(idx, 1)
    sorted.unshift(selectedPerson)
  }

  // Distribute on circle, starting from top
  sorted.forEach((person, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    positions[person] = [
      Math.round(cx + radius * Math.cos(angle)),
      Math.round(cy + radius * Math.sin(angle)),
    ]
  })

  // Spoke connections: everyone connects to 黄宾虹
  const spokes = sorted.map(p => ({ from: HUB_NAME, to: p }))
  return { positions, spokes }
}

function buildGraphOptions(people: string[], selectedPerson: string | null) {
  const peopleData = store.people
  const { positions, spokes } = computeHubLayout(people, selectedPerson)

  // Add 黄宾虹 to people list if not present
  const allPeople = people.includes(HUB_NAME) ? people : [HUB_NAME, ...people]
  const nodes: any[] = []
  const links: any[] = []

  // ── Build nodes ──
  allPeople.forEach((person) => {
    const pos = positions[person]
    if (!pos) return

    const isHub = person === HUB_NAME
    const isSelected = person === selectedPerson
    const info = peopleData[person]
    const count = info?.count || 1

    // Hub node — seal stamp style
    if (isHub) {
      nodes.push({
        name: HUB_NAME,
        x: pos[0], y: pos[1],
        symbolSize: 52,
        fixed: true,
        symbol: 'roundRect',
        itemStyle: {
          color: {
            type: 'radial', x: 0.5, y: 0.5, x2: 0.5, y2: 0.5,
            colorStops: [
              { offset: 0, color: '#B83A2E' },
              { offset: 0.6, color: 'rgba(184,58,46,0.6)' },
              { offset: 0.85, color: 'rgba(184,58,46,0.15)' },
              { offset: 1, color: 'transparent' },
            ],
          },
          borderColor: 'rgba(184,58,46,0.5)',
          borderWidth: 1.5,
          shadowBlur: 12,
          shadowColor: 'rgba(184,58,46,0.2)',
        },
        label: {
          show: true,
          fontSize: 15,
          fontWeight: '700',
          color: '#B83A2E',
          fontFamily: 'Ma Shan Zheng, cursive',
          position: 'inside',
        },
      })
      return
    }

    // Spoke nodes
    const isActive = isSelected || (selectedPerson && info?.connections?.[selectedPerson])
    const symbolSize = Math.max(22, Math.min(38, count * 2 + 14))

    if (isPoliticsView.value) {
      const affiliation = politicalMap.value.get(person) || 'apolitical'
      const pigment = PIGMENT_COLORS[affiliation]
      nodes.push({
        name: person, x: pos[0], y: pos[1], symbolSize, fixed: true,
        value: { affiliation },
        itemStyle: {
          color: {
            type: 'radial', x: 0.5, y: 0.5, x2: 0.5, y2: 0.5,
            colorStops: isActive
              ? [{ offset: 0, color: pigment.center }, { offset: 0.5, color: pigment.mid }, { offset: 1, color: 'transparent' }]
              : [{ offset: 0, color: pigment.center.replace('0.85', '0.4') }, { offset: 1, color: 'transparent' }],
          },
          ...(isSelected ? { borderColor: pigment.center, borderWidth: 1.5 } : {}),
        },
        label: {
          show: true, fontSize: isSelected ? 12 : 10,
          color: isActive ? pigment.center : 'rgba(42,37,32,0.75)',
          fontFamily: 'Noto Serif SC, serif',
          ...(isSelected ? { fontWeight: '600' } : {}),
        },
      })
    } else {
      nodes.push({
        name: person, x: pos[0], y: pos[1], symbolSize, fixed: true,
        itemStyle: {
          color: {
            type: 'radial', x: 0.5, y: 0.5, x2: 0.5, y2: 0.5,
            colorStops: isActive
              ? [{ offset: 0, color: 'rgba(184,58,46,0.7)' }, { offset: 0.45, color: 'rgba(184,58,46,0.25)' }, { offset: 1, color: 'transparent' }]
              : [{ offset: 0, color: 'rgba(42,37,32,0.45)' }, { offset: 0.5, color: 'rgba(74,67,58,0.15)' }, { offset: 1, color: 'transparent' }],
          },
          ...(isSelected ? { borderColor: '#B83A2E', borderWidth: 1.5 } : {}),
        },
        label: {
          show: true, fontSize: isSelected ? 12 : 10,
          color: isActive ? '#B83A2E' : 'rgba(42,37,32,0.8)',
          fontFamily: 'Noto Serif SC, serif',
          ...(isSelected ? { fontWeight: '600' } : {}),
        },
      })
    }
  })

  // ── Build links ──
  // 1) Spoke lines: hub → each person (always visible, subtle)
  spokes.forEach(spoke => {
    const isSelected = spoke.to === selectedPerson
    links.push({
      source: spoke.from, target: spoke.to,
      lineStyle: {
        color: isSelected ? 'rgba(184,58,46,0.45)' : 'rgba(74,67,58,0.12)',
        width: isSelected ? 2 : 1,
        type: isSelected ? 'solid' : 'dashed',
        opacity: isSelected ? 0.7 : 0.35,
        curveness: 0,
      },
    })
  })

  // 2) Inter-person links (from old connection data)
  const addedLinks = new Set<string>()
  const visiblePeople = allPeople.filter(p => positions[p])
  visiblePeople.forEach(person => {
    if (person === HUB_NAME) return
    const info = peopleData[person]
    if (!info?.connections) return
    Object.entries(info.connections).forEach(([other, weight]) => {
      if (!positions[other]) return
      const key = [person, other].sort().join('-')
      if (addedLinks.has(key)) return
      addedLinks.add(key)

      const isHighlighted = selectedPerson && (person === selectedPerson || other === selectedPerson)
      const w = weight as number

      if (isPoliticsView.value) {
        const aff1 = politicalMap.value.get(person) || 'apolitical'
        const aff2 = politicalMap.value.get(other) || 'apolitical'
        const isCross = aff1 !== aff2
        links.push({
          source: person, target: other,
          lineStyle: {
            color: isHighlighted ? (isCross ? '#A8884A' : PIGMENT_COLORS[aff1].center) : 'rgba(74,67,58,0.08)',
            width: Math.min(1.5, w * 0.2 + 0.5),
            opacity: isHighlighted ? 0.6 : 0.2,
            curveness: 0.15,
            type: isCross ? 'dashed' : 'solid',
          },
        })
      } else {
        links.push({
          source: person, target: other,
          lineStyle: {
            color: isHighlighted ? 'rgba(184,58,46,0.4)' : 'rgba(74,67,58,0.08)',
            width: Math.min(1.5, w * 0.2 + 0.5),
            opacity: isHighlighted ? 0.6 : 0.18,
            curveness: 0.15,
            type: 'dashed',
          },
        })
      }
    })
  })

  return { nodes, links }
}

function handleResize() { chart?.resize() }

onMounted(() => {
  if (!chartContainer.value) return
  chart = echarts.init(chartContainer.value)

  chart.on('click', { dataType: 'node' }, (params: any) => {
    if (!params.name) return
    // Click 黄宾虹 or already-selected person → deselect, return to year view
    if (params.name === HUB_NAME || params.name === store.selectedPerson) {
      if (store.selectedYear) store.selectYear(store.selectedYear)
      return
    }
    store.selectPerson(params.name)
  })

  chart.on('mouseover', { dataType: 'node' }, (params: any) => {
    if (chartContainer.value && params.name !== HUB_NAME) chartContainer.value.style.cursor = 'pointer'
  })
  chart.on('mouseout', { dataType: 'node' }, () => {
    if (chartContainer.value) chartContainer.value.style.cursor = 'default'
  })

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) { chart.dispose(); chart = null }
})

const graphTitle = computed(() => {
  if (store.viewTheme === 'politics') return '政治光谱'
  if (store.viewTheme === 'turmoil') return '战时交游'
  if (store.viewTheme === 'art') return '艺术交游'
  return '文人交游'
})

const legendItems = computed(() => {
  if (!isPoliticsView.value) return []
  return Object.entries(PIGMENT_COLORS)
    .filter(([key]) => key !== 'apolitical')
    .map(([key, val]) => ({ key, ...val }))
})

watch(
  () => [store.activePeople, store.selectedPerson, store.viewTheme],
  () => {
    if (!chart) return
    const people = store.activePeople
    if (people.length === 0) { chart.clear(); return }
    const { nodes, links } = buildGraphOptions(people, store.selectedPerson)
    chart.setOption({
      backgroundColor: 'transparent',
      series: [{
        type: 'graph',
        layout: 'none',
        data: nodes,
        links: links,
        roam: false,
        draggable: false,
        label: { position: 'bottom', distance: 8 },
        lineStyle: { opacity: 1 },
        emphasis: {
          focus: 'adjacency',
          itemStyle: { borderColor: '#B83A2E', borderWidth: 2 },
          lineStyle: { color: '#B83A2E', width: 2.5 },
        },
      }],
      animation: true,
      animationDuration: 500,
      animationDurationUpdate: 350,
      animationEasingUpdate: 'cubicOut',
    }, true)
  },
  { deep: true }
)
</script>

<template>
  <div class="relationship-graph">
    <div class="relationship-graph__title">{{ graphTitle }}</div>
    <div ref="chartContainer" class="relationship-graph__chart"></div>

    <!-- Political Legend -->
    <Transition name="legend-fade">
      <div v-if="isPoliticsView" class="politics-legend">
        <div class="politics-legend__title">颜料图例</div>
        <div v-for="item in legendItems" :key="item.key" class="politics-legend__item">
          <span class="politics-legend__swatch" :style="{ background: item.center }"></span>
          <span class="politics-legend__label">{{ item.label }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.relationship-graph {
  width: 100%; height: 100%;
  position: relative;
  background-color: $parchment-dark;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 36px, rgba($frame-wood, .05) 36px, rgba($frame-wood, .05) 37px),
    repeating-linear-gradient(90deg, transparent, transparent 36px, rgba($frame-wood, .05) 36px, rgba($frame-wood, .05) 37px),
    radial-gradient(ellipse at 50% 50%, rgba($aged-paper, .12) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 70%, rgba($ink-wash, .1) 0%, transparent 45%);

  &__title {
    position: absolute; top: 14px; left: 20px; z-index: 5;
    font-family: $font-display; font-size: 16px;
    color: $ink-zhong; opacity: .6; letter-spacing: 3px;
    pointer-events: none; transition: all 0.4s ease;
  }

  &__chart { width: 100%; height: 100%; }
}

// ═══ Political Legend ═══
.politics-legend {
  position: absolute; top: 10px; right: 12px; z-index: 20;
  padding: 10px 12px;
  background: rgba($rice-paper, 0.92);
  border: 1px solid rgba($frame-wood, 0.2);
  box-shadow: 0 1px 8px rgba($ink-heavy, 0.06);
  display: flex; flex-direction: column; gap: 5px;

  &::before, &::after {
    content: ''; position: absolute;
    width: 8px; height: 8px;
    border-color: rgba($cinnabar, 0.25); border-style: solid;
  }
  &::before { top: 3px; left: 3px; border-width: 1px 0 0 1px; }
  &::after  { bottom: 3px; right: 3px; border-width: 0 1px 1px 0; }
}

.politics-legend__title {
  font-family: $font-label; font-size: 9px;
  color: rgba($ink-dan, 0.6); letter-spacing: 2px;
  margin-bottom: 2px; text-align: center;
}

.politics-legend__item {
  display: flex; align-items: center; gap: 5px;
}

.politics-legend__swatch {
  width: 8px; height: 8px; border-radius: 1px; flex-shrink: 0;
  box-shadow: inset 0 0 2px rgba(0,0,0,0.1);
}

.politics-legend__label {
  font-family: $font-sans; font-size: 9px; font-weight: 300;
  color: $ink-dan; letter-spacing: 0.5px;
}

.legend-fade-enter-active {
  transition: opacity 0.5s ease 0.3s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;
}
.legend-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.legend-fade-enter-from { opacity: 0; transform: translateY(-8px) scale(0.95); }
.legend-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
