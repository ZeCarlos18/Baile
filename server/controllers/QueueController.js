export class QueueController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  addVideo(socket, io, data) {
    const { code, video, playNow } = data;
    const roomCode = code || socket.roomCode;
    const room = this.roomService.getRoomByCode(roomCode);

    if (!room) return;

    if (playNow && !room.currentVideo) {
      room.currentVideo = video;
      room.videoStartTime = Date.now();

      io.to(roomCode).emit('play-video', {
        video: room.currentVideo,
        elapsedTime: 0
      });
    } else {
      room.addVideo(video);
      io.to(roomCode).emit('update-queue', room.queue);
    }
  }

  nextVideo(socket, io) {
    const room = this.roomService.getRoomByCode(socket.roomCode);

    if (!room || room.queue.length === 0) return;

    room.getNextVideo();

    io.to(socket.roomCode).emit('play-video', {
      video: room.currentVideo,
      elapsedTime: 0
    });

    io.to(socket.roomCode).emit('update-queue', room.queue);
  }

  removeVideo(socket, io, index) {
    const room = this.roomService.getRoomByCode(socket.roomCode);

    if (!room) return;

    if (room.removeVideoByIndex(index)) {
      io.to(socket.roomCode).emit('update-queue', room.queue);
    }
  }
}
