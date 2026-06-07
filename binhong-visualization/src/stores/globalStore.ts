import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ActiveMode, Entry, BinhongData, ViewTheme } from '../types'
import binhongData from '../data/binhong_data.json'

const data = binhongData as unknown as BinhongData

export const useGlobalStore = defineStore('global', () => {
  // Selection state
  const selectedYear = ref<number | null>(null)
  const selectedPerson = ref<string | null>(null)
  const selectedLocation = ref<string | null>(null)
  const activeMode = ref<ActiveMode>('idle')
  const selectedEntryIndex = ref(0)

  // ═══ Narrative state ═══
  const viewTheme = ref<ViewTheme>('chronology')

  // All data
  const entries = computed(() => data.entries)
  const timeline = computed(() => data.timeline)
  const people = computed(() => data.people)
  const geodata = computed(() => data.geodata)
  const metadata = computed(() => data.metadata)

  // ═══ Narrative computed ═══
  const historyContext = computed(() => data.historyContext || [])
  const politicalProfiles = computed(() => data.politicalProfiles || [])
  const migrationRoutes = computed(() => data.migrationRoutes || [])
  const yearSummaries = computed(() => data.yearSummaries || [])

  // Current year's chronology text (from actual 年谱)
  const currentYearSummary = computed(() => {
    if (!selectedYear.value) return null
    return yearSummaries.value.find((s: any) => s.year === selectedYear.value) ?? null
  })

  // Current year's pressure (0-10)
  const currentPressure = computed(() => {
    if (!selectedYear.value) return 0
    const ctx = (data.historyContext || []).find((h: any) => h.year === selectedYear.value)
    return ctx?.pressureIndex ?? 0
  })

  // Current year's era context (for DocumentCard era footnote)
  const currentEraContext = computed(() => {
    if (!selectedYear.value) return null
    return (data.historyContext || []).find((h: any) => h.year === selectedYear.value) ?? null
  })

  // War-related years set
  const warYears = computed(() => {
    return new Set(
      (data.historyContext || [])
        .filter((h: any) => h.isWarRelated)
        .map((h: any) => h.year)
    )
  })

  // Political turning-point years set
  const politicalYears = computed(() => {
    return new Set(
      (data.historyContext || [])
        .filter((h: any) => h.isPoliticalTurning)
        .map((h: any) => h.year)
    )
  })

  // Art milestone years set
  const artMilestoneYears = computed(() => {
    return new Set(
      (data.historyContext || [])
        .filter((h: any) => h.isArtMilestone)
        .map((h: any) => h.year)
    )
  })

  // Filtered data based on current selection
  const filteredEntries = computed<Entry[]>(() => {
    if (activeMode.value === 'timeline' && selectedYear.value !== null) {
      return data.entries.filter(e => e.year === selectedYear.value)
    }
    if (activeMode.value === 'person' && selectedPerson.value !== null) {
      return data.entries.filter(e => e.people.includes(selectedPerson.value!))
    }
    if (activeMode.value === 'geography' && selectedLocation.value !== null) {
      return data.entries.filter(e =>
        e.locations.some(l => l.name === selectedLocation.value) ||
        e.primaryLocation === selectedLocation.value
      )
    }
    return []
  })

  const activeEntry = computed<Entry | null>(() => {
    const entries = filteredEntries.value
    if (entries.length === 0) return null
    const idx = Math.min(selectedEntryIndex.value, entries.length - 1)
    return entries[idx]
  })

  // People mentioned in the current year's chronology text
  const activePeople = computed<string[]>(() => {
    if (!selectedYear.value) return []
    const summary = yearSummaries.value.find((s: any) => s.year === selectedYear.value)
    if (!summary || !summary.text) return []

    const text = summary.text
    const found: string[] = []

    // ═══ 黄宾虹自己的别名/字号/尊称 — 不是其他人物 ═══
    const SELF_ALIASES = new Set([
      '黄宾虹', '黄賓虹', '賓虹', '賓老', '賓翁', '賓谼',
      '樸存', '黄樸存', '朴丞', '樸人', '朴人',
      '虹老', '濱虹', '黄老', '虹黄', '矼叟', '予向',
      '懋質', '元吉', '黄質', '質', '賓虹',
    ])

    // ═══ 非人物词汇（常见词/动宾短语等） ═══
    const NON_NAME_WORDS = new Set([
      '前輩', '物色', '臘月', '禮堂', '仁兄', '有四', '長子', '老兄',
      '徵求', '於是', '人約', '公老', '為年', '明之', '於一',
      '後人', '此年', '同年', '次年', '是年', '時年', '年為', '有二',
      '社長', '攜到', '想見', '邀請', '函請', '遂邀', '爰請',
      '不料', '尚希', '欣逢', '歡逢', '轉告', '走訪', '補祝', '來補',
      '千祈', '尚乞', '出示', '念及', '前承', '甚佩', '欣賞',
      '社兄', '世兄', '道兄', '老公', '親家', '兩位', '不卜',
      '稱以', '讀鄉', '是大', '義來', '賦比', '承諸', '惟諸',
      '聞諸', '原兩', '確夫', '邀請', '弟因', '邇聞',
      '亦為', '日內', '願與', '公約', '仍以',
      '修世', '芚公', '嘉德', '禮堂', '臘月',
      '有負', '敬乞', '拜識', '椷請', '並承',
      '聽畢', '地問', '親沈', '江老', '翁老', '葩叟',
      '萬里', '文世', '水如', '余識',
    ])

    // ═══ 垃圾前缀 — 以这些开头的是从文本中错误提取的片段 ═══
    const GARBAGE_PREFIXES = [
      '的', '與', '為', '見', '有', '時', '友', '夕', '加', '之', '人',
      '弟', '據', '錄', '下', '攜', '是', '幫', '里', '看', '近', '而',
      '將', '出', '着', '對', '予', '信', '謂', '顧', '錄', '達', '交',
      '告', '請', '訪', '送', '給', '幀', '稱', '結', '甚', '過', '從',
      '父', '段', '主編', '畫家', '父段', '代明', '那', '了',
    ]

    // ═══ 垃圾后缀 — 以这些结尾的是错误提取 ═══
    const GARBAGE_SUFFIXES = ['兩', '两', '諸', '黄', '羣']

    function isValidPerson(name: string): boolean {
      if (name.length < 2) return false
      if (SELF_ALIASES.has(name)) return false
      if (NON_NAME_WORDS.has(name)) return false
      // Garbage prefix check
      for (const prefix of GARBAGE_PREFIXES) {
        if (name.startsWith(prefix) && name.length > prefix.length) return false
      }
      // Garbage suffix check
      for (const suffix of GARBAGE_SUFFIXES) {
        if (name.endsWith(suffix) && name.length > suffix.length) return false
      }
      return true
    }

    for (const name of Object.keys(data.people)) {
      if (!isValidPerson(name)) continue
      if (text.includes(name)) {
        found.push(name)
      }
    }
    return found
  })

  const activeLocations = computed(() => {
    const locMap = new Map<string, [number, number]>()
    // Priority 1: year summary locations (from actual chronology)
    if (selectedYear.value) {
      const summary = yearSummaries.value.find((s: any) => s.year === selectedYear.value)
      if (summary && summary.locations.length > 0) {
        summary.locations.forEach((l: any) => {
          if (l.coords && !locMap.has(l.name)) {
            locMap.set(l.name, l.coords)
          }
        })
        return Array.from(locMap.entries()).map(([name, coords]) => ({ name, coords }))
      }
    }
    // Priority 2: fallback to old entries
    filteredEntries.value.forEach(e => {
      e.locations.forEach(l => {
        if (l.coords && !locMap.has(l.name)) {
          locMap.set(l.name, l.coords)
        }
      })
    })
    return Array.from(locMap.entries()).map(([name, coords]) => ({ name, coords }))
  })

  // Actions
  function selectYear(year: number) {
    selectedYear.value = year
    selectedPerson.value = null
    selectedLocation.value = null
    activeMode.value = 'timeline'
    selectedEntryIndex.value = 0
  }

  function selectPerson(person: string) {
    selectedPerson.value = person
    activeMode.value = 'person'
    selectedEntryIndex.value = 0

    // Auto-derive the most frequent year for timeline snap
    const personEntries = data.entries.filter(e => e.people.includes(person))
    if (personEntries.length > 0) {
      const yearCounts = new Map<number, number>()
      personEntries.forEach(e => {
        if (e.year !== null) {
          yearCounts.set(e.year, (yearCounts.get(e.year) || 0) + 1)
        }
      })
      let maxYear = 0
      let maxCount = 0
      yearCounts.forEach((count, year) => {
        if (count > maxCount) {
          maxCount = count
          maxYear = year
        }
      })
      selectedYear.value = maxYear || null
    }
  }

  function selectLocation(location: string) {
    selectedLocation.value = location
    activeMode.value = 'geography'
    selectedEntryIndex.value = 0

    // Auto-derive the most frequent year for timeline snap
    const locEntries = data.entries.filter(e =>
      e.locations.some(l => l.name === location) || e.primaryLocation === location
    )
    if (locEntries.length > 0) {
      const yearCounts = new Map<number, number>()
      locEntries.forEach(e => {
        if (e.year !== null) {
          yearCounts.set(e.year, (yearCounts.get(e.year) || 0) + 1)
        }
      })
      let maxYear = 0
      let maxCount = 0
      yearCounts.forEach((count, year) => {
        if (count > maxCount) {
          maxCount = count
          maxYear = year
        }
      })
      selectedYear.value = maxYear || null
    }
  }

  function resetSelection() {
    selectedYear.value = null
    selectedPerson.value = null
    selectedLocation.value = null
    activeMode.value = 'idle'
    selectedEntryIndex.value = 0
  }

  function setViewTheme(theme: ViewTheme) {
    viewTheme.value = theme
    if (theme === 'turmoil') {
      const years = [...warYears.value].sort()
      if (years.length > 0) selectYear(years[0])
    } else if (theme === 'politics') {
      const years = [...politicalYears.value].sort()
      if (years.length > 0) selectYear(years[0])
    } else if (theme === 'art') {
      const years = [...artMilestoneYears.value].sort()
      if (years.length > 0) selectYear(years[0])
    }
    // chronology: keep current selection, don't reset
  }

  return {
    selectedYear,
    selectedPerson,
    selectedLocation,
    activeMode,
    selectedEntryIndex,
    viewTheme,
    entries,
    timeline,
    people,
    geodata,
    metadata,
    historyContext,
    politicalProfiles,
    migrationRoutes,
    yearSummaries,
    currentYearSummary,
    currentPressure,
    currentEraContext,
    warYears,
    politicalYears,
    artMilestoneYears,
    filteredEntries,
    activeEntry,
    activePeople,
    activeLocations,
    selectYear,
    selectPerson,
    selectLocation,
    resetSelection,
    setViewTheme,
  }
})
