import { useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, isValid, parseISO } from "date-fns"
import { getZodiacSign, type ZodiacSign } from "@/lib/relationship"
import { getTodayHoroscopes } from "@/services/horoscopeService"
import type { HoroscopeRow } from "@/types/horoscope"
import { useRelationship } from "./useRelationship"

export const horoscopeKeys = {
  all: ["horoscopes"] as const,
  byDateAndZodiacs: (date: string, zodiacs: string[]) =>
    [...horoscopeKeys.all, date, ...zodiacs] as const,
}

function parseZodiacFromBirthDate(
  birthDate?: string | null
): ZodiacSign | null {
  if (!birthDate) return null
  const parsed = parseISO(birthDate)
  if (!isValid(parsed)) return null
  return getZodiacSign(parsed)
}

function findHoroscopeByZodiac(
  rows: HoroscopeRow[] | undefined,
  zodiac: ZodiacSign | null
): HoroscopeRow | null {
  if (!rows || !zodiac) return null
  const target = zodiac.toLowerCase()
  return (
    rows.find((row) => row.content?.zodiac?.toLowerCase() === target) ?? null
  )
}

function buildUniqueZodiacs(
  myZodiac: ZodiacSign | null,
  partnerZodiac: ZodiacSign | null
): string[] {
  const list: string[] = []
  if (myZodiac) list.push(myZodiac.toLowerCase())
  if (partnerZodiac) list.push(partnerZodiac.toLowerCase())
  return Array.from(new Set(list)).sort()
}

export function useHoroscopes() {
  const { currentMember, partnerMember, updateMemberContentMutation } =
    useRelationship()

  const myBirthDate = currentMember?.content?.birth_date
  const partnerBirthDate = partnerMember?.content?.birth_date

  const myZodiac = parseZodiacFromBirthDate(myBirthDate)
  const partnerZodiac = parseZodiacFromBirthDate(partnerBirthDate)
  const today = format(new Date(), "yyyy-MM-dd")
  const zodiacs = buildUniqueZodiacs(myZodiac, partnerZodiac)

  const openedToday =
    currentMember?.content?.horoscope_opened?.date === today
      ? currentMember.content.horoscope_opened
      : null
  const isMyHoroscopeOpened = Boolean(openedToday?.self)
  const isPartnerHoroscopeOpened = Boolean(openedToday?.partner)

  const markHoroscopeOpened = useCallback(
    (target: "self" | "partner") => {
      if (!currentMember) return

      const currentOpened =
        currentMember.content?.horoscope_opened?.date === today
          ? currentMember.content.horoscope_opened
          : { date: today }

      updateMemberContentMutation.mutate({
        memberId: currentMember.id,
        content: {
          horoscope_opened: {
            date: today,
            self: target === "self" ? true : Boolean(currentOpened.self),
            partner:
              target === "partner" ? true : Boolean(currentOpened.partner),
          },
        },
      })
    },
    [currentMember, today, updateMemberContentMutation]
  )

  const query = useQuery<HoroscopeRow[], Error>({
    queryKey: horoscopeKeys.byDateAndZodiacs(today, zodiacs),
    queryFn: () => getTodayHoroscopes(today, zodiacs),
    enabled: zodiacs.length > 0,
  })

  const myHoroscope = useMemo(
    () => findHoroscopeByZodiac(query.data, myZodiac),
    [query.data, myZodiac]
  )

  const partnerHoroscope = useMemo(
    () => findHoroscopeByZodiac(query.data, partnerZodiac),
    [query.data, partnerZodiac]
  )

  return {
    today,
    myZodiac,
    partnerZodiac,
    myHoroscope,
    partnerHoroscope,
    isMyHoroscopeOpened,
    isPartnerHoroscopeOpened,
    markHoroscopeOpened,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
