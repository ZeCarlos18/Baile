export class Room {
  constructor(code) {
    this.code = code;
    this.queue = [];
    this.currentVideo = null;
    this.videoStartTime = null;
    this.isPlaying = false;
    this.pausedAt = 0;
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

  getNextVideo() {
    if (this.queue.length > 0) {
      this.currentVideo = this.queue.shift();
      this.videoStartTime = Date.now();
      return this.currentVideo;
    }
    return null;
  }

  removeVideoByIndex(index) {
    if (index >= 0 && index < this.queue.length) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  getElapsedTime() {
    if (!this.currentVideo || !this.videoStartTime) {
      return 0;
    }

    if (this.isPlaying) {
      return (Date.now() - this.videoStartTime) / 1000;
    }

    return this.pausedAt;
  }

  // Novo sistema de cartas
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

  playCardSelection(originalIndex) {
    if (originalIndex >= 0 && originalIndex < this.queue.length) {
      const video = this.queue[originalIndex];
      this.queue.splice(originalIndex, 1);
      this.currentVideo = video;
      this.videoStartTime = Date.now();
      return video;
    }
    return null;
  }
}
