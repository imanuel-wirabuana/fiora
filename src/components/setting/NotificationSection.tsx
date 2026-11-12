import { Bell, BellOff } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { usePushNotifications } from "@/hooks/usePushNotifications"

export function NotificationSection() {
  const {
    isSupported,
    isStandalone,
    isIOS,
    permission,
    isSubscribed,
    isLoading,
    isPending,
    error,
    togglePush,
  } = usePushNotifications()

  const needsIOSInstall = isIOS && !isStandalone
  const isBlocked = permission === "denied"
  const isDisabled = !isSupported || needsIOSInstall || isBlocked || isPending

  let description = "Receive alerts on this phone even when Fiora is closed."
  if (needsIOSInstall) {
    description =
      "Add Fiora to your iPhone Home Screen (Share → Add to Home Screen) to enable push notifications."
  } else if (!isSupported) {
    description = "Push notifications are not supported in this browser."
  } else if (isBlocked) {
    description =
      "Notifications are blocked. Enable them in your browser or phone settings."
  } else if (isSubscribed) {
    description = "Active on this device. You will receive partner alerts."
  }

  return (
    <CustomItem
      icon={
        isSubscribed ? (
          <Bell className="size-3.5 text-primary" />
        ) : (
          <BellOff className="size-3.5 text-muted-foreground" />
        )
      }
      title="Phone Notifications"
      description={description}
      topRightActions={
        isLoading || isPending ? (
          <Spinner className="size-4 text-primary" />
        ) : (
          <Switch
            checked={isSubscribed}
            disabled={isDisabled}
            onCheckedChange={() => {
              void togglePush().catch(() => {
                // Error state is exposed by hook
              })
            }}
            aria-label="Toggle phone push notifications"
          />
        )
      }
      bottomLeftInfo={
        error ? (
          <p className="text-[11px] text-destructive">{error.message}</p>
        ) : null
      }
    />
  )
}

