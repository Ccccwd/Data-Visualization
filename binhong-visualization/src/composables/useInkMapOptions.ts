import type { EChartsOption } from 'echarts'
import type { Entry, GeoLocation } from '../types'

// ═══════════════════════════════════════
// Background routes: 黄宾虹一生主要旅行路线
// ═══════════════════════════════════════
const BACKGROUND_ROUTES: [number, number][][] = [
  [[121.47, 31.23], [120.15, 30.27]],       // 上海→杭州
  [[121.47, 31.23], [116.40, 39.90]],       // 上海→北京
  [[121.47, 31.23], [118.80, 32.06]],       // 上海→南京
  [[121.47, 31.23], [118.17, 30.13]],       // 上海→黄山
  [[121.47, 31.23], [113.26, 23.13]],       // 上海→广州
  [[104.07, 30.57], [103.33, 29.60]],       // 成都→峨眉
  [[104.07, 30.57], [103.77, 29.55]],       // 成都→乐山
  [[104.07, 30.57], [106.55, 29.56]],       // 成都→重庆
  [[114.31, 30.59], [109.88, 31.07]],       // 武汉→巫山
  [[120.15, 30.27], [119.65, 29.08]],       // 杭州→金华
]

// Province color palette (ink-wash tones)
const PROVINCE_COLORS = [
  'rgba(74,67,58,0.04)',
  'rgba(74,67,58,0.06)',
  'rgba(74,67,58,0.05)',
  'rgba(74,67,58,0.07)',
  'rgba(74,67,58,0.03)',
  'rgba(74,67,58,0.05)',
]

function getProvinceColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash = hash & hash
  }
  return PROVINCE_COLORS[Math.abs(hash) % PROVINCE_COLORS.length]
}

// ═══════════════════════════════════════
// Label collision avoidance
// ═══════════════════════════════════════
type LabelPosition = 'top' | 'bottom' | 'left' | 'right'

/**
 * Assign label positions to avoid overlap.
 * Uses a greedy algorithm: process locations from most important to least,
 * and pick the position that minimizes overlap with already-placed labels.
 */
function resolveLabelPositions(locations: GeoLocation[]): Map<string, LabelPosition> {
  const POSITIONS: LabelPosition[] = ['bottom', 'right', 'left', 'top']
  const result = new Map<string, LabelPosition>()
  const placed: { x: number; y: number; w: number; h: number }[] = []

  // Estimate pixel size of a label based on name length
  function labelRect(coords: [number, number], pos: LabelPosition, name: string) {
    // Approximate: each char ~14px wide, height ~16px
    const textW = name.length * 14
    const textH = 16
    // Rough geo-to-pixel conversion at zoom ~1.15: ~8px per degree
    const scale = 8
    const offset = 12 // distance from point
    const [lng, lat] = coords
    let x: number, y: number
    switch (pos) {
      case 'bottom': x = lng - textW / (2 * scale); y = lat - (offset + textH) / scale; break
      case 'top':    x = lng - textW / (2 * scale); y = lat + offset / scale; break
      case 'left':   x = lng - (offset + textW) / scale; y = lat - textH / (2 * scale); break
      case 'right':  x = lng + offset / scale; y = lat - textH / (2 * scale); break
    }
    return { x, y, w: textW / scale, h: textH / scale }
  }

  function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
    return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)
  }

  // Sort by importance: high mentionCount first
  const sorted = [...locations].sort((a, b) => b.mentionCount - a.mentionCount)

  for (const loc of sorted) {
    let bestPos: LabelPosition = 'bottom'
    let minCollisions = Infinity

    for (const pos of POSITIONS) {
      const rect = labelRect(loc.coords, pos, loc.name)
      let collisions = 0
      for (const p of placed) {
        if (overlaps(rect, p)) collisions++
      }
      if (collisions < minCollisions) {
        minCollisions = collisions
        bestPos = pos
      }
    }

    result.set(loc.name, bestPos)
    placed.push(labelRect(loc.coords, bestPos, loc.name))
  }

  return result
}

