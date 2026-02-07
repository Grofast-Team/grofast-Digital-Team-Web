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
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          // If AbortError, try again once
          if (error.message?.includes('AbortError') || error.message?.includes('aborted')) {
            console.warn('Session fetch aborted, retrying...')
            const retry = await supabase.auth.getSession()
            if (!mounted) return
            if (retry.data?.session?.user) {
              setUser(retry.data.session.user)
              await fetchEmployee(retry.data.session.user.id)
            }
            setLoading(false)
            return
          }
          throw error
        }

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchEmployee(session.user.id)
        }
      } catch (err) {
        console.error('Session error:', err)
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchEmployee(session.user.id)
        } else {
          setEmployee(null)
        }
        setLoading(false)
      }
    )

    // Safety timeout - never stay loading more than 8 seconds
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 8000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
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
