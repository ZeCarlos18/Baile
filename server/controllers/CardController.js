export class CardController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  requestCards(socket, io, roomCode, userId) {
    console.log(`🎴 [${roomCode}] Usuário ${userId} solicitou cartas`);
    
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room) {
      console.error(`❌ Sala ${roomCode} não encontrada`);
      return;
    }

    const userQueue = room.getUserQueue(userId);
    console.log(`📊 [${roomCode}] Fila de ${userId}: ${userQueue.length} música(s)`);
    
    if (!userQueue || userQueue.length === 0) {
      console.warn(`⚠️ [${roomCode}] Fila vazia para ${userId}`);
      return;
    }

    const cards = room.createCardDeck(userId);

    if (!cards) {
      console.error(`❌ Não foi possível criar cartas para ${userId}`);
      return;
    }

    // Enviar cartas viradas (sem revelar qual música representam)
    const revealedCards = cards.map((card, index) => ({
      cardIndex: index,
      originalIndex: card.originalIndex // Guardado para quando revelar
    }));

    console.log(`✅ ${revealedCards.length} cartas criadas para ${userId}`);
    
    // Envia apenas para este usuário (unicast) com sua fila pessoal
    socket.emit('cards-revealed', {
      cards: revealedCards,
      queue: userQueue
    });
  }

  selectCard(socket, io, data, userId) {
    const { roomCode, selectedCardIndex, cardDetails } = data;
    const room = this.roomService.getRoomByCode(roomCode);

    console.log(`🎴 [${roomCode}] Usuário ${userId} selecionou carta ${selectedCardIndex}`);

    if (!room || !cardDetails) {
      console.error(`❌ Sala ou cardDetails não encontrado`);
      return;
    }

    const originalIndex = cardDetails.originalIndex;
    console.log(`🔍 [${roomCode}] Índice original: ${originalIndex}`);
    
    const playedVideo = room.playCardSelection(userId, originalIndex);

    if (playedVideo) {
      // Envia para TODA a sala (broadcast) - música toca para todos
      const userVideo = room.getUserCurrentVideo(userId);
      const userQueue = room.getUserQueue(userId);
      
      console.log(`▶️ [${roomCode}] Tocando: ${userVideo.video.title}`);
      console.log(`📝 [${roomCode}] Fila de ${userId} agora tem ${userQueue.length} música(s)`);
      
      io.to(roomCode).emit('play-video', {
        video: userVideo.video,
        elapsedTime: 0,
        selectedByUserId: userId,
        userQueue: userQueue // Fila pessoal atualizada apenas de quem selecionou
      });
    } else {
      console.error(`❌ Falha ao selecionar música para ${userId}`);
    }
  }

  syncTime(socket, io, data, userId) {
    const { roomCode } = data;
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room) {
      console.error(`❌ Sala ${roomCode} não encontrada para sincronizar`);
      return;
    }

    // Obter tempo decorrido específico do usuário
    const userVideo = room.getUserCurrentVideo(userId);
    if (!userVideo) {
      console.log(`⏱️ [${roomCode}] ${userId} não tem música tocando`);
      socket.emit('sync-time-response', {
        currentTime: 0,
        isPlaying: false
      });
      return;
    }

    const elapsedTime = room.getElapsedTimeForUser(userId);
    console.log(`⏱️ [${roomCode}] ${userId} - Tempo decorrido: ${elapsedTime.toFixed(2)}s`);
    
    socket.emit('sync-time-response', {
      currentTime: elapsedTime,
      isPlaying: true
    });
  }
}
