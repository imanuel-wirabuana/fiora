import { supabase } from "./supabase"
import type { HoroscopeRow } from "../types/horoscope"

/**
 * Fetch today's horoscope rows for the given date and zodiac signs.
 * Zodiac signs are normalized to lowercase and deduplicated before querying.
 */
export async function getTodayHoroscopes(
  date: string,
  zodiacs: string[]
): Promise<HoroscopeRow[]> {
  const normalizedUniqueZodiacs = Array.from(
    new Set(
      zodiacs
        .map((z) => z.trim().toLowerCase())
        .filter((z) => z.length > 0)
    )
  )

  if (normalizedUniqueZodiacs.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from("horoscopes")
    .select("*")
    .eq("content->>date", date)
    .in("content->>zodiac", normalizedUniqueZodiacs)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as HoroscopeRow[]
}

export const horoscopeService = {
  getTodayHoroscopes,
}
