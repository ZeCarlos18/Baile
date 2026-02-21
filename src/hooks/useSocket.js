import { io } from "socket.io-client"

const socket = io("http://localhost:3000")

export function useSocket() {
  return socket
}