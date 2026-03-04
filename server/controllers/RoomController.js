export class RoomController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  createRoom(socket, io, userId) {
    console.log(`🏠 [RoomController] Criando sala para usuário ${userId}`);
    
    const room = this.roomService.createRoom();
    room.addUser(userId);

    socket.join(room.code);
    socket.roomCode = room.code;
    socket.userId = userId;

    console.log(`✅ [RoomController] Sala criada: ${room.code}`);
    
    socket.emit('room-created', room.code);
  }

  joinRoom(socket, io, roomCode, userId) {
    console.log(`👤 [RoomController] Usuário ${userId} entrando na sala ${roomCode}`);
    
    if (!this.roomService.roomExists(roomCode)) {
      console.error(`❌ [RoomController] Sala ${roomCode} não encontrada`);
      socket.emit('room-error', 'Sala não encontrada');
      return;
    }

    const room = this.roomService.getRoomByCode(roomCode);

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.userId = userId;
    
    room.addUser(userId);
    
    const userQueue = room.getUserQueue(userId);
    console.log(`📊 [RoomController] ${userId} recebeu ${userQueue.length} música(s) da fila global`);
    console.log(`📊 [RoomController] Fila global tem ${room.globalQueue.length} música(s) total`);

    // Envia a fila pessoal + fila global para sincronizar
    socket.emit('user-joined', {
      userCount: room.getUserCount(),
      queue: userQueue,
      globalQueue: room.globalQueue
    });

    io.to(roomCode).emit('user-count-updated', room.getUserCount());
  }

  handleDisconnect(socket, roomService, io) {
    if (socket.roomCode && socket.userId) {
      const room = roomService.getRoomByCode(socket.roomCode);
      
      if (room) {
        room.removeUser(socket.userId);
        room.removeUserVideo(socket.userId);
        
        console.log(`👋 [RoomController] ${socket.userId} desconectou da sala ${socket.roomCode}`);
        
        if (room.getUserCount() > 0) {
          io.to(socket.roomCode).emit('user-left', room.getUserCount());
        } else {
          roomService.deleteRoom(socket.roomCode);
          console.log(`🗑️ [RoomController] Sala ${socket.roomCode} deletada (sem usuários)`);
        }
      }
    }
  }
}
