import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { Room } from '../models/Room.js'
import { DRAW_DURATION_MS, START_DELAY_MS } from '../config/constants.js'

function createRoom() {
  const clock = { t: 1_000_000 }
  let seq = 0
  const room = new Room('ABC234', {
    now: () => clock.t,
    random: Math.random,
    uuid: () => `id-${++seq}`
  })
  return { room, clock }
}

function add(room, videoId, title = videoId, addedBy = 'u1') {
  return room.addEntry({ videoId, title, addedBy }).entry
}

describe('fila', () => {
  test('adicionar cria uma Entry com entryId único e incrementa a versão', () => {
    const { room } = createRoom()
    const before = room.version
    const entry = add(room, 'vid00000001', 'Música A')

    assert.equal(room.queue.length, 1)
    assert.equal(entry.videoId, 'vid00000001')
    assert.equal(entry.title, 'Música A')
    assert.equal(entry.addedBy, 'u1')
    assert.ok(entry.entryId)
    assert.ok(room.version > before)
  })

  test('música repetida vira duas entradas independentes', () => {
    const { room, clock } = createRoom()
    const a = add(room, 'mesmoVideo1')
    const b = add(room, 'mesmoVideo1')
    assert.notEqual(a.entryId, b.entryId)

    const { draw } = room.startDraw('u1')
    assert.equal(draw.cardOrder.length, 2)

    const result = room.pickCard(draw.drawId, 0, 'u1')
    assert.equal(result.ok, true)
    assert.deepEqual(result.cardTitles, ['mesmoVideo1', 'mesmoVideo1'])

    // Só uma cópia sai da fila, e é exatamente a da carta escolhida
    assert.equal(room.queue.length, 1)
    assert.equal(room.nowPlaying.entry.entryId, draw.cardOrder[0])
    assert.equal(room.queue[0].entryId, draw.cardOrder[1])

    // Terminar a primeira cópia não afeta a segunda
    clock.t += START_DELAY_MS
    assert.equal(room.endEntry(draw.cardOrder[0]).ok, true)
    assert.equal(room.queue.length, 1)
  })
})

describe('sorteio', () => {
  test('não abre com fila vazia nem com outro sorteio aberto', () => {
    const { room } = createRoom()
    assert.deepEqual(room.startDraw('u1'), { ok: false, error: 'queue-empty' })

    add(room, 'a')
    assert.equal(room.startDraw('u1').ok, true)
    assert.deepEqual(room.startDraw('u2'), { ok: false, error: 'draw-open' })
  })

  test('a carta revelada é a música que toca', () => {
    const { room } = createRoom()
    add(room, 'a', 'Música A')
    add(room, 'b', 'Música B')
    add(room, 'c', 'Música C')

    const { draw } = room.startDraw('u1')
    const result = room.pickCard(draw.drawId, 2, 'u2')

    assert.equal(result.ok, true)
    assert.equal(result.cardTitles[2], room.nowPlaying.entry.title)
    assert.equal(room.nowPlaying.entry.entryId, draw.cardOrder[2])
    assert.equal(room.nowPlaying.selectedBy, 'u2')
    assert.equal(room.draw, null)
  })

  test('dois cliques simultâneos: só o primeiro vence', () => {
    const { room } = createRoom()
    add(room, 'a')
    add(room, 'b')
    add(room, 'c')

    const { draw } = room.startDraw('u1')
    const first = room.pickCard(draw.drawId, 0, 'u1')
    const second = room.pickCard(draw.drawId, 1, 'u2')

    assert.equal(first.ok, true)
    assert.deepEqual(second, { ok: false, error: 'draw-closed' })
    assert.equal(room.queue.length, 2)
    assert.equal(room.nowPlaying.selectedBy, 'u1')
    assert.equal(room.nowPlaying.entry.entryId, draw.cardOrder[0])
  })

  test('drawId errado ou carta inválida não fecham o sorteio', () => {
    const { room } = createRoom()
    add(room, 'a')
    add(room, 'b')
    const { draw } = room.startDraw('u1')

    assert.equal(room.pickCard('outro-sorteio', 0, 'u1').error, 'draw-closed')
    for (const index of [-1, 2, 1.5, '0', null, undefined]) {
      assert.equal(room.pickCard(draw.drawId, index, 'u1').error, 'invalid-card')
    }
    assert.equal(room.draw.drawId, draw.drawId)
    assert.equal(room.queue.length, 2)
  })

  test('escolher com música tocando pula a atual', () => {
    const { room } = createRoom()
    add(room, 'a')
    add(room, 'b')

    let { draw } = room.startDraw('u1')
    room.pickCard(draw.drawId, 0, 'u1')
    const skipped = room.nowPlaying.entry.entryId

    ;({ draw } = room.startDraw('u2'))
    assert.equal(room.pickCard(draw.drawId, 0, 'u2').ok, true)
    assert.notEqual(room.nowPlaying.entry.entryId, skipped)
    assert.equal(room.queue.length, 0)
  })

  test('clique depois do prazo é recusado', () => {
    const { room, clock } = createRoom()
    add(room, 'a')
    const { draw } = room.startDraw('u1')

    clock.t += DRAW_DURATION_MS + 1
    assert.deepEqual(room.pickCard(draw.drawId, 0, 'u1'), { ok: false, error: 'draw-expired' })
    assert.equal(room.nowPlaying, null)
  })

  test('sorteio expirado sem música tocando escolhe uma carta aleatória', () => {
    const { room } = createRoom()
    add(room, 'a')
    add(room, 'b')
    const { draw } = room.startDraw(null)

    const result = room.expireDraw(draw.drawId, { autoPick: true })
    assert.equal(result.ok, true)
    assert.equal(result.autoPicked, true)
    assert.equal(room.nowPlaying.selectedBy, null)
    assert.equal(room.nowPlaying.entry.entryId, draw.cardOrder[result.cardIndex])
    assert.equal(room.queue.length, 1)
    assert.equal(room.draw, null)
  })

  test('sorteio expirado com música tocando só fecha', () => {
    const { room } = createRoom()
    add(room, 'a')
    add(room, 'b')
    let { draw } = room.startDraw('u1')
    room.pickCard(draw.drawId, 0, 'u1')
    const playing = room.nowPlaying

    ;({ draw } = room.startDraw('u2'))
    const result = room.expireDraw(draw.drawId, { autoPick: true })

    assert.equal(result.autoPicked, false)
    assert.equal(room.nowPlaying, playing)
    assert.equal(room.queue.length, 1)
    assert.equal(room.draw, null)
  })

  test('sorteio expirado com escolha automática desligada só fecha', () => {
    const { room } = createRoom()
    add(room, 'a')
    const { draw } = room.startDraw(null)

    const result = room.expireDraw(draw.drawId, { autoPick: false })
    assert.equal(result.autoPicked, false)
    assert.equal(room.nowPlaying, null)
    assert.equal(room.queue.length, 1)
    assert.equal(room.draw, null)
  })

  test('expirar um sorteio que já terminou não faz nada', () => {
    const { room } = createRoom()
    add(room, 'a')
    add(room, 'b')
    const { draw } = room.startDraw('u1')
    room.pickCard(draw.drawId, 0, 'u1')
    const version = room.version

    assert.equal(room.expireDraw(draw.drawId, { autoPick: true }).ok, false)
    assert.equal(room.version, version)
    assert.equal(room.queue.length, 1)
  })
})

