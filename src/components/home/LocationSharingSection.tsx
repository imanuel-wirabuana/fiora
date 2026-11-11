import { useEffect, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
import L from "leaflet"
import { MapPin, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useLocationSharing } from "@/hooks/useLocationSharing"
import { useRelationship } from "@/hooks/useRelationship"

export function LocationSharingSection() {
  const {
    locationSharing,
    myLocation,
    partnerLocation,
    partnerMember,
    isLocating,
    geoError,
    refreshLocation,
  } = useLocationSharing()

  const { currentMember } = useRelationship()

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  const myAvatar = currentMember?.content?.avatar || "🙋"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const partnerName = partnerMember?.content?.name || "Partner"

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
      const partnerLatLng: L.LatLngExpression = [partnerLocation.lat, partnerLocation.lng]
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

    // 3. Fit Bounds or Center
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true })
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15, animate: true })
    }
  }, [myLocation, partnerLocation, myAvatar, partnerAvatar, partnerName])

  // Strictly return null if location sharing is not enabled in commitment settings
  if (!locationSharing) {
    return null
  }

  return (
    <Item variant="outline" className="w-full flex-col items-start gap-2.5 p-3.5">
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-4 text-primary" />
          <ItemTitle className="text-sm font-semibold">Location Sharing</ItemTitle>
        </div>

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
      </ItemHeader>

      <ItemContent className="w-full space-y-2">
        {/* Leaflet Map Frame */}
        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-border/70 bg-muted/40 shadow-inner">
          <div ref={mapContainerRef} className="h-full w-full z-0" />

          {/* Overlay when waiting for initial coordinates */}
          {!myLocation && !partnerLocation && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs text-xs text-muted-foreground gap-1.5 p-4 text-center">
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
          <p className="text-[11px] font-medium text-destructive">
            {geoError}
          </p>
        )}

        {/* Location Status Chips */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* My Status */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-2 space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <span>{myAvatar}</span>
              <span>You</span>
            </div>
            <ItemDescription className="text-[11px] truncate text-foreground">
              {myLocation ? (
                formatDistanceToNow(new Date(myLocation.updated_at), {
                  addSuffix: true,
                })
              ) : isLocating ? (
                "Locating..."
              ) : (
                "Not shared"
              )}
            </ItemDescription>
          </div>

          {/* Partner Status */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-2 space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <span>{partnerAvatar}</span>
              <span className="truncate">{partnerName}</span>
            </div>
            <ItemDescription className="text-[11px] truncate text-foreground">
              {partnerLocation ? (
                formatDistanceToNow(new Date(partnerLocation.updated_at), {
                  addSuffix: true,
                })
              ) : partnerMember ? (
                "Waiting for broadcast..."
              ) : (
                "No partner linked"
              )}
            </ItemDescription>
          </div>
        </div>
      </ItemContent>
    </Item>
  )
}

