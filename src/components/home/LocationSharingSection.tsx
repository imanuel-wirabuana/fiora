import { useCallback, useEffect, useRef } from "react"
import { useLocation } from "wouter"
import L from "leaflet"
import { MapPin } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { CustomSkeleton } from "@/components/CustomSkeleton"
import { useLocationSharing } from "@/hooks/useLocationSharing"
import { useRelationship } from "@/hooks/useRelationship"
import { createMapTileLayer } from "@/lib/map"
import type { Gender } from "@/types/relationship"

function getGenderMarkerBg(gender?: Gender | null) {
  if (gender === "male") return "bg-blue-500"
  if (gender === "female") return "bg-secondary"
  return "bg-primary"
}

export function LocationSharingSection() {
  const {
    locationSharing,
    myLocation,
    partnerLocation,
    partnerMember,
    formattedDistance,
    isLocating,
  } = useLocationSharing()

  const { currentMember } = useRelationship()
  const [, setLocation] = useLocation()

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const pointsRef = useRef<L.LatLngExpression[]>([])

  const fitMapToPoints = useCallback((map: L.Map) => {
    const pts = pointsRef.current
    if (pts.length === 0) return

    if (pts.length === 1) {
      map.setView(pts[0], 14, { animate: true })
    } else {
      const bounds = L.latLngBounds(pts)
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15, animate: true })
    }
  }, [])

  const myAvatar = currentMember?.content?.avatar || "💙"
  const myGender = currentMember?.content?.gender
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerGender = partnerMember?.content?.gender

  // Initialize Read-Only Leaflet Map
  useEffect(() => {
    if (!locationSharing || !mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const defaultCenter: L.LatLngExpression = [0, 0]
      const defaultZoom = 2

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      })

      createMapTileLayer().addTo(map)

      const markersLayer = L.layerGroup().addTo(map)
      markersLayerRef.current = markersLayer
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersLayerRef.current = null
      }
    }
  }, [locationSharing])

  // Update Markers & Zoom bounds whenever locations change
  useEffect(() => {
    const map = mapInstanceRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return

    layer.clearLayers()
    const points: L.LatLngExpression[] = []

    // 1. Plot My Location Marker
    if (myLocation) {
      const myLatLng: L.LatLngExpression = [myLocation.lat, myLocation.lng]
      points.push(myLatLng)

      const myIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="flex flex-col items-center">
            <div class="flex size-7 items-center justify-center rounded-full ${getGenderMarkerBg(myGender)} text-white shadow-md ring-2 ring-background text-sm">
              ${myAvatar}
            </div>
            <div class="mt-0.5 rounded bg-background/90 px-1 py-0.2 text-[9px] font-semibold text-foreground shadow-xs border border-border/60">
              You
            </div>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 36],
      })

      L.marker(myLatLng, { icon: myIcon }).addTo(layer)
    }

    // 2. Plot Partner Location Marker
    if (partnerLocation) {
      const partnerLatLng: L.LatLngExpression = [
        partnerLocation.lat,
        partnerLocation.lng,
      ]
      points.push(partnerLatLng)

      const partnerIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="flex flex-col items-center">
            <div class="flex size-7 items-center justify-center rounded-full ${getGenderMarkerBg(partnerGender)} text-white shadow-md ring-2 ring-background text-sm">
              ${partnerAvatar}
            </div>
            <div class="mt-0.5 rounded bg-background/90 px-1 py-0.2 text-[9px] font-semibold text-foreground shadow-xs border border-border/60">
              ${partnerName}
            </div>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 36],
      })

      L.marker(partnerLatLng, { icon: partnerIcon }).addTo(layer)
    }

    // 3. Connect line & fit points
    pointsRef.current = points
    if (points.length > 1) {
      L.polyline(points, {
        color: "#f43f5e",
        weight: 2,
        dashArray: "4 6",
        opacity: 0.7,
      }).addTo(layer)
    }

    fitMapToPoints(map)
  }, [
    myLocation,
    partnerLocation,
    myAvatar,
    myGender,
    partnerAvatar,
    partnerName,
    partnerGender,
    fitMapToPoints,
  ])

  // Strictly return null if location sharing is not enabled in commitment settings
  if (!locationSharing) {
    return null
  }

  const handleOpenLocation = () => {
    setLocation("/location")
  }

  return (
    <CustomItem
      role="button"
      tabIndex={0}
      onClick={handleOpenLocation}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleOpenLocation()
        }
      }}
      icon={<MapPin className="size-3.5 text-primary" />}
      title="Location"
      className="h-full cursor-pointer gap-0 p-1 transition hover:border-primary/40 active:scale-[0.99]"
      headerClassName="px-2.5 py-2"
      topRightActions={
        formattedDistance ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-primary">
            {formattedDistance} apart
          </span>
        ) : null
      }
      contentClassName="w-full flex-1"
    >
      {/* Read-only Leaflet Map Frame */}
      <div className="relative h-full min-h-36 w-full flex-1 overflow-hidden rounded-lg border border-border/50 bg-muted/40">
        <div
          ref={mapContainerRef}
          className="pointer-events-none z-0 h-full w-full select-none"
        />

        {/* Overlay when waiting for initial coordinates */}
        {!myLocation && !partnerLocation && (
          isLocating ? (
            <CustomSkeleton className="absolute inset-0 z-10 h-full w-full rounded-none" />
          ) : (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-background/60 p-4 text-center text-xs text-muted-foreground backdrop-blur-xs">
              <MapPin className="size-5 opacity-40" />
              <span>Tap to open location sharing</span>
            </div>
          )
        )}
      </div>
    </CustomItem>
  )
}
