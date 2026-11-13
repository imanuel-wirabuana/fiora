import L from "leaflet"

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

export const OSM_TILE_OPTIONS: L.TileLayerOptions = {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}

export function createMapTileLayer(): L.TileLayer {
  return L.tileLayer(OSM_TILE_URL, OSM_TILE_OPTIONS)
}
