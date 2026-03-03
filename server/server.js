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
      users: [socket.id]
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

  socket.on('spin-wheel', (roomCode) => {
    const room = rooms.get(roomCode);

    if (room && room.queue.length > 0) {
      io.to(roomCode).emit('start-roulette', {
        queue: room.queue
      });

      const randomIndex = Math.floor(Math.random() * room.queue.length);
      room.currentVideo = room.queue[randomIndex]
      room.videoStartTime = Date.now()
      
      room.queue.splice(randomIndex, 1)

      io.to(roomCode).emit('play-video', { 
        video: room.currentVideo,
        elapsedTime: 0 
      })
      io.to(roomCode).emit('update-queue', room.queue)
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
