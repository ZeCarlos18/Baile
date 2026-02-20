import { useEffect, useState } from 'react'
import io from 'socket.io-client'

export function useSocket(roomId) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
    })

    newSocket.on('connect', () => setConnected(true))
    newSocket.on('disconnect', () => setConnected(false))

    setSocket(newSocket)

    return () => newSocket.close()
  }, [roomId])

  return { socket, connected }
}