import { Room } from '../models/Room.js'
import {
  AUTO_PICK_ON_EXPIRE,
  EMPTY_ROOM_TTL_MS,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH
} from '../config/constants.js'

/**
 * Guarda as salas, cuida dos timers (expiração de sorteio, remoção de sala
 * vazia) e avisa os clientes. Não conhece sockets: recebe uma função
 * `emit(roomCode, event, payload)` que faz o broadcast para a sala.
 *
 * Toda mudança de estado termina com um `room-state` completo.
 */
export class RoomService {
  constructor({
    emit = () => {},
    now = () => Date.now(),
    random = Math.random,
    autoPickOnExpire = AUTO_PICK_ON_EXPIRE,
    emptyRoomTtlMs = EMPTY_ROOM_TTL_MS
  } = {}) {
    this.emit = emit
    this.now = now
    this.random = random
    this.autoPickOnExpire = autoPickOnExpire
    this.emptyRoomTtlMs = emptyRoomTtlMs

    this.rooms = new Map()
    this.drawTimers = new Map() // code -> Timeout
    this.deleteTimers = new Map() // code -> Timeout
  }

  // --- Salas --------------------------------------------------------------

  generateRoomCode() {
    let code
    do {
      code = ''
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_ALPHABET[Math.floor(this.random() * ROOM_CODE_ALPHABET.length)]
      }
    } while (this.rooms.has(code))
    return code
  }

  createRoom() {
    const code = this.generateRoomCode()
    const room = new Room(code, { now: this.now, random: this.random })
    this.rooms.set(code, room)
    // Se ninguém entrar, a sala é apagada como qualquer sala vazia
    this.scheduleDeletion(code)
    return room
  }

  getRoom(code) {
    return this.rooms.get(code) ?? null
  }

  deleteRoom(code) {
    this.clearTimer(this.drawTimers, code)
    this.clearTimer(this.deleteTimers, code)
    this.rooms.delete(code)
  }

  join(code, userId, socketId) {
    const room = this.getRoom(code)
    if (!room) return null

    this.clearTimer(this.deleteTimers, code)
    room.addSocket(userId, socketId)
    this.broadcastState(code)
    return room
  }

  leave(code, userId, socketId) {
    const room = this.getRoom(code)
    if (!room || !room.removeSocket(userId, socketId)) return

    if (room.userCount === 0) this.scheduleDeletion(code)
    this.broadcastState(code)
  }

  // --- Fila ---------------------------------------------------------------

  addVideo(code, userId, { videoId, title }) {
    const room = this.getRoom(code)
    if (!room) return { ok: false, error: 'not-found' }

    const result = room.addEntry({ videoId, title, addedBy: userId })
    this.broadcastState(code)
    return result
  }

  // --- Sorteio ------------------------------------------------------------

  startDraw(code, openedBy) {
    const room = this.getRoom(code)
    if (!room) return { ok: false, error: 'not-found' }

    const result = room.startDraw(openedBy)
    if (!result.ok) return result

    const { drawId, cardOrder, expiresAt } = result.draw
    this.setTimer(this.drawTimers, code, () => this.expireDraw(code, drawId), expiresAt - this.now())

    this.emit(code, 'draw-started', { drawId, cardCount: cardOrder.length, openedBy, expiresAt })
    this.broadcastState(code)
    return { ok: true, drawId }
  }

  pickCard(code, userId, drawId, cardIndex) {
    const room = this.getRoom(code)
    if (!room) return { ok: false, error: 'not-found' }

    const result = room.pickCard(drawId, cardIndex, userId)
    if (!result.ok) return result

    this.announcePick(code, result)
    return { ok: true }
  }

  expireDraw(code, drawId) {
    this.drawTimers.delete(code)
    const room = this.getRoom(code)
    if (!room) return { ok: false, error: 'not-found' }

    const result = room.expireDraw(drawId, { autoPick: this.autoPickOnExpire })
    if (!result.ok) return result

    if (result.autoPicked) this.announcePick(code, result)
    else this.broadcastState(code)
    return result
  }

  announcePick(code, { drawId, cardIndex, cardTitles }) {
    this.clearTimer(this.drawTimers, code)
    this.emit(code, 'card-picked', { drawId, cardIndex, cardTitles })
    this.broadcastState(code)
  }

  /** Abre um sorteio sozinho quando nada está tocando e a fila tem músicas. */
  autoDraw(code) {
    const room = this.getRoom(code)
    if (!room || room.nowPlaying || room.draw || room.queue.length === 0) return false
    return this.startDraw(code, null).ok
  }

  // --- Reprodução ---------------------------------------------------------

  videoEnded(code, entryId) {
    return this.finishEntry(code, room => room.endEntry(entryId))
  }

  videoError(code, entryId) {
    return this.finishEntry(code, room => room.skipEntry(entryId))
  }

  finishEntry(code, finish) {
    const room = this.getRoom(code)
    if (!room) return { ok: false, error: 'not-found' }

    const result = finish(room)
    if (!result.ok) return result

    if (!this.autoDraw(code)) this.broadcastState(code)
    return result
  }

  // --- Infra --------------------------------------------------------------

  broadcastState(code) {
    const room = this.getRoom(code)
    if (room) this.emit(code, 'room-state', room.snapshot())
  }

  scheduleDeletion(code) {
    this.setTimer(this.deleteTimers, code, () => {
      this.deleteTimers.delete(code)
      const room = this.getRoom(code)
      if (room && room.userCount === 0) this.deleteRoom(code)
    }, this.emptyRoomTtlMs)
  }

  setTimer(timers, code, fn, delayMs) {
    this.clearTimer(timers, code)
    const timer = setTimeout(fn, Math.max(0, delayMs))
    // Não segura o processo aberto só por causa de um timer (ex.: nos testes)
    timer.unref?.()
    timers.set(code, timer)
  }

  clearTimer(timers, code) {
    const timer = timers.get(code)
    if (timer) {
      clearTimeout(timer)
      timers.delete(code)
    }
  }

  /** Cancela todos os timers pendentes. */
  dispose() {
    for (const timer of this.drawTimers.values()) clearTimeout(timer)
    for (const timer of this.deleteTimers.values()) clearTimeout(timer)
    this.drawTimers.clear()
    this.deleteTimers.clear()
  }
}
