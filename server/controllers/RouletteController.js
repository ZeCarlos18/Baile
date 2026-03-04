export class RouletteController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  requestRoulette(socket, io, roomCode) {
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room || room.queue.length === 0) return;

    const rouletteData = room.startRouletteVoting(socket.id);

    io.to(roomCode).emit('roulette-voting-started', {
      queue: [...room.queue],
      selectedIndex: rouletteData.selectedIndex,
      selectedVideo: rouletteData.selectedVideo,
      votesCount: rouletteData.votesCount,
      totalUsers: room.getUserCount(),
      votesNeeded: rouletteData.votesNeeded
    });

    // Se já tem maioria de votos (case: 1 usuário), roda imediatamente
    if (rouletteData.votesCount >= rouletteData.votesNeeded) {
      setTimeout(() => {
        this.startSpinningRoulette(io, roomCode, room);
      }, 100);
    }
  }

  voteRoulette(socket, io, roomCode) {
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room || !room.isRouletteVoting) return;

    const voteResult = room.addRouletteVote(socket.id);

    io.to(roomCode).emit('roulette-votes-updated', {
      votesCount: voteResult.votesCount,
      totalUsers: room.getUserCount(),
      votesNeeded: voteResult.votesNeeded
    });

    if (voteResult.isMajority) {
      this.startSpinningRoulette(io, roomCode, room);
    }
  }

  spinWheel(socket, io, roomCode) {
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room || room.queue.length === 0) return;

    const wheelResult = room.spinWheel();

    io.to(roomCode).emit('start-roulette', {
      queue: [...room.queue],
      selectedIndex: wheelResult.selectedIndex,
      selectedVideo: wheelResult.selectedVideo
    });

    this.scheduleVideoPlay(io, roomCode, room, wheelResult.selectedIndex);
  }

  startSpinningRoulette(io, roomCode, room) {
    io.to(roomCode).emit('start-roulette', {
      queue: [...room.queue],
      selectedIndex: room.selectedRouletteIndex,
      selectedVideo: room.selectedRouletteVideo
    });

    this.scheduleVideoPlay(io, roomCode, room, room.selectedRouletteIndex);
  }

  scheduleVideoPlay(io, roomCode, room, selectedIndex) {
    setTimeout(() => {
      const playedVideo = room.playSpinnedVideo(selectedIndex);

      if (playedVideo) {
        io.to(roomCode).emit('play-video', {
          video: room.currentVideo,
          elapsedTime: 0
        });

        io.to(roomCode).emit('update-queue', room.queue);
      }
    }, 3000);
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
