/**
 * MCPNodeCard - Card visual para nodes de MCP no workflow
 * 
 * Renderiza um node específico de integração MCP com ícone e configuração
 */

import React, { useState } from 'react';

interface MCPNodeCardProps {
  node: {
    id: string;
    type: string;
    title: string;
    description: string;
    params: {
      mcp?: {
        service: string;
        action: string;
        params: Record<string, any>;
      };
    };
  };
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}

// Ícones e cores por serviço
const MCP_CONFIG = {
  stripe: { icon: '💳', color: '#635BFF', label: 'Stripe' },
  sendgrid: { icon: '📧', color: '#1A82E2', label: 'SendGrid' },
  twilio: { icon: '📱', color: '#F22F46', label: 'Twilio' },
  hubspot: { icon: '🧲', color: '#FF7A59', label: 'HubSpot' },
  zendesk: { icon: '🎫', color: '#03363D', label: 'Zendesk' },
  'google-calendar': { icon: '🗓️', color: '#4285F4', label: 'Google Calendar' },
  docusign: { icon: '📝', color: '#FF4F00', label: 'DocuSign' },
  clicksign: { icon: '✍️', color: '#00B5D1', label: 'Clicksign' },
  rdstation: { icon: '📊', color: '#00A868', label: 'RD Station' },
  pagarme: { icon: '💰', color: '#66CC66', label: 'Pagar.me' },
  advbox: { icon: '⚖️', color: '#1B4F72', label: 'Advbox' },
  mongodb: { icon: '🍃', color: '#00ED64', label: 'MongoDB' }
};

// Ações disponíveis por serviço
const MCP_ACTIONS: Record<string, Array<{ value: string; label: string }>> = {
  stripe: [
    { value: 'createCheckout', label: 'Criar Checkout' },
    { value: 'getSubscriptions', label: 'Listar Assinaturas' },
    { value: 'createPayment', label: 'Criar Pagamento' }
  ],
  sendgrid: [
    { value: 'sendEmail', label: 'Enviar Email' },
    { value: 'sendTemplate', label: 'Enviar Template' }
  ],
  twilio: [
    { value: 'sendSMS', label: 'Enviar SMS' },
    { value: 'sendWhatsApp', label: 'Enviar WhatsApp' },
    { value: 'sendOTP', label: 'Enviar Código OTP' },
    { value: 'verifyOTP', label: 'Verificar Código OTP' }
  ],
  hubspot: [
    { value: 'createContact', label: 'Criar Contato' },
    { value: 'createDeal', label: 'Criar Negócio' }
  ],
  zendesk: [
    { value: 'createTicket', label: 'Criar Ticket' },
    { value: 'addComment', label: 'Adicionar Comentário' }
  ],
  'google-calendar': [
    { value: 'createMeeting', label: 'Criar Reunião' },
    { value: 'checkAvailability', label: 'Verificar Disponibilidade' }
  ],
  docusign: [
    { value: 'sendDocument', label: 'Enviar para Assinatura' }
  ],
  clicksign: [
    { value: 'uploadDocument', label: 'Enviar Documento' },
    { value: 'addSigner', label: 'Adicionar Signatário' }
  ],
  rdstation: [
    { value: 'createContact', label: 'Criar/Atualizar Contato' },
    { value: 'sendConversion', label: 'Enviar Conversão' }
  ],
  pagarme: [
    { value: 'createPix', label: 'Criar Pagamento PIX' },
    { value: 'createBoleto', label: 'Criar Boleto' },
    { value: 'createCreditCard', label: 'Pagamento Cartão' }
  ],
  advbox: [
    { value: 'listProcesses', label: 'Listar Processos' },
    { value: 'getProcess', label: 'Buscar Processo' }
  ],
  mongodb: [
    { value: 'createCluster', label: 'Criar Cluster' },
    { value: 'listClusters', label: 'Listar Clusters' }
  ]
};

