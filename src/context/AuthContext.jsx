import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch employee profile from database
  const fetchEmployee = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setEmployee(data)
      return data
    } catch (err) {
      console.error('Error fetching employee:', err)
      setEmployee(null)
      return null
    }
  }

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchEmployee(session.user.id)
        }
      } catch (err) {
        console.error('Session error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchEmployee(session.user.id)
        } else {
          setEmployee(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setEmployee(null)
    } catch (err) {
      setError(err.message)
    }
  }

  // Check if user is admin
  const isAdmin = () => {
    return employee?.role === 'admin'
  }

  // Refresh employee data
  const refreshEmployee = async () => {
    if (user) {
      await fetchEmployee(user.id)
    }
  }

  const value = {
    user,
    employee,
    loading,
    error,
    signIn,
    signOut,
    isAdmin,
    refreshEmployee
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
