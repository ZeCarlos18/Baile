import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

app.get('/', (req, res) => {
  res.json({ status: 'Backend Baile online ✅' });
});

const rooms = new Map();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  socket.on('create-room', () => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      queue: [],
      currentVideo: null,
      videoStartTime: null,
      isPlaying: false,
      pausedAt: 0,
      users: [socket.id],
      rouletteVotes: new Set(),
      isRouletteVoting: false,
      selectedRouletteVideo: null,
      selectedRouletteIndex: null
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    socket.emit('room-created', roomCode);
  });

  socket.on('join-room', (roomCode) => {
    const room = rooms.get(roomCode);

    if (room) {
      socket.join(roomCode);
      socket.roomCode = roomCode;
      room.users.push(socket.id);

      let elapsedTime = 0;
      if (room.currentVideo && room.videoStartTime) {
        elapsedTime = (Date.now() - room.videoStartTime) / 1000;
      }

      socket.emit('user-joined', {
        userCount: room.users.length,
        queue: room.queue,
        currentVideo: room.currentVideo,
        elapsedTime: elapsedTime
      });
      
      socket.broadcast.to(roomCode).emit('user-count-updated', room.users.length);
    } else {
      socket.emit('room-error', 'Sala não encontrada');
    }
  });

  socket.on('add-video', (data) => {
    const { code, video, playNow } = data
    const roomCode = code || socket.roomCode
    const room = rooms.get(roomCode)

    if (room) {
      if (playNow && !room.currentVideo) {
        room.currentVideo = video
        room.videoStartTime = Date.now()
        io.to(roomCode).emit('play-video', { 
          video: room.currentVideo,
          elapsedTime: 0 
        })
      } else {
        room.queue.push(video)
        io.to(roomCode).emit('update-queue', room.queue)
      }
    }
  });

  socket.on('next-video', () => {
    const room = rooms.get(socket.roomCode);

    if (room && room.queue.length > 0) {
      room.currentVideo = room.queue.shift()
      room.videoStartTime = Date.now()
      
      io.to(socket.roomCode).emit('play-video', { 
        video: room.currentVideo,
        elapsedTime: 0 
      })
      io.to(socket.roomCode).emit('update-queue', room.queue)
    }
  });

  socket.on('remove-video', (index) => {
    const room = rooms.get(socket.roomCode);

    if (room && index >= 0 && index < room.queue.length) {
      room.queue.splice(index, 1);
      io.to(socket.roomCode).emit('update-queue', room.queue);
    }
  });

  socket.on('request-roulette', (roomCode) => {
    const room = rooms.get(roomCode);

    if (room && room.queue.length > 0) {
      room.isRouletteVoting = true;
      room.rouletteVotes.clear();
      room.rouletteVotes.add(socket.id);

      const randomIndex = Math.floor(Math.random() * room.queue.length);
      room.selectedRouletteVideo = room.queue[randomIndex];
      room.selectedRouletteIndex = randomIndex;

      const queueSnapshot = [...room.queue];
      const votesCount = room.rouletteVotes.size;
      const totalUsers = room.users.length;
      const votesNeeded = Math.ceil(totalUsers * 0.5);

      io.to(roomCode).emit('roulette-voting-started', {
        queue: queueSnapshot,
        selectedIndex: randomIndex,
        selectedVideo: room.selectedRouletteVideo,
        votesCount: votesCount,
        totalUsers: totalUsers,
        votesNeeded: votesNeeded
      });
    }
  });

  socket.on('vote-roulette', (roomCode) => {
    const room = rooms.get(roomCode);

    if (room && room.isRouletteVoting) {
      room.rouletteVotes.add(socket.id);

      const votesCount = room.rouletteVotes.size;
      const totalUsers = room.users.length;
      const votesNeeded = Math.ceil(totalUsers * 0.5);

      io.to(roomCode).emit('roulette-votes-updated', {
        votesCount: votesCount,
        totalUsers: totalUsers,
        votesNeeded: votesNeeded
      });

      if (votesCount >= votesNeeded) {
        room.isRouletteVoting = false;

        const selectedVideo = room.selectedRouletteVideo;
        const selectedIndex = room.selectedRouletteIndex;
        const queueSnapshot = [...room.queue];

        io.to(roomCode).emit('start-roulette', {
          queue: queueSnapshot,
          selectedIndex: selectedIndex,
          selectedVideo: selectedVideo
        });

        setTimeout(() => {
          room.currentVideo = selectedVideo;
          room.videoStartTime = Date.now();
          room.queue.splice(selectedIndex, 1);

          io.to(roomCode).emit('play-video', { 
            video: room.currentVideo,
            elapsedTime: 0 
          });
          io.to(roomCode).emit('update-queue', room.queue);
        }, 3000);
      }
    }
  });

  socket.on('spin-wheel', (roomCode) => {
    const room = rooms.get(roomCode);

    if (room && room.queue.length > 0) {
      const randomIndex = Math.floor(Math.random() * room.queue.length);
      const selectedVideo = room.queue[randomIndex];
      const queueSnapshot = [...room.queue];

      io.to(roomCode).emit('start-roulette', {
        queue: queueSnapshot,
        selectedIndex: randomIndex,
        selectedVideo: selectedVideo
      });

      setTimeout(() => {
        room.currentVideo = selectedVideo;
        room.videoStartTime = Date.now();
        room.queue.splice(randomIndex, 1);

        io.to(roomCode).emit('play-video', { 
          video: room.currentVideo,
          elapsedTime: 0 
        });
        io.to(roomCode).emit('update-queue', room.queue);
      }, 3000);
    }
  });

  socket.on('sync-time', () => {
    const room = rooms.get(socket.roomCode);
    if (room && room.currentVideo) {
      let elapsedTime = 0;
      
      if (room.isPlaying && room.videoStartTime) {
        elapsedTime = (Date.now() - room.videoStartTime) / 1000;
      } else if (!room.isPlaying) {
        elapsedTime = room.pausedAt;
      }
      
      socket.emit('sync-time-response', {
        currentTime: elapsedTime,
        isPlaying: room.isPlaying
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.roomCode) {
      const room = rooms.get(socket.roomCode);
      if (room) {
        room.users = room.users.filter(id => id !== socket.id);
        if (room.users.length > 0) {
          io.to(socket.roomCode).emit('user-left', room.users.length);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
