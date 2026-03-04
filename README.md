# 🎵 Baile

Aplicação web colaborativa em tempo real para criação de salas de música com fila compartilhada e sistema interativo de cartas para seleção da próxima música.


## 📖 Sobre o Projeto

O **Baile** é uma aplicação que permite que usuários participem de uma sala compartilhada onde podem:

- Buscar músicas no YouTube
- Adicionar músicas à fila
- Selecionar a próxima música através de um sistema dinâmico de cartas


A comunicação ocorre em tempo real utilizando WebSockets via Socket.IO.


## 🎯 Objetivo

Criar uma experiência colaborativa de compartilhamento de gosto musical entre usuários em tempo real, permitindo interação dinâmica e escolha interativa da próxima música através de cartas baseadas na fila atual.


## 🛠 Tecnologias Utilizadas

### Frontend
- React
- Vite
- React Router DOM
- Socket.io-client

### Backend
- Node.js
- Express
- Socket.IO
- CORS

### Integração Externa
- YouTube Data API v3

## 🧠 Arquitetura

- Monorepo (Frontend e Backend no mesmo repositório)
- SPA (Single Page Application)
- Backend orientado a eventos (Event-Driven)
- Comunicação via WebSockets
- Estado das salas armazenado em memória utilizando `Map`
