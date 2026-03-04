export class CardController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  requestCards(socket, io, roomCode) {
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room || room.queue.length === 0) return;

    const cards = room.createCardDeck();

    if (!cards) return;

    // Enviar cartas viradas (sem revelar qual música representam)
    const revealedCards = cards.map((card, index) => ({
      cardIndex: index,
      originalIndex: card.originalIndex // Guardado para quando revelar
    }));

    socket.emit('cards-revealed', {
      cards: revealedCards,
      queue: [...room.queue]
    });
  }

  selectCard(socket, io, data) {
    const { roomCode, selectedCardIndex, cardDetails } = data;
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room || !cardDetails) return;

    const originalIndex = cardDetails.originalIndex;
    // Passa userId (socket.id) para armazenar vídeo separadamente por usuário
    const playedVideo = room.playCardSelection(socket.id, originalIndex);

    if (playedVideo) {
      // Envia apenas para este usuário (unicast) - fila não muda, só o vídeo tocando
      const userVideo = room.getUserCurrentVideo(socket.id);
      socket.emit('play-video', {
        video: userVideo.video,
        elapsedTime: 0
      });
      // A fila NÃO é emitida pois permanece igual para todos
    }
  }

  syncTime(socket, io, data) {
    const { roomCode } = data;
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room) return;

    // Obter tempo decorrido específico do usuário
    const userVideo = room.getUserCurrentVideo(socket.id);
    if (!userVideo) {
      socket.emit('sync-time-response', {
        currentTime: 0,
        isPlaying: false
      });
      return;
    }

    socket.emit('sync-time-response', {
      currentTime: room.getElapsedTimeForUser(socket.id),
      isPlaying: true
    });
  }
}
