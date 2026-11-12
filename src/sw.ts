/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"

declare let self: ServiceWorkerGlobalScope

// Clean up outdated Workbox caches and precache Vite build assets
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Serve index.html for all SPA client routes (e.g. /home, /setting, /notification)
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/~oauth/, /^https:\/\/.*\.supabase\.co/],
  })
)

// Activate updated service worker immediately
self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title?: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
}

// Listen for incoming Web Push messages from Supabase Edge Function (even when app is closed)
self.addEventListener("push", (event) => {
  if (!event.data) return

  let payload: PushPayload
  try {
    payload = event.data.json() as PushPayload
  } catch {
    payload = { title: "Fiora", body: event.data.text() }
  }

  const title = payload.title || "Fiora"
  const options: NotificationOptions = {
    body: payload.body || "You have a new update from your partner",
    badge: "/notification-badge.png",
    tag: payload.tag || "fiora-notification",
    data: {
      url: payload.url || "/notification",
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Focus existing window or open Fiora when the user taps the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl =
    (event.notification.data as { url?: string } | undefined)?.url ||
    "/notification"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            void client.focus()
            if ("navigate" in client) {
              return client.navigate(targetUrl)
            }
            return client
          }
        }
        return self.clients.openWindow(targetUrl)
      })
  )
})
