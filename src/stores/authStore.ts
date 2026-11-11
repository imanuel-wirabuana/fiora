import { create } from "zustand"
import { authService } from "../services/authService"
import type { AuthSession, AuthState } from "../types/auth"

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isInitialized: false,

  setSession: (session: AuthSession | null) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  initialize: () => {
    // Get initial session
    authService
      .getSession()
      .then((session) => {
        set({
          session,
          user: session?.user ?? null,
          isInitialized: true,
        })
      })
      .catch((err: unknown) => {
        console.error("Failed to load initial session", err)
        set({ isInitialized: true })
      })

    // Subscribe to auth state updates
    const unsubscribe = authService.onAuthStateChange((session) => {
      set({
        session,
        user: session?.user ?? null,
      })
    })

    return unsubscribe
  },
}))
