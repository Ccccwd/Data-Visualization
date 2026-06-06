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

  const activePeople = computed<string[]>(() => {
    const peopleSet = new Set<string>()
    filteredEntries.value.forEach(e => e.people.forEach(p => peopleSet.add(p)))
    return Array.from(peopleSet)
  })

  const activeLocations = computed(() => {
    const locMap = new Map<string, [number, number]>()
    filteredEntries.value.forEach(e => {
      e.locations.forEach(l => {
        if (!locMap.has(l.name) && l.coords) {
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
