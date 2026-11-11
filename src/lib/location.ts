export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Calculates the great-circle distance between two coordinates in meters
 * using the Haversine formula.
 */
export function calculateDistanceMeters(from: Coordinates, to: Coordinates): number {
  const EARTH_RADIUS_METERS = 6371000
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180

  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)

  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

/**
 * Formats a distance in meters:
 * - Uses "m" if < 1 km (1000 m)
 * - Uses "km" if >= 1 km
 */
export function formatDistanceBetween(meters: number): string {
  const safeMeters = Math.max(0, meters)
  if (safeMeters < 1000) {
    return `${Math.round(safeMeters)} m`
  }

  const km = safeMeters / 1000
  return `${km >= 100 ? Math.round(km) : km.toFixed(1)} km`
}

