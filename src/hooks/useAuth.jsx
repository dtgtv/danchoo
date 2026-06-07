import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [agent, setAgent] = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchAgent(session.user.id)
      else { setAgent(null); setLoading(false) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) fetchAgent(session.user.id)
      else { setAgent(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchAgent(userId) {
    const { data } = await supabase.from('agents').select('*').eq('id', userId).single()
    setAgent(data || null)
    setLoading(false)
  }

  async function signInWithEmail(email) {
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/danchoo/` }
    })
  }

  async function signOut() { await supabase.auth.signOut() }

  return (
    <AuthContext.Provider value={{ agent, loading, signInWithEmail, signOut, fetchAgent }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
