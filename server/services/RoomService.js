import { Room } from '../models/Room.js';

export class RoomService {
  constructor() {
    this.rooms = new Map();
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
