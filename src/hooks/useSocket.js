import { io } from "socket.io-client"

// Usar URL do socket da variável de ambiente ou detectar dinamicamente
const getServerUrl = () => {
  // Em produção (Vercel), usará VITE_SOCKET_URL do .env
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL
  }
  
  // Em desenvolvimento, detecta dinamicamente
  if (typeof window === 'undefined') return 'http://localhost:3000'
  
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const port = 3000
  
  return `${protocol}//${hostname}:${port}`
}

const socket = io(getServerUrl())

export function useSocket() {
  return socket
}