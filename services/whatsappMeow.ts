/**
 * WhatsApp MEOW Integration Service
 * 
 * Baseado em whatsapp-web.js (Multi-Device Evolution Of WhatsApp)
 * Oferece integração completa com WhatsApp Web para automações
 * 
 * Recursos:
 * - Autenticação via QR Code
 * - Envio de mensagens (texto, mídia, localização, contatos)
 * - Gerenciamento de grupos
 * - Webhooks para mensagens recebidas
 * - Status e presença online
 * - Templates de mensagens
 */

import EventEmitter from 'events';

// Types para whatsapp-web.js
export interface WhatsAppConfig {
  sessionName?: string;
  sessionPath?: string;
  puppeteerOptions?: {
    headless?: boolean;
    args?: string[];
    executablePath?: string;
  };
  autoReconnect?: boolean;
  webhookUrl?: string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  isGroup: boolean;
  author?: string;
  type: 'chat' | 'image' | 'video' | 'audio' | 'document' | 'ptt' | 'sticker';
}

export interface WhatsAppContact {
  id: string;
  name: string;
  number: string;
  pushname?: string;
  isMyContact: boolean;
  isBlocked: boolean;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
  participants: Array<{
    id: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }>;
  inviteCode?: string;
}

export interface WhatsAppMediaOptions {
  caption?: string;
  sendMediaAsDocument?: boolean;
  filename?: string;
}

export interface WhatsAppStatus {
  isConnected: boolean;
  isReady: boolean;
  batteryLevel?: number;
  phoneNumber?: string;
  platform?: string;
  sessionState: 'disconnected' | 'connecting' | 'qr' | 'authenticated' | 'ready';
}

export type WhatsAppEventType = 
  | 'qr' 
  | 'ready' 
  | 'authenticated' 
  | 'auth_failure' 
  | 'message' 
  | 'disconnected' 
  | 'message_ack' 
  | 'group_join'
  | 'group_leave';

class WhatsAppMeow extends EventEmitter {
  private config: WhatsAppConfig;
  private client: any = null;
  private status: WhatsAppStatus;
  private messageHandlers: Map<string, (msg: WhatsAppMessage) => void> = new Map();

