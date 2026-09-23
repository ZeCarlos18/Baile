import { useContext, useEffect, useRef } from 'react'
import { SocketContext } from '../contexts/SocketContext'

export function useSocket() {
  return useContext(SocketContext)
}

/**
 * Escuta um evento do socket enquanto o componente estiver montado.
 * O handler é lido de um ref, então sempre enxerga o estado atual sem
 * precisar registrar o listener de novo a cada render.
 */
export function useSocketEvent(event, handler) {
  const socket = useSocket()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    const listener = (...args) => handlerRef.current(...args)
    socket.on(event, listener)
    return () => socket.off(event, listener)
  }, [socket, event])
}
