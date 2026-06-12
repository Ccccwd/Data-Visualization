<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useGlobalStore } from '../../stores/globalStore'

const store = useGlobalStore()
const chartContainer = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

const HUB_NAME = '黄宾虹'

// ═══ Mineral Pigment Colors (矿物颜料) ═══
// Inspired by traditional Chinese painting pigments:
// 朱砂(cinnabar), 石青(azurite), 石绿(malachite), 藤黄(gamboge), 赭石(ochre), 花青(indigo)
const PIGMENT_COLORS: Record<string, { center: string; mid: string; label: string; pigment: string }> = {
  revolutionary: { center: '#C23B2E', mid: 'rgba(194,59,46,0.28)', label: '革命先驱', pigment: '朱砂' },
  reformist:     { center: '#3D7A5F', mid: 'rgba(61,122,95,0.25)',  label: '维新改良', pigment: '石绿' },
  kmt:           { center: '#3B6B8A', mid: 'rgba(59,107,138,0.25)', label: '国民党系', pigment: '石青' },
  leftist:       { center: '#8B4513', mid: 'rgba(139,69,19,0.28)',  label: '左翼进步', pigment: '赭石' },
  traditionalist:{ center: '#A07830', mid: 'rgba(160,120,48,0.25)', label: '传统遗老', pigment: '藤黄' },
  apolitical:    { center: '#8A8278', mid: 'rgba(138,130,120,0.18)',label: '未详',     pigment: '宿墨' },
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
    const symbolSize = Math.max(26, Math.min(44, count * 2 + 18))

    if (isPoliticsView.value) {
      const affiliation = politicalMap.value.get(person) || 'apolitical'
      const pigment = PIGMENT_COLORS[affiliation]
      // Parse center hex to rgba
      const r = parseInt(pigment.center.slice(1, 3), 16)
      const g = parseInt(pigment.center.slice(3, 5), 16)
      const b = parseInt(pigment.center.slice(5, 7), 16)

      // In politics view: ALL nodes always show their category color at full strength
      // Only selected node gets extra emphasis (border + glow)
      // Slightly dim nodes of OTHER categories when a person is selected
      const isSameCategory = selectedPerson
        ? affiliation === (politicalMap.value.get(selectedPerson) || 'apolitical')
        : true
      const dimFactor = (selectedPerson && !isSelected && !isSameCategory) ? 0.65 : 1.0

      nodes.push({
        name: person, x: pos[0], y: pos[1], symbolSize, fixed: true,
        value: { affiliation },
        itemStyle: {
          color: {
            type: 'radial', x: 0.5, y: 0.5, x2: 0.5, y2: 0.5,
            colorStops: [
              { offset: 0, color: `rgba(${r},${g},${b},${0.9 * dimFactor})` },
              { offset: 0.5, color: `rgba(${r},${g},${b},${0.35 * dimFactor})` },
              { offset: 1, color: 'transparent' },
            ],
          },
          ...(isSelected ? { borderColor: pigment.center, borderWidth: 2, shadowBlur: 10, shadowColor: `rgba(${r},${g},${b},0.35)` } : {}),
        },
        label: {
          show: true, fontSize: isSelected ? 13 : 11,
          color: `rgba(${r},${g},${b},${0.95 * dimFactor})`,
          fontFamily: 'Noto Serif SC, serif',
          ...(isSelected ? { fontWeight: '700' } : {}),
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
          show: true, fontSize: isSelected ? 13 : 11,
          color: isActive ? '#B83A2E' : 'rgba(42,37,32,0.95)',
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
        const p1 = PIGMENT_COLORS[aff1]
        links.push({
          source: person, target: other,
          lineStyle: {
            color: isHighlighted ? (isCross ? 'rgba(160,120,48,0.5)' : p1.mid) : 'rgba(74,67,58,0.08)',
            width: Math.min(1.5, w * 0.2 + 0.5),
            opacity: isHighlighted ? 0.7 : 0.2,
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

    <!-- Political Legend: Inkstone Palette (砚谱) -->
    <Transition name="legend-fade">
      <div v-if="isPoliticsView" class="pigment-legend">
        <div class="pigment-legend__scroll-top"></div>
        <div class="pigment-legend__header">
          <span class="pigment-legend__seal">谱</span>
          <span class="pigment-legend__title">矿物颜料</span>
        </div>
        <div class="pigment-legend__divider"></div>
        <div v-for="item in legendItems" :key="item.key" class="pigment-legend__item">
          <span class="pigment-legend__dot" :style="{
            background: item.center,
            boxShadow: `0 0 5px ${item.mid}, inset 0 -1px 2px rgba(0,0,0,0.15)`
          }"></span>
          <span class="pigment-legend__label">{{ item.label }}</span>
          <span class="pigment-legend__pigment">{{ item.pigment }}</span>
        </div>
        <div class="pigment-legend__scroll-bot"></div>
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

// ═══ Political Legend: Inkstone Palette (砚谱) ═══
.pigment-legend {
  position: absolute; top: 8px; right: 10px; z-index: 20;
  display: flex; flex-direction: column;
  min-width: 108px;
}

.pigment-legend__scroll-top,
.pigment-legend__scroll-bot {
  height: 6px; align-self: center; width: 88%;
  background: linear-gradient(90deg, transparent 2%, rgba($frame-wood, 0.35) 15%, rgba($frame-wood, 0.45) 50%, rgba($frame-wood, 0.35) 85%, transparent 98%);
  border-radius: 3px;
}

.pigment-legend__scroll-top {
  margin-bottom: -1px;
  box-shadow: 0 1px 3px rgba($ink-heavy, 0.08);
}

.pigment-legend__scroll-bot {
  margin-top: -1px;
  box-shadow: 0 -1px 3px rgba($ink-heavy, 0.06);
}

.pigment-legend__header {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 10px 4px 10px;
  background: linear-gradient(180deg, rgba($rice-paper, 0.95) 0%, rgba($aged-paper, 0.88) 100%);
  border-left: 1px solid rgba($frame-wood, 0.2);
  border-right: 1px solid rgba($frame-wood, 0.2);
}

.pigment-legend__seal {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; flex-shrink: 0;
  font-family: $font-display; font-size: 11px; line-height: 1;
  color: rgba($cinnabar, 0.85);
  border: 1.2px solid rgba($cinnabar, 0.55);
  border-radius: 2px;
  background: rgba($cinnabar, 0.06);
}

.pigment-legend__title {
  font-family: $font-label; font-size: 10px;
  color: rgba($ink-zhong, 0.7); letter-spacing: 2px;
}

.pigment-legend__divider {
  height: 1px; margin: 0 10px;
  background: linear-gradient(90deg, transparent, rgba($frame-wood, 0.25) 20%, rgba($frame-wood, 0.25) 80%, transparent);
}

.pigment-legend__item {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  background: rgba($rice-paper, 0.9);
  border-left: 1px solid rgba($frame-wood, 0.15);
  border-right: 1px solid rgba($frame-wood, 0.15);

  &:last-of-type {
    padding-bottom: 7px;
  }
}

.pigment-legend__dot {
  width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
  position: relative;
  // Simulate a ground pigment pool on stone
  &::after {
    content: ''; position: absolute; inset: 1px;
    border-radius: 50%;
    background: radial-gradient(ellipse at 35% 35%, rgba(255,255,255,0.3), transparent 60%);
  }
}

.pigment-legend__label {
  font-family: $font-sans; font-size: 10px; font-weight: 400;
  color: rgba($ink-nong, 0.8); letter-spacing: 0.8px;
  flex: 1;
}

.pigment-legend__pigment {
  font-family: $font-body; font-size: 8.5px; font-weight: 300;
  color: rgba($ink-dan, 0.65); letter-spacing: 1px;
  opacity: 0.8;
}

.legend-fade-enter-active {
  transition: opacity 0.5s ease 0.3s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;
}
.legend-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.legend-fade-enter-from { opacity: 0; transform: translateY(-8px) scale(0.95); }
.legend-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
