export class RoomController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  createRoom(socket, io) {
    const room = this.roomService.createRoom();
    room.addUser(socket.id);

    socket.join(room.code);
    socket.roomCode = room.code;

    socket.emit('room-created', room.code);
  }

  joinRoom(socket, io, roomCode) {
    if (!this.roomService.roomExists(roomCode)) {
      socket.emit('room-error', 'Sala não encontrada');
      return;
    }

    const room = this.roomService.getRoomByCode(roomCode);

    socket.join(roomCode);
    socket.roomCode = roomCode;
    room.addUser(socket.id);

    // Envia apenas a fila global, sem vídeo inicial (Opção B: cada usuário tem seu próprio vídeo)
    socket.emit('user-joined', {
      userCount: room.getUserCount(),
      queue: room.queue
    });

    io.to(roomCode).emit('user-count-updated', room.getUserCount());
  }

  handleDisconnect(socket, roomService, io) {
    if (socket.roomCode) {
      const room = roomService.getRoomByCode(socket.roomCode);
      
      if (room) {
        room.removeUser(socket.id);
        room.removeUserVideo(socket.id); // Remove vídeo do usuário do mapa
        
        if (room.getUserCount() > 0) {
          io.to(socket.roomCode).emit('user-left', room.getUserCount());
        } else {
          roomService.deleteRoom(socket.roomCode);
        }
      }
    }
  }
}
