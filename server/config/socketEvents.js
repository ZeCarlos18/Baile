import { RoomController } from '../controllers/RoomController.js';
import { QueueController } from '../controllers/QueueController.js';
import { CardController } from '../controllers/CardController.js';

export function setupSocketEvents(io, roomService) {
  const roomController = new RoomController(roomService);
  const queueController = new QueueController(roomService);
  const cardController = new CardController(roomService);

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`🔌 [Socket] Nova conexão - userId: ${userId}`);

    // Room Events
    socket.on('create-room', () => {
      console.log(`🏠 [Socket] create-room recebido de ${userId}`);
      roomController.createRoom(socket, io, userId);
    });

    socket.on('join-room', (roomCode) => {
      console.log(`🚪 [Socket] join-room recebido: ${roomCode} de ${userId}`);
      roomController.joinRoom(socket, io, roomCode, userId);
    });

    // Queue Events
    socket.on('add-video', (data) => {      
      console.log(`📥 Socket 'add-video' recebido para sala: ${data.code || socket.roomCode} de ${userId}`);      
      queueController.addVideo(socket, io, data, userId);
    });

    // Card Events
    socket.on('request-cards', (roomCode) => {
      console.log(`🎴 [Socket] request-cards recebido: ${roomCode} de ${userId}`);
      cardController.requestCards(socket, io, roomCode, userId);
    });

    socket.on('select-card', (data) => {
      console.log(`🃏 [Socket] select-card recebido de ${userId}:`, data);
      cardController.selectCard(socket, io, data, userId);
    });

    socket.on('sync-time', (data) => {
      console.log(`⏱️ [Socket] sync-time recebido de ${userId}`);
      cardController.syncTime(socket, io, data, userId);
    });

    // Disconnect Event
    socket.on('disconnect', () => {
      console.log(`❌ [Socket] Desconectado - userId: ${userId}`);
      roomController.handleDisconnect(socket, roomService, io);
    });
  });
}
