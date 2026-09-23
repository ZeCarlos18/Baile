import { useCallback, useEffect, useRef } from "react"
import { SyncedPlayer } from "../lib/SyncedPlayer"
import { useServerNow } from "./useServerClock"

/**
 * Liga um SyncedPlayer ao ciclo de vida do componente. O player é criado
 * uma vez; os callbacks ficam em refs, então o efeito de troca de música
 * depende só de `entryId` e `startAt`.
 */
export function usePlayer({ containerRef, nowPlaying, onEnded, onError, onBlocked, onPlaying }) {
  const serverNow = useServerNow()
  const controllerRef = useRef(null)
  const latest = useRef(null)

  useEffect(() => {
    latest.current = { nowPlaying, serverNow, onEnded, onError, onBlocked, onPlaying }
  })

  useEffect(() => {
    const controller = new SyncedPlayer(containerRef.current, {
      serverNow: () => latest.current.serverNow(),
      onEnded: (entryId) => latest.current.onEnded?.(entryId),
      onError: (entryId, code) => latest.current.onError?.(entryId, code),
      onBlocked: () => latest.current.onBlocked?.(),
      onPlaying: () => latest.current.onPlaying?.()
    })
    controllerRef.current = controller

    return () => {
      controller.destroy()
      controllerRef.current = null
    }
  }, [containerRef])

  const entryId = nowPlaying?.entry.entryId
  const startAt = nowPlaying?.startAt

  useEffect(() => {
    controllerRef.current?.setNowPlaying(latest.current.nowPlaying)
  }, [entryId, startAt])

  const resume = useCallback(() => controllerRef.current?.resume(), [])
  const getPlayer = useCallback(() => controllerRef.current?.player ?? null, [])

  return { resume, getPlayer }
}
