import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomService } from './services/RoomService.js';
import { setupSocketEvents } from './config/socketEvents.js';

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
  res.json({ status: 'Backend Baralhô online ✅' });
});

// Initialize Room Service
const roomService = new RoomService();

// Setup Socket Events
setupSocketEvents(io, roomService);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

