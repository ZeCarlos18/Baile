/**
 * Adapta os eventos do Socket.IO para o RoomService.
 *
 * Todo handler responde pelo acknowledgement (quando o cliente manda um)
 * com `{ ok: true, ... }` ou `{ ok: false, error }`. Nenhuma exceção escapa:
 * o Socket.IO chama os handlers dentro de `process.nextTick`, então um erro
 * não tratado derrubaria o servidor inteiro.
 */

const isObject = value => value !== null && typeof value === 'object'
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0

function normalizeUserId(raw) {
  return isNonEmptyString(raw) ? raw.trim().slice(0, 64) : null
}

export function setupSocketEvents(io, roomService) {
  io.on('connection', (socket) => {
    const userId = normalizeUserId(socket.handshake.query.userId) ?? socket.id

    function on(event, handler) {
      socket.on(event, (payload, ack) => {
        if (typeof payload === 'function') {
          ack = payload
          payload = undefined
        }
        const reply = typeof ack === 'function' ? ack : () => {}

        try {
          reply(handler(payload) ?? { ok: true })
        } catch (err) {
          console.error(`❌ [socket] erro em '${event}' (${userId}):`, err)
          reply({ ok: false, error: 'internal' })
        }
      })
    }

    // Eventos de sala só valem para a sala em que este socket entrou
    function inRoom(handler) {
      return (payload) => {
        const code = socket.data.roomCode
        if (!code || !isObject(payload) || payload.roomCode !== code) {
          return { ok: false, error: 'not-in-room' }
        }
        return handler(code, payload)
      }
    }

    function leaveCurrentRoom() {
      const code = socket.data.roomCode
      if (!code) return
      socket.leave(code)
      socket.data.roomCode = null
      roomService.leave(code, userId, socket.id)
    }

    on('create-room', () => ({ ok: true, code: roomService.createRoom().code }))

    on('join-room', (payload) => {
      if (!isObject(payload) || !isNonEmptyString(payload.roomCode)) {
        return { ok: false, error: 'invalid-payload' }
      }
      const code = payload.roomCode.trim().toUpperCase()

      if (socket.data.roomCode && socket.data.roomCode !== code) leaveCurrentRoom()

      const room = roomService.join(code, userId, socket.id)
      if (!room) return { ok: false, error: 'not-found' }

      socket.join(code)
      socket.data.roomCode = code
      return { ok: true, state: room.snapshot() }
    })

    on('leave-room', inRoom(() => {
      leaveCurrentRoom()
    }))

    on('add-video', inRoom((code, { videoId, title }) => {
      if (!isNonEmptyString(videoId) || typeof title !== 'string') {
        return { ok: false, error: 'invalid-payload' }
      }
      return roomService.addVideo(code, userId, { videoId, title })
    }))

    on('start-draw', inRoom((code) => roomService.startDraw(code, userId)))

    on('pick-card', inRoom((code, { drawId, cardIndex }) =>
      roomService.pickCard(code, userId, drawId, cardIndex)
    ))

    on('video-ended', inRoom((code, { entryId }) => roomService.videoEnded(code, entryId)))

    on('video-error', inRoom((code, { entryId }) => roomService.videoError(code, entryId)))

    on('time-ping', (payload) => ({
      t0: isObject(payload) && typeof payload.t0 === 'number' ? payload.t0 : null,
      serverNow: Date.now()
    }))

    socket.on('disconnect', () => {
      try {
        leaveCurrentRoom()
      } catch (err) {
        console.error(`❌ [socket] erro ao desconectar (${userId}):`, err)
      }
    })
  })
}
