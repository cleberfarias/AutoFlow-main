/**
 * WhatsApp Manager Component
 * 
 * Gerencia conexão, autenticação e operações do WhatsApp MEOW
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Power, 
  Send, 
  Users, 
  MessageSquare, 
  Settings,
  AlertCircle,
  CheckCircle,
  Loader,
  QrCode,
  LogOut,
  RefreshCw,
  Image,
  Paperclip,
  Phone
} from 'lucide-react';
import { getWhatsAppClient } from '../services/whatsappClient';
import type { WhatsAppStatus, WhatsAppMessage } from '../services/whatsappClient';
import { i18n } from '../services/i18n';

const t = (key: string, fallback?: string) => i18n.t(key, fallback);

export default function WhatsAppManager() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isConnected: false,
    isReady: false,
    sessionState: 'disconnected'
  });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const whatsappRef = useRef(getWhatsAppClient());

  useEffect(() => {
    const wa = whatsappRef.current;
    
    // Iniciar monitoramento
    wa.startMonitoring();
    
    // Atualizar status periodicamente
    const statusInterval = setInterval(async () => {
      try {
        const newStatus = await wa.getStatus();
        setStatus(newStatus);
      } catch (error) {
        console.error('Erro ao buscar status:', error);
      }
    }, 2000);

    // Buscar QR Code se necessário
    const qrInterval = setInterval(async () => {
      if (status.sessionState === 'qr') {
        try {
          const qr = await wa.getQRCode();
          setQrCode(qr);
        } catch (error) {
          console.error('Erro ao buscar QR:', error);
        }
      }
    }, 3000);

    // Event listeners
    wa.on('status_change', (newStatus: WhatsAppStatus) => {
      addLog(`📊 Status: ${newStatus.sessionState}`);
      setStatus(newStatus);
      
      if (newStatus.sessionState === 'qr') {
        wa.getQRCode().then(qr => setQrCode(qr));
      } else if (newStatus.sessionState === 'ready') {
        setQrCode(null);
      }
    });

    wa.on('ready', () => {
      addLog('✅ WhatsApp conectado e pronto!');
    });

    wa.on('disconnected', () => {
      addLog('🔌 WhatsApp desconectado');
      setQrCode(null);
    });

    wa.on('message', (msg: WhatsAppMessage) => {
      addLog(`📨 Mensagem de ${msg.from}: ${msg.body.substring(0, 30)}...`);
      setMessages(prev => [msg, ...prev].slice(0, 50));
    });

    return () => {
      clearInterval(statusInterval);
      clearInterval(qrInterval);
      wa.stopMonitoring();
      wa.removeAllListeners();
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  };

  const handleConnect = async () => {
    try {
      addLog('🔄 Iniciando conexão...');
      await whatsappRef.current.connect();
    } catch (error: any) {
      addLog(`❌ Erro ao conectar: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      addLog('🔌 Desconectando...');
      await whatsappRef.current.disconnect();
    } catch (error: any) {
      addLog(`❌ Erro ao desconectar: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    if (!confirm(t('whatsapp.confirmLogout', 'Tem certeza? Isso removerá a sessão e você precisará escanear o QR novamente.'))) {
      return;
    }
    
    try {
      addLog('🚪 Fazendo logout...');
      await whatsappRef.current.logout();
    } catch (error: any) {
      addLog(`❌ Erro ao fazer logout: ${error.message}`);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      alert(t('whatsapp.fillPhoneAndMessage', 'Preencha o telefone e a mensagem'));
      return;
    }

    setSending(true);
    try {
      const result = await whatsappRef.current.sendMessage(testPhone, testMessage);
      addLog(`✅ Mensagem enviada para ${testPhone} (ID: ${result.id})`);
      setTestMessage('');
      alert(t('whatsapp.messageSent', 'Mensagem enviada com sucesso!'));
    } catch (error: any) {
      addLog(`❌ Erro ao enviar: ${error.message}`);
      alert(`${t('whatsapp.errorSending', 'Erro ao enviar')}: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status.sessionState) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'qr':
      case 'connecting':
      case 'authenticated':
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusText = () => {
    const texts: Record<string, string> = {
      'ready': t('whatsapp.status.ready', 'Conectado'),
      'qr': t('whatsapp.status.qr', 'Aguardando QR Code'),
      'connecting': t('whatsapp.status.connecting', 'Conectando'),
      'authenticated': t('whatsapp.status.authenticated', 'Autenticado'),
      'disconnected': t('whatsapp.status.disconnected', 'Desconectado')
    };
    return texts[status.sessionState] || status.sessionState;
  };

  const getStatusColor = () => {
    switch (status.sessionState) {
      case 'ready':
        return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
      case 'qr':
      case 'connecting':
      case 'authenticated':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
      case 'disconnected':
        return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {t('whatsapp.title', 'WhatsApp MEOW')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('whatsapp.subtitle', 'Gerenciar conexão e automações WhatsApp')}
          </p>
        </div>
        <Smartphone className="w-12 h-12 text-green-500" />
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {t('whatsapp.connectionStatus', 'Status da Conexão')}
              </h2>
              <p className={`text-sm px-3 py-1 rounded-full border inline-block ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>
          
          {/* Connection Controls */}
          <div className="flex gap-2">
            {status.sessionState === 'disconnected' ? (
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Power className="w-4 h-4" />
                {t('whatsapp.connect', 'Conectar')}
              </button>
            ) : (
              <>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Power className="w-4 h-4" />
                  {t('whatsapp.disconnect', 'Desconectar')}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('whatsapp.logout', 'Logout')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Device Info */}
        {status.isReady && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {t('whatsapp.phoneNumber', 'Número')}
              </p>
              <p className="font-mono text-slate-900 dark:text-white">
                {status.phoneNumber || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {t('whatsapp.platform', 'Plataforma')}
              </p>
              <p className="text-slate-900 dark:text-white">
                {status.platform || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {t('whatsapp.battery', 'Bateria')}
              </p>
              <p className="text-slate-900 dark:text-white">
                {status.batteryLevel ? `${status.batteryLevel}%` : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* QR Code */}
      {qrCode && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('whatsapp.scanQR', 'Escanear QR Code')}
            </h2>
          </div>
          <div className="flex flex-col items-center gap-4">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`}
              alt="WhatsApp QR Code"
              className="w-64 h-64 border-4 border-slate-200 dark:border-slate-600 rounded-lg"
            />
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                {t('whatsapp.qrInstructions', '1. Abra o WhatsApp no celular')}
              </p>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                {t('whatsapp.qrInstructions2', '2. Vá em Configurações > Dispositivos Vinculados')}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {t('whatsapp.qrInstructions3', '3. Escaneie este QR Code')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Message */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Send className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('whatsapp.sendTestMessage', 'Enviar Mensagem de Teste')}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('whatsapp.phoneNumber', 'Número de Telefone')}
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5511999999999"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                disabled={!status.isReady}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('whatsapp.phoneFormat', 'Formato: código do país + DDD + número (sem +)')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('whatsapp.message', 'Mensagem')}
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder={t('whatsapp.messagePlaceholder', 'Digite sua mensagem...')}
                rows={4}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
                disabled={!status.isReady}
              />
            </div>

            <button
              onClick={handleSendTest}
              disabled={!status.isReady || sending}
              className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
            >
              {sending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t('whatsapp.sending', 'Enviando...')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t('whatsapp.send', 'Enviar')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('whatsapp.recentMessages', 'Mensagens Recentes')}
            </h2>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                {t('whatsapp.noMessages', 'Nenhuma mensagem ainda')}
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-900 dark:text-white">
                      {msg.from.split('@')[0]}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(msg.timestamp * 1000).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {msg.body}
                  </p>
                  {msg.isGroup && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded">
                      {t('whatsapp.group', 'Grupo')}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-slate-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('whatsapp.logs', 'Logs de Atividade')}
            </h2>
          </div>
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {t('whatsapp.clearLogs', 'Limpar')}
          </button>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              {t('whatsapp.noLogs', 'Nenhum log ainda')}
            </p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="text-green-400 mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 shadow-lg text-white">
        <h2 className="text-xl font-bold mb-4">
          {t('whatsapp.quickActions', 'Ações Rápidas')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            disabled={!status.isReady}
            className="p-4 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg backdrop-blur transition-all flex flex-col items-center gap-2"
          >
            <Users className="w-6 h-6" />
            <span className="text-sm font-medium">
              {t('whatsapp.viewGroups', 'Ver Grupos')}
            </span>
          </button>
          <button
            disabled={!status.isReady}
            className="p-4 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg backdrop-blur transition-all flex flex-col items-center gap-2"
          >
            <Phone className="w-6 h-6" />
            <span className="text-sm font-medium">
              {t('whatsapp.viewContacts', 'Ver Contatos')}
            </span>
          </button>
          <button
            disabled={!status.isReady}
            className="p-4 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg backdrop-blur transition-all flex flex-col items-center gap-2"
          >
            <Image className="w-6 h-6" />
            <span className="text-sm font-medium">
              {t('whatsapp.sendMedia', 'Enviar Mídia')}
            </span>
          </button>
          <button
            disabled={!status.isReady}
            className="p-4 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg backdrop-blur transition-all flex flex-col items-center gap-2"
          >
            <RefreshCw className="w-6 h-6" />
            <span className="text-sm font-medium">
              {t('whatsapp.syncChats', 'Sincronizar')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
