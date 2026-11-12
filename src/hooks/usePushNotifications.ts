import { useEffect, useMemo, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { pushService } from "../services/pushService"
import { useRelationship } from "./useRelationship"
import type { PushPermissionState } from "../types/notification"

const PUSH_OPT_OUT_KEY = "fiora_push_opt_out"

export const pushKeys = {
  all: ["push"] as const,
  device: (memberId?: number) => [...pushKeys.all, "device", memberId] as const,
}

interface DevicePushStatus {
  permission: PushPermissionState
  activeEndpoint: string | null
}

export function usePushNotifications() {
  const queryClient = useQueryClient()
  const { currentMember, updateMemberContentMutation } = useRelationship()

  const isSupported = pushService.isPushSupported()
  const isStandalone = pushService.isStandalonePWA()
  const isIOS = pushService.isIOS()

  const deviceQuery = useQuery<DevicePushStatus>({
    queryKey: pushKeys.device(currentMember?.id),
    queryFn: async () => {
      const permission = pushService.getPermissionState()
      const subscription = await pushService.getActiveSubscription()
      return {
        permission,
        activeEndpoint: subscription?.endpoint ?? null,
      }
    },
    enabled: isSupported,
    staleTime: 30_000,
  })

  const savedSubscriptions = useMemo(
    () => currentMember?.content?.push_subscriptions ?? [],
    [currentMember?.content?.push_subscriptions]
  )

  const permission: PushPermissionState =
    deviceQuery.data?.permission ?? pushService.getPermissionState()
  const activeEndpoint = deviceQuery.data?.activeEndpoint ?? null

  const isSubscribed = Boolean(
    permission === "granted" &&
      activeEndpoint &&
      savedSubscriptions.some((sub) => sub.endpoint === activeEndpoint)
  )

  const enablePushMutation = useMutation({
    mutationFn: async () => {
      if (!currentMember) {
        throw new Error("Please join or create a relationship first.")
      }

      const subscriptionData = await pushService.subscribeDevice()
      localStorage.removeItem(PUSH_OPT_OUT_KEY)

      const filtered = savedSubscriptions.filter(
        (sub) => sub.endpoint !== subscriptionData.endpoint
      )

      await updateMemberContentMutation.mutateAsync({
        memberId: currentMember.id,
        content: {
          push_subscriptions: [...filtered, subscriptionData],
        },
      })

      return subscriptionData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pushKeys.device(currentMember?.id),
      })
    },
  })

  const disablePushMutation = useMutation({
    mutationFn: async () => {
      localStorage.setItem(PUSH_OPT_OUT_KEY, "true")
      const removedEndpoint = await pushService.unsubscribeDevice()

      if (currentMember && removedEndpoint) {
        const remaining = savedSubscriptions.filter(
          (sub) => sub.endpoint !== removedEndpoint
        )
        await updateMemberContentMutation.mutateAsync({
          memberId: currentMember.id,
          content: {
            push_subscriptions: remaining,
          },
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pushKeys.device(currentMember?.id),
      })
    },
  })

  const togglePush = () => {
    if (isSubscribed) {
      return disablePushMutation.mutateAsync()
    }
    return enablePushMutation.mutateAsync()
  }

  return {
    isSupported,
    isStandalone,
    isIOS,
    permission,
    isSubscribed,
    isLoading: deviceQuery.isLoading,
    isPending: enablePushMutation.isPending || disablePushMutation.isPending,
    error: enablePushMutation.error || disablePushMutation.error,
    enablePush: enablePushMutation.mutateAsync,
    disablePush: disablePushMutation.mutateAsync,
    togglePush,
  }
}

export function useAutoPushSubscription() {
  const { currentMember } = useRelationship()
  const {
    isSupported,
    isIOS,
    isStandalone,
    permission,
    isSubscribed,
    isLoading,
    enablePush,
  } = usePushNotifications()
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (
      attemptedRef.current ||
      isLoading ||
      !currentMember ||
      !isSupported ||
      (isIOS && !isStandalone) ||
      isSubscribed ||
      permission === "denied"
    ) {
      return
    }

    if (localStorage.getItem(PUSH_OPT_OUT_KEY) === "true") {
      return
    }

    attemptedRef.current = true

    const triggerSubscribe = () => {
      void enablePush().catch(() => {
        // Ignore if user dismisses or browser requires gesture
      })
    }

    // 1. Try immediately on app open (works when permission is already "granted" or on desktop/Android)
    triggerSubscribe()

    // 2. If browser requires a user gesture to show the permission prompt, trigger on first tap
    if (pushService.getPermissionState() === "default") {
      const handleFirstInteraction = () => {
        if (pushService.getPermissionState() === "default") {
          triggerSubscribe()
        }
        window.removeEventListener("pointerdown", handleFirstInteraction)
        window.removeEventListener("keydown", handleFirstInteraction)
      }

      window.addEventListener("pointerdown", handleFirstInteraction, {
        once: true,
      })
      window.addEventListener("keydown", handleFirstInteraction, {
        once: true,
      })

      return () => {
        window.removeEventListener("pointerdown", handleFirstInteraction)
        window.removeEventListener("keydown", handleFirstInteraction)
      }
    }
  }, [
    currentMember,
    isLoading,
    isSupported,
    isIOS,
    isStandalone,
    isSubscribed,
    permission,
    enablePush,
  ])
}