  constructor(config: WhatsAppConfig = {}) {
    super();
    
    this.config = {
      sessionName: config.sessionName || 'autoflow-wa',
      sessionPath: config.sessionPath || './data/whatsapp-sessions',
      autoReconnect: config.autoReconnect ?? true,
      puppeteerOptions: {
        headless: config.puppeteerOptions?.headless ?? true,
        args: config.puppeteerOptions?.args || [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        executablePath: config.puppeteerOptions?.executablePath
      },
      webhookUrl: config.webhookUrl
    };

    this.status = {
      isConnected: false,
      isReady: false,
      sessionState: 'disconnected'
    };
  }

  /**
   * Inicializa o cliente WhatsApp
   */
  async initialize(): Promise<void> {
    if (this.client) {
      console.log('⚠️ WhatsApp client já inicializado');
      return;
    }

    try {
      // Importação dinâmica para evitar erros em ambientes sem whatsapp-web.js
      const { Client, LocalAuth } = await import('whatsapp-web.js');
      
      this.status.sessionState = 'connecting';
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: this.config.sessionName,
          dataPath: this.config.sessionPath
        }),
        puppeteer: this.config.puppeteerOptions
      });

      this.setupEventHandlers();
      
      await this.client.initialize();
      console.log('✅ WhatsApp client inicializado');
      
    } catch (error: any) {
      console.error('❌ Erro ao inicializar WhatsApp:', error);
      this.status.sessionState = 'disconnected';
      throw new Error(`Falha ao inicializar WhatsApp: ${error.message}`);
    }
  }

  /**
   * Configura handlers de eventos do cliente
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // QR Code para autenticação
    this.client.on('qr', (qr: string) => {
      console.log('📱 QR Code recebido');
      this.status.sessionState = 'qr';
      this.emit('qr', qr);
      
      // Gerar QR terminal se não tiver webhook
      if (!this.config.webhookUrl) {
        import('qrcode-terminal').then(qrcode => {
          qrcode.generate(qr, { small: true });
        });
      }
    });

    // Autenticado com sucesso
    this.client.on('authenticated', () => {
      console.log('✅ WhatsApp autenticado');
      this.status.sessionState = 'authenticated';
      this.emit('authenticated');
    });

    // Falha na autenticação
    this.client.on('auth_failure', (error: any) => {
      console.error('❌ Falha na autenticação WhatsApp:', error);
      this.status.sessionState = 'disconnected';
      this.emit('auth_failure', error);
    });

    // Cliente pronto
    this.client.on('ready', async () => {
      console.log('🚀 WhatsApp client pronto!');
      this.status.isReady = true;
      this.status.isConnected = true;
      this.status.sessionState = 'ready';
      
      // Buscar informações do dispositivo
      try {
        const info = this.client.info;
        this.status.phoneNumber = info.wid.user;
        this.status.platform = info.platform;
        
        // Buscar nível de bateria
        const state = await this.client.getState();
        this.status.batteryLevel = state.battery;
      } catch (error) {
        console.warn('⚠️ Não foi possível buscar informações do dispositivo:', error);
      }
      
      this.emit('ready');
    });

    // Desconectado
    this.client.on('disconnected', (reason: string) => {
      console.log('🔌 WhatsApp desconectado:', reason);
      this.status.isConnected = false;
      this.status.isReady = false;
      this.status.sessionState = 'disconnected';
      this.emit('disconnected', reason);
      
      // Auto-reconectar se habilitado
      if (this.config.autoReconnect) {
        console.log('🔄 Tentando reconectar...');
        setTimeout(() => this.initialize(), 5000);
      }
    });

    // Mensagens recebidas
    this.client.on('message', async (msg: any) => {
      const message = await this.parseMessage(msg);
      
      console.log(`📨 Mensagem recebida de ${message.from}: ${message.body.substring(0, 50)}`);
      
      // Emitir evento
      this.emit('message', message);
      
      // Chamar handlers registrados
      this.messageHandlers.forEach(handler => handler(message));
      
      // Enviar para webhook se configurado
      if (this.config.webhookUrl) {
        this.sendToWebhook(message);
      }
    });

    // Confirmação de mensagem (entregue/lida)
    this.client.on('message_ack', (msg: any, ack: number) => {
      const status = ['error', 'pending', 'server', 'device', 'read', 'played'][ack] || 'unknown';
      this.emit('message_ack', { messageId: msg.id._serialized, status });
    });

    // Entrou em grupo
    this.client.on('group_join', (notification: any) => {
      this.emit('group_join', {
        groupId: notification.chatId,
        participants: notification.recipientIds
      });
    });

    // Saiu de grupo
    this.client.on('group_leave', (notification: any) => {
      this.emit('group_leave', {
        groupId: notification.chatId,
        participants: notification.recipientIds
      });
    });
  }

  /**
   * Parse mensagem do cliente para formato padronizado
   */
  private async parseMessage(msg: any): Promise<WhatsAppMessage> {
    return {
      id: msg.id._serialized,
      from: msg.from,
      to: msg.to,
      body: msg.body || '',
      timestamp: msg.timestamp,
      hasMedia: msg.hasMedia,
      isGroup: msg.from.includes('@g.us'),
      author: msg.author,
      type: msg.type
    };
  }

  /**
   * Envia mensagem para webhook configurado
   */
  private async sendToWebhook(message: WhatsAppMessage): Promise<void> {
    if (!this.config.webhookUrl) return;
    
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'message',
          timestamp: Date.now(),
          data: message
        })
      });
      
      if (!response.ok) {
        console.error('❌ Erro ao enviar para webhook:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Falha ao enviar para webhook:', error);
    }
  }

  /**
   * Registra handler para mensagens recebidas
   */
  onMessage(id: string, handler: (msg: WhatsAppMessage) => void): () => void {
    this.messageHandlers.set(id, handler);
    return () => this.messageHandlers.delete(id);
  }

  /**
   * Envia mensagem de texto
   */
  async sendMessage(to: string, message: string): Promise<{ id: string; timestamp: number }> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      // Formatar número se necessário
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      
      const sent = await this.client.sendMessage(chatId, message);
      
      console.log(`✅ Mensagem enviada para ${to}: ${message.substring(0, 50)}`);
      
      return {
        id: sent.id._serialized,
        timestamp: sent.timestamp
      };
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw new Error(`Falha ao enviar mensagem: ${error.message}`);
    }
  }

  /**
   * Envia mídia (imagem, vídeo, áudio, documento)
   */
  async sendMedia(
    to: string,
    mediaUrl: string,
    options: WhatsAppMediaOptions = {}
  ): Promise<{ id: string; timestamp: number }> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      const { MessageMedia } = await import('whatsapp-web.js');
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      
      // Baixar mídia
      let media: any;
      
      if (mediaUrl.startsWith('http')) {
        // URL remota
        media = await MessageMedia.fromUrl(mediaUrl);
      } else {
        // Arquivo local (base64)
        const [mimetype, data] = mediaUrl.split(';base64,');
        media = new MessageMedia(mimetype.replace('data:', ''), data, options.filename);
      }
      
      const sent = await this.client.sendMessage(chatId, media, {
        caption: options.caption,
        sendMediaAsDocument: options.sendMediaAsDocument
      });
      
      console.log(`✅ Mídia enviada para ${to}`);
      
      return {
        id: sent.id._serialized,
        timestamp: sent.timestamp
      };
    } catch (error: any) {
      console.error('❌ Erro ao enviar mídia:', error);
      throw new Error(`Falha ao enviar mídia: ${error.message}`);
    }
  }

  /**
   * Envia localização
   */
  async sendLocation(
    to: string,
    latitude: number,
    longitude: number,
    description?: string
  ): Promise<{ id: string; timestamp: number }> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      const { Location } = await import('whatsapp-web.js');
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      
      const location = new Location(latitude, longitude, description);
      const sent = await this.client.sendMessage(chatId, location);
      
      console.log(`✅ Localização enviada para ${to}`);
      
      return {
        id: sent.id._serialized,
        timestamp: sent.timestamp
      };
    } catch (error: any) {
      console.error('❌ Erro ao enviar localização:', error);
      throw new Error(`Falha ao enviar localização: ${error.message}`);
    }
  }

  /**
   * Busca contato por número
   */
  async getContact(phoneNumber: string): Promise<WhatsAppContact | null> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      const contactId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
      const contact = await this.client.getContactById(contactId);
      
      return {
        id: contact.id._serialized,
        name: contact.name || contact.pushname || phoneNumber,
        number: contact.number,
        pushname: contact.pushname,
        isMyContact: contact.isMyContact,
        isBlocked: contact.isBlocked
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar contato:', error);
      return null;
    }
  }

  /**
   * Lista todos os contatos
   */
  async getContacts(): Promise<WhatsAppContact[]> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      const contacts = await this.client.getContacts();
      
      return contacts.map((c: any) => ({
        id: c.id._serialized,
        name: c.name || c.pushname || c.number,
        number: c.number,
        pushname: c.pushname,
        isMyContact: c.isMyContact,
        isBlocked: c.isBlocked
      }));
    } catch (error: any) {
      console.error('❌ Erro ao listar contatos:', error);
      return [];
    }
  }

  /**
   * Lista grupos
   */
  async getGroups(): Promise<WhatsAppGroup[]> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      const chats = await this.client.getChats();
      const groups = chats.filter((chat: any) => chat.isGroup);
      
      return groups.map((group: any) => ({
        id: group.id._serialized,
        name: group.name,
        description: group.groupMetadata?.desc || '',
        participants: group.groupMetadata?.participants?.map((p: any) => ({
          id: p.id._serialized,
          isAdmin: p.isAdmin,
          isSuperAdmin: p.isSuperAdmin
        })) || [],
        inviteCode: group.groupMetadata?.inviteCode
      }));
    } catch (error: any) {
      console.error('❌ Erro ao listar grupos:', error);
      return [];
    }
  }

  /**
   * Cria novo grupo
   */
  async createGroup(name: string, participants: string[]): Promise<WhatsAppGroup> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      const participantIds = participants.map(p => p.includes('@') ? p : `${p}@c.us`);
      const group = await this.client.createGroup(name, participantIds);
      
      return {
        id: group.gid._serialized,
        name: name,
        description: '',
        participants: participantIds.map(id => ({
          id,
          isAdmin: false,
          isSuperAdmin: false
        }))
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar grupo:', error);
      throw new Error(`Falha ao criar grupo: ${error.message}`);
    }
  }

  /**
   * Adiciona participantes ao grupo
   */
  async addParticipantsToGroup(groupId: string, participants: string[]): Promise<void> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      const chat = await this.client.getChatById(groupId);
      const participantIds = participants.map(p => p.includes('@') ? p : `${p}@c.us`);
      
      await chat.addParticipants(participantIds);
      console.log(`✅ Participantes adicionados ao grupo ${groupId}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar participantes:', error);
      throw new Error(`Falha ao adicionar participantes: ${error.message}`);
    }
  }

  /**
   * Define status online/offline
   */
  async setPresence(available: boolean): Promise<void> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      await this.client.sendPresenceAvailable(available);
      console.log(`✅ Presença definida: ${available ? 'online' : 'offline'}`);
    } catch (error: any) {
      console.error('❌ Erro ao definir presença:', error);
    }
  }

  /**
   * Marca chat como lido
   */
  async markAsRead(chatId: string): Promise<void> {
    if (!this.client || !this.status.isReady) {
      throw new Error('WhatsApp client não está pronto');
    }

    try {
      const chat = await this.client.getChatById(chatId);
      await chat.sendSeen();
      console.log(`✅ Chat marcado como lido: ${chatId}`);
    } catch (error: any) {
      console.error('❌ Erro ao marcar como lido:', error);
    }
  }

  /**
   * Retorna status atual da conexão
   */
  getStatus(): WhatsAppStatus {
    return { ...this.status };
  }

  /**
   * Desconecta e destrói o cliente
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.destroy();
        console.log('👋 WhatsApp client desconectado');
      } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
      }
      
      this.client = null;
      this.status = {
        isConnected: false,
        isReady: false,
        sessionState: 'disconnected'
      };
    }
  }

  /**
   * Faz logout e remove sessão
   */
  async logout(): Promise<void> {
    if (this.client) {
      try {
        await this.client.logout();
        console.log('🚪 Logout realizado, sessão removida');
      } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
      }
      
      this.client = null;
      this.status = {
        isConnected: false,
        isReady: false,
        sessionState: 'disconnected'
      };
    }
  }
}

// Singleton instance
let whatsappInstance: WhatsAppMeow | null = null;

/**
 * Retorna instância singleton do WhatsApp
 */
export function getWhatsAppInstance(config?: WhatsAppConfig): WhatsAppMeow {
  if (!whatsappInstance) {
    whatsappInstance = new WhatsAppMeow(config);
  }
  return whatsappInstance;
}

/**
 * Reseta instância (útil para testes)
 */
export function resetWhatsAppInstance(): void {
  if (whatsappInstance) {
    whatsappInstance.disconnect();
    whatsappInstance = null;
  }
}

export default WhatsAppMeow;