/** Build the full ECharts option for the ink-wash map */
export function buildInkMapOptions(
  allLocations: GeoLocation[],
  activeLocations: { name: string; coords: [number, number] | null }[],
  selectedLocation: string | null,
  activeEntry: Entry | null,
  _filteredEntries: Entry[],
  provinceNames?: string[]
): EChartsOption {
  const activeNameSet = new Set(activeLocations.map(l => l.name))

  // Resolve label positions to avoid overlap
  const labelPositions = resolveLabelPositions(allLocations)

  // Build scatter data
  const inactiveData = allLocations
    .filter(loc => !activeNameSet.has(loc.name) && loc.name !== selectedLocation)
    .map(loc => {
      const pos = labelPositions.get(loc.name) || 'bottom'
      return {
        name: loc.name,
        value: [...loc.coords, 0] as [number, number, number],
        symbolSize: loc.mentionCount > 5 ? 12 : loc.mentionCount > 2 ? 9 : 7,
        itemStyle: { color: 'rgba(74,67,58,0.5)' },
        label: {
          show: true,
          position: pos,
          formatter: loc.name,
          color: 'rgba(42,37,32,0.85)',
          fontSize: 12,
          fontFamily: 'ZCOOL XiaoWei, serif',
          distance: 8,
        },
      }
    })

  const activeData = allLocations
    .filter(loc => activeNameSet.has(loc.name) || loc.name === selectedLocation)
    .map(loc => {
      const isSelected = loc.name === selectedLocation
      const pos = labelPositions.get(loc.name) || 'bottom'
      return {
        name: loc.name,
        value: [...loc.coords, 1] as [number, number, number],
        symbolSize: isSelected
          ? (loc.mentionCount > 5 ? 20 : loc.mentionCount > 2 ? 16 : 14)
          : (loc.mentionCount > 5 ? 16 : loc.mentionCount > 2 ? 13 : 10),
        itemStyle: {
          color: isSelected ? '#B83A2E' : 'rgba(184,58,46,0.85)',
          shadowBlur: isSelected ? 15 : 8,
          shadowColor: 'rgba(184,58,46,0.4)',
        },
        label: {
          show: true,
          position: pos,
          formatter: loc.name,
          color: isSelected ? '#B83A2E' : 'rgba(42,37,32,0.9)',
          fontSize: isSelected ? 16 : 14,
          fontWeight: isSelected ? 'bold' as const : 'normal' as const,
          fontFamily: isSelected ? 'Ma Shan Zheng, cursive' : 'ZCOOL XiaoWei, serif',
          distance: 12,
        },
      }
    })

  // Background route lines
  const bgLineSeries = BACKGROUND_ROUTES.map(r => ({
    type: 'lines' as const,
    coordinateSystem: 'geo',
    geoIndex: 0,
    zlevel: 1,
    silent: true,
    polyline: false,
    data: [{ coords: r }],
    lineStyle: {
      color: 'rgba(74,61,46,0.15)',
      width: 1,
      type: 'dashed' as const,
      opacity: 1,
      curveness: 0.2,
    },
    effect: { show: false },
  }))

  // Active route segments
  let activeRouteSeries: any = null
  if (activeEntry) {
    const locsWithCoords = activeEntry.locations.filter(l => l.coords)
    if (locsWithCoords.length >= 2) {
      const segments: { coords: [number, number][] }[] = []
      for (let i = 0; i < locsWithCoords.length - 1; i++) {
        segments.push({
          coords: [
            locsWithCoords[i].coords as [number, number],
            locsWithCoords[i + 1].coords as [number, number],
          ],
        })
      }
      activeRouteSeries = {
        type: 'lines' as const,
        coordinateSystem: 'geo',
        geoIndex: 0,
        zlevel: 2,
        silent: true,
        polyline: false,
        data: segments,
        lineStyle: {
          color: '#B83A2E',
          width: 2,
          type: 'dashed' as const,
          opacity: 0.5,
          curveness: 0.2,
        },
        effect: {
          show: true,
          period: 6,
          trailLength: 0.3,
          symbol: 'circle',
          symbolSize: 3,
          color: '#B83A2E',
        },
      }
    }
  }

  // Determine flyTo target
  let geoCenter: [number, number] | undefined
  let geoZoom: number | undefined
  if (activeEntry) {
    const primaryLoc = activeEntry.locations.find(l => l.name === activeEntry.primaryLocation)
    const firstLoc = activeEntry.locations[0]
    const target = primaryLoc?.coords || firstLoc?.coords
    if (target) {
      geoCenter = target
      geoZoom = 5
    }
  }

  // Province regions coloring
  const regions = (provinceNames || []).map(name => ({
    name,
    itemStyle: { areaColor: getProvinceColor(name) },
    label: { show: false },
  }))
  regions.push({ name: '南海诸岛', itemStyle: { areaColor: 'rgba(74,67,58,0.02)' }, label: { show: false } })

  const series: any[] = [
    ...bgLineSeries,
    ...(activeRouteSeries ? [activeRouteSeries] : []),
    {
      type: 'scatter' as const,
      coordinateSystem: 'geo',
      geoIndex: 0,
      zlevel: 3,
      silent: false,
      data: inactiveData,
    },
    {
      type: 'effectScatter' as const,
      coordinateSystem: 'geo',
      geoIndex: 0,
      zlevel: 4,
      silent: false,
      showEffectOn: 'render',
      rippleEffect: { brushType: 'stroke', scale: 3, period: 4 },
      data: activeData,
    },
  ]

  return {
    backgroundColor: 'transparent',
    geo: {
      map: 'china',
      roam: false,
      center: geoCenter || [105, 35],
      zoom: geoZoom || 1.15,
      aspectScale: 0.78,
      itemStyle: {
        areaColor: 'rgba(74,67,58,0.04)',
        borderColor: 'rgba(74,67,58,0.3)',
        borderWidth: 1,
        shadowColor: 'rgba(74,67,58,0.15)',
        shadowBlur: 15,
      },
      emphasis: { disabled: true },
      select: { disabled: true },
      label: { show: false },
      regions,
    },
    series,
    animation: true,
    animationDuration: 800,
    animationEasingUpdate: 'cubicInOut',
  }
}
