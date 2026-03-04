import { useContext, useMemo } from 'react'
import { io } from "socket.io-client"
import { AuthContext } from '../contexts/AuthContext'

const getServerUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL
  }
  
  if (typeof window === 'undefined') return 'http://localhost:3000'
  
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const port = 3000
  
  return `${protocol}//${hostname}:${port}`
}

export function useSocket() {
  const { userId } = useContext(AuthContext)
  
  const socket = useMemo(() => {
    console.log(`🔌 [useSocket] Conectando com userId:`, userId)
    
    return io(getServerUrl(), {
      query: {
        userId: userId
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })
  }, [userId])
  
  return socket
}