import type { Session, User } from "@supabase/supabase-js"

export type AuthUser = User
export type AuthSession = Session

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthResult {
  user: AuthUser | null
  session: AuthSession | null
  requiresEmailConfirmation?: boolean
}

export interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  isInitialized: boolean
  setSession: (session: AuthSession | null) => void
  initialize: () => () => void
}
