# 🎵 Baile - Servidor Backend

Servidor Socket.IO para gerenciar salas de música colaborativas.

## Requisitos

- Node.js 14+
- npm ou yarn

## Instalação

1. Navegue para a pasta do servidor:
```bash
cd server
```

2. Instale as dependências:
```bash
npm install
```

## Como Rodar

### Modo Desenvolvimento (com auto-reload)
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

O servidor iniciará na **porta 3000**.

## Endpoints do Socket.IO

### Cliente → Servidor

- **`create-room`** - Cria uma nova sala
- **`join-room(roomCode)`** - Entra em uma sala existente
- **`add-video(data)`** - Adiciona vídeo à fila
  ```javascript
  socket.emit('add-video', {
    roomCode: 'ABC123',
    video: { id: '...', title: '...' }
  })
  ```
- **`next-video()`** - Pula para o próximo vídeo
- **`remove-video(index)`** - Remove vídeo por índice
- **`spin-wheel(roomCode)`** - Seleciona vídeo aleatório

### Servidor → Cliente

- **`room-created(roomCode)`** - Sala foi criada com sucesso
- **`user-joined(data)`** - Novo usuário entrou na sala
- **`update-queue(queue)`** - Fila foi atualizada
- **`play-video(video)`** - Reproduzir vídeo específico
- **`user-left(count)`** - Usuário saiu da sala

## Estrutura de Dados

### Room Object
```javascript
{
  code: 'ABC123',           // Código único da sala
  queue: [],               // Array de vídeos
  currentVideo: null,      // Vídeo sendo tocado
  currentIndex: 0,         // Índice na fila
  users: ['socketId']      // Array de IDs conectados
}
```

## Configuração do Frontend

O frontend deve conectar em:
```javascript
const socket = io("http://localhost:3000")
```

> **Nota:** Se o frontend estiver em outra porta, o servidor já está configurado com CORS para aceitar conexões de `http://localhost:5173` (Vite padrão).
