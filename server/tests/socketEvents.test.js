import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { setupSocketEvents } from '../config/socketEvents.js'
import { RoomService } from '../services/RoomService.js'

// Servidor e sockets falsos: o suficiente para exercitar os handlers sem rede
let io
let service
let socketCount

function connect(userId) {
  const socket = new EventEmitter()
  socket.id = `socket-${++socketCount}`
  socket.handshake = { query: { userId } }
  socket.data = {}
  socket.rooms = new Set()
  socket.join = code => socket.rooms.add(code)
  socket.leave = code => socket.rooms.delete(code)

  // Emite como o cliente e devolve a resposta do acknowledgement
  socket.call = (event, ...args) => {
    let reply
    socket.emit(event, ...args, r => { reply = r })
    return reply
  }

  io.emit('connection', socket)
  return socket
}

beforeEach(() => {
  io = new EventEmitter()
  service = new RoomService()
  socketCount = 0
  setupSocketEvents(io, service)
})

afterEach(() => service.dispose())

describe('payloads malformados não derrubam o servidor', () => {
  const EVENTS = [
    'create-room', 'join-room', 'leave-room', 'add-video', 'start-draw',
    'pick-card', 'video-ended', 'video-error', 'time-ping'
  ]
  const PAYLOADS = [undefined, null, 'ABC', 42, [], {}, { roomCode: 42 }, { roomCode: {} }]

  test('com e sem acknowledgement', () => {
    const socket = connect('u1')
    for (const event of EVENTS) {
      for (const payload of PAYLOADS) {
        assert.doesNotThrow(() => socket.emit(event, payload), `${event} ${JSON.stringify(payload)}`)
        assert.doesNotThrow(() => socket.call(event, payload), `${event} ${JSON.stringify(payload)} (ack)`)
      }
      assert.doesNotThrow(() => socket.emit(event), `${event} sem payload`)
    }
  })

  test('dentro de uma sala, campos inválidos são recusados', () => {
    const socket = connect('u1')
    const { code } = socket.call('create-room')
    socket.call('join-room', { roomCode: code })

    assert.equal(socket.call('add-video', { roomCode: code }).ok, false)
    assert.equal(socket.call('add-video', { roomCode: code, videoId: 5, title: 'x' }).ok, false)
    assert.equal(socket.call('pick-card', { roomCode: code, drawId: 'x', cardIndex: 'y' }).ok, false)
    assert.equal(socket.call('video-ended', { roomCode: code }).ok, false)
  })

  test('uma exceção interna vira erro no ack', () => {
    const socket = connect('u1')
    const { code } = socket.call('create-room')
    socket.call('join-room', { roomCode: code })
    service.addVideo = () => { throw new Error('boom') }

    const originalError = console.error
    console.error = () => {}
    try {
      assert.deepEqual(
        socket.call('add-video', { roomCode: code, videoId: 'a', title: 'a' }),
        { ok: false, error: 'internal' }
      )
    } finally {
      console.error = originalError
    }
  })
})

describe('protocolo', () => {
  test('fluxo completo com duas pessoas clicando ao mesmo tempo', () => {
    const ana = connect('ana')
    const bia = connect('bia')

    const { code } = ana.call('create-room')
    assert.match(code, /^[A-Z2-9]{6}$/)

    assert.equal(ana.call('join-room', { roomCode: code }).ok, true)
    const joined = bia.call('join-room', { roomCode: code.toLowerCase() })
    assert.equal(joined.ok, true)
    assert.equal(joined.state.userCount, 2)

    ana.call('add-video', { roomCode: code, videoId: 'a', title: 'A' })
    bia.call('add-video', { roomCode: code, videoId: 'a', title: 'A' })

    const { drawId } = ana.call('start-draw', { roomCode: code })
    const results = [
      ana.call('pick-card', { roomCode: code, drawId, cardIndex: 0 }),
      bia.call('pick-card', { roomCode: code, drawId, cardIndex: 1 })
    ]
    assert.deepEqual(results.map(r => r.ok), [true, false])

    const room = service.getRoom(code)
    assert.equal(room.queue.length, 1)
    assert.equal(room.nowPlaying.selectedBy, 'ana')
  })

  test('quem não entrou na sala não pode mexer nela', () => {
    const ana = connect('ana')
    const intruso = connect('intruso')
    const { code } = ana.call('create-room')
    ana.call('join-room', { roomCode: code })

    const result = intruso.call('add-video', { roomCode: code, videoId: 'a', title: 'A' })
    assert.deepEqual(result, { ok: false, error: 'not-in-room' })
    assert.equal(service.getRoom(code).queue.length, 0)
  })

  test('sala inexistente', () => {
    const socket = connect('u1')
    assert.deepEqual(socket.call('join-room', { roomCode: 'NAOEXI' }), { ok: false, error: 'not-found' })
  })

  test('trocar de sala sai da anterior', () => {
    const socket = connect('u1')
    const first = socket.call('create-room').code
    const second = socket.call('create-room').code

    socket.call('join-room', { roomCode: first })
    socket.call('join-room', { roomCode: second })

    assert.equal(service.getRoom(first).userCount, 0)
    assert.equal(service.getRoom(second).userCount, 1)
    assert.deepEqual([...socket.rooms], [second])
  })

  test('desconectar sai da sala', () => {
    const socket = connect('u1')
    const { code } = socket.call('create-room')
    socket.call('join-room', { roomCode: code })

    socket.emit('disconnect')
    assert.equal(service.getRoom(code).userCount, 0)
  })

  test('time-ping devolve t0 e a hora do servidor', () => {
    const socket = connect('u1')
    const before = Date.now()
    const reply = socket.call('time-ping', { t0: 123 })

    assert.equal(reply.t0, 123)
    assert.ok(reply.serverNow >= before)
  })
})