export function MCPNodeCard({ node, onEdit, onDelete }: MCPNodeCardProps) {
  const mcpService = node.params.mcp?.service || 'stripe';
  const mcpAction = node.params.mcp?.action || '';
  const config = MCP_CONFIG[mcpService] || MCP_CONFIG.stripe;

  return (
    <div
      className="relative bg-gray-800 rounded-lg shadow-lg border-2 hover:border-blue-400 transition-all"
      style={{ borderColor: config.color }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 rounded-t-lg"
        style={{ backgroundColor: config.color + '20' }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full text-2xl"
          style={{ backgroundColor: config.color }}
        >
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase font-semibold">MCP</div>
          <div className="text-sm font-bold text-white">{config.label}</div>
        </div>
        <button
          onClick={() => onEdit?.(node.id)}
          className="p-1 hover:bg-gray-700 rounded"
          title="Editar"
        >
          ⚙️
        </button>
        <button
          onClick={() => onDelete?.(node.id)}
          className="p-1 hover:bg-red-600 rounded"
          title="Excluir"
        >
          🗑️
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="text-sm font-semibold text-white">{node.title}</div>
        <div className="text-xs text-gray-400">{node.description}</div>

        {/* Ação selecionada */}
        {mcpAction && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-gray-700 rounded">
            <span className="text-xs text-gray-400">Ação:</span>
            <span className="text-xs text-white font-mono">{mcpAction}</span>
          </div>
        )}

        {/* Parâmetros */}
        {node.params.mcp?.params && Object.keys(node.params.mcp.params).length > 0 && (
          <div className="mt-2 p-2 bg-gray-700 rounded">
            <div className="text-xs text-gray-400 mb-1">Parâmetros:</div>
            <div className="space-y-1">
              {Object.entries(node.params.mcp.params).slice(0, 3).map(([key, value]) => (
                <div key={key} className="text-xs text-gray-300">
                  <span className="text-gray-500">{key}:</span> {String(value).substring(0, 20)}
                  {String(value).length > 20 && '...'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entrada/Saída */}
      <div className="flex justify-between px-3 pb-3">
        <div className="w-3 h-3 bg-green-500 rounded-full" title="Entrada"></div>
        <div className="w-3 h-3 bg-blue-500 rounded-full" title="Saída"></div>
      </div>
    </div>
  );
}

/**
 * MCPSelectorModal - Modal para selecionar e configurar MCP
 */
interface MCPSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mcpConfig: {
    service: string;
    action: string;
    params: Record<string, any>;
  }) => void;
}

export function MCPSelectorModal({ isOpen, onClose, onSelect }: MCPSelectorModalProps) {
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [params, setParams] = useState<Record<string, any>>({});

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedService || !selectedAction) {
      alert('Selecione um serviço e uma ação');
      return;
    }

    onSelect({
      service: selectedService,
      action: selectedAction,
      params
    });

    // Reset
    setSelectedService('');
    setSelectedAction('');
    setParams({});
    onClose();
  };

  const availableActions = selectedService ? MCP_ACTIONS[selectedService] || [] : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">🔌 Adicionar Integração MCP</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Seleção de Serviço */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              1. Selecione o Serviço
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(MCP_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedService(key);
                    setSelectedAction('');
                    setParams({});
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    selectedService === key
                      ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <span className="text-2xl">{config.icon}</span>
                  <span className="text-xs text-white font-semibold">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de Ação */}
          {selectedService && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                2. Selecione a Ação
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="">-- Escolha uma ação --</option>
                {availableActions.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Configuração de Parâmetros */}
          {selectedAction && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                3. Configure os Parâmetros
              </label>
              <div className="bg-gray-700 rounded p-3 space-y-2">
                <div className="text-xs text-gray-400">
                  Os parâmetros serão configurados de acordo com a ação selecionada.
                </div>
                <textarea
                  placeholder='{"param1": "value1", "param2": "value2"}'
                  value={JSON.stringify(params, null, 2)}
                  onChange={(e) => {
                    try {
                      setParams(JSON.parse(e.target.value));
                    } catch {
                      // Ignore parse errors while typing
                    }
                  }}
                  className="w-full h-32 p-2 bg-gray-800 text-white font-mono text-xs rounded border border-gray-600"
                />
                <div className="text-xs text-gray-500">
                  Use variáveis do workflow: {'{{'} variavel {'}}'} 
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedService || !selectedAction}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar MCP
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MCPListPanel - Painel lateral com lista de MCPs disponíveis
 */
export function MCPListPanel({ onAddMCP }: { onAddMCP: () => void }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">🔌 Integrações MCP</h3>
        <button
          onClick={onAddMCP}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500"
        >
          + Adicionar
        </button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {Object.entries(MCP_CONFIG).map(([key, config]) => {
          const actions = MCP_ACTIONS[key] || [];
          return (
            <div
              key={key}
              className="p-2 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer"
              onClick={onAddMCP}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{config.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-white">{config.label}</div>
                  <div className="text-xs text-gray-400">{actions.length} ações</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { MCP_CONFIG, MCP_ACTIONS };
