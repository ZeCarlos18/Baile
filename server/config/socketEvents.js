import { RoomController } from '../controllers/RoomController.js';
import { QueueController } from '../controllers/QueueController.js';
import { CardController } from '../controllers/CardController.js';

export function setupSocketEvents(io, roomService) {
  const roomController = new RoomController(roomService);
  const queueController = new QueueController(roomService);
  const cardController = new CardController(roomService);

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

    // Card Events
    socket.on('request-cards', (roomCode) => {
      cardController.requestCards(socket, io, roomCode);
    });

    socket.on('select-card', (data) => {
      cardController.selectCard(socket, io, data);
    });

    socket.on('sync-time', () => {
      cardController.syncTime(socket);
    });

    // Disconnect Event
    socket.on('disconnect', () => {
      roomController.handleDisconnect(socket, roomService, io);
    });
  });
}
