/**
 * objetivo: Serviço de WebSocket para comunicação em tempo real
 * funcionalidades: Chat, Localização, Status e Chamadas de Voz/Video (WebRTC)
 * data: 25/09/2025  
 * dev: Giovanna
 * versão: 2.0 - Com WebRTC
 */

const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // mapa de usuários conectados
    this.activeCalls = new Map(); // rastreamento de chamadas ativas
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

      // Log para debug (opcional)
      socket.onAny((eventName, ...args) => {
        if (!eventName.includes('call:ice-candidate')) { // Não logar ICE candidates (muito spam)
          console.log(`📨 EVENTO RECEBIDO: ${eventName}`, args);
        }
      });

      // === EVENTOS EXISTENTES ===
      
      // Usuário se conecta e informa seu ID
      socket.on('user_connected', (userData) => {
        this.handleUserConnected(socket, userData);
      });

      // Entrar na sala de um serviço
      socket.on('join_servico', (servicoId) => {
        this.handleJoinServico(socket, servicoId);
      });

      // Sair da sala de um serviço  
      socket.on('leave_servico', (servicoId) => {
        this.handleLeaveServico(socket, servicoId);
      });

      // Nova mensagem no chat
      socket.on('send_message', (data) => {
        this.handleSendMessage(socket, data);
      });

      // Atualização de localização
      socket.on('update_location', (data) => {
        this.handleUpdateLocation(socket, data);
      });

      // Atualização de status
      socket.on('update_status', (data) => {
        this.handleUpdateStatus(socket, data);
      });

      // === NOVOS EVENTOS WEBRTC ===

      // Iniciar uma chamada
      socket.on('call:initiate', (data) => {
        this.handleCallInitiate(socket, data);
      });

      // Aceitar uma chamada
      socket.on('call:accept', (data) => {
        this.handleCallAccept(socket, data);
      });

      // Rejeitar uma chamada
      socket.on('call:reject', (data) => {
        this.handleCallReject(socket, data);
      });

      // Cancelar uma chamada
      socket.on('call:cancel', (data) => {
        this.handleCallCancel(socket, data);
      });

      // Trocar ICE Candidates (WebRTC)
      socket.on('call:ice-candidate', (data) => {
        this.handleCallIceCandidate(socket, data);
      });

      // Finalizar chamada em andamento
      socket.on('call:end', (data) => {
        this.handleCallEnd(socket, data);
      });

      // Toggle vídeo/áudio durante chamada
      socket.on('call:toggle-media', (data) => {
        this.handleCallToggleMedia(socket, data);
      });

      // Desconexão
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Usuário conectado
   */
  handleUserConnected(socket, userData) {
    const { userId, userType, userName } = userData;
    
    this.connectedUsers.set(socket.id, {
      userId,
      userType, 
      userName,
      socketId: socket.id,
      connectedAt: new Date()
    });

    socket.join(`user_${userId}`); // Sala pessoal do usuário
    
    console.log('🔗 EVENTO user_connected recebido:', { userId, userType, userName, socketId: socket.id });
        
    // Confirmar conexão
    socket.emit('connection_established', {
      message: 'Conectado ao servidor de tempo real',
      socketId: socket.id
    });
  }

  /**
   * Entrar na sala de um serviço
   */
  handleJoinServico(socket, servicoId) {
    console.log('🎯 EVENTO join_servico recebido:', { servicoId, socketId: socket.id });
    
    const roomName = `servico_${servicoId}`;
    socket.join(roomName);
    
    const userInfo = this.connectedUsers.get(socket.id);
    console.log(`📱 ${userInfo?.userName} entrou na sala do serviço ${servicoId}`);
    
    socket.emit('joined_servico', {
      servicoId: servicoId,
      message: `Conectado ao serviço ${servicoId}`
    });
  }

  /**
   * Sair da sala de um serviço
   */
  handleLeaveServico(socket, servicoId) {
    const roomName = `servico_${servicoId}`;
    socket.leave(roomName);
    
    const userInfo = this.connectedUsers.get(socket.id);
    console.log(`🚪 ${userInfo?.userName} saiu da sala do serviço ${servicoId}`);
  }

  /**
   * Enviar mensagem no chat
   */
  handleSendMessage(socket, data) {
    const { servicoId, mensagem, sender } = data;
    const userInfo = this.connectedUsers.get(socket.id);

    console.log('💬 EVENTO send_message recebido:', { 
        servicoId, 
        mensagem, 
        sender, 
        socketId: socket.id,
        userInfo 
    });

    // Broadcast para todos na sala do serviço
    this.io.to(`servico_${servicoId}`).emit('new_message', {
      ...data,
      timestamp: new Date(),
      senderInfo: userInfo
    });

    // Notificar o outro participante (se estiver em sala pessoal)
    const targetUserType = sender === 'prestador' ? 'contratante' : 'prestador';
    this.io.to(`user_${data.targetUserId}`).emit('message_notification', {
      servicoId,
      mensagem: mensagem.substring(0, 50) + '...', // Preview
      sender: sender,
      timestamp: new Date()
    });
  }

  /**
   * Atualização de localização em tempo real
   */
  handleUpdateLocation(socket, data) {
    const { servicoId, latitude, longitude, prestadorId } = data;
    const userInfo = this.connectedUsers.get(socket.id);

    console.log(`📍 Atualização de localização - Serviço ${servicoId}: ${latitude}, ${longitude}`);

    // Enviar para o contratante (se estiver na sala)
    this.io.to(`servico_${servicoId}`).emit('location_updated', {
      servicoId,
      latitude,
      longitude,
      prestadorId,
      prestadorName: userInfo?.userName,
      timestamp: new Date()
    });
  }

  /**
   * Atualização de status do serviço
   */
  handleUpdateStatus(socket, data) {
    const { servicoId, status, observacao } = data;

    console.log(`🔄 Atualização de status - Serviço ${servicoId}: ${status}`);

    // Notificar todos na sala do serviço
    this.io.to(`servico_${servicoId}`).emit('status_updated', {
      servicoId,
      status,
      observacao,
      timestamp: new Date()
    });
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
 * ✅ Iniciar uma chamada de voz/vídeo - COM DEBUG
 */
handleCallInitiate(socket, data) {
  console.log('🔍 DEBUG handleCallInitiate - data recebida:', data);
  
  // ✅ CORREÇÃO: Extrair o objeto do array se necessário
  if (Array.isArray(data) && data.length > 0) {
    data = data[0];
  }

  const { servicoId, callerId, callerName, targetUserId, callType = 'video' } = data;
  const callerInfo = this.connectedUsers.get(socket.id);

  console.log(`📞 Chamada ${callType} iniciada - Serviço: ${servicoId}, De: ${callerId}, Para: ${targetUserId}`);

  // ✅ DEBUG: Ver conexões antes de continuar
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

  const callId = `${servicoId}_${callerId}_${Date.now()}`;
  
  // Registrar chamada como pendente
  this.activeCalls.set(callId, {
    callId,
    servicoId,
    callerId,
    targetUserId,
    callType,
    status: 'ringing',
    startedAt: new Date()
  });

  // Notificar o usuário destino
  console.log(`📤 Enviando call:incoming para user_${targetUserId}`);
  this.io.to(`user_${targetUserId}`).emit('call:incoming', {
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
}

/**
 * ✅ Aceitar uma chamada - VERSÃO CORRIGIDA
 */
handleCallAccept(socket, data) {
  console.log('🔍 DEBUG handleCallAccept - data recebida:', data);
  
  // ✅ CORREÇÃO: Extrair do array se necessário
  if (Array.isArray(data) && data.length > 0) {
    data = data[0];
    console.log('🔧 Data extraída do array:', data);
  }

  const { servicoId, callId, callerId, answer } = data;
  const answererInfo = this.connectedUsers.get(socket.id);

  console.log(`✅ Chamada aceita - Call ID: ${callId}, Por: ${answererInfo?.userName || 'N/A'}`);
  console.log('🔍 AnswererInfo:', answererInfo);

  // Atualizar status da chamada
  const call = this.activeCalls.get(callId);
  if (call) {
    call.status = 'active';
    call.answeredAt = new Date();
    call.answererId = answererInfo?.userId;
  }

  // ✅ DEBUG: Verificar se caller existe
  const callerSockets = this.getUserSockets(callerId);
  console.log(`🎯 Sockets do caller ${callerId}:`, callerSockets);

  // Notificar o caller que a chamada foi aceita
  this.io.to(`user_${callerId}`).emit('call:accepted', {
    servicoId,
    callId,
    answererId: answererInfo?.userId,
    answererName: answererInfo?.userName || 'Usuário',
    answer, // SDP answer do WebRTC
    timestamp: new Date()
  });

  // Notificar todos na sala do serviço que começou uma chamada
  this.io.to(`servico_${servicoId}`).emit('call:started', {
    servicoId,
    callId,
    participants: [callerId, answererInfo?.userId],
    timestamp: new Date()
  });

  console.log(`📤 Notificações enviadas - Call accepted para caller ${callerId}`);
}

  /**
   * ✅ Rejeitar uma chamada
   */
  handleCallReject(socket, data) {
    const { servicoId, callId, callerId, reason = 'user_busy' } = data;
    const rejecterInfo = this.connectedUsers.get(socket.id);

    console.log(`❌ Chamada rejeitada - Call ID: ${callId}, Por: ${rejecterInfo?.userName}`);

    // Remover chamada do registro
    this.activeCalls.delete(callId);

    this.io.to(`user_${callerId}`).emit('call:rejected', {
      servicoId,
      callId,
      reason,
      rejectedBy: rejecterInfo?.userId,
      rejectedByName: rejecterInfo?.userName,
      timestamp: new Date()
    });
  }

  /**
   * ✅ Cancelar uma chamada (quem iniciou desiste antes de ser atendida)
   */
  handleCallCancel(socket, data) {
    const { servicoId, callId, targetUserId } = data;

    console.log(`📵 Chamada cancelada - Call ID: ${callId}`);

    // Remover chamada do registro
    this.activeCalls.delete(callId);

    this.io.to(`user_${targetUserId}`).emit('call:cancelled', {
      servicoId,
      callId,
      timestamp: new Date()
    });
  }

  /**
   * ✅ Trocar ICE Candidates (WebRTC)
   */
  handleCallIceCandidate(socket, data) {
    const { servicoId, targetUserId, candidate, callId } = data;

    // Encaminhar o ICE candidate para o outro participante
    this.io.to(`user_${targetUserId}`).emit('call:ice-candidate', {
      servicoId,
      candidate,
      callId,
      timestamp: new Date()
    });
  }

  /**
   * ✅ Finalizar chamada em andamento
   */
  handleCallEnd(socket, data) {
    const { servicoId, callId, targetUserId, reason = 'ended' } = data;
    const enderInfo = this.connectedUsers.get(socket.id);

    console.log(`🔚 Chamada finalizada - Call ID: ${callId}, Por: ${enderInfo?.userName}`);

    // Calcular duração se a chamada estava ativa
    const call = this.activeCalls.get(callId);
    let duration = 0;
    if (call && call.answeredAt) {
      duration = Math.floor((new Date() - call.answeredAt) / 1000); // segundos
    }

    // Remover chamada do registro
    this.activeCalls.delete(callId);

    // Notificar o outro participante
    this.io.to(`user_${targetUserId}`).emit('call:ended', {
      servicoId,
      callId,
      endedBy: enderInfo?.userId,
      reason,
      duration,
      timestamp: new Date()
    });

    // Notificar a sala do serviço que a chamada terminou
    this.io.to(`servico_${servicoId}`).emit('call:finished', {
      servicoId,
      callId,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * ✅ Toggle vídeo/áudio durante chamada
   */
  handleCallToggleMedia(socket, data) {
    const { servicoId, targetUserId, mediaType, enabled, callId } = data;

    console.log(`🎚️ Toggle ${mediaType} - Enabled: ${enabled}, Call ID: ${callId}`);

    this.io.to(`user_${targetUserId}`).emit('call:media-toggled', {
      servicoId,
      callId,
      mediaType, // 'video' ou 'audio'
      enabled,
      timestamp: new Date()
    });
  }

  /**
   * Usuário desconectado
   */
  handleDisconnect(socket) {
    const userInfo = this.connectedUsers.get(socket.id);
    
    if (userInfo) {
      console.log(`👋 Usuário desconectado: ${userInfo.userName} (${userInfo.userId})`);
      
      // Finalizar chamadas ativas do usuário
      this.cleanupUserCalls(userInfo.userId);
      
      this.connectedUsers.delete(socket.id);
    } else {
      console.log(`👋 Socket desconectado: ${socket.id}`);
    }
  }

  /**
   * Limpar chamadas de um usuário ao desconectar
   */
  cleanupUserCalls(userId) {
    for (const [callId, call] of this.activeCalls.entries()) {
      if (call.callerId === userId || call.answererId === userId) {
        console.log(`🧹 Limpando chamada ${callId} do usuário desconectado ${userId}`);
        
        // Notificar o outro participante
        const targetUserId = call.callerId === userId ? call.targetUserId : call.callerId;
        this.io.to(`user_${targetUserId}`).emit('call:ended', {
          servicoId: call.servicoId,
          callId,
          reason: 'user_disconnected',
          timestamp: new Date()
        });
        
        this.activeCalls.delete(callId);
      }
    }
  }

  // =========================================================================
  // === MÉTODOS PÚBLICOS ===
  // =========================================================================

  /**
   * Emitir nova mensagem (usado pelo controller de chat)
   */
  emitNewMessage(servicoId, mensagemData) {
    this.io.to(`servico_${servicoId}`).emit('new_message', {
      ...mensagemData,
      isFromServer: true,
      timestamp: new Date()
    });
  }

  /**
   * Emitir atualização de status (usado pelo controller de rastreamento)
   */
  emitStatusUpdate(servicoId, statusData) {
    this.io.to(`servico_${servicoId}`).emit('status_updated', {
      ...statusData,
      isFromServer: true,
      timestamp: new Date()
    });
  }

  /**
   * Emitir atualização de localização
   */
  emitLocationUpdate(servicoId, locationData) {
    this.io.to(`servico_${servicoId}`).emit('location_updated', {
      ...locationData,
      isFromServer: true,
      timestamp: new Date()
    });
  }

  /**
   * Verificar se usuário está online
   */
  isUserOnline(userId) {
    return Array.from(this.connectedUsers.values()).some(
      user => user.userId === userId
    );
  }

  /**
   * Obter sockets de um usuário
   */
  getUserSockets(userId) {
    return Array.from(this.connectedUsers.entries())
      .filter(([_, user]) => user.userId === userId)
      .map(([socketId, _]) => socketId);
  }

  // =========================================================================
  // === NOVOS MÉTODOS PÚBLICOS WEBRTC ===
  // =========================================================================

  /**
   * Verificar se usuário está em chamada ativa
   */
  isUserInCall(userId) {
    return Array.from(this.activeCalls.values()).some(call => 
      (call.callerId === userId || call.answererId === userId) && call.status === 'active'
    );
  }

  /**
   * Forçar término de chamada (útil para admin/timeout)
   */
  forceEndCall(servicoId, callId, reason = 'admin_force_end') {
    const call = this.activeCalls.get(callId);
    if (call) {
      console.log(`🛑 Forçando término da chamada ${callId}, Razão: ${reason}`);
      
      // Notificar ambos participantes
      this.io.to(`user_${call.callerId}`).emit('call:ended', {
        servicoId,
        callId,
        reason,
        forced: true,
        timestamp: new Date()
      });
      
      if (call.answererId) {
        this.io.to(`user_${call.answererId}`).emit('call:ended', {
          servicoId,
          callId,
          reason,
          forced: true,
          timestamp: new Date()
        });
      }
      
      // Notificar sala do serviço
      this.io.to(`servico_${servicoId}`).emit('call:finished', {
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

  /**
   * Obter estatísticas de chamadas (para dashboard)
   */
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

  /**
   * Obter informações de uma chamada específica
   */
  getCallInfo(callId) {
    return this.activeCalls.get(callId);
  }

  /**
   * Listar todas as chamadas ativas (para debug/admin)
   */
  getAllActiveCalls() {
    return Array.from(this.activeCalls.values());
  }
}

module.exports = new SocketService();