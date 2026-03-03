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

// Rota de health check
app.get('/', (req, res) => {
  res.json({ status: 'Backend Baile online ✅' });
});

// Armazenar salas e suas filas
const rooms = new Map();

// Gerar código de sala aleatório
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Eventos do Socket.IO
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  // Criar uma nova sala
  socket.on('create-room', () => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      queue: [],
      currentVideo: null,
      videoStartTime: null, // Timestamp de quando começou a tocar
      currentIndex: 0,
      users: [socket.id]
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    console.log(`Sala criada: ${roomCode}`);
    socket.emit('room-created', roomCode);
  });

  // Entrar em uma sala existente
  socket.on('join-room', (roomCode) => {
    const room = rooms.get(roomCode);

    if (room) {
      socket.join(roomCode);
      socket.roomCode = roomCode;
      room.users.push(socket.id);

      console.log(`Usuário ${socket.id} entrou na sala ${roomCode}`);
      
      // Calcular tempo decorrido do vídeo atual
      let elapsedTime = 0;
      if (room.currentVideo && room.videoStartTime) {
        elapsedTime = (Date.now() - room.videoStartTime) / 1000; // em segundos
      }

      io.to(roomCode).emit('user-joined', {
        userCount: room.users.length,
        queue: room.queue,
        currentVideo: room.currentVideo,
        elapsedTime: elapsedTime // Tempo em segundos
      });
    } else {
      socket.emit('room-error', 'Sala não encontrada');
    }
  });

  // Adicionar vídeo à fila
  socket.on('add-video', (data) => {
    console.log("📥 Evento add-video recebido:", data)
    const { code, video, playNow } = data
    const roomCode = code || socket.roomCode
    const room = rooms.get(roomCode)

    console.log("🔍 Procurando sala:", roomCode)
    console.log("🎬 Room encontrada?", !!room)

    if (room) {
      if (playNow && !room.currentVideo) {
        // Se pedir para tocar agora e não há vídeo tocando, toca este
        room.currentVideo = video
        room.videoStartTime = Date.now() // Armazenar o tempo de início
        console.log(`▶️ Tocando vídeo imediatamente na sala ${roomCode}: ${video.title}`)
        io.to(roomCode).emit('play-video', { 
          video: room.currentVideo,
          elapsedTime: 0 
        })
      } else {
        // Caso contrário, adiciona à fila/roleta
        room.queue.push(video)
        console.log(`⏳ Vídeo adicionado à fila na sala ${roomCode}: ${video.title}`)
        io.to(roomCode).emit('update-queue', room.queue)
      }
    } else {
      console.error(`❌ Sala não encontrada: ${roomCode}`)
    }
  });

  // Pular para o próximo vídeo
  socket.on('next-video', () => {
    const room = rooms.get(socket.roomCode);

    if (room && room.queue.length > 0) {
      // Pega o primeiro da fila se houver
      room.currentVideo = room.queue.shift() // Remove e pega o primeiro
      room.videoStartTime = Date.now() // Armazenar o tempo de início
      
      console.log(`⏭️ Próximo vídeo na sala ${socket.roomCode}: ${room.currentVideo.title}`)
      io.to(socket.roomCode).emit('play-video', { 
        video: room.currentVideo,
        elapsedTime: 0 
      })
      io.to(socket.roomCode).emit('update-queue', room.queue)
    }
  });

  // Remover vídeo da fila
  socket.on('remove-video', (index) => {
    const room = rooms.get(socket.roomCode);

    if (room && index >= 0 && index < room.queue.length) {
      room.queue.splice(index, 1);

      console.log(`Vídeo removido da fila da sala ${socket.roomCode}`);
      io.to(socket.roomCode).emit('update-queue', room.queue);
    }
  });

  // Sortear vídeo aleatório (roulette)
  socket.on('spin-wheel', (roomCode) => {
    const room = rooms.get(roomCode);

    if (room && room.queue.length > 0) {
      const randomIndex = Math.floor(Math.random() * room.queue.length);
      room.currentVideo = room.queue[randomIndex]
      room.videoStartTime = Date.now() // Armazenar o tempo de início
      
      // Remove o vídeo da fila já que está tocando
      room.queue.splice(randomIndex, 1)
      room.currentIndex = 0

      console.log(`🎡 Roulette acionada na sala ${roomCode}. Tocando: ${room.currentVideo.title}`)
      io.to(roomCode).emit('play-video', { 
        video: room.currentVideo,
        elapsedTime: 0 
      })
      io.to(roomCode).emit('update-queue', room.queue) // Atualiza a fila
    } else {
      console.log(`❌ Não há vídeos na fila para girar em ${roomCode}`)
    }
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);

    if (socket.roomCode) {
      const room = rooms.get(socket.roomCode);
      if (room) {
        room.users = room.users.filter(id => id !== socket.id);

        // Notificar outros usuários na sala
        if (room.users.length > 0) {
          io.to(socket.roomCode).emit('user-left', room.users.length);
          console.log(`Usuário saiu da sala ${socket.roomCode}. Usuários restantes: ${room.users.length}`);
        } else {
          console.log(`Sala ${socket.roomCode} vazia, mas mantida para futuras conexões`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
httpServer.listen(PORT, HOST, () => {
  console.log(`🎵 Servidor Baile rodando em ${HOST}:${PORT}`);
  console.log(`📱 Acesse de qualquer lugar: http://<seu-ip>:${PORT}`);
});
