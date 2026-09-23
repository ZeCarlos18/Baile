import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { AuthContext } from "./AuthContext"
import { ServerClockContext, useClockSync } from "../hooks/useServerClock"

export const SocketContext = createContext(null)

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

// Uma única conexão para o app inteiro. Ela é criada sem conectar e só
// conecta no efeito, para que o StrictMode (monta, desmonta, monta de novo)
// não deixe conexões abertas para trás.
export function SocketProvider({ children }) {
  const { userId } = useContext(AuthContext)

  const [socket] = useState(() =>
    io(getServerUrl(), {
      autoConnect: false,
      query: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })
  )

  const serverNow = useClockSync(socket)

  useEffect(() => {
    socket.connect()
    return () => socket.disconnect()
  }, [socket])

  return (
    <SocketContext.Provider value={socket}>
      <ServerClockContext.Provider value={serverNow}>
        {children}
      </ServerClockContext.Provider>
    </SocketContext.Provider>
  )
}
