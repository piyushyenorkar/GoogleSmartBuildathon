import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise]) as T
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Hook that listens to Supabase auth state changes and syncs with Zustand store.
 * Call this once in your App or PageShell component.
 */
export function useAuthListener() {
  const { setUser, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          15000,
          'Supabase auth session request timed out. Please refresh the page.'
        )

        if (session?.user) {
          setSession({ access_token: session.access_token })
          await fetchUserProfile(session.user.email ?? '', session.user.user_metadata, session.user.id)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('[useAuthListener] Auth initialization failed:', error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
            setLoading(false)
          }
        }
      }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setSession({ access_token: session.access_token })
            await fetchUserProfile(session.user.email ?? '', session.user.user_metadata, session.user.id)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setSession(null)
          }
        } catch (error) {
          console.error('[useAuthListener] Auth state change failed:', error)
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setSession, setLoading])

  async function fetchUserProfile(email: string, meta?: any, fallbackId?: string) {
    if (!email) {
      setLoading(false)
      return
    }

    try {
      const queryPromise = supabase
        .from('users')
        .select('*, college_ref:colleges!college_id(name, city, state)')
        .eq('email', email)
        .maybeSingle()

      const result = await withTimeout(
        queryPromise as unknown as Promise<{ data: any; error: any }>,
        15000,
        'Failed to load user profile. Please refresh.'
      )

      const { data, error } = result

      if (data && !error) {
        const collegeName = (data as any).college_ref?.name || meta?.college || ''
        const collegeCity = (data as any).college_ref?.city || data.city || ''
        const collegeState = (data as any).college_ref?.state || data.state || ''
        const user: User = {
          id: data.id,
          email: data.email,
          name: data.name || email.split('@')[0],
          college: collegeName,
          college_id: data.college_id,
          avatar_url: data.profile_avatar || '',
          roles: data.roles || ['student'],
          bio: data.bio,
          username: data.username,
          city: collegeCity,
          state: collegeState,
          socials: {
            instagram: data.instagram,
            twitter: data.twitter,
            linkedin: data.linkedin,
            github: data.github,
            portfolio: data.portfolio,
          },
          payouts: {
            bank_name: data.bank_name,
            account_name: data.account_name,
            account_number: data.account_number,
            ifsc_code: data.ifsc_code,
            upi_id: data.upi_id,
          },
          created_at: data.created_at,
          course: data.course,
          department: data.department,
          year: data.year || undefined,
          section: data.section || undefined,
          admin_type: data.admin_type || undefined,
        }
        setUser(user)
      } else if (!data && fallbackId) {
        const existingUser = useAuthStore.getState().user
        setUser({
          ...(existingUser || {}),
          id: fallbackId,
          email,
          name: existingUser?.name || meta?.name || email.split('@')[0],
          college: existingUser?.college || meta?.college || '',
          college_id: existingUser?.college_id || meta?.college_id,
          course: existingUser?.course || meta?.course || '',
          department: existingUser?.department || meta?.department || '',
          year: existingUser?.year || meta?.year || undefined,
          section: existingUser?.section || meta?.section || undefined,
          admin_type: existingUser?.admin_type || meta?.admin_type || undefined,
          roles: existingUser?.roles || meta?.roles || ['student'],
          avatar_url: existingUser?.avatar_url || meta?.avatar_url || '',
        })
      }
    } catch (error) {
      console.error('[useAuthListener] fetchUserProfile failed:', error)
      if (fallbackId) {
        const existingUser = useAuthStore.getState().user
        setUser({
          ...(existingUser || {}),
          id: fallbackId,
          email,
          name: existingUser?.name || meta?.name || email.split('@')[0],
          college: existingUser?.college || meta?.college || '',
          college_id: existingUser?.college_id || meta?.college_id,
          course: existingUser?.course || meta?.course || '',
          department: existingUser?.department || meta?.department || '',
          year: existingUser?.year || meta?.year || undefined,
          section: existingUser?.section || meta?.section || undefined,
          admin_type: existingUser?.admin_type || meta?.admin_type || undefined,
          roles: existingUser?.roles || meta?.roles || ['student'],
          avatar_url: existingUser?.avatar_url || meta?.avatar_url || '',
        })
      } else {
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }
}
