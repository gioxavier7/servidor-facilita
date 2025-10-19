/**
 * objetivo: Serviço de WebSocket para comunicação em tempo real
 * data: 25/09/2025  
 * dev: Giovanna
 * versão: 1.0
 */

const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // mapa de usuários conectados
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
    console.log('🔌 WebSocket Server inicializado');
  }

  /**
   * Configura os handlers de eventos
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
    console.log('👤 Nova conexão Socket:', socket.id);

    socket.onAny((eventName, ...args) => {
      console.log(`📨 EVENTO RECEBIDO: ${eventName}`, args);
    });

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
  
    this.connectedUsers.set(socket.id, {
        userId,
        userType, 
        userName,
        socketId: socket.id,
        connectedAt: new Date()
    });
        
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

  /**
   * Usuário desconectado
   */
  handleDisconnect(socket) {
    const userInfo = this.connectedUsers.get(socket.id);
    
    if (userInfo) {
      console.log(`👋 Usuário desconectado: ${userInfo.userName} (${userInfo.userId})`);
      this.connectedUsers.delete(socket.id);
    } else {
      console.log(`👋 Socket desconectado: ${socket.id}`);
    }
  }

  /**
   * Métodos públicos para uso em controllers
   */

  // Emitir nova mensagem (usado pelo controller de chat)
  emitNewMessage(servicoId, mensagemData) {
    this.io.to(`servico_${servicoId}`).emit('new_message', {
      ...mensagemData,
      isFromServer: true,
      timestamp: new Date()
    });
  }

  // Emitir atualização de status (usado pelo controller de rastreamento)
  emitStatusUpdate(servicoId, statusData) {
    this.io.to(`servico_${servicoId}`).emit('status_updated', {
      ...statusData,
      isFromServer: true,
      timestamp: new Date()
    });
  }

  // Emitir atualização de localização
  emitLocationUpdate(servicoId, locationData) {
    this.io.to(`servico_${servicoId}`).emit('location_updated', {
      ...locationData,
      isFromServer: true,
      timestamp: new Date()
    });
  }

  // Verificar se usuário está online
  isUserOnline(userId) {
    return Array.from(this.connectedUsers.values()).some(
      user => user.userId === userId
    );
  }

  // Obter sockets de um usuário
  getUserSockets(userId) {
    return Array.from(this.connectedUsers.entries())
      .filter(([_, user]) => user.userId === userId)
      .map(([socketId, _]) => socketId);
  }
}

module.exports = new SocketService();