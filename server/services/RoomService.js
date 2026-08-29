import { Room } from '../models/Room.js';

export class RoomService {
  constructor() {
    this.rooms = new Map();
    this.disconnectTimers = new Map(); // `${code}:${userId}` -> Timeout
  }

  // Agenda a remoção de um usuário após um período de graça, para
  // sobreviver a um refresh de página (disconnect + reconnect rápido)
  scheduleUserRemoval(code, userId, callback, delayMs = 10000) {
    this.cancelUserRemoval(code, userId);
    const key = `${code}:${userId}`;
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(key);
      callback();
    }, delayMs);
    this.disconnectTimers.set(key, timer);
  }

  cancelUserRemoval(code, userId) {
    const key = `${code}:${userId}`;
    const timer = this.disconnectTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(key);
    }
  }

  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createRoom() {
    const code = this.generateRoomCode();
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  getRoomByCode(code) {
    return this.rooms.get(code);
  }

  roomExists(code) {
    return this.rooms.has(code);
  }

  deleteRoom(code) {
    this.rooms.delete(code);
  }

  removeUserFromRoom(code, userId) {
    const room = this.getRoomByCode(code);
    if (room) {
      room.removeUser(userId);
      
      // Deletar sala se não houver mais usuários
      if (room.getUserCount() === 0) {
        this.deleteRoom(code);
      }
    }
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }
}
