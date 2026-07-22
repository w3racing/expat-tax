import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getSupabase, isSupabaseConfigured } from '@/shared/lib/supabase'

export type AuthUser = {
  id: string
  email: string
  displayName: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  isLocalMode: boolean
  signInWithGoogle: () => Promise<void>
  signInLocal: (email?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const LOCAL_USER_KEY = 'ajx.auth.local.user'

function readLocalUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const isLocalMode = !isSupabaseConfigured

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      setUser(readLocalUser())
      setLoading(false)
      return
    }
    // Cloud mode: never honour a stale local demo session
    localStorage.removeItem(LOCAL_USER_KEY)

    void supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email ?? '',
          displayName:
            (sessionUser.user_metadata?.full_name as string | undefined) ??
            sessionUser.email ??
            'User',
        })
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user
      if (!sessionUser) {
        setUser(null)
        return
      }
      setUser({
        id: sessionUser.id,
        email: sessionUser.email ?? '',
        displayName:
          (sessionUser.user_metadata?.full_name as string | undefined) ??
          sessionUser.email ??
          'User',
      })
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      throw Object.assign(new Error('Supabase not configured'), { code: 'AUTH_FAILED' })
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      throw Object.assign(error, { code: 'AUTH_FAILED' })
    }
  }, [])

  const signInLocal = useCallback(async (email = 'you@ajx.tax') => {
    if (isSupabaseConfigured) {
      throw Object.assign(new Error('Local sign-in is disabled when Supabase is configured'), {
        code: 'AUTH_FAILED',
      })
    }
    const localUser: AuthUser = {
      id: 'local-user',
      email,
      displayName: email.split('@')[0] || 'You',
    }
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser))
    setUser(localUser)
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (supabase) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem(LOCAL_USER_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, isLocalMode, signInWithGoogle, signInLocal, signOut }),
    [user, loading, isLocalMode, signInWithGoogle, signInLocal, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
