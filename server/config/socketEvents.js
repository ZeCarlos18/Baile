import { RoomController } from '../controllers/RoomController.js';
import { QueueController } from '../controllers/QueueController.js';
import { RouletteController } from '../controllers/RouletteController.js';

export function setupSocketEvents(io, roomService) {
  const roomController = new RoomController(roomService);
  const queueController = new QueueController(roomService);
  const rouletteController = new RouletteController(roomService);

  io.on('connection', (socket) => {
    // Room Events
    socket.on('create-room', () => {
      roomController.createRoom(socket, io);
    });

    socket.on('join-room', (roomCode) => {
      roomController.joinRoom(socket, io, roomCode);
    });

    // Queue Events
    socket.on('add-video', (data) => {
      queueController.addVideo(socket, io, data);
    });

    socket.on('next-video', () => {
      queueController.nextVideo(socket, io);
    });

    socket.on('remove-video', (index) => {
      queueController.removeVideo(socket, io, index);
    });

    // Roulette Events
    socket.on('request-roulette', (roomCode) => {
      rouletteController.requestRoulette(socket, io, roomCode);
    });

    socket.on('vote-roulette', (roomCode) => {
      rouletteController.voteRoulette(socket, io, roomCode);
    });

    socket.on('spin-wheel', (roomCode) => {
      rouletteController.spinWheel(socket, io, roomCode);
    });

    socket.on('sync-time', () => {
      rouletteController.syncTime(socket);
    });

    // Disconnect Event
    socket.on('disconnect', () => {
      roomController.handleDisconnect(socket, roomService, io);
    });
  });
}
