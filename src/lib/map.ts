import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Gender } from "@/types/relationship"

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

export const OSM_TILE_OPTIONS: L.TileLayerOptions = {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}

export function createMapTileLayer(): L.TileLayer {
  return L.tileLayer(OSM_TILE_URL, OSM_TILE_OPTIONS)
}

/**
 * Returns Tailwind classes for map marker pinpoints based on member gender,
 * matching CoupleMoodTracker's sky (male) and rose (female) palette.
 */
export function getGenderMarkerBg(gender?: Gender | null): string {
  if (gender === "male") return "bg-sky-500 text-white"
  if (gender === "female") return "bg-rose-500 text-white"
  return "bg-muted text-foreground"
}
