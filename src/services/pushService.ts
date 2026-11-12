import type {
  PushPermissionState,
  PushSubscriptionData,
} from "../types/notification"

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

function serializeSubscription(
  subscription: PushSubscription
): PushSubscriptionData {
  const json = subscription.toJSON()
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth

  if (!subscription.endpoint || !p256dh || !auth) {
    throw new Error("Browser returned an incomplete push subscription.")
  }

  return {
    endpoint: subscription.endpoint,
    keys: { p256dh, auth },
    userAgent: navigator.userAgent,
    createdAt: new Date().toISOString(),
  }
}

export const pushService = {
  isPushSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    )
  },

  isStandalonePWA(): boolean {
    if (typeof window === "undefined") return false
    const nav = window.navigator as Navigator & { standalone?: boolean }
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true
    )
  },

  isIOS(): boolean {
    if (typeof navigator === "undefined") return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  },

  getPermissionState(): PushPermissionState {
    if (!this.isPushSupported()) return "unsupported"
    return Notification.permission
  },

  async getActiveSubscription(): Promise<PushSubscription | null> {
    if (!this.isPushSupported()) return null

    const registration = await navigator.serviceWorker.ready
    return registration.pushManager.getSubscription()
  },

  async subscribeDevice(): Promise<PushSubscriptionData> {
    if (!this.isPushSupported()) {
      throw new Error("Push notifications are not supported on this browser.")
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      throw new Error(
        "Missing VITE_VAPID_PUBLIC_KEY environment variable. Please configure VAPID keys."
      )
    }

    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      throw new Error(
        "Notification permission was denied. Please allow notifications in your browser or phone settings."
      )
    }

    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      return serializeSubscription(existing)
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    return serializeSubscription(subscription)
  },

  async unsubscribeDevice(): Promise<string | null> {
    const existing = await this.getActiveSubscription()
    if (!existing) return null

    const endpoint = existing.endpoint
    await existing.unsubscribe()
    return endpoint
  },
}

