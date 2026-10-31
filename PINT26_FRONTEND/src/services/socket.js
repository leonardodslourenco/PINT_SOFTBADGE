import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket = null;
let currentToken = null;
let currentActiveProfile = null;

export const socketService = {
  connect(token) {
    if (socket && currentToken === token) {
      if (!socket.connected) {
        socket.connect();
      }
      return socket;
    }

    if (socket) {
      socket.disconnect();
      socket = null;
    }

    currentToken = token;

    socket = io(API_BASE_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado com sucesso. Socket ID:', socket.id);
      if (currentActiveProfile) {
        socket.emit('set_active_profile', currentActiveProfile);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('⚠️ WebSocket desconectado. Motivo:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('❌ Erro de conexão WebSocket:', err.message);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    currentToken = null;
    currentActiveProfile = null;
  },

  getSocket() {
    return socket;
  },

  emitActiveProfile(profile) {
    let profileStr = '';
    if (Number(profile) === 1) profileStr = 'ADMIN';
    else if (Number(profile) === 2) profileStr = 'SLL';
    else if (Number(profile) === 3) profileStr = 'TM';
    else if (Number(profile) === 4) profileStr = 'CON';
    else profileStr = String(profile);

    currentActiveProfile = profileStr;

    if (socket && socket.connected) {
      console.log(`📡 Emitindo perfil ativo via socket: ${profileStr}`);
      socket.emit('set_active_profile', profileStr);
    }
  }
};
