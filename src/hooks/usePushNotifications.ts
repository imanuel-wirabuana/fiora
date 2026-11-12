import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { pushService } from "../services/pushService"
import { useRelationship } from "./useRelationship"
import type { PushPermissionState } from "../types/notification"

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

