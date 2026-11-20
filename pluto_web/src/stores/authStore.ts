import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: { access_token: string } | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: { access_token: string } | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  isLoggedIn: () => boolean
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      signOut: async () => {
        try {
          await supabase.auth.signOut()
        } catch (error) {
          console.error('Error during sign out:', error)
        } finally {
          set({ user: null, session: null })
        }
      },

      isLoggedIn: () => !!get().user,

      hasRole: (role: string) => {
        const user = get().user
        return user?.roles?.includes(role) ?? false
      },
    }),
    {
      name: 'pluto-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
