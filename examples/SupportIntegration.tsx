/**
 * Exemplo de Integração do Sistema de Suporte ChatGuru
 * 
 * Este arquivo demonstra como integrar o novo sistema de suporte hierárquico
 * em diferentes partes da sua aplicação.
 */

import React, { useState } from 'react';
import TestChat from './components/TestChat';
import { handleMessage, getSessionStatus, resetConversation } from './src/services/supportRouter';
import { MessageCircle, X } from 'lucide-react';

// ============================================================================
// EXEMPLO 1: Botão Flutuante de Suporte (Widget)
// ============================================================================

export const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all z-50 group"
          aria-label="Abrir suporte"
        >
          <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat de suporte */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border-2 border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white">
            <div>
              <h3 className="font-bold text-lg">Suporte ChatGuru</h3>
              <p className="text-xs opacity-90">Estamos aqui para ajudar!</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Component */}
          <div className="flex-1">
            <TestChat
              steps={[]}
              onClose={() => setIsOpen(false)}
              onStepActive={() => {}}
              mode="support"
            />
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// EXEMPLO 2: Integração Programática (sem UI)
// ============================================================================

export const useSupportChat = (chatId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await handleMessage(chatId, message);
      
      // Você pode processar a resposta aqui
      console.log('Intent:', response.intent);
      console.log('Severity:', response.severity);
      console.log('Reply:', response.replyText);
      
      if (response.checklist.length > 0) {
        console.log('Checklist:', response.checklist);
      }

      if (response.action === 'HANDOFF') {
        console.log('Transferindo para humano:', response.handoffReason);
        // Aqui você pode integrar com sistema de tickets
      }

      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = () => {
    return getSessionStatus(chatId);
  };

  const reset = () => {
    resetConversation(chatId);
  };

  return {
    sendMessage,
    getStatus,
    reset,
    isLoading,
    error
  };
};

// Exemplo de uso do hook:
export const ProgrammaticSupportExample: React.FC = () => {
  const chatId = 'user_123';
  const { sendMessage, getStatus, reset, isLoading } = useSupportChat(chatId);

  const handleQuickQuestion = async () => {
    const response = await sendMessage('Como faço login?');
    alert(response.replyText);
  };

  const showStatus = () => {
    const status = getStatus();
    console.log('Status atual:', status);
  };

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={handleQuickQuestion}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {isLoading ? 'Enviando...' : 'Enviar pergunta rápida'}
      </button>
      
      <button
        onClick={showStatus}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg"
      >
        Ver status da sessão
      </button>

      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Resetar conversa
      </button>
    </div>
  );
};

// ============================================================================
// EXEMPLO 3: Página Dedicada de Suporte
// ============================================================================

export const SupportPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Central de Suporte ChatGuru
            </h1>
            <p className="text-lg text-slate-600">
              Assistência inteligente 24/7 com IA
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sidebar com informações */}
            <div className="lg:col-span-1 space-y-6">
              {/* Status do Sistema */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  Status do Sistema
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">API Status:</span>
                    <span className="font-semibold text-green-600">Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tempo médio:</span>
                    <span className="font-semibold">~800ms</span>
                  </div>
                </div>
              </div>

              {/* FAQs Rápidos */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                <h3 className="font-bold text-lg mb-4">Perguntas Frequentes</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors text-sm">
                    Como fazer login?
                  </button>
                  <button className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors text-sm">
                    WhatsApp não conecta
                  </button>
                  <button className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors text-sm">
                    Problemas com automações
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Principal */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden">
                <TestChat
                  steps={[]}
                  onClose={() => {}}
                  onStepActive={() => {}}
                  mode="support"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXEMPLO 4: Integração no App.tsx Principal
// ============================================================================

// No seu App.tsx, adicione o widget globalmente:
/*
import { SupportWidget } from './examples/SupportIntegration';

function App() {
  return (
    <>
      <YourAppContent />
      
      {/* Widget de suporte sempre visível *\/}
      <SupportWidget />
    </>
  );
}
*/

// ============================================================================
// EXEMPLO 5: Monitoramento e Analytics
// ============================================================================

export const SupportAnalytics: React.FC = () => {
  const [stats, setStats] = React.useState({
    totalSessions: 0,
    averageConfidence: 0,
    topIntents: [] as Array<{ intent: string; count: number }>,
    handoffRate: 0
  });

  React.useEffect(() => {
    // Aqui você implementaria a coleta de métricas
    // Por exemplo, ler todas as sessões do localStorage
    
    // Exemplo mockado:
    setStats({
      totalSessions: 42,
      averageConfidence: 0.87,
      topIntents: [
        { intent: 'WHATSAPP_CONNECT', count: 15 },
        { intent: 'AUTH_LOGIN', count: 12 },
        { intent: 'BILLING', count: 8 }
      ],
      handoffRate: 0.15
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Analytics de Suporte</h2>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <p className="text-sm text-slate-600">Total de Sessões</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalSessions}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <p className="text-sm text-slate-600">Confidence Média</p>
          <p className="text-3xl font-bold text-green-600">
            {(stats.averageConfidence * 100).toFixed(0)}%
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <p className="text-sm text-slate-600">Taxa de Handoff</p>
          <p className="text-3xl font-bold text-amber-600">
            {(stats.handoffRate * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="font-bold text-lg mb-4">Top Intenções</h3>
        <div className="space-y-2">
          {stats.topIntents.map((item, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm font-medium">{item.intent}</span>
              <span className="text-sm text-slate-600">{item.count} sessões</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportWidget;
