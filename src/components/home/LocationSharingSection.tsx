import { useCallback, useEffect, useRef } from "react"
import { useLocation } from "wouter"
import { format, isToday } from "date-fns"
import L from "leaflet"
import { Clock, MapPin, Maximize2, RefreshCw } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useLocationSharing } from "@/hooks/useLocationSharing"
import { useRelationship } from "@/hooks/useRelationship"
import { createMapTileLayer } from "@/lib/map"
import type { Gender, MemberLocation } from "@/types/relationship"

function getGenderMarkerBg(gender?: Gender | null) {
  if (gender === "male") return "bg-blue-500"
  if (gender === "female") return "bg-rose-500"
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
    geoError,
    refreshLocation,
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

  const myAvatar = currentMember?.content?.avatar || "🙋"
  const myGender = currentMember?.content?.gender
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerGender = partnerMember?.content?.gender

  const formatLastUpdated = (dateStr: string) => {
    const d = new Date(dateStr)
    const exactTime = format(d, "h:mm a")
    if (isToday(d)) {
      return `Today at ${exactTime}`
    }
    return `${format(d, "MMM d")} at ${exactTime}`
  }

  const renderLocationItem = (
    avatar: string,
    name: string,
    location: MemberLocation | null,
    isMe: boolean
  ) => {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-center text-xs">
        <div className="flex max-w-full items-center justify-center gap-1.5 font-semibold text-foreground">
          <span className="shrink-0 text-xs leading-none">{avatar}</span>
          <span className="truncate capitalize">{name}</span>
        </div>

        {location ? (
          <>
            <div className="flex max-w-full items-center justify-center gap-1 text-[11px] font-medium text-foreground/90">
              <MapPin className="size-2.5 shrink-0 text-primary" />
              <span
                className="truncate"
                title={location.placeName || `${location.lat}, ${location.lng}`}
              >
                {location.placeName ||
                  `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
              </span>
            </div>

            <div className="flex max-w-full items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-2.5 shrink-0 opacity-70" />
              <span className="truncate">
                {formatLastUpdated(location.updated_at)}
              </span>
            </div>
          </>
        ) : (
          <p className="w-full truncate text-center text-[10px] text-muted-foreground italic">
            {isMe
              ? isLocating
                ? "Locating..."
                : "Tap refresh to share"
              : "Waiting for update..."}
          </p>
        )}
      </div>
    )
  }

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

  return (
    <CustomItem
      icon={<MapPin className="size-3.5 text-primary" />}
      title="Location Sharing"
      topRightActions={
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setLocation("/location")}
            title="Open full map"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={refreshLocation}
            disabled={isLocating}
            title="Refresh current location"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
          >
            {isLocating ? (
              <Spinner className="size-3.5" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
          </Button>
        </div>
      }
      contentClassName="space-y-2"
    >
      {/* Read-only Leaflet Map Frame */}
      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-border/70 bg-muted/40 shadow-inner">
        <div
          ref={mapContainerRef}
          className="pointer-events-none z-0 h-full w-full select-none"
        />

        {/* Overlay when waiting for initial coordinates */}
        {!myLocation && !partnerLocation && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-background/60 p-4 text-center text-xs text-muted-foreground backdrop-blur-xs">
            {isLocating ? (
              <>
                <Spinner className="size-5 text-primary" />
                <span>Fetching your GPS location...</span>
              </>
            ) : (
              <>
                <MapPin className="size-5 opacity-40" />
                <span>Tap refresh to broadcast your location</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {geoError && (
        <p className="text-[11px] font-medium text-destructive">{geoError}</p>
      )}

      {/* Compact Location Status Summary */}
      <div className="flex items-stretch gap-2 pt-0.5">
        {renderLocationItem(myAvatar, "You", myLocation, true)}

        {formattedDistance && (
          <div className="flex shrink-0 flex-col items-center justify-center gap-1">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-primary">
              {formattedDistance} apart
            </span>
          </div>
        )}

        {renderLocationItem(partnerAvatar, partnerName, partnerLocation, false)}
      </div>
    </CustomItem>
  )
}
