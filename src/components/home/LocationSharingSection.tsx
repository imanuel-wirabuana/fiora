import { useCallback, useEffect, useRef } from "react"
import { useLocation } from "wouter"
import { format, formatDistanceToNow, isToday } from "date-fns"
import L from "leaflet"
import { Clock, MapPin, Maximize2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useLocationSharing } from "@/hooks/useLocationSharing"
import { useRelationship } from "@/hooks/useRelationship"
import type { MemberLocation } from "@/types/relationship"

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
  const recenterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isProgrammaticMoveRef = useRef(false)
  const programmaticResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fitMapToPoints = useCallback((map: L.Map) => {
    const pts = pointsRef.current
    if (pts.length === 0) return

    if (recenterTimeoutRef.current) {
      clearTimeout(recenterTimeoutRef.current)
      recenterTimeoutRef.current = null
    }
    if (programmaticResetTimeoutRef.current) {
      clearTimeout(programmaticResetTimeoutRef.current)
    }

    isProgrammaticMoveRef.current = true
    if (pts.length === 1) {
      map.setView(pts[0], 14, { animate: true })
    } else {
      const bounds = L.latLngBounds(pts)
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15, animate: true })
    }

    // Fallback reset in case fitBounds/setView is a no-op and does not fire moveend
    programmaticResetTimeoutRef.current = setTimeout(() => {
      isProgrammaticMoveRef.current = false
      programmaticResetTimeoutRef.current = null
    }, 500)
  }, [])

  const myAvatar = currentMember?.content?.avatar || "🙋"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const partnerName = partnerMember?.content?.name || "Partner"

  const formatLastUpdated = (dateStr: string) => {
    const d = new Date(dateStr)
    const exactTime = format(d, "h:mm a")
    if (isToday(d)) {
      return `Today at ${exactTime}`
    }
    return `${format(d, "MMM d")} at ${exactTime}`
  }

  const renderLocationCard = (
    avatar: string,
    name: string,
    location: MemberLocation | null,
    isMe: boolean
  ) => {
    return (
      <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="text-sm">{avatar}</span>
            <span className="truncate">{name}</span>
          </div>
          {location ? (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(location.updated_at), {
                addSuffix: true,
              })}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground italic">
              {isMe && isLocating ? "Locating..." : "Not shared"}
            </span>
          )}
        </div>

        {location ? (
          <div className="space-y-1 pt-0.5">
            {/* Last Place Name / Coordinates */}
            <div className="flex items-start gap-1 text-[11px] text-foreground/90 font-medium leading-snug">
              <MapPin className="size-3 text-primary shrink-0 mt-0.5" />
              <span className="break-words line-clamp-1" title={location.placeName || `${location.lat}, ${location.lng}`}>
                {location.placeName || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
              </span>
            </div>

            {/* Last Update Time */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-2.5 shrink-0 opacity-70" />
              <span className="truncate">{formatLastUpdated(location.updated_at)}</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic pt-1">
            {isMe
              ? isLocating
                ? "Acquiring GPS fix..."
                : "Tap refresh to share your location"
              : "Waiting for partner's update..."}
          </p>
        )}
      </div>
    )
  }

  // Initialize Leaflet Map
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
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      const markersLayer = L.layerGroup().addTo(map)
      markersLayerRef.current = markersLayer
      mapInstanceRef.current = map

      const clearRecenterTimer = () => {
        if (recenterTimeoutRef.current) {
          clearTimeout(recenterTimeoutRef.current)
          recenterTimeoutRef.current = null
        }
      }

      const scheduleRecenter = () => {
        clearRecenterTimer()
        recenterTimeoutRef.current = setTimeout(() => {
          recenterTimeoutRef.current = null
          if (mapInstanceRef.current) {
            fitMapToPoints(mapInstanceRef.current)
          }
        }, 3000)
      }

      map.on("dragstart", () => {
        isProgrammaticMoveRef.current = false
        clearRecenterTimer()
      })

      map.on("dragend", () => {
        scheduleRecenter()
      })

      map.on("zoomstart", () => {
        if (!isProgrammaticMoveRef.current) {
          clearRecenterTimer()
        }
      })

      map.on("zoomend", () => {
        if (!isProgrammaticMoveRef.current) {
          scheduleRecenter()
        }
      })

      map.on("moveend", () => {
        if (isProgrammaticMoveRef.current) {
          isProgrammaticMoveRef.current = false
          if (programmaticResetTimeoutRef.current) {
            clearTimeout(programmaticResetTimeoutRef.current)
            programmaticResetTimeoutRef.current = null
          }
        }
      })
    }

    return () => {
      if (recenterTimeoutRef.current) {
        clearTimeout(recenterTimeoutRef.current)
        recenterTimeoutRef.current = null
      }
      if (programmaticResetTimeoutRef.current) {
        clearTimeout(programmaticResetTimeoutRef.current)
        programmaticResetTimeoutRef.current = null
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersLayerRef.current = null
      }
    }
  }, [locationSharing, fitMapToPoints])

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
            <div class="flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-background text-sm">
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
            <div class="flex size-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-md ring-2 ring-background text-sm">
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

    // 3. Connect line & Always Fit Both points to keep home map in view
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
  }, [myLocation, partnerLocation, myAvatar, partnerAvatar, partnerName, fitMapToPoints])

  // Strictly return null if location sharing is not enabled in commitment settings
  if (!locationSharing) {
    return null
  }

  return (
    <Item
      variant="outline"
      className="w-full flex-col items-start gap-2.5 p-3.5"
    >
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <ItemTitle className="text-sm font-semibold">
          Location Sharing
        </ItemTitle>

        <div className="flex items-center gap-1.5">
          {formattedDistance && (
            <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {formattedDistance} apart
            </span>
          )}

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
      </ItemHeader>

      <ItemContent className="w-full space-y-2">
        {/* Leaflet Map Frame */}
        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-border/70 bg-muted/40 shadow-inner">
          <div ref={mapContainerRef} className="z-0 h-full w-full" />

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

        {/* Location Status Cards */}
        <div className="grid grid-cols-2 gap-2">
          {renderLocationCard(myAvatar, "You", myLocation, true)}
          {renderLocationCard(
            partnerAvatar,
            partnerName,
            partnerLocation,
            false
          )}
        </div>
      </ItemContent>
    </Item>
  )
}
