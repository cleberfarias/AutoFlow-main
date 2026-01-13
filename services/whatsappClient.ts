/**
 * WhatsApp Client (Frontend)
 * 
 * Cliente para comunicação com o servidor WhatsApp via API REST
 * Este arquivo roda no navegador e se comunica com o backend
 */

// EventEmitter simples para navegador (não usar Node.js 'events')
class SimpleEventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, callback: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

export interface WhatsAppStatus {
  isConnected: boolean;
  isReady: boolean;
  batteryLevel?: number;
  phoneNumber?: string;
  platform?: string;
  sessionState: 'disconnected' | 'connecting' | 'qr' | 'authenticated' | 'ready';
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

class WhatsAppClient extends SimpleEventEmitter {
  private apiUrl = '/api/whatsapp';
  private statusInterval: any = null;
  private messagesInterval: any = null;
  private currentStatus: WhatsAppStatus = {
    isConnected: false,
    isReady: false,
    sessionState: 'disconnected'
  };

  constructor() {
    super();
  }

  /**
   * Inicia monitoramento de status
   */
  startMonitoring(): void {
    // Monitorar status a cada 2 segundos
    this.statusInterval = setInterval(async () => {
      try {
        const status = await this.getStatus();
        
        // Emitir eventos se houver mudanças
        if (status.sessionState !== this.currentStatus.sessionState) {
          this.emit('status_change', status);
          
          if (status.sessionState === 'ready') {
            this.emit('ready');
          } else if (status.sessionState === 'disconnected') {
            this.emit('disconnected');
          }
        }
        
        this.currentStatus = status;
      } catch (error) {
        console.error('Erro ao monitorar status:', error);
      }
    }, 2000);

    // Monitorar mensagens a cada 3 segundos
    this.messagesInterval = setInterval(async () => {
      if (this.currentStatus.isReady) {
        try {
          const messages = await this.getRecentMessages();
          if (messages.length > 0) {
            messages.forEach(msg => this.emit('message', msg));
          }
        } catch (error) {
          console.error('Erro ao buscar mensagens:', error);
        }
      }
    }, 3000);
  }

  /**
   * Para monitoramento
   */
  stopMonitoring(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
    if (this.messagesInterval) {
      clearInterval(this.messagesInterval);
      this.messagesInterval = null;
    }
  }

  /**
   * Conecta ao WhatsApp
   */
  async connect(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/connect`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Falha ao conectar');
    }
  }

  /**
   * Desconecta do WhatsApp
   */
  async disconnect(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/disconnect`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Falha ao desconectar');
    }
  }

  /**
   * Faz logout e remove sessão
   */
  async logout(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/logout`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Falha ao fazer logout');
    }
  }

  /**
   * Busca QR Code atual
   */
  async getQRCode(): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiUrl}/qr`);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.qrCode || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Busca status atual
   */
  async getStatus(): Promise<WhatsAppStatus> {
    const response = await fetch(`${this.apiUrl}/status`);
    
    if (!response.ok) {
      throw new Error('Falha ao buscar status');
    }
    
    return response.json();
  }

  /**
   * Envia mensagem
   */
  async sendMessage(to: string, message: string): Promise<{ id: string; timestamp: number }> {
    const response = await fetch(`${this.apiUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Falha ao enviar mensagem');
    }
    
    return response.json();
  }

  /**
   * Envia mídia
   */
  async sendMedia(
    to: string,
    mediaUrl: string,
    options: { caption?: string; sendMediaAsDocument?: boolean; filename?: string } = {}
  ): Promise<{ id: string; timestamp: number }> {
    const response = await fetch(`${this.apiUrl}/send-media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, mediaUrl, options })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Falha ao enviar mídia');
    }
    
    return response.json();
  }

  /**
   * Busca mensagens recentes
   */
  async getRecentMessages(limit: number = 50): Promise<WhatsAppMessage[]> {
    const response = await fetch(`${this.apiUrl}/messages?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Falha ao buscar mensagens');
    }
    
    const data = await response.json();
    return data.messages || [];
  }

  /**
   * Busca contatos
   */
  async getContacts(): Promise<any[]> {
    const response = await fetch(`${this.apiUrl}/contacts`);
    
    if (!response.ok) {
      throw new Error('Falha ao buscar contatos');
    }
    
    const data = await response.json();
    return data.contacts || [];
  }

  /**
   * Busca grupos
   */
  async getGroups(): Promise<any[]> {
    const response = await fetch(`${this.apiUrl}/groups`);
    
    if (!response.ok) {
      throw new Error('Falha ao buscar grupos');
    }
    
    const data = await response.json();
    return data.groups || [];
  }
}

// Singleton instance
let clientInstance: WhatsAppClient | null = null;

export function getWhatsAppClient(): WhatsAppClient {
  if (!clientInstance) {
    clientInstance = new WhatsAppClient();
  }
  return clientInstance;
}

export default WhatsAppClient;
