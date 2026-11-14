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
    geoError,
    refreshLocation,
  } = useLocationSharing()

  const { currentMember } = useRelationship()

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const drawerContentRef = useRef<HTMLDivElement | null>(null)

  const [isDrawerExpanded, setIsDrawerExpanded] = useState(true)
  const [drawerContentHeight, setDrawerContentHeight] = useState<
    number | undefined
  >(undefined)
  const locationKey = `${myLocation?.updated_at ?? ""}|${partnerLocation?.updated_at ?? ""}`
  const [focusState, setFocusState] = useState<{
    focus: "both" | "me" | "partner"
    key: string
  }>({ focus: "both", key: "" })
  const activeFocus =
    focusState.key === locationKey ? focusState.focus : "both"

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
    }
  }, [])

  // Keep Leaflet map sized cleanly when the docked drawer expands/collapses
  useEffect(() => {
    const mapEl = mapContainerRef.current
    if (!mapEl) return

    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize({ animate: false })
    })
    observer.observe(mapEl)

    return () => observer.disconnect()
  }, [])

  // Smoothly measure collapsible drawer content height (including padding)
  useEffect(() => {
    const contentEl = drawerContentRef.current
    if (!contentEl) return

    const observer = new ResizeObserver(() => {
      setDrawerContentHeight(contentEl.offsetHeight)
    })
    observer.observe(contentEl)

    return () => observer.disconnect()
  }, [isDrawerExpanded])

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

    // Auto-fit whenever myLocation or partnerLocation updates
    if (points.length === 1) {
      map.invalidateSize({ animate: false })
      map.setView(points[0], 14, { animate: true })
    } else if (points.length >= 2) {
      map.invalidateSize({ animate: false })
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, {
        paddingTopLeft: [50, 70],
        paddingBottomRight: [50, 70],
        maxZoom: 15,
        animate: true,
      })
    }
  }, [myLocation, partnerLocation, myAvatar, partnerAvatar, partnerName])

  // Camera navigation controls
  const locateMe = () => {
    if (!myLocation || !mapInstanceRef.current) return
    setFocusState({ focus: "me", key: locationKey })
    mapInstanceRef.current.flyTo([myLocation.lat, myLocation.lng], 15, {
      duration: 1.2,
    })
  }

  const locatePartner = () => {
    if (!partnerLocation || !mapInstanceRef.current) return
    setFocusState({ focus: "partner", key: locationKey })
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
    setFocusState({ focus: "both", key: locationKey })
    const points: L.LatLngExpression[] = []
    if (myLocation) points.push([myLocation.lat, myLocation.lng])
    if (partnerLocation) points.push([partnerLocation.lat, partnerLocation.lng])

    if (points.length === 1) {
      mapInstanceRef.current.flyTo(points[0], 14, { duration: 1 })
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points)
      mapInstanceRef.current.flyToBounds(bounds, {
        paddingTopLeft: [50, 70],
        paddingBottomRight: [50, 70],
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
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background lg:h-full">
      {/* 1. Interactive map area (flex-1 so zoom controls stay above docked drawer) */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={mapContainerRef}
          className="absolute inset-0 z-0 h-full w-full [&_.leaflet-bottom]:mb-7"
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
      </div>

      {/* 3. Docked Persistent Collapsible Drawer (matching Login & Setup) */}
      <div className="relative z-20 -mt-6 flex w-full shrink-0 flex-col rounded-t-4xl border-t border-border bg-card px-5 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
        {/* Grab handle */}
        <button
          type="button"
          onClick={() => setIsDrawerExpanded((prev) => !prev)}
          aria-label={isDrawerExpanded ? "Collapse locations" : "Expand locations"}
          className="mx-auto mb-2 flex w-16 justify-center py-0.5"
        >
          <span className="h-1 w-10 rounded-full bg-muted-foreground/25 transition-colors hover:bg-muted-foreground/45" />
        </button>

        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-2 pb-1">
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

          <Button
            type="button"
            variant={activeFocus === "both" ? "secondary" : "ghost"}
            size="xs"
            onClick={fitBoth}
            className={cn(
              "h-7 gap-1 rounded-full px-2.5 text-[11px]",
              activeFocus === "both"
                ? "bg-primary/10 font-semibold text-primary hover:bg-primary/15"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Fit both markers"
          >
            <Users className="size-3" />
            <span>Fit both</span>
          </Button>
        </div>

        {/* Smooth Height-Animated Collapsible Content */}
        <div
          style={{
            height: isDrawerExpanded
              ? drawerContentHeight !== undefined
                ? `${drawerContentHeight}px`
                : "auto"
              : "0px",
          }}
          className="overflow-hidden transition-[height] duration-300 ease-out"
        >
          <div ref={drawerContentRef} className="space-y-2.5 pt-2.5 pb-1">
            {geoError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] font-medium text-destructive">
                {geoError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {/* Locate You */}
              <button
                type="button"
                onClick={locateMe}
                disabled={!myLocation}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition-all",
                  myLocation
                    ? activeFocus === "me"
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-primary/25 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 active:scale-[0.98]"
                    : "cursor-not-allowed border-border/50 bg-muted/20 opacity-60"
                )}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground">
                    <AnimatedEmoji
                      emoji={myAvatar}
                      size={18}
                      replayOnTap={false}
                      className="shrink-0"
                      fallbackClassName="text-sm"
                    />
                    <span className="truncate">You</span>
                  </div>
                  <Crosshair className="size-3.5 shrink-0 text-primary" />
                </div>

                {myLocation ? (
                  <div className="w-full space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                      <MapPin className="size-2.5 shrink-0 text-primary/80" />
                      <span
                        className="truncate"
                        title={myLocation.placeName || ""}
                      >
                        {myLocation.placeName ||
                          `${myLocation.lat.toFixed(3)}, ${myLocation.lng.toFixed(3)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5 shrink-0 opacity-70" />
                      <span className="truncate">
                        {formatLastUpdated(myLocation.updated_at)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">
                    {isLocating ? "Locating..." : "Not shared yet"}
                  </span>
                )}
              </button>

              {/* Locate Partner */}
              <button
                type="button"
                onClick={locatePartner}
                disabled={!partnerLocation}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition-all",
                  partnerLocation
                    ? activeFocus === "partner"
                      ? "border-secondary bg-secondary/35 ring-1 ring-secondary-foreground/25"
                      : "border-secondary/50 bg-secondary/15 hover:border-secondary hover:bg-secondary/25 active:scale-[0.98]"
                    : "cursor-not-allowed border-border/50 bg-muted/20 opacity-60"
                )}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground">
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
                  <div className="w-full space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                      <MapPin className="size-2.5 shrink-0 text-secondary-foreground/80" />
                      <span
                        className="truncate"
                        title={partnerLocation.placeName || ""}
                      >
                        {partnerLocation.placeName ||
                          `${partnerLocation.lat.toFixed(3)}, ${partnerLocation.lng.toFixed(3)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5 shrink-0 opacity-70" />
                      <span className="truncate">
                        {formatLastUpdated(partnerLocation.updated_at)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">
                    {partnerMember ? "Waiting for update..." : "No partner"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
