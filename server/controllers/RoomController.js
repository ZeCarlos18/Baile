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

    // Cancela remoção pendente (usuário está reconectando, ex: refresh da página)
    this.roomService.cancelUserRemoval(roomCode, userId);

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.userId = userId;

    room.addUser(userId);

    const userQueue = room.getUserQueue(userId);
    const currentVideoData = room.getUserCurrentVideo(userId);
    console.log(`📊 [RoomController] ${userId} recebeu ${userQueue.length} música(s) da fila global`);
    console.log(`📊 [RoomController] Fila global tem ${room.globalQueue.length} música(s) total`);

    // Envia a fila pessoal + fila global + música em andamento para sincronizar
    socket.emit('user-joined', {
      userCount: room.getUserCount(),
      queue: userQueue,
      globalQueue: room.globalQueue,
      currentVideo: currentVideoData ? currentVideoData.video : null,
      elapsedTime: currentVideoData ? room.getElapsedTimeForUser(userId) : 0
    });

    io.to(roomCode).emit('user-count-updated', room.getUserCount());
  }

  handleDisconnect(socket, roomService, io) {
    if (socket.roomCode && socket.userId) {
      const roomCode = socket.roomCode;
      const userId = socket.userId;

      console.log(`👋 [RoomController] ${userId} desconectou da sala ${roomCode} (aguardando reconexão)`);

      // Só remove o usuário de fato após um período de graça, para não
      // destruir a sala/estado quando é apenas um refresh de página
      roomService.scheduleUserRemoval(roomCode, userId, () => {
        const room = roomService.getRoomByCode(roomCode);
        if (!room) return;

        room.removeUser(userId);
        room.removeUserVideo(userId);

        if (room.getUserCount() > 0) {
          io.to(roomCode).emit('user-left', room.getUserCount());
        } else {
          roomService.deleteRoom(roomCode);
          console.log(`🗑️ [RoomController] Sala ${roomCode} deletada (sem usuários)`);
        }
      });
    }
  }
}
