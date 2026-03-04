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
    const playedVideo = room.playCardSelection(originalIndex);

    if (playedVideo) {
      io.to(roomCode).emit('play-video', {
        video: room.currentVideo,
        elapsedTime: 0
      });

      io.to(roomCode).emit('update-queue', room.queue);
    }
  }

  syncTime(socket) {
    const room = this.roomService.getRoomByCode(socket.roomCode);

    if (!room || !room.currentVideo) return;

    socket.emit('sync-time-response', {
      currentTime: room.getElapsedTime(),
      isPlaying: room.isPlaying
    });
  }
}
