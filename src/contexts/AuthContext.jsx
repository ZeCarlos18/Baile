import { createContext, useMemo } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  // Gerar ou recuperar userId do localStorage - APENAS UMA VEZ
  const userId = useMemo(() => {
    let stored = localStorage.getItem('userId')
    
    if (!stored) {
      console.log('🆔 [AuthContext] Gerando novo userId');
      // Gerar novo userId: user_timestamp_randomString
      stored = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('userId', stored)
      console.log('✅ [AuthContext] userId salvo no localStorage:', stored);
    } else {
      console.log('♻️ [AuthContext] Recuperando userId do localStorage:', stored);
    }
    
    return stored
  }, [])

  return (
    <AuthContext.Provider value={{ userId }}>
      {children}
    </AuthContext.Provider>
  )
}
