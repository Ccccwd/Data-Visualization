export interface Location {
  name: string
  coords: [number, number] | null
}

export interface Seal {
  name: string
  owner: string
}

export interface Entry {
  id: number
  rowIndex: number
  year: number | null
  yearConfidence: 'high' | 'medium' | 'low'
  ganzhi: string
  locations: Location[]
  primaryLocation: string | null
  people: string[]
  text: string
  tags: string[]
  seals: Seal[]
  category: string
}

export interface PersonInfo {
  count: number
  years: number[]
  connections: Record<string, number>
}

export interface GeoLocation {
  name: string
  coords: [number, number]
  mentionCount: number
}

export interface Route {
  from: string
  to: string
  year: number | null
}

export interface TimelineYear {
  year: number
  ganzhi: string
  displayLabel: string
  entryCount: number
}

export interface BinhongData {
  metadata: {
    subject: string
    birthYear: number
    deathYear: number
    totalEntries: number
    yearRange: [number, number]
  }
  timeline: TimelineYear[]
  entries: Entry[]
  people: Record<string, PersonInfo>
  geodata: {
    locations: GeoLocation[]
    routes: Route[]
  }
}

export type ActiveMode = 'timeline' | 'person' | 'geography' | 'idle'
