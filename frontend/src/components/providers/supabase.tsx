import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface SupabaseContextType {
  supabase: SupabaseClient
  session: Session | null
  loading: boolean
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <SupabaseContext.Provider value={{ supabase, session, loading }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export const useAuth = () => {
  const { session, loading } = useSupabase()
  return {
    isAuthenticated: !!session,
    user: session?.user ?? null,
    loading,
    isLoading: loading,
    error: null,
    signinRedirect: async () => {
      await supabase.auth.signInWithOAuth({ provider: 'google' })
    },
    removeUser: async () => {
      await supabase.auth.signOut()
    },
  }
}
