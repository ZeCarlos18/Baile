export class CardController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  requestCards(socket, io, roomCode) {
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room) return;

    const userQueue = room.getUserQueue(socket.id);
    if (!userQueue || userQueue.length === 0) return;

    const cards = room.createCardDeck(socket.id);

    if (!cards) return;

    // Enviar cartas viradas (sem revelar qual música representam)
    const revealedCards = cards.map((card, index) => ({
      cardIndex: index,
      originalIndex: card.originalIndex // Guardado para quando revelar
    }));

    // Envia apenas para este usuário (unicast) com sua fila pessoal
    socket.emit('cards-revealed', {
      cards: revealedCards,
      queue: userQueue
    });
  }

  selectCard(socket, io, data) {
    const { roomCode, selectedCardIndex, cardDetails } = data;
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room || !cardDetails) return;

    const originalIndex = cardDetails.originalIndex;
    const playedVideo = room.playCardSelection(socket.id, originalIndex);

    if (playedVideo) {
      // Envia apenas para este usuário (unicast) - sua fila pessoal atualizada
      const userVideo = room.getUserCurrentVideo(socket.id);
      const userQueue = room.getUserQueue(socket.id);
      
      socket.emit('play-video', {
        video: userVideo.video,
        elapsedTime: 0,
        queue: userQueue // Fila pessoal atualizada (sem a música que acaba de escolher)
      });
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
