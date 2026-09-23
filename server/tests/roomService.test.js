import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { RoomService } from '../services/RoomService.js'
import { DRAW_DURATION_MS, START_DELAY_MS } from '../config/constants.js'

let clock
let events
let service

function setup(options = {}) {
  clock = { t: 1_000_000 }
  events = []
  service = new RoomService({
    emit: (code, event, payload) => events.push({ code, event, payload }),
    now: () => clock.t,
    emptyRoomTtlMs: 10_000,
    ...options
  })
}

// Avança o relógio da sala e os timers falsos juntos
function advance(ms) {
  clock.t += ms
  mock.timers.tick(ms)
}

function eventsNamed(name) {
  return events.filter(e => e.event === name)
}

function roomWith(...titles) {
  const room = service.createRoom()
  service.join(room.code, 'u1', 's1')
  for (const title of titles) service.addVideo(room.code, 'u1', { videoId: title, title })
  events.length = 0
  return room
}

function playFirstCard(room) {
  const { drawId } = service.startDraw(room.code, 'u1')
  service.pickCard(room.code, 'u1', drawId, 0)
  advance(START_DELAY_MS)
  events.length = 0
  return room.nowPlaying.entry.entryId
}

beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout'] })
  setup()
})

afterEach(() => {
  service.dispose()
  mock.timers.reset()
})

describe('código da sala', () => {
  test('não repete um código existente', () => {
    // As 6 primeiras chamadas geram "AAAAAA" duas vezes seguidas; depois muda
    const values = [...Array(12).fill(0), ...Array(6).fill(0.99)]
    let i = 0
    setup({ random: () => values[i++] ?? Math.random() })

    const first = service.createRoom()
    const second = service.createRoom()

    assert.equal(first.code, 'AAAAAA')
    assert.notEqual(second.code, first.code)
    assert.match(second.code, /^[A-Z2-9]{6}$/)
  })
})

describe('broadcast', () => {
  test('toda mudança termina com um room-state completo', () => {
    const room = roomWith()
    service.addVideo(room.code, 'u1', { videoId: 'a', title: 'A' })

    const [state] = eventsNamed('room-state')
    assert.equal(state.code, room.code)
    assert.equal(state.payload.queue.length, 1)
    assert.equal(state.payload.version, room.version)
  })

  test('sorteio avisa todos e a escolha revela a mesma carta para todos', () => {
    const room = roomWith('A', 'B')
    const { drawId } = service.startDraw(room.code, 'u1')

    const [started] = eventsNamed('draw-started')
    assert.deepEqual(started.payload, {
      drawId,
      cardCount: 2,
      openedBy: 'u1',
      expiresAt: clock.t + DRAW_DURATION_MS
    })

    service.pickCard(room.code, 'u2', drawId, 1)
    const [picked] = eventsNamed('card-picked')
    assert.equal(picked.payload.cardIndex, 1)
    assert.equal(picked.payload.cardTitles[1], room.nowPlaying.entry.title)
  })
})

describe('sorteio automático', () => {
  test('fim da música abre o sorteio sozinho se houver fila', () => {
    const room = roomWith('A', 'B')
    const entryId = playFirstCard(room)

    assert.equal(service.videoEnded(room.code, entryId).ok, true)
    const [started] = eventsNamed('draw-started')
    assert.equal(started.payload.openedBy, null)
    assert.equal(room.nowPlaying, null)
  })

  test('fim da música com fila vazia deixa a sala parada', () => {
    const room = roomWith('A')
    const entryId = playFirstCard(room)

    service.videoEnded(room.code, entryId)
    assert.equal(eventsNamed('draw-started').length, 0)
    assert.equal(room.nowPlaying, null)
    assert.equal(eventsNamed('room-state').at(-1).payload.nowPlaying, null)
  })

  test('vários clientes avisando o fim geram um único sorteio', () => {
    const room = roomWith('A', 'B', 'C')
    const entryId = playFirstCard(room)

    const results = [1, 2, 3].map(() => service.videoEnded(room.code, entryId))
    assert.deepEqual(results.map(r => r.ok), [true, false, false])
    assert.equal(eventsNamed('draw-started').length, 1)
  })

  test('video-error pula a música e abre o sorteio', () => {
    const room = roomWith('A', 'B')
    const { drawId } = service.startDraw(room.code, 'u1')
    service.pickCard(room.code, 'u1', drawId, 0)
    events.length = 0

    service.videoError(room.code, room.nowPlaying.entry.entryId)
    assert.equal(room.nowPlaying, null)
    assert.equal(eventsNamed('draw-started').length, 1)
  })

  test('sorteio expirado escolhe sozinho quando nada está tocando', () => {
    const room = roomWith('A', 'B')
    service.startDraw(room.code, null)

    advance(DRAW_DURATION_MS - 1)
    assert.equal(room.nowPlaying, null)

    advance(1)
    assert.ok(room.nowPlaying)
    assert.equal(room.nowPlaying.selectedBy, null)
    assert.equal(eventsNamed('card-picked').length, 1)
    assert.equal(room.draw, null)
  })

  test('sorteio expirado com música tocando só fecha', () => {
    const room = roomWith('A', 'B')
    playFirstCard(room)
    const playing = room.nowPlaying

    service.startDraw(room.code, 'u1')
    advance(DRAW_DURATION_MS)

    assert.equal(room.nowPlaying, playing)
    assert.equal(room.draw, null)
    assert.equal(eventsNamed('card-picked').length, 0)
  })

  test('escolha automática desligada: sorteio expirado só fecha', () => {
    setup({ autoPickOnExpire: false })
    const room = roomWith('A')
    service.startDraw(room.code, null)

    advance(DRAW_DURATION_MS)
    assert.equal(room.nowPlaying, null)
    assert.equal(room.draw, null)
    assert.equal(room.queue.length, 1)
  })

  test('escolher uma carta cancela o timer do sorteio', () => {
    const room = roomWith('A', 'B', 'C')
    const { drawId } = service.startDraw(room.code, 'u1')
    service.pickCard(room.code, 'u1', drawId, 0)
    const playing = room.nowPlaying
    events.length = 0

    advance(DRAW_DURATION_MS * 2)
    assert.equal(room.nowPlaying, playing)
    assert.equal(events.length, 0)
  })
})

describe('salas vazias', () => {
  test('sala sem ninguém é apagada depois do prazo', () => {
    const room = roomWith()
    service.leave(room.code, 'u1', 's1')

    advance(9_999)
    assert.ok(service.getRoom(room.code))
    advance(1)
    assert.equal(service.getRoom(room.code), null)
  })

  test('voltar antes do prazo (refresh) mantém a sala', () => {
    const room = roomWith('A')
    service.leave(room.code, 'u1', 's1')
    advance(5_000)
    service.join(room.code, 'u1', 's2')
    advance(20_000)

    assert.equal(service.getRoom(room.code), room)
    assert.equal(room.queue.length, 1)
  })

  test('sala criada e nunca usada também é apagada', () => {
    const room = service.createRoom()
    advance(10_000)
    assert.equal(service.getRoom(room.code), null)
  })

  test('entrar em sala inexistente devolve null', () => {
    assert.equal(service.join('NAOEXI', 'u1', 's1'), null)
    assert.equal(service.addVideo('NAOEXI', 'u1', { videoId: 'a', title: 'a' }).error, 'not-found')
  })
})
