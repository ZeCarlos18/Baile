export class QueueController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  addVideo(socket, io, data) {
    const { code, video } = data;
    const roomCode = code || socket.roomCode;
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room) return;

    // Opção B: Sempre adiciona à fila global, sem auto-play
    // Cada usuário escolhe sua próxima música via cartas
    room.addVideo(video);
    io.to(roomCode).emit('update-queue', room.queue);
  }
}
