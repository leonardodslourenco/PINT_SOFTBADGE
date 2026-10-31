// =========================================================================
// SERVIÇO CENTRAL DE WEBSOCKETS (SOCKET.IO)
// =========================================================================
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { AUTH } = require('../config/parameters');
const { isTokenRevoked } = require('./tokenBlacklist');

let io; // Variável global interna para armazenar a instância do Socket.IO

/**
 * INICIALIZAÇÃO DO SERVIDOR DE SOCKETS
 * Acopla o motor Socket.IO ao servidor HTTP nativo do Node.
 */
function initWebSocket(httpServer) {
  const rawCorsOrigin = process.env.CORS_ORIGIN;
  const allowedOrigins = rawCorsOrigin 
    ? rawCorsOrigin.split(',').map(o => o.trim()).filter(Boolean)
    : '*';

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  // MIDDLEWARE DE AUTENTICAÇÃO (CIBERSEGURANÇA)
  io.use(async (socket, next) => {
    try {
      // 1. Extrai o token do handshake (geralmente enviado no auth.token)
      const token = socket.handshake.auth?.token;
      
      if (!token) {
        return next(new Error('Autenticação necessária. Token JWT ausente.'));
      }

      // 2. Valida se o token foi revogado (Logout)
      if (await isTokenRevoked(token)) {
        return next(new Error('Token revogado. Faça login novamente.'));
      }

      // 3. Verifica a assinatura criptográfica e validade do token
      const decoded = jwt.verify(token, AUTH.JWT_SECRET);
      
      // 4. Injeta os dados do utilizador na ligação ativa
      socket.user = decoded;
      
      next(); // Permite a conexão
    } catch (error) {
      next(new Error('Token JWT inválido ou expirado.'));
    }
  });

  // LÓGICA DE CONEXÃO E GESTÃO DE SALAS (ROOMS)
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Utilizador conectado: ${socket.user.email} (Socket ID: ${socket.id})`);

    // Sala fixa para o utilizador individual (para notificações diretas)
    const personalRoom = `user_${socket.user.id_utilizador || socket.user.sub}`;
    socket.join(personalRoom);

    // Auto-adesão às salas dos perfis que o utilizador possui
    const perfis = socket.user.perfis || [];
    if (perfis.includes(1)) {
      socket.join('room_admin');
      socket.join('room_administrador');
    }
    if (perfis.includes(2)) socket.join('room_sll');
    if (perfis.includes(3)) socket.join('room_tm');
    if (perfis.includes(4)) socket.join('room_consultor');

    // O Frontend pode também enviar este evento quando altera ativamente de perfil na UI
    // Exemplo: socket.emit('set_active_profile', 'admin')
    socket.on('set_active_profile', (profileName) => {
      if (!profileName) return;
      
      const targetRoom = `room_${profileName.toLowerCase()}`;
      
      // 1. Remove o socket de outras salas de perfil anteriores para não receber spam
      // (Ignorando a própria sala (socket.id) e a personalRoom)
      socket.rooms.forEach(room => {
        if (room.startsWith('room_')) {
          socket.leave(room);
        }
      });

      // 2. Adiciona o socket à sala do perfil selecionado
      socket.join(targetRoom);
      console.log(`[Socket.IO] ${socket.user.email} entrou na sala: ${targetRoom}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Utilizador desconectado: ${socket.user.email}`);
    });
  });
}

const { sendPushToTopic } = require('./firebase.service');

/**
 * GATILHO GLOBAL (TRIGGER)
 * Exporta uma função limpa para qualquer controlador usar com 1 única linha.
 * Envia o evento via Socket.IO para a Web e replica via Firebase Push Notification (FCM)
 * para o telemóvel Android caso o destinatário seja um consultor (user_UUID ou room_consultor).
 * 
 * @param {string} room - Nome da sala (ex: 'room_tm', 'room_sll', 'room_consultor', 'user_1234')
 * @param {string} event - Nome do evento (ex: 'candidatura_avancou', 'candidatura_aprovada')
 * @param {object} data - Dados a enviar no formato JSON
 * @param {object} [notificationMeta] - Metadados de notificação para push móvel { title, body }
 */
function emitToRoom(room, event, data, notificationMeta = null) {
  // 1. Emissão nativa via Socket.IO para os clientes Web conectados
  if (io) {
    io.to(room).emit(event, data);
  }

  // 2. Replicação via Firebase Admin SDK (Push Notifications Android)
  // O mobile é exclusivo para consultores: enviamos para salas individuais (user_UUID) ou de consultores
  if (room && (room.startsWith('user_') || room === 'room_consultor')) {
    if (!notificationMeta || !notificationMeta.skipPush) {
      sendPushToTopic({
        topic: room,
        event,
        data,
        notificationMeta
      }).catch(err => {
        console.error(`[WebSocket/Firebase] Erro ao enviar push para ${room}:`, err.message);
      });
    }
  }
}

/**
 * EMISSÃO BROADCAST GLOBAL
 * Envia o evento para todos os sockets conectados simultaneamente e
 * replica via Firebase Push Notification para o tópico global.
 * 
 * @param {string} event - Nome do evento
 * @param {object} data - Dados complementares
 * @param {object} [notificationMeta] - Metadados de notificação { title, body }
 */
function emitGlobal(event, data, notificationMeta = null) {
  // 1. Emissão Socket.IO global
  if (io) {
    io.emit(event, data);
  }

  // 2. Push Notification global via FCM
  if (!notificationMeta || !notificationMeta.skipPush) {
    sendPushToTopic({
      topic: 'global',
      event,
      data,
      notificationMeta
    }).catch(err => {
      console.error('[WebSocket/Firebase] Erro ao enviar push global:', err.message);
    });
  }
}

/**
 * Retorna a instância bruta do Socket.IO caso seja necessária em casos mais complexos.
 */
function getIo() {
  if (!io) throw new Error('Socket.IO não foi inicializado!');
  return io;
}

module.exports = {
  initWebSocket,
  emitToRoom,
  emitGlobal,
  getIo
};
