/**
 * objetivo: Serviço de WebSocket para comunicação em tempo real
 * funcionalidades: Chat, Localização, Status e Chamadas de Voz/Video (WebRTC)
 * data: 25/09/2025
 * dev: Giovanna
 * versão: 2.0 - Com WebRTC (corrigido e endurecido)
 */

const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // chave = socket.id, valor = { userId, userType, userName, socketId, connectedAt }
    this.activeCalls = new Map(); // callId -> call info
  }

  /**
   * Inicializa o servidor Socket.io
   */
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    console.log('🔌 WebSocket Server inicializado - Com WebRTC');
  }

  /**
   * Configura os handlers de eventos
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('👤 Nova conexão Socket:', socket.id);

      // Log para debug (opcional) - evita spam com ICE candidates
      socket.onAny((eventName, ...args) => {
        if (!eventName.includes('call:ice-candidate')) {
          console.log(`📨 EVENTO RECEBIDO: ${eventName}`, args);
        }
      });

      // EVENTOS
      socket.on('user_connected', (userData) => this.handleUserConnected(socket, userData));
      socket.on('join_servico', (servicoId) => this.handleJoinServico(socket, servicoId));
      socket.on('leave_servico', (servicoId) => this.handleLeaveServico(socket, servicoId));
      socket.on('send_message', (data) => this.handleSendMessage(socket, data));
      socket.on('update_location', (data) => this.handleUpdateLocation(socket, data));
      socket.on('update_status', (data) => this.handleUpdateStatus(socket, data));

      // WEBRTC
      socket.on('call:initiate', (data) => this.handleCallInitiate(socket, data));
      socket.on('call:accept', (data) => this.handleCallAccept(socket, data));
      socket.on('call:reject', (data) => this.handleCallReject(socket, data));
      socket.on('call:cancel', (data) => this.handleCallCancel(socket, data));
      socket.on('call:ice-candidate', (data) => this.handleCallIceCandidate(socket, data));
      socket.on('call:end', (data) => this.handleCallEnd(socket, data));
      socket.on('call:toggle-media', (data) => this.handleCallToggleMedia(socket, data));

      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * Normaliza userId: retorna Number quando possível, caso contrário mantém string
   */
  normalizeId(raw) {
    if (raw === undefined || raw === null) return raw;
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
  }

  /**
   * Usuário conectado
   */
  handleUserConnected(socket, userData) {
    try {
      if (!userData) {
        socket.emit('connection_failed', { reason: 'missing_user_data' });
        return;
      }

      // Se veio encapsulado (ex: [ { ... } ]) tiramos do array
      if (Array.isArray(userData) && userData.length > 0) {
        userData = userData[0];
      }

      const rawUserId = userData.userId;
      const parsedUserId = this.normalizeId(rawUserId);

      const userType = userData.userType || userData.type || null;
      const userName = userData.userName || userData.name || null;

      // Salva usando socket.id como chave
      this.connectedUsers.set(socket.id, {
        userId: parsedUserId,
        userType,
        userName,
        socketId: socket.id,
        connectedAt: new Date()
      });

      // Sala pessoal sempre como string (user_{id})
      socket.join(`user_${String(parsedUserId)}`);

      console.log('🔗 EVENTO user_connected recebido:', { userId: parsedUserId, userType, userName, socketId: socket.id });

      // Confirmar conexão
      socket.emit('connection_established', {
        message: 'Conectado ao servidor de tempo real',
        socketId: socket.id,
        userId: parsedUserId
      });

      // opcional: emitir debug para o socket
      // socket.emit('debug', { connectedUsers: Array.from(this.connectedUsers.values()) });
    } catch (err) {
      console.error('handleUserConnected erro:', err);
    }
  }

  /**
   * Entrar na sala de um serviço
   */
  handleJoinServico(socket, servicoId) {
    try {
      // aceitar "10", 10, { servicoId: 10 }, ["10"]
      if (Array.isArray(servicoId) && servicoId.length > 0) servicoId = servicoId[0];
      if (typeof servicoId === 'object' && servicoId !== null && servicoId.servicoId !== undefined) {
        servicoId = servicoId.servicoId;
      }

      const roomName = `servico_${String(servicoId)}`;
      socket.join(roomName);

      const userInfo = this.connectedUsers.get(socket.id);
      console.log('🎯 EVENTO join_servico recebido:', { servicoId, socketId: socket.id });
      console.log(`📱 ${userInfo?.userName || 'Usuário'} entrou na sala do serviço ${servicoId}`);

      socket.emit('joined_servico', {
        servicoId,
        message: `Conectado ao serviço ${servicoId}`
      });
    } catch (err) {
      console.error('handleJoinServico erro:', err);
    }
  }

  /**
   * Sair da sala de um serviço
   */
  handleLeaveServico(socket, servicoId) {
    try {
      if (Array.isArray(servicoId) && servicoId.length > 0) servicoId = servicoId[0];
      if (typeof servicoId === 'object' && servicoId !== null && servicoId.servicoId !== undefined) {
        servicoId = servicoId.servicoId;
      }
      const roomName = `servico_${String(servicoId)}`;
      socket.leave(roomName);

      const userInfo = this.connectedUsers.get(socket.id);
      console.log(`🚪 ${userInfo?.userName || 'Usuário'} saiu da sala do serviço ${servicoId}`);
    } catch (err) {
      console.error('handleLeaveServico erro:', err);
    }
  }

  /**
   * Enviar mensagem no chat
   */
  handleSendMessage(socket, incoming) {
    try {
      // aceitar array/obj/data wrapper
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      const servicoId = data?.servicoId;
      const mensagem = data?.mensagem;
      const sender = data?.sender;
      const targetUserIdRaw = data?.targetUserId;
      const targetUserId = this.normalizeId(targetUserIdRaw);

      const userInfo = this.connectedUsers.get(socket.id);

      console.log('💬 EVENTO send_message recebido:', {
        servicoId,
        mensagem,
        sender,
        socketId: socket.id,
        userInfo
      });

      // Broadcast para todos na sala do serviço
      this.io.to(`servico_${String(servicoId)}`).emit('new_message', {
        servicoId,
        mensagem,
        sender,
        timestamp: new Date(),
        senderInfo: {
          userId: userInfo?.userId,
          userType: userInfo?.userType,
          userName: userInfo?.userName
        }
      });

      // Notificar o outro participante (se estiver em sala pessoal)
      if (targetUserId !== undefined && targetUserId !== null) {
        this.io.to(`user_${String(targetUserId)}`).emit('message_notification', {
          servicoId,
          mensagem: (mensagem || '').substring(0, 50) + '...',
          sender,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('handleSendMessage erro:', err);
    }
  }

  /**
   * Atualização de localização em tempo real
   */
  handleUpdateLocation(socket, incoming) {
    try {
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      const servicoId = data?.servicoId;
      const latitude = Number(data?.latitude);
      const longitude = Number(data?.longitude);
      const userId = this.normalizeId(data?.prestadorId ?? data?.userId ?? data?.id);

      const userInfo = this.connectedUsers.get(socket.id);

      console.log(`📍 Atualização de localização - Serviço ${servicoId}: ${latitude}, ${longitude}`);

      this.io.to(`servico_${String(servicoId)}`).emit('location_updated', {
        servicoId,
        latitude,
        longitude,
        userId,
        userName: userInfo?.userName,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('handleUpdateLocation erro:', err);
    }
  }

  /**
   * Atualização de status do serviço
   */
  handleUpdateStatus(socket, incoming) {
    try {
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      const servicoId = data?.servicoId;
      const status = data?.status;
      const observacao = data?.observacao;

      console.log(`🔄 Atualização de status - Serviço ${servicoId}: ${status}`);

      this.io.to(`servico_${String(servicoId)}`).emit('status_updated', {
        servicoId,
        status,
        observacao,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('handleUpdateStatus erro:', err);
    }
  }

  // =========================================================================
  // === HANDLERS WEBRTC - NOVOS MÉTODOS ===
  // =========================================================================

  /**
   * ✅ DEBUG: Método para verificar conexões
   */
  debugConnections() {
    console.log('=== 🔍 DEBUG CONEXÕES ATIVAS ===');
    const users = Array.from(this.connectedUsers.values());
    if (users.length === 0) {
      console.log('❌ NENHUM usuário conectado!');
      return;
    }
    users.forEach(user => {
      console.log(`👤 UserID: ${user.userId}, Socket: ${user.socketId}, Nome: ${user.userName}`);
    });
    console.log('================================');
  }

  /**
   * ✅ Iniciar uma chamada de voz/vídeo
   */
  handleCallInitiate(socket, incoming) {
    try {
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      // Normalizar IDs
      const servicoId = data?.servicoId;
      const callerId = this.normalizeId(data?.callerId ?? data?.userId ?? data?.from);
      const callerName = data?.callerName;
      const targetUserId = this.normalizeId(data?.targetUserId ?? data?.targetId ?? data?.to);
      const callType = data?.callType || 'video';

      const callerInfo = this.connectedUsers.get(socket.id);

      console.log('🔍 DEBUG handleCallInitiate - data recebida:', { servicoId, callerId, callerName, targetUserId, callType });
      this.debugConnections();

      // Verificar se o target está online
      const targetOnline = this.isUserOnline(targetUserId);
      console.log(`🎯 Target ${targetUserId} online?`, targetOnline);

      if (!targetOnline) {
        console.log(`❌ Target ${targetUserId} OFFLINE - Enviando call:failed`);
        socket.emit('call:failed', {
          reason: 'user_offline',
          message: 'Usuário destino está offline'
        });
        return;
      }

      // Gerar callId unico
      const callId = `${servicoId}_${callerId}_${Date.now()}`;

      // Registrar chamada
      this.activeCalls.set(callId, {
        callId,
        servicoId,
        callerId,
        targetUserId,
        callType,
        status: 'ringing',
        startedAt: new Date()
      });

      // Notificar o usuário destino (todos sockets dele)
      console.log(`📤 Enviando call:incoming para user_${String(targetUserId)}`);
      this.io.to(`user_${String(targetUserId)}`).emit('call:incoming', {
        servicoId,
        callerId,
        callerName: callerInfo?.userName || callerName,
        callType,
        callId,
        timestamp: new Date()
      });

      // Confirmar para quem iniciou
      console.log(`📤 Enviando call:initiated para socket ${socket.id}`);
      socket.emit('call:initiated', {
        callId,
        targetUserId,
        targetOnline: true
      });

      console.log(`✅ Notificações enviadas - Call ID: ${callId}`);
    } catch (err) {
      console.error('handleCallInitiate erro:', err);
      socket.emit('call:failed', { reason: 'server_error', message: String(err) });
    }
  }

  /**
   * ✅ Aceitar uma chamada
   */
  handleCallAccept(socket, incoming) {
    try {
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      const servicoId = data?.servicoId;
      const callId = data?.callId;
      const callerId = this.normalizeId(data?.callerId);
      const answer = data?.answer; // SDP answer
      const answererInfo = this.connectedUsers.get(socket.id);

      console.log('🔍 DEBUG handleCallAccept - data recebida:', { servicoId, callId, callerId });
      console.log(`✅ Chamada aceita - Call ID: ${callId}, Por: ${answererInfo?.userName || 'N/A'}`);

      // Atualizar status
      const call = this.activeCalls.get(callId);
      if (call) {
        call.status = 'active';
        call.answeredAt = new Date();
        call.answererId = answererInfo?.userId;
      }

      // Notificar o caller (todos sockets dele)
      console.log(`🎯 Notificando caller ${callerId} com call:accepted`);
      this.io.to(`user_${String(callerId)}`).emit('call:accepted', {
        servicoId,
        callId,
        answererId: answererInfo?.userId,
        answererName: answererInfo?.userName || 'Usuário',
        answer,
        timestamp: new Date()
      });

      // Notificar sala do serviço
      this.io.to(`servico_${String(servicoId)}`).emit('call:started', {
        servicoId,
        callId,
        participants: [call?.callerId, call?.answererId],
        timestamp: new Date()
      });

      console.log(`📤 Notificações enviadas - Call accepted para caller ${callerId}`);
    } catch (err) {
      console.error('handleCallAccept erro:', err);
    }
  }

  /**
   * ✅ Rejeitar uma chamada
   */
  handleCallReject(socket, incoming) {
    try {
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      const servicoId = data?.servicoId;
      const callId = data?.callId;
      const callerId = this.normalizeId(data?.callerId);
      const reason = data?.reason || 'user_busy';
      const rejecter = this.connectedUsers.get(socket.id);

      console.log(`❌ Chamada rejeitada - Call ID: ${callId}, Por: ${rejecter?.userName}`);

      this.activeCalls.delete(callId);

      this.io.to(`user_${String(callerId)}`).emit('call:rejected', {
        servicoId,
        callId,
        reason,
        rejectedBy: rejecter?.userId,
        rejectedByName: rejecter?.userName,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('handleCallReject erro:', err);
    }
  }

  /**
   * ✅ Cancelar uma chamada (quem iniciou desiste antes de ser atendida)
   */
  handleCallCancel(socket, incoming) {
    try {
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      const servicoId = data?.servicoId;
      const callId = data?.callId;
      const targetUserId = this.normalizeId(data?.targetUserId);

      console.log(`📵 Chamada cancelada - Call ID: ${callId}`);

      this.activeCalls.delete(callId);

      if (targetUserId !== undefined && targetUserId !== null) {
        this.io.to(`user_${String(targetUserId)}`).emit('call:cancelled', {
          servicoId,
          callId,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('handleCallCancel erro:', err);
    }
  }

  /**
   * ✅ Trocar ICE Candidates (WebRTC)
   */
  handleCallIceCandidate(socket, incoming) {
    try {
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      const servicoId = data?.servicoId;
      const targetUserId = this.normalizeId(data?.targetUserId);
      const candidate = data?.candidate;
      const callId = data?.callId;

      if (targetUserId === undefined || targetUserId === null) return;

      // Encaminhar o ICE candidate para o outro participante
      this.io.to(`user_${String(targetUserId)}`).emit('call:ice-candidate', {
        servicoId,
        candidate,
        callId,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('handleCallIceCandidate erro:', err);
    }
  }

  /**
   * ✅ Finalizar chamada em andamento
   */
  handleCallEnd(socket, incoming) {
    try {
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      const servicoId = data?.servicoId;
      const callId = data?.callId;
      const targetUserId = this.normalizeId(data?.targetUserId);
      const reason = data?.reason || 'ended';

      const enderInfo = this.connectedUsers.get(socket.id);
      console.log(`🔚 Chamada finalizada - Call ID: ${callId}, Por: ${enderInfo?.userName}`);

      const call = this.activeCalls.get(callId);
      let duration = 0;
      if (call && call.answeredAt) {
        duration = Math.floor((new Date() - call.answeredAt) / 1000); // segundos
      }
      this.activeCalls.delete(callId);

      if (targetUserId !== undefined && targetUserId !== null) {
        this.io.to(`user_${String(targetUserId)}`).emit('call:ended', {
          servicoId,
          callId,
          endedBy: enderInfo?.userId,
          reason,
          duration,
          timestamp: new Date()
        });
      }

      this.io.to(`servico_${String(servicoId)}`).emit('call:finished', {
        servicoId,
        callId,
        duration,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('handleCallEnd erro:', err);
    }
  }

  /**
   * ✅ Toggle vídeo/áudio durante chamada
   */
  handleCallToggleMedia(socket, incoming) {
    try {
      let data = incoming;
      if (Array.isArray(data) && data.length > 0) data = data[0];
      if (data && data.data) data = data.data;

      const servicoId = data?.servicoId;
      const targetUserId = this.normalizeId(data?.targetUserId);
      const mediaType = data?.mediaType; // 'video' ou 'audio'
      const enabled = data?.enabled;
      const callId = data?.callId;

      console.log(`🎚️ Toggle ${mediaType} - Enabled: ${enabled}, Call ID: ${callId}`);

      if (targetUserId !== undefined && targetUserId !== null) {
        this.io.to(`user_${String(targetUserId)}`).emit('call:media-toggled', {
          servicoId,
          callId,
          mediaType,
          enabled,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('handleCallToggleMedia erro:', err);
    }
  }

  /**
   * Usuário desconectado
   */
  handleDisconnect(socket) {
    try {
      const userInfo = this.connectedUsers.get(socket.id);

      if (userInfo) {
        console.log(`👋 Usuário desconectado: ${userInfo.userName} (${userInfo.userId})`);
        // Finalizar chamadas ativas do usuário
        this.cleanupUserCalls(userInfo.userId);
        this.connectedUsers.delete(socket.id);
      } else {
        console.log(`👋 Socket desconectado: ${socket.id}`);
      }
    } catch (err) {
      console.error('handleDisconnect erro:', err);
    }
  }

  /**
   * Limpar chamadas de um usuário ao desconectar
   */
  cleanupUserCalls(userIdRaw) {
    try {
      const userId = this.normalizeId(userIdRaw);
      for (const [callId, call] of this.activeCalls.entries()) {
        if (Number(call.callerId) === Number(userId) || Number(call.answererId) === Number(userId)) {
          console.log(`🧹 Limpando chamada ${callId} do usuário desconectado ${userId}`);

          const targetUserId = Number(call.callerId) === Number(userId) ? call.targetUserId : call.callerId;
          if (targetUserId !== undefined && targetUserId !== null) {
            this.io.to(`user_${String(targetUserId)}`).emit('call:ended', {
              servicoId: call.servicoId,
              callId,
              reason: 'user_disconnected',
              timestamp: new Date()
            });
          }
          this.activeCalls.delete(callId);
        }
      }
    } catch (err) {
      console.error('cleanupUserCalls erro:', err);
    }
  }

  // =========================================================================
  // === MÉTODOS PÚBLICOS ===
  // =========================================================================

  /**
   * Emitir nova mensagem (usado pelo controller de chat)
   */
  emitNewMessage(servicoId, mensagemData) {
    this.io.to(`servico_${String(servicoId)}`).emit('new_message', {
      ...mensagemData,
      isFromServer: true,
      timestamp: new Date()
    });
  }

  /**
   * Emitir atualização de status (usado pelo controller de rastreamento)
   */
  emitStatusUpdate(servicoId, statusData) {
    this.io.to(`servico_${String(servicoId)}`).emit('status_updated', {
      ...statusData,
      isFromServer: true,
      timestamp: new Date()
    });
  }

  /**
   * Emitir atualização de localização
   */
  emitLocationUpdate(servicoId, locationData) {
    this.io.to(`servico_${String(servicoId)}`).emit('location_updated', {
      ...locationData,
      isFromServer: true,
      timestamp: new Date()
    });
  }

  /**
   * Verificar se usuário está online
   */
  isUserOnline(userIdRaw) {
    const userId = this.normalizeId(userIdRaw);
    return Array.from(this.connectedUsers.values()).some(
      user => this.normalizeId(user.userId) === this.normalizeId(userId)
    );
  }

  /**
   * Obter sockets de um usuário
   */
  getUserSockets(userIdRaw) {
    const userId = this.normalizeId(userIdRaw);
    return Array.from(this.connectedUsers.entries())
      .filter(([_, user]) => this.normalizeId(user.userId) === this.normalizeId(userId))
      .map(([socketId, _]) => socketId);
  }

  // =========================================================================
  // === MÉTODOS PÚBLICOS WEBRTC ===
  // (mesmos comportamentos, expostos para uso por controllers se necessário)
  // =========================================================================

  isUserInCall(userIdRaw) {
    const userId = this.normalizeId(userIdRaw);
    return Array.from(this.activeCalls.values()).some(call =>
      (this.normalizeId(call.callerId) === userId || this.normalizeId(call.answererId) === userId) && call.status === 'active'
    );
  }

  forceEndCall(servicoId, callId, reason = 'admin_force_end') {
    const call = this.activeCalls.get(callId);
    if (call) {
      console.log(`🛑 Forçando término da chamada ${callId}, Razão: ${reason}`);

      this.io.to(`user_${String(call.callerId)}`).emit('call:ended', {
        servicoId,
        callId,
        reason,
        forced: true,
        timestamp: new Date()
      });

      if (call.answererId) {
        this.io.to(`user_${String(call.answererId)}`).emit('call:ended', {
          servicoId,
          callId,
          reason,
          forced: true,
          timestamp: new Date()
        });
      }

      this.io.to(`servico_${String(servicoId)}`).emit('call:finished', {
        servicoId,
        callId,
        reason,
        forced: true,
        timestamp: new Date()
      });

      this.activeCalls.delete(callId);
      return true;
    }
    return false;
  }

  getCallStats() {
    const calls = Array.from(this.activeCalls.values());
    const activeCalls = calls.filter(call => call.status === 'active');
    const ringingCalls = calls.filter(call => call.status === 'ringing');

    return {
      activeCalls: activeCalls.length,
      ringingCalls: ringingCalls.length,
      totalCalls: calls.length,
      activeCallDetails: activeCalls,
      ringingCallDetails: ringingCalls
    };
  }

  getCallInfo(callId) {
    return this.activeCalls.get(callId);
  }

  getAllActiveCalls() {
    return Array.from(this.activeCalls.values());
  }
}

module.exports = new SocketService();
