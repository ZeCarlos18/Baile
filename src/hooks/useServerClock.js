import { createContext, useContext, useEffect, useRef, useState } from "react"

export const ServerClockContext = createContext(() => Date.now())

const SAMPLES = 5
const PING_TIMEOUT_MS = 5000
const RESYNC_INTERVAL_MS = 60_000

/** Hora atual no relógio do servidor (epoch ms). */
export function useServerNow() {
  return useContext(ServerClockContext)
}

/**
 * Mede a diferença entre o relógio deste aparelho e o do servidor com
 * alguns `time-ping` e usa a mediana. Refaz ao (re)conectar e a cada minuto.
 * Devolve uma função estável `serverNow()`.
 */
export function useClockSync(socket) {
  const offsetRef = useRef(0)
  const [serverNow] = useState(() => () => Date.now() + offsetRef.current)

  useEffect(() => {
    let cancelled = false
    let timer = null

    async function sync() {
      const offset = await measureOffset(socket)
      if (!cancelled && offset !== null) offsetRef.current = offset
    }

    function handleConnect() {
      sync()
      clearInterval(timer)
      timer = setInterval(sync, RESYNC_INTERVAL_MS)
    }

    if (socket.connected) handleConnect()
    socket.on("connect", handleConnect)

    return () => {
      cancelled = true
      clearInterval(timer)
      socket.off("connect", handleConnect)
    }
  }, [socket])

  return serverNow
}

async function measureOffset(socket) {
  const offsets = []

  for (let i = 0; i < SAMPLES; i++) {
    try {
      const t0 = Date.now()
      const { serverNow } = await socket.timeout(PING_TIMEOUT_MS).emitWithAck("time-ping", { t0 })
      const t1 = Date.now()
      // A resposta saiu do servidor ~meia viagem antes de chegar aqui
      offsets.push(serverNow + (t1 - t0) / 2 - t1)
    } catch {
      // Ping perdido: segue com as outras amostras
    }
  }

  if (offsets.length === 0) return null
  offsets.sort((a, b) => a - b)
  return offsets[Math.floor(offsets.length / 2)]
}