describe('fim da música', () => {
  function playing() {
    const ctx = createRoom()
    add(ctx.room, 'a')
    add(ctx.room, 'b')
    const { draw } = ctx.room.startDraw('u1')
    ctx.room.pickCard(draw.drawId, 0, 'u1')
    ctx.clock.t += START_DELAY_MS + 60_000
    return { ...ctx, entryId: ctx.room.nowPlaying.entry.entryId }
  }

  test('video-ended duplicado só vale uma vez', () => {
    const { room, entryId } = playing()
    assert.equal(room.endEntry(entryId).ok, true)
    const version = room.version
    assert.deepEqual(room.endEntry(entryId), { ok: false, error: 'not-playing' })
    assert.equal(room.version, version)
  })

  test('video-ended atrasado (de uma música anterior) é ignorado', () => {
    const { room, clock, entryId: oldEntry } = playing()
    const { draw } = room.startDraw('u2')
    room.pickCard(draw.drawId, 0, 'u2')
    const current = room.nowPlaying
    clock.t += START_DELAY_MS

    assert.deepEqual(room.endEntry(oldEntry), { ok: false, error: 'not-playing' })
    assert.equal(room.nowPlaying, current)
  })

  test('video-ended antes da música começar é ignorado', () => {
    const { room } = createRoom()
    add(room, 'a')
    const { draw } = room.startDraw('u1')
    room.pickCard(draw.drawId, 0, 'u1')

    assert.deepEqual(room.endEntry(room.nowPlaying.entry.entryId), { ok: false, error: 'not-started' })
  })

  test('video-error pula a música, mesmo antes de começar', () => {
    const { room } = createRoom()
    add(room, 'a')
    const { draw } = room.startDraw('u1')
    room.pickCard(draw.drawId, 0, 'u1')

    assert.equal(room.skipEntry(room.nowPlaying.entry.entryId).ok, true)
    assert.equal(room.nowPlaying, null)
    assert.equal(room.skipEntry('qualquer').ok, false)
  })
})

describe('usuários e snapshot', () => {
  test('várias abas do mesmo usuário contam uma vez e só saem quando todas fecham', () => {
    const { room, clock } = createRoom()
    room.addSocket('u1', 's1')
    room.addSocket('u1', 's2')
    room.addSocket('u2', 's3')
    assert.equal(room.userCount, 2)
    assert.equal(room.emptySince, null)

    room.removeSocket('u1', 's1')
    assert.equal(room.userCount, 2)
    room.removeSocket('u1', 's2')
    room.removeSocket('u2', 's3')
    assert.equal(room.userCount, 0)
    assert.equal(room.emptySince, clock.t)

    assert.equal(room.removeSocket('u2', 's3'), false)
  })

  test('snapshot não revela os títulos nem a ordem das cartas', () => {
    const { room } = createRoom()
    add(room, 'a', 'Segredo A')
    add(room, 'b', 'Segredo B')
    room.startDraw('u1')

    const { draw } = room.snapshot()
    assert.deepEqual(Object.keys(draw).sort(), ['cardCount', 'drawId', 'expiresAt', 'openedBy'])
    assert.equal(draw.cardCount, 2)
    assert.ok(!JSON.stringify(draw).includes('Segredo'))
  })
})
