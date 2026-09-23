import { useCallback, useEffect, useRef, useState } from "react"
import { useSocket, useSocketEvent } from "./useSocket"

const ACK_TIMEOUT_MS = 10000

/**
 * Estado de uma sala, espelho do `room-state` do servidor.
 *
 * `deck` é o sorteio visto por este cliente:
 *   { drawId, cardCount, openedBy, pickedIndex, reveal, dismissed }
 * `reveal` ({ cardIndex, cardTitles }) chega em `card-picked` e mantém o
 * baralho aberto até a animação terminar, mesmo com o sorteio já fechado
 * no servidor.
 */
export function useRoom(roomCode, { onNotFound }) {
  const socket = useSocket()
  const [room, setRoom] = useState(null)
  const [deck, setDeck] = useState(null)

  const roomRef = useRef(null)
  const onNotFoundRef = useRef(onNotFound)

  useEffect(() => {
    onNotFoundRef.current = onNotFound
  })

  const applyState = useCallback((snapshot, { force = false } = {}) => {
    if (!snapshot || snapshot.code !== roomCode) return
    // Ignora um snapshot mais velho que o atual (ex.: chegou fora de ordem)
    if (!force && roomRef.current && snapshot.version < roomRef.current.version) return

    roomRef.current = snapshot
    setRoom(snapshot)
    setDeck(prev => syncDeck(prev, snapshot.draw))
  }, [roomCode])

  // Entra na sala ao montar e a cada (re)conexão; sai ao desmontar
  useEffect(() => {
    let active = true

    function join() {
      socket.timeout(ACK_TIMEOUT_MS).emit("join-room", { roomCode }, (err, response) => {
        if (!active) return
        if (err) {
          if (socket.connected) join()
          return
        }
        if (!response.ok) {
          onNotFoundRef.current?.(response.error)
          return
        }
        applyState(response.state, { force: true })
      })
    }

    if (socket.connected) join()
    socket.on("connect", join)

    return () => {
      active = false
      socket.off("connect", join)
      if (socket.connected) socket.emit("leave-room", { roomCode })
    }
  }, [socket, roomCode, applyState])

  useSocketEvent("room-state", snapshot => applyState(snapshot))

  useSocketEvent("draw-started", ({ drawId, cardCount, openedBy }) => {
    setDeck(prev => (prev?.drawId === drawId ? prev : newDeck({ drawId, cardCount, openedBy })))
  })

  useSocketEvent("card-picked", ({ drawId, cardIndex, cardTitles }) => {
    setDeck(prev => ({
      ...(prev?.drawId === drawId ? prev : newDeck({ drawId, cardCount: cardTitles.length })),
      reveal: { cardIndex, cardTitles },
      dismissed: false
    }))
  })

  const addVideo = useCallback((videoId, title) => {
    socket.emit("add-video", { roomCode, videoId, title })
  }, [socket, roomCode])

  // Com um sorteio já aberto, só reabre o baralho que foi fechado no ✕
  const startDraw = useCallback(() => {
    if (roomRef.current?.draw) {
      setDeck(prev => prev && { ...prev, dismissed: false })
      return
    }
    socket.emit("start-draw", { roomCode })
  }, [socket, roomCode])

  const pickCard = useCallback((drawId, cardIndex) => {
    setDeck(prev => (prev?.drawId === drawId ? { ...prev, pickedIndex: cardIndex } : prev))

    socket.timeout(ACK_TIMEOUT_MS).emit("pick-card", { roomCode, drawId, cardIndex }, (err, response) => {
      if (!err && response.ok) return
      // Outra pessoa venceu ou o prazo acabou: o servidor avisa o resultado
      // por card-picked/room-state. Aqui só destrava a carta clicada.
      setDeck(prev =>
        prev?.drawId === drawId && !prev.reveal ? { ...prev, pickedIndex: null } : prev
      )
    })
  }, [socket, roomCode])

  // ✕ no baralho: esconde só para esta pessoa; o sorteio continua aberto
  const dismissDeck = useCallback(() => {
    setDeck(prev => (prev?.reveal ? null : prev && { ...prev, dismissed: true }))
  }, [])

  const finishReveal = useCallback(() => {
    setDeck(prev => (prev?.reveal ? null : prev))
  }, [])

  const videoEnded = useCallback((entryId) => {
    socket.emit("video-ended", { roomCode, entryId })
  }, [socket, roomCode])

  const videoError = useCallback((entryId, code) => {
    socket.emit("video-error", { roomCode, entryId, code })
  }, [socket, roomCode])

  return { room, deck, addVideo, startDraw, pickCard, dismissDeck, finishReveal, videoEnded, videoError }
}

function newDeck({ drawId, cardCount, openedBy = null }) {
  return { drawId, cardCount, openedBy, pickedIndex: null, reveal: null, dismissed: false }
}

// Alinha o baralho local com o sorteio do snapshot
function syncDeck(prev, draw) {
  if (draw) {
    return prev?.drawId === draw.drawId ? prev : newDeck(draw)
  }
  // Sorteio fechou: some, a não ser que a revelação ainda esteja animando
  return prev?.reveal ? prev : null
}
