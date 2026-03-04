export class QueueController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  addVideo(socket, io, data, userId) {
    const { code, video } = data;
    const roomCode = code || socket.roomCode;
    const room = this.roomService.getRoomByCode(roomCode);

    console.log(`🎵 [${roomCode}] Usuário ${userId} adicionou música:`, video.title);

    if (!room) {
      console.error(`❌ Sala ${roomCode} não encontrada`);
      return;
    }

    // Sempre adiciona à fila global E a todas as filas pessoais
    room.addVideo(video);
    console.log(`✅ Música adicionada. Fila global agora tem ${room.globalQueue.length} música(s)`);
    
    // Emitir APENAS a nova música (não a lista completa)
    io.to(roomCode).emit('video-added', {
      video: video
    });
    console.log(`📡 Evento 'video-added' emitido para sala ${roomCode}`);
  }
}
