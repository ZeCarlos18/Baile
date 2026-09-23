import { createContext, useState } from 'react'

export const AuthContext = createContext()

// userId por aba (sessionStorage): sobrevive ao refresh, mas cada aba
// aberta é uma pessoa diferente na sala
function getOrCreateUserId() {
  let stored = sessionStorage.getItem('userId')

  if (!stored) {
    // Gerar novo userId: user_timestamp_randomString
    stored = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    sessionStorage.setItem('userId', stored)
  }

  return stored
}

export function AuthProvider({ children }) {
  const [userId] = useState(getOrCreateUserId)

  return (
    <AuthContext.Provider value={{ userId }}>
      {children}
    </AuthContext.Provider>
  )
}
