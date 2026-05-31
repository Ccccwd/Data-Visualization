import type { EChartsOption } from 'echarts'
import type { Entry, GeoLocation } from '../types'

interface LocationMarker {
  name: string
  coords: [number, number]
  active: boolean
  size: 'lg' | 'md' | 'sm'
}

// ═══════════════════════════════════════
// Background routes: 黄宾虹一生主要旅行路线（固定）
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
  activeLocationNames: Set<string>
): LocationMarker[] {
  return allLocations.map(loc => ({
    name: loc.name,
    coords: loc.coords,
    active: activeLocationNames.has(loc.name),
    size: loc.mentionCount > 5 ? 'lg' : loc.mentionCount > 2 ? 'md' : 'sm',
  }))
}

/** Build the full ECharts option for the ink-wash map */
export function buildInkMapOptions(
  allLocations: GeoLocation[],
  activeLocations: { name: string; coords: [number, number] | null }[],
  selectedLocation: string | null,
  activeEntry: Entry | null,
  filteredEntries: Entry[]
): EChartsOption {
  const activeNameSet = new Set(activeLocations.map(l => l.name))
  const scatterData = buildScatterData(allLocations, activeNameSet)

  // Map each scatter point
  const scatterSeriesData = scatterData.map(loc => ({
    name: loc.name,
    value: [...loc.coords, loc.active ? 1 : 0] as [number, number, number],
    active: loc.active,
    size: loc.size,
    itemStyle: loc.active
      ? { color: 'rgba(184,58,46,0.9)', borderColor: '#B83A2E', borderWidth: 2 }
      : { color: 'rgba(74,67,58,0.5)', borderColor: 'transparent', borderWidth: 0 },
    symbol: loc.active ? 'rect' : 'circle',
    symbolSize: loc.active
      ? (loc.size === 'lg' ? 28 : loc.size === 'md' ? 22 : 18)
      : (loc.size === 'lg' ? 12 : loc.size === 'md' ? 9 : 7),
    label: {
      show: true,
      position: loc.active ? 'inside' as const : 'bottom' as const,
      formatter: loc.name,
      color: loc.active ? '#B83A2E' : 'rgba(74,67,58,0.6)',
      fontSize: loc.active ? 10 : 9,
      fontFamily: loc.active ? 'Ma Shan Zheng, cursive' : 'ZCOOL XiaoWei, serif',
      distance: loc.active ? 0 : 8,
    },
  }))

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

  // Active route: connect locations from the selected entry
  let activeRouteSeries: any = null
  if (activeEntry) {
    const activeCoords = activeEntry.locations
      .filter(l => l.coords)
      .map(l => l.coords as [number, number])
    if (activeCoords.length >= 2) {
      activeRouteSeries = {
        type: 'lines' as const,
        coordinateSystem: 'geo',
        geoIndex: 0,
        zlevel: 2,
        silent: true,
        polyline: false,
        data: [{
          coords: activeCoords,
          lineStyle: {
            color: '#B83A2E',
            width: 2.5,
            type: 'dashed' as const,
            opacity: 0.6,
            curveness: 0.15,
          },
        }],
        effect: {
          show: true,
          period: 6,
          trailLength: 0.4,
          symbol: 'circle',
          symbolSize: 4,
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
      geoZoom = 8
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
      center: geoCenter || [110, 30],   // 聚焦中国中东部
      zoom: geoZoom || 4,               // 从 1.2 提升到 4，放大很多
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
