import { useEffect, useRef, useState } from "react"
import { useLocation } from "wouter"
import { format, isToday } from "date-fns"
import L from "leaflet"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Crosshair,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useLocationSharing } from "@/hooks/useLocationSharing"
import { useRelationship } from "@/hooks/useRelationship"
import { createMapTileLayer } from "@/lib/map"
import { cn } from "@/lib/utils"

export function LocationSharingScreen() {
  const [, setLocation] = useLocation()
  const {
    myLocation,
    partnerLocation,
    partnerMember,
    formattedDistance,
    isLocating,
    refreshLocation,
  } = useLocationSharing()

  const { currentMember } = useRelationship()

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const initialFitCountRef = useRef(0)

  const [isDrawerExpanded, setIsDrawerExpanded] = useState(true)

  const myAvatar = currentMember?.content?.avatar || "💙"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const partnerName = partnerMember?.content?.name || "Partner"

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [0, 0],
        zoom: 2,
        zoomControl: false,
        attributionControl: false,
      })

      createMapTileLayer().addTo(map)

      // Add zoom control at bottom-right or top-right
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map)

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
      initialFitCountRef.current = 0
    }
  }, [])

  // Sync markers smoothly without auto-centering on every update
  useEffect(() => {
    const map = mapInstanceRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return

    layer.clearLayers()
    const points: L.LatLngExpression[] = []

    if (myLocation) {
      const myLatLng: L.LatLngExpression = [myLocation.lat, myLocation.lng]
      points.push(myLatLng)

      const myIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="flex flex-col items-center">
            <div class="flex size-8 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-2 ring-background text-base">
              ${myAvatar}
            </div>
            <div class="mt-0.5 rounded-md bg-background/95 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-xs border border-border/80">
              You
            </div>
          </div>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 40],
      })

      L.marker(myLatLng, { icon: myIcon }).addTo(layer)
    }

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
            <div class="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg ring-2 ring-background text-base">
              ${partnerAvatar}
            </div>
            <div class="mt-0.5 rounded-md bg-background/95 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-xs border border-border/80">
              ${partnerName}
            </div>
          </div>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 40],
      })

      L.marker(partnerLatLng, { icon: partnerIcon }).addTo(layer)
    }

    if (points.length > 1) {
      L.polyline(points, {
        color: "#f43f5e",
        weight: 2.5,
        dashArray: "5 6",
        opacity: 0.7,
      }).addTo(layer)
    }

    // Default to "fit both" on initial load:
    // 1. If only 1 marker is available yet, center on it once
    // 2. As soon as both (2) markers are available, upgrade to fitBounds framing both
    if (points.length === 1 && initialFitCountRef.current < 1) {
      map.invalidateSize()
      map.setView(points[0], 14, { animate: false })
      initialFitCountRef.current = 1
    } else if (points.length >= 2 && initialFitCountRef.current < 2) {
      map.invalidateSize()
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, {
        paddingTopLeft: [50, 70],
        paddingBottomRight: [50, 170],
        maxZoom: 15,
        animate: false,
      })
      initialFitCountRef.current = 2
    }
  }, [myLocation, partnerLocation, myAvatar, partnerAvatar, partnerName])

  // Camera navigation controls
  const locateMe = () => {
    if (!myLocation || !mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([myLocation.lat, myLocation.lng], 15, {
      duration: 1.2,
    })
  }

  const locatePartner = () => {
    if (!partnerLocation || !mapInstanceRef.current) return
    mapInstanceRef.current.flyTo(
      [partnerLocation.lat, partnerLocation.lng],
      15,
      {
        duration: 1.2,
      }
    )
  }

  const fitBoth = () => {
    if (!mapInstanceRef.current) return
    const points: L.LatLngExpression[] = []
    if (myLocation) points.push([myLocation.lat, myLocation.lng])
    if (partnerLocation) points.push([partnerLocation.lat, partnerLocation.lng])

    if (points.length === 1) {
      mapInstanceRef.current.flyTo(points[0], 14, { duration: 1 })
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points)
      mapInstanceRef.current.flyToBounds(bounds, {
        paddingTopLeft: [50, 70],
        paddingBottomRight: [50, 170],
        maxZoom: 15,
        duration: 1.2,
      })
    }
  }

  const formatLastUpdated = (dateStr: string) => {
    const d = new Date(dateStr)
    const exactTime = format(d, "h:mm a")
    if (isToday(d)) {
      return `Today at ${exactTime}`
    }
    return `${format(d, "MMM d")} · ${exactTime}`
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background lg:h-full">
      {/* 1. Full interactive map container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0 h-full w-full"
      />

      {/* 2. Top floating header bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => setLocation("/home")}
            className="size-9 rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur-md hover:bg-background"
            title="Back to home"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-3 py-1.5 shadow-md backdrop-blur-md">
            <MapPin className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Couple Map
            </span>
            {formattedDistance && (
              <span className="ml-1 text-[11px] font-medium text-primary">
                · {formattedDistance}
              </span>
            )}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={refreshLocation}
            disabled={isLocating}
            className="size-9 rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur-md hover:bg-background"
            title="Refresh location"
          >
            {isLocating ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 3. Persisted Interactive Drawer */}
      <div className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 mx-auto max-w-md transition-all duration-300">
        <div className="rounded-3xl border border-border/80 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md">
          {/* Drawer Handle & Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <button
              type="button"
              onClick={() => setIsDrawerExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-semibold text-foreground transition-colors hover:text-primary"
            >
              <span>Locations</span>
              {isDrawerExpanded ? (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronUp className="size-3.5 text-muted-foreground" />
              )}
            </button>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={fitBoth}
                className="h-6 gap-1 rounded-full px-2 text-[11px] text-muted-foreground hover:text-foreground"
                title="Fit both markers"
              >
                <Users className="size-3 text-primary" />
                <span>Fit both</span>
              </Button>
            </div>
          </div>

          {/* Expanded Drawer Content with Locate Buttons */}
          {isDrawerExpanded && (
            <div className="grid grid-cols-2 gap-2 pt-2.5">
              {/* Locate You */}
              <button
                type="button"
                onClick={locateMe}
                disabled={!myLocation}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border p-2.5 text-left transition-all",
                  myLocation
                    ? "border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10 active:scale-[0.98]"
                    : "cursor-not-allowed border-border/50 bg-muted/20 opacity-60"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <AnimatedEmoji
                      emoji={myAvatar}
                      size={18}
                      replayOnTap={false}
                      className="shrink-0"
                      fallbackClassName="text-sm"
                    />
                    <span>You</span>
                  </div>
                  <Crosshair className="size-3.5 shrink-0 text-primary" />
                </div>

                {myLocation ? (
                  <div className="w-full space-y-0.5">
                    <p
                      className="truncate text-[11px] font-medium text-foreground"
                      title={myLocation.placeName || ""}
                    >
                      {myLocation.placeName ||
                        `${myLocation.lat.toFixed(3)}, ${myLocation.lng.toFixed(3)}`}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5 shrink-0 opacity-70" />
                      <span className="truncate">
                        {formatLastUpdated(myLocation.updated_at)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">
                    {isLocating ? "Locating..." : "Not shared"}
                  </span>
                )}
              </button>

              {/* Locate Partner */}
              <button
                type="button"
                onClick={locatePartner}
                disabled={!partnerLocation}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border p-2.5 text-left transition-all",
                  partnerLocation
                    ? "border-secondary/60 bg-secondary/20 hover:border-secondary hover:bg-secondary/30 active:scale-[0.98]"
                    : "cursor-not-allowed border-border/50 bg-muted/20 opacity-60"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <AnimatedEmoji
                      emoji={partnerAvatar}
                      size={18}
                      replayOnTap={false}
                      className="shrink-0"
                      fallbackClassName="text-sm"
                    />
                    <span className="truncate">{partnerName}</span>
                  </div>
                  <Crosshair className="size-3.5 shrink-0 text-secondary-foreground" />
                </div>

                {partnerLocation ? (
                  <div className="w-full space-y-0.5">
                    <p
                      className="truncate text-[11px] font-medium text-foreground"
                      title={partnerLocation.placeName || ""}
                    >
                      {partnerLocation.placeName ||
                        `${partnerLocation.lat.toFixed(3)}, ${partnerLocation.lng.toFixed(3)}`}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5 shrink-0 opacity-70" />
                      <span className="truncate">
                        {formatLastUpdated(partnerLocation.updated_at)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">
                    {partnerMember ? "Waiting..." : "No partner"}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
