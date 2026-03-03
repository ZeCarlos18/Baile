import { createContext, useState, useCallback } from 'react'
import axios from 'axios'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loginWithSpotify = useCallback(async (code) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/token`, { code })
      localStorage.setItem('token', response.data.access_token)
      return response.data
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('token')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithSpotify, logout }}>
      {children}
    </AuthContext.Provider>
  )
}