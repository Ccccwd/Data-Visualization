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

// ═══ Narrative Enhancement Types ═══

/** Historical context for key years — the narrative backbone */
export interface HistoryContext {
  year: number
  /** 0-10 scale of historical turmoil/pressure */
  pressureIndex: number
  /** Era label, e.g. "全面抗战" */
  era: string
  /** Major historical events (2-3 items) */
  events: string[]
  /** Brief era summary (1-2 sentences) */
  summary: string
  /** Huang Binhong's personal response, derived from chronology data */
  personalNote: string
  /** Academic insight: data-driven observations */
  insight: string
  /** Whether this year is war/revolution related */
  isWarRelated: boolean
  /** Whether this year is a political turning point */
  isPoliticalTurning: boolean
  /** Whether this year is an art milestone */
  isArtMilestone: boolean
}

/** Political affiliation for "Political Spectrum" view */
export type PoliticalAffiliation =
  | 'revolutionary'    // 革命党/同盟会
  | 'reformist'        // 维新派/立宪派
  | 'kmt'              // 国民党系
  | 'leftist'          // 左翼/进步
  | 'traditionalist'   // 传统文人/清遗老
  | 'apolitical'       // 无明确政治倾向

/** Person's political profile for the Political Spectrum view */
export interface PersonPoliticalProfile {
  name: string
  affiliation: PoliticalAffiliation
  /** Brief explanation, e.g. "早年同盟会，后任国民政府监察院长" */
  note?: string
  /** Period this affiliation is valid for */
  period?: [number, number]
}

/** Migration route for "Turmoil & Seclusion" view */
export interface MigrationRoute {
  id: string
  /** Route label, e.g. "滞留北平" */
  label: string
  /** Start and end years */
  period: [number, number]
  /** Path coordinates [lng, lat] */
  waypoints: [number, number][]
  /** Description of this migration */
  description: string
}

/** View theme — the four narrative perspectives */
export type ViewTheme = 'chronology' | 'turmoil' | 'politics' | 'art'

/** Year-level summary extracted from the original chronology */
export interface YearSummary {
  year: number
  ganzhi: string
  locations: { name: string; coords: [number, number] }[]
  primaryLocation: string | null
  text: string
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
  historyContext: HistoryContext[]
  politicalProfiles: PersonPoliticalProfile[]
  migrationRoutes: MigrationRoute[]
  yearSummaries: YearSummary[]
}

export type ActiveMode = 'timeline' | 'person' | 'geography' | 'idle'
