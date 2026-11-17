export type HoroscopeCategoryKey =
  | "mood"
  | "love"
  | "money"
  | "career"
  | "summary"
  | "advice"

export interface HoroscopeContent {
  date: string
  zodiac: string
  mood?: string
  love?: string
  money?: string
  career?: string
  summary?: string
  advice?: string
}

export interface HoroscopeRow {
  id: number
  content: HoroscopeContent | null
  created_at: string
  updated_at: string
}
