export class Room {
  constructor(code) {
    this.code = code;
    this.queue = [];
    this.currentVideo = null;
    this.videoStartTime = null;
    this.isPlaying = false;
    this.pausedAt = 0;
    this.users = [];
    this.rouletteVotes = new Set();
    this.isRouletteVoting = false;
    this.selectedRouletteVideo = null;
    this.selectedRouletteIndex = null;
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

  startRouletteVoting(userVotingId) {
    this.isRouletteVoting = true;
    this.rouletteVotes.clear();
    this.rouletteVotes.add(userVotingId);

    const randomIndex = Math.floor(Math.random() * this.queue.length);
    this.selectedRouletteVideo = this.queue[randomIndex];
    this.selectedRouletteIndex = randomIndex;

    return {
      selectedIndex: randomIndex,
      selectedVideo: this.selectedRouletteVideo,
      votesCount: this.rouletteVotes.size,
      votesNeeded: this.getVotesNeeded()
    };
  }

  addRouletteVote(userId) {
    this.rouletteVotes.add(userId);
    return {
      votesCount: this.rouletteVotes.size,
      votesNeeded: this.getVotesNeeded(),
      isMajority: this.rouletteVotes.size >= this.getVotesNeeded()
    };
  }

  getVotesNeeded() {
    return Math.ceil(this.getUserCount() * 0.5);
  }

  playSelectedRoulette() {
    if (this.selectedRouletteVideo && this.selectedRouletteIndex !== null) {
      const video = this.selectedRouletteVideo;
      const index = this.selectedRouletteIndex;

      this.queue.splice(index, 1);
      this.currentVideo = video;
      this.videoStartTime = Date.now();
      this.isRouletteVoting = false;

      return video;
    }
    return null;
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

  spinWheel() {
    if (this.queue.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * this.queue.length);
    const selectedVideo = this.queue[randomIndex];

    return {
      selectedIndex: randomIndex,
      selectedVideo: selectedVideo
    };
  }

  playSpinnedVideo(index) {
    if (index >= 0 && index < this.queue.length) {
      const video = this.queue[index];
      this.queue.splice(index, 1);
      this.currentVideo = video;
      this.videoStartTime = Date.now();
      return video;
    }
    return null;
  }
}
