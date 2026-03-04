export class Room {
  constructor(code) {
    this.code = code;
    this.queue = [];
    this.userCurrentVideos = {}; // { userId: { video, videoStartTime } }
    this.users = [];
  }

  addUser(userId) {
    if (!this.users.includes(userId)) {
      this.users.push(userId);
      return true;
    }
    return false;
  }

  removeUser(userId) {
    this.users = this.users.filter(id => id !== userId);
  }

  getUserCount() {
    return this.users.length;
  }

  addVideo(video) {
    this.queue.push(video);
  }

  getUserCurrentVideo(userId) {
    return this.userCurrentVideos[userId] || null;
  }

  playCardSelection(userId, originalIndex) {
    if (originalIndex >= 0 && originalIndex < this.queue.length) {
      const video = this.queue[originalIndex];
      
      // NÃO remove da fila - permite que outros usuários escolham a mesma música
      // Cada usuário tem sua própria reprodução independente
      this.userCurrentVideos[userId] = {
        video: video,
        videoStartTime: Date.now()
      };
      
      return video;
    }
    return null;
  }

  removeUserVideo(userId) {
    delete this.userCurrentVideos[userId];
  }

  // Sistema de cartas
  createCardDeck() {
    if (this.queue.length === 0) {
      return null;
    }

    // Embaralha a fila para criar ordem aleatória das cartas
    const shuffledQueue = [...this.queue];
    for (let i = shuffledQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
    }

    // Cria arranjo de cartas com índices originais
    const cards = shuffledQueue.map(video => {
      const originalIndex = this.queue.findIndex(v => v.id === video.id);
      return {
        id: video.id,
        originalIndex: originalIndex,
        video: video
      };
    });

    return cards;
  }

  getElapsedTimeForUser(userId) {
    const userVideo = this.userCurrentVideos[userId];
    if (!userVideo) {
      return 0;
    }

    return (Date.now() - userVideo.videoStartTime) / 1000;
  }
}
