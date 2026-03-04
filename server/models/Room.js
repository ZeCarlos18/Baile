export class Room {
  constructor(code) {
    this.code = code;
    this.globalQueue = []; // Fila global - base para novos usuários
    this.userQueues = {}; // { userId: [] } - cópia pessoal de cada usuário
    this.userCurrentVideos = {}; // { userId: { video, videoStartTime } }
    this.users = [];
  }

  addUser(userId) {
    if (!this.users.includes(userId)) {
      this.users.push(userId);
      // Novo usuário recebe uma cópia da fila global
      this.userQueues[userId] = [...this.globalQueue];
      return true;
    }
    return false;
  }

  removeUser(userId) {
    this.users = this.users.filter(id => id !== userId);
    delete this.userQueues[userId];
    delete this.userCurrentVideos[userId];
  }

  getUserCount() {
    return this.users.length;
  }

  addVideo(video) {
    // Adiciona à fila global
    this.globalQueue.push(video);
    
    // E também a TODAS as filas pessoais dos usuários conectados
    for (const userId in this.userQueues) {
      this.userQueues[userId].push(video);
    }
  }

  // Obter fila pessoal do usuário
  getUserQueue(userId) {
    return this.userQueues[userId] || [];
  }

  getUserCurrentVideo(userId) {
    return this.userCurrentVideos[userId] || null;
  }

  playCardSelection(userId, originalIndex) {
    const userQueue = this.userQueues[userId];
    
    if (!userQueue || originalIndex < 0 || originalIndex >= userQueue.length) {
      return null;
    }

    const video = userQueue[originalIndex];
    // Remove da FILA PESSOAL do usuário
    userQueue.splice(originalIndex, 1);
    
    // Armazenar vídeo individual para este usuário
    this.userCurrentVideos[userId] = {
      video: video,
      videoStartTime: Date.now()
    };
    
    return video;
  }

  removeUserVideo(userId) {
    delete this.userCurrentVideos[userId];
  }

  // Sistema de cartas
  createCardDeck(userId) {
    const userQueue = this.userQueues[userId];
    
    if (!userQueue || userQueue.length === 0) {
      return null;
    }

    // Embaralha a fila pessoal para criar ordem aleatória das cartas
    const shuffledQueue = [...userQueue];
    for (let i = shuffledQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
    }

    // Cria arranjo de cartas com índices originais
    const cards = shuffledQueue.map(video => {
      const originalIndex = userQueue.findIndex(v => v.id === video.id);
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
