import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authService } from "../services/authService"
import { useAuthStore } from "../stores/authStore"
import type { AuthCredentials, AuthResult } from "../types/auth"

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
}

export function useAuth() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initialize = useAuthStore((state) => state.initialize)
  const setSession = useAuthStore((state) => state.setSession)

  const signInMutation = useMutation<AuthResult, Error, AuthCredentials>({
    mutationFn: (credentials) => authService.signInWithEmail(credentials),
    onSuccess: (data) => {
      setSession(data.session)
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })

  const signUpMutation = useMutation<AuthResult, Error, AuthCredentials>({
    mutationFn: (credentials) => authService.signUpWithEmail(credentials),
    onSuccess: (data) => {
      if (data.session) {
        setSession(data.session)
      }
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })

  const signOutMutation = useMutation<
    void,
    Error,
    void,
    { previousSession: ReturnType<typeof useAuthStore.getState>["session"] }
  >({
    mutationFn: () => authService.signOut(),
    onMutate: async () => {
      const previousSession = useAuthStore.getState().session
      // Immediately clear local session store to transition screens instantly
      setSession(null)
      queryClient.clear()
      return { previousSession }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSession) {
        setSession(context.previousSession)
      }
    },
    onSuccess: () => {
      setSession(null)
      queryClient.clear()
    },
  })

  return {
    user,
    session,
    isAuthenticated: !!session,
    isInitialized,
    initialize,
    // Mutations
    signIn: signInMutation.mutateAsync,
    signInMutation,
    signUp: signUpMutation.mutateAsync,
    signUpMutation,
    signOut: signOutMutation.mutateAsync,
    signOutMutation,
  }
}
