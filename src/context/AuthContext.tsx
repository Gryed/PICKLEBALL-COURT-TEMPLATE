import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: 'admin' | 'customer' | null
  platformRole: 'super_admin' | null
  username: string | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  signIn: (usernameOrEmail: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<'admin' | 'customer' | null>(null)
  const [platformRole, setPlatformRole] = useState<'super_admin' | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('role, username, platform_role').eq('id', userId).single()
    setRole((data?.role as 'admin' | 'customer') ?? 'customer')
    setUsername(data?.username ?? null)
    setPlatformRole(data?.platform_role === 'super_admin' ? 'super_admin' : null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) await loadProfile(session.user.id)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setRole(null)
        setUsername(null)
        setPlatformRole(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    return { error }
  }

  const signIn = async (usernameOrEmail: string, password: string) => {
    let email = usernameOrEmail

    // If it doesn't look like an email, treat it as a username and look up the email
    if (!usernameOrEmail.includes('@')) {
      const { data, error: lookupError } = await supabase.rpc('get_email_by_username', {
        p_username: usernameOrEmail,
      })
      if (lookupError || !data) {
        return { error: new Error('Username not found') }
      }
      email = data
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, role, platformRole, username, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}