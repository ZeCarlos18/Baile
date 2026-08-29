# 🎵 Baralhô - Sistema de Fila de Música Colaborativa

Uma aplicação web colaborativa em tempo real que permite criar salas compartilhadas para ouvir música com amigos, com sistema interativo de cartas para seleção da próxima música.

## 🎯 O Que É?

**Baralhô** é uma plataforma onde você pode:
- 🎤 Criar uma sala de música compartilhada
- 🔗 Convidar amigos através de um link
- 🔍 Buscar músicas do YouTube
- ➕ Adicionar músicas à fila coletiva
- 🎴 Selecionar a próxima música usando um jogo de cartas interativo
- 🎵 Ouvir a mesma música sincronizada com todos na sala

**Caso de uso:** Festa, reunião entre amigos, estudo em grupo - qualquer situação onde múltiplas pessoas querem colaborar na escolha da trilha sonora.

## 🚀 Quick Start (5 minutos)

### 1. Instalar Dependências

```bash
# Frontend + Backend
npm install

# Backend separadamente (opcional)
cd server && npm install
```

### 2. Configurar YouTube API

Crie um arquivo `.env` na raiz do projeto:
```env
VITE_YOUTUBE_API_KEY=sua_chave_do_youtube_aqui
```

**Como obter a chave:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a "YouTube Data API v3"
4. Crie credenciais (API Key)
5. Copie a chave para o `.env`

### 3. Iniciar a Aplicação

```bash
# Modo desenvolvimento (Frontend + Backend simultâneos)
npm run dev

# Ou separadamente:
npm run dev:frontend    # Terminal 1 - http://localhost:5173
npm run dev:backend     # Terminal 2 - http://localhost:3000
```

## 📱 Como Usar

### 👥 Criar Sala

1. Acesse http://localhost:5173
2. Clique em **"Criar Sala"**
3. Você receberá um código único (ex: `ABC123`)
4. Seu ID de usuário é salvo automaticamente no navegador

### 🤝 Convidar Amigos

1. Na página da sala, encontre o botão **"🎤 Convide seus amigos"**
2. Clique em **"📋 Copiar"** para copiar o link
3. Compartilhe o link com seus amigos
4. Eles entrarão automaticamente na sua sala

### 🎵 Buscar e Adicionar Música

1. Digite o nome da música no campo de busca (ex: "Matuê - Crack")
2. Clique em **"🔍 Buscar"** ou pressione Enter
3. Clique em **"➕ Adicionar"** ao lado da música desejada
4. A música entra na fila compartilhada

### 🎴 Escolher Próxima Música

1. Veja a lista de próximas músicas no painel direito
2. Clique em **"🎴 Escolher Próxima"**
3. As cartas aparecem com as músicas embaralhadas
4. Clique em uma carta para revelar e selecionar
5. A música toca para todos automaticamente
6. Os outros usuários veem a fila atualizar em tempo real

### 🔄 Recarregar a Página

- Seu ID de usuário é preservado
- Você volta automaticamente à mesma sala (código na URL)
- O servidor mantém sua fila e a música em andamento por alguns segundos
  enquanto seu navegador reconecta, então nada é perdido

## 🏗️ Arquitetura

### Frontend (React)
```
src/
├── pages/
│   ├── Home.jsx          # Página inicial - Criar sala
│   └── Room.jsx          # Sala - Busca, fila, player
├── components/
│   ├── SearchBar.jsx     # Campo de busca
│   ├── QueueList.jsx     # Lista de próximas músicas
│   ├── Player.jsx        # Player do YouTube
│   ├── CardDeck.jsx      # Jogo de cartas
│   └── ShareRoom.jsx     # Link para compartilhar
├── contexts/
│   ├── AuthContext.jsx   # Gerencia userId persistent
│   └── RoomContext.jsx   # Estado compartilhado da sala
└── hooks/
    ├── useSocket.js      # WebSocket connection
    └── usePlayer.js      # YouTube Player API
```

### Backend (Node.js + Express + Socket.IO)
```
server/
├── controllers/
│   ├── RoomController.js      # Criar/entrar em salas
│   ├── QueueController.js     # Adicionar músicas
│   └── CardController.js      # Lógica de cartas
├── models/
│   └── Room.js               # Estrutura de dados da sala
├── services/
│   └── RoomService.js        # Serviço de gerenciamento
└── config/
    └── socketEvents.js       # Listener de eventos
```

## 🔌 Como Funciona (Por Baixo dos Panos)

### 1️⃣ Criação de Sala
```
Cliente → emit 'create-room' 
       ← emit 'room-created' + código
       → navigate('/room/ABC123')
```

### 2️⃣ Entrada na Sala
```
Cliente → emit 'join-room' + userId
       ← emit 'user-joined' + fila pessoal/global + vídeo em andamento
       → Restaura o player se havia música tocando (ex: após refresh)
```

### 3️⃣ Adicionar Música
```
Cliente → emit 'add-video' + YouTube video
       → Backend adiciona à globalQueue
       ← broadcast 'video-added' para todos
       → Todos adicionam à sua fila pessoal
```

### 4️⃣ Selecionar Música com Cartas
```
Cliente 1 → emit 'select-card'
         → Backend remove da fila
         ← broadcast 'play-video' para todos
Cliente 2 → Recebe 'play-video'
         → Remove mesma música da sua fila
```

## 🔑 Conceitos Principais

### Fila Global vs Fila Pessoal
- **Global**: Lista de todas as músicas adicionadas (todos veem igual)
- **Pessoal**: Cópia individual (cada um remove o que tocou)

### Persistência de Sessão
- `userId` (localStorage): identificador único do usuário, gerado uma vez
- Código da sala: mantido na URL (`/room/:code`), sobrevive a um refresh
- Fila e vídeo em andamento: guardados no servidor (em memória) e mantidos
  por um período de graça (10s) quando o socket desconecta, para que um
  refresh de página não apague o estado da sala

### Socket.IO
- Conexão bidirecional em tempo real
- Eventos síncronos entre cliente-servidor
- Broadcasts para múltiplos usuários

## 📊 Fluxo de Dados

```
┌─────────────────────────────────────────━┐
│         YouTube API v3                   │
│    (Busca de vídeos/músicas)             │
└──────────────────┬──────────────────────┘
                   │
          ┌────────▼────────┐
          │   Frontend      │
          │  (React 19.2)   │
          └────────┬────────┘
                   │
         Socket.IO │ WebSocket
                   │
          ┌────────▼────────┐
          │   Backend       │
          │ (Node + Express)│
          │ (Estado da sala)│
          └─────────────────┘
```

## 🛠️ Tecnologias

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React | 19.2.0 |
| Frontend | Vite | 7.3.1 |
| Frontend | Socket.io-client | 4.8.3 |
| Backend | Node.js | 18+ |
| Backend | Express | 4.18.2 |
| Backend | Socket.IO | 4.8.3 |
| API | YouTube Data API | v3 |

## 📋 Requisitos Cumpridos (PWEB B2)

- ✅ SPA com React consumindo API externa
- ✅ State Management (useState + Context API)
- ✅ Componentes reutilizáveis
- ✅ React Router (2 rotas)
- ✅ Props entre componentes
- ✅ Eventos (UI + WebSocket)
- ✅ Interface RESTful (semântica)

## 🐛 Debug Mode

O projeto inclui console.logs detalhados com emojis para fácil rastreamento:

```
👤 AuthContext Events
🔌 Socket Connection
🎵 Music Events
🎴 Card Selection
▶️ Playback Events
📝 Queue Updates
📊 Data Events
⏱️ Time Sync
```

**Ativar DevTools:**
1. Pressione F12 no navegador
2. Vá para "Console"
3. Execute qualquer ação - verá logs detalhados

## 📁 Arquivos Importantes

| Arquivo | Propósito |
|---------|-----------|
| `.env` | Chave da YouTube API |
| `package.json` | Dependências e scripts |
| `src/App.jsx` | Configuração de providers e rotas |
| `server/server.js` | Servidor principal |
| `src/contexts/AuthContext.jsx` | Gerenciamento de userId |
| `src/contexts/RoomContext.jsx` | Estado compartilhado |

## 🚀 Deploy (Opcional)

### Vercel
```bash
npm run build
# Deploy a pasta 'dist'
```

### Render
```bash
# Backend roda em: PORT=10000
# Frontend aponta para: VITE_SOCKET_URL=https://seu-backend.onrender.com
```

## 💡 Dicas

- 🔗 Compartilhe o link sem recarregar a página para mais velocidade
- 💾 Recarregar a página não perde progresso - a sala te espera por alguns segundos
- 🔄 Sincronização é automática entre todos os usuários
- 🎴 Quanto mais músicas, mais emoção na escolha das cartas!

## 📞 Suporte

Para debug:
1. Verifique a chave da YouTube API
2. Certifique-se que Backend está rodando na porta 3000
3. Verifique o console (F12) para logs detalhados
4. Teste em abas diferentes do navegador

---


