import { randomUUID } from 'node:crypto'
import { DRAW_DURATION_MS, START_DELAY_MS } from '../config/constants.js'

/**
 * Estado de uma sala. É a única fonte da verdade: os clientes só espelham
 * o `snapshot()`. Não conhece sockets nem timers; `now`, `random` e `uuid`
 * são injetáveis para os testes.
 *
 * Os métodos que mudam o estado devolvem `{ ok: true, ... }` ou
 * `{ ok: false, error }` e incrementam `version` quando algo mudou.
 */
export class Room {
  constructor(code, { now = () => Date.now(), random = Math.random, uuid = randomUUID } = {}) {
    this.code = code
    this.queue = [] // Entry[]: { entryId, videoId, title, addedBy, addedAt }
    this.nowPlaying = null // { entry, startAt, selectedBy }
    this.draw = null // { drawId, cardOrder: entryId[], openedBy, expiresAt }
    this.users = new Map() // userId -> Set<socketId>
    this.version = 0
    this.emptySince = now()

    this.now = now
    this.random = random
    this.uuid = uuid
  }

  bump() {
    this.version++
  }

  // --- Usuários -----------------------------------------------------------

  addSocket(userId, socketId) {
    let sockets = this.users.get(userId)
    if (!sockets) {
      sockets = new Set()
      this.users.set(userId, sockets)
    }
    sockets.add(socketId)
    this.emptySince = null
    this.bump()
  }

  removeSocket(userId, socketId) {
    const sockets = this.users.get(userId)
    if (!sockets || !sockets.delete(socketId)) return false

    if (sockets.size === 0) this.users.delete(userId)
    if (this.users.size === 0) this.emptySince = this.now()
    this.bump()
    return true
  }

  get userCount() {
    return this.users.size
  }

  // --- Fila ---------------------------------------------------------------

  addEntry({ videoId, title, addedBy }) {
    const entry = {
      entryId: this.uuid(),
      videoId,
      title,
      addedBy,
      addedAt: this.now()
    }
    this.queue.push(entry)
    this.bump()
    return { ok: true, entry }
  }

  // --- Sorteio ------------------------------------------------------------

  /**
   * Abre um sorteio com todas as músicas da fila embaralhadas. Pode ser
   * aberto com música tocando: a carta escolhida pula a música atual.
   */
  startDraw(openedBy) {
    if (this.draw) return { ok: false, error: 'draw-open' }
    if (this.queue.length === 0) return { ok: false, error: 'queue-empty' }

    const cardOrder = this.queue.map(e => e.entryId)
    for (let i = cardOrder.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1))
      ;[cardOrder[i], cardOrder[j]] = [cardOrder[j], cardOrder[i]]
    }

    this.draw = {
      drawId: this.uuid(),
      cardOrder,
      openedBy,
      expiresAt: this.now() + DRAW_DURATION_MS
    }
    this.bump()
    return { ok: true, draw: this.draw }
  }

  /** Primeiro clique válido vence; os seguintes recebem `draw-closed`. */
  pickCard(drawId, cardIndex, selectedBy) {
    const draw = this.draw
    if (!draw || draw.drawId !== drawId) return { ok: false, error: 'draw-closed' }
    if (this.now() > draw.expiresAt) return { ok: false, error: 'draw-expired' }
    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= draw.cardOrder.length) {
      return { ok: false, error: 'invalid-card' }
    }

    return this.applyPick(cardIndex, selectedBy)
  }

  applyPick(cardIndex, selectedBy) {
    const { drawId, cardOrder } = this.draw
    const queueIndex = this.queue.findIndex(e => e.entryId === cardOrder[cardIndex])
    if (queueIndex === -1) return { ok: false, error: 'invalid-card' }

    const cardTitles = cardOrder.map(
      id => this.queue.find(e => e.entryId === id)?.title ?? null
    )

    const [entry] = this.queue.splice(queueIndex, 1)
    this.nowPlaying = {
      entry,
      startAt: this.now() + START_DELAY_MS,
      selectedBy
    }
    this.draw = null
    this.bump()

    return { ok: true, drawId, cardIndex, cardTitles, nowPlaying: this.nowPlaying }
  }

  /**
   * Fecha um sorteio vencido. Com `autoPick` e nada tocando, escolhe uma
   * carta aleatória; com música tocando só fecha, para ninguém ser pulado
   * sem querer.
   */
  expireDraw(drawId, { autoPick }) {
    if (!this.draw || this.draw.drawId !== drawId) return { ok: false, error: 'draw-closed' }

    if (autoPick && !this.nowPlaying) {
      const cardIndex = Math.floor(this.random() * this.draw.cardOrder.length)
      const result = this.applyPick(cardIndex, null)
      if (result.ok) return { ...result, autoPicked: true }
    }

    this.draw = null
    this.bump()
    return { ok: true, autoPicked: false }
  }

  // --- Reprodução ---------------------------------------------------------

  /**
   * Encerra a música atual. Idempotente: só aceita o `entryId` que está
   * tocando, então avisos duplicados ou atrasados são ignorados.
   */
  endEntry(entryId) {
    if (!this.nowPlaying || this.nowPlaying.entry.entryId !== entryId) {
      return { ok: false, error: 'not-playing' }
    }
    if (this.now() < this.nowPlaying.startAt) return { ok: false, error: 'not-started' }

    this.nowPlaying = null
    this.bump()
    return { ok: true }
  }

  /** Pula uma música que não pode ser reproduzida (ex.: incorporação bloqueada). */
  skipEntry(entryId) {
    if (!this.nowPlaying || this.nowPlaying.entry.entryId !== entryId) {
      return { ok: false, error: 'not-playing' }
    }

    this.nowPlaying = null
    this.bump()
    return { ok: true }
  }

  // --- Snapshot -----------------------------------------------------------

  /** Estado completo enviado aos clientes. As cartas vão sem títulos. */
  snapshot() {
    return {
      code: this.code,
      queue: this.queue,
      nowPlaying: this.nowPlaying,
      draw: this.draw && {
        drawId: this.draw.drawId,
        cardCount: this.draw.cardOrder.length,
        openedBy: this.draw.openedBy,
        expiresAt: this.draw.expiresAt
      },
      userCount: this.userCount,
      version: this.version,
      serverNow: this.now()
    }
  }
}
