import { supabase } from "./supabase"
import type { AuthCredentials, AuthResult, AuthSession } from "../types/auth"

export const authService = {
  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      throw new Error(error.message)
    }
    return data.session
  },

  onAuthStateChange(
    callback: (session: AuthSession | null) => void
  ): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
    return () => {
      subscription.unsubscribe()
    }
  },

  async signInWithEmail({ email, password }: AuthCredentials): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      user: data.user,
      session: data.session,
    }
  },

  async signUpWithEmail({ email, password }: AuthCredentials): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      user: data.user,
      session: data.session,
      requiresEmailConfirmation: !data.session,
    }
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  },
}

