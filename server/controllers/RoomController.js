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

    const elapsedTime = room.getElapsedTime();

    socket.emit('user-joined', {
      userCount: room.getUserCount(),
      queue: room.queue,
      currentVideo: room.currentVideo,
      elapsedTime: elapsedTime
    });

    io.to(roomCode).emit('user-count-updated', room.getUserCount());
  }

  handleDisconnect(socket, roomService, io) {
    if (socket.roomCode) {
      const room = roomService.getRoomByCode(socket.roomCode);
      
      if (room) {
        room.removeUser(socket.id);
        
        if (room.getUserCount() > 0) {
          io.to(socket.roomCode).emit('user-left', room.getUserCount());
        } else {
          roomService.deleteRoom(socket.roomCode);
        }
      }
    }
  }
}
