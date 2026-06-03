import type { EChartsOption } from 'echarts'
import type { Entry, GeoLocation } from '../types'

interface LocationMarker {
  name: string
  coords: [number, number]
  active: boolean
  selected: boolean
  size: 'lg' | 'md' | 'sm'
}

// ═══════════════════════════════════════
// Background routes: 黄宾虹一生主要旅行路线（固定）
// 坐标格式: [longitude, latitude]
// ═══════════════════════════════════════
const BACKGROUND_ROUTES: [number, number][][] = [
  // 上海出发
  [[121.47, 31.23], [120.15, 30.27]],       // 上海→杭州
  [[121.47, 31.23], [116.40, 39.90]],       // 上海→北京
  [[121.47, 31.23], [118.80, 32.06]],       // 上海→南京
  [[121.47, 31.23], [118.17, 30.13]],       // 上海→黄山
  [[121.47, 31.23], [113.26, 23.13]],       // 上海→广州
  // 成都出发（蜀游）
  [[104.07, 30.57], [103.33, 29.60]],       // 成都→峨眉
  [[104.07, 30.57], [103.77, 29.55]],       // 成都→乐山
  [[104.07, 30.57], [106.55, 29.56]],       // 成都→重庆
  // 其他路线
  [[114.31, 30.59], [109.88, 31.07]],       // 武汉→巫山
  [[120.15, 30.27], [119.65, 29.08]],       // 杭州→金华
]

/** Build ink-dot + seal-stamp scatter data */
function buildScatterData(
  allLocations: GeoLocation[],
  activeLocationNames: Set<string>,
  selectedLocation: string | null
): LocationMarker[] {
  return allLocations.map(loc => ({
    name: loc.name,
    coords: loc.coords,
    active: activeLocationNames.has(loc.name),
    selected: loc.name === selectedLocation,
    size: loc.mentionCount > 5 ? 'lg' : loc.mentionCount > 2 ? 'md' : 'sm',
  }))
}

/** Build the full ECharts option for the ink-wash map */
export function buildInkMapOptions(
  allLocations: GeoLocation[],
  activeLocations: { name: string; coords: [number, number] | null }[],
  selectedLocation: string | null,
  activeEntry: Entry | null,
  _filteredEntries: Entry[]
): EChartsOption {
  const activeNameSet = new Set(activeLocations.map(l => l.name))
  const scatterData = buildScatterData(allLocations, activeNameSet, selectedLocation)

  // Map each scatter point with selectedLocation highlight
  const scatterSeriesData = scatterData.map(loc => {
    // Determine styling based on state: selected > active > inactive
    let color: string
    let borderColor: string
    let borderWidth: number
    let symbol: string
    let symbolSize: number
    let labelColor: string
    let labelFontSize: number
    let labelFontFamily: string
    let labelPosition: 'inside' | 'bottom'

    if (loc.selected) {
      // Highest priority: selected location
      color = 'rgba(184,58,46,1)'
      borderColor = '#B83A2E'
      borderWidth = 3
      symbol = 'pin'
      symbolSize = loc.size === 'lg' ? 36 : loc.size === 'md' ? 30 : 26
      labelColor = '#B83A2E'
      labelFontSize = 12
      labelFontFamily = 'Ma Shan Zheng, cursive'
      labelPosition = 'inside'
    } else if (loc.active) {
      color = 'rgba(184,58,46,0.9)'
      borderColor = '#B83A2E'
      borderWidth = 2
      symbol = 'rect'
      symbolSize = loc.size === 'lg' ? 28 : loc.size === 'md' ? 22 : 18
      labelColor = '#B83A2E'
      labelFontSize = 10
      labelFontFamily = 'Ma Shan Zheng, cursive'
      labelPosition = 'inside'
    } else {
      color = 'rgba(74,67,58,0.5)'
      borderColor = 'transparent'
      borderWidth = 0
      symbol = 'circle'
      symbolSize = loc.size === 'lg' ? 12 : loc.size === 'md' ? 9 : 7
      labelColor = 'rgba(74,67,58,0.6)'
      labelFontSize = 9
      labelFontFamily = 'ZCOOL XiaoWei, serif'
      labelPosition = 'bottom'
    }

    return {
      name: loc.name,
      value: [...loc.coords, loc.active ? 1 : 0] as [number, number, number],
      itemStyle: { color, borderColor, borderWidth },
      symbol,
      symbolSize,
      label: {
        show: true,
        position: labelPosition,
        formatter: loc.name,
        color: labelColor,
        fontSize: labelFontSize,
        fontFamily: labelFontFamily,
        distance: labelPosition === 'inside' ? 0 : 8,
      },
    }
  })

  // Background route lines (always visible, static)
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

  // Active route: draw individual line segments between consecutive locations
  let activeRouteSeries: any = null
  if (activeEntry) {
    const locsWithCoords = activeEntry.locations.filter(l => l.coords)
    if (locsWithCoords.length >= 2) {
      // Build separate line segments between consecutive locations
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

  const series: any[] = [
    ...bgLineSeries,
    ...(activeRouteSeries ? [activeRouteSeries] : []),
    {
      type: 'scatter' as const,
      coordinateSystem: 'geo',
      geoIndex: 0,
      zlevel: 3,
      data: scatterSeriesData,
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
        areaColor: {
          type: 'radial',
          x: 0.5, y: 0.4, r: 0.8,
          colorStops: [
            { offset: 0, color: 'rgba(74,67,58,0.05)' },
            { offset: 0.6, color: 'rgba(74,67,58,0.03)' },
            { offset: 1, color: 'rgba(74,67,58,0.06)' },
          ],
        },
        borderColor: 'rgba(74,67,58,0.2)',
        borderWidth: 0.8,
      },
      emphasis: { disabled: true },
      select: { disabled: true },
      label: { show: false },
      regions: [
        { name: '南海诸岛', itemStyle: { opacity: 0.3 }, label: { show: false } },
      ],
    },
    series,
    animation: true,
    animationDuration: 800,
    animationEasingUpdate: 'cubicInOut',
  }
}
