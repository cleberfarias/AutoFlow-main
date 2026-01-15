/**
 * Exemplo de Integração MCP no Dashboard/WorkflowEditor
 * 
 * Copie e adapte este código no seu componente de workflow
 */

import React, { useState } from 'react';
import { MCPListPanel } from './MCPNode';
import AddActionModal from '../src/components/Integrations/AddActionModal';
import ActionStepNode from '../src/components/Integrations/ActionStepNode';
import { StepType } from '../types';

/**
 * OPÇÃO 1: Adicionar botão no painel lateral
 * 
 * Adicione este código onde você tem os botões "ATUALIZAR FLUXO" e "+ NOVA ETAPA"
 */

export function WorkflowSidebarWithMCP({ workflow, onUpdateWorkflow }) {
  const [showMCPModal, setShowMCPModal] = useState(false);

  const handleAddMCPNode = (mcpNodeOrConfig: any) => {
    // mcpNodeOrConfig may be a full node (from AddActionModal) or a mcp config
    const newStep = mcpNodeOrConfig.id ? mcpNodeOrConfig : {
      id: `mcp-${Date.now()}`,
      type: StepType.MCP,
      title: `${getMCPLabel(mcpNodeOrConfig.service)} - ${getMCPActionLabel(mcpNodeOrConfig.action)}`,
      description: `Integração ${mcpNodeOrConfig.service}`,
      params: { mcp: mcpNodeOrConfig },
      position: { x: 400, y: 300 + (workflow.steps.length * 100) }
    };

    const updatedWorkflow = { ...workflow, steps: [...workflow.steps, newStep] };
    onUpdateWorkflow(updatedWorkflow);
    setShowMCPModal(false);
  };

  // derive available variables from current workflow steps
  const availableVars = (workflow?.steps || []).map(s => ({ path: `steps.${s.id}.result`, label: `${s.title}` }));

  return (
    <div className="p-4 bg-slate-800 rounded-lg space-y-4">
      {/* Header do Funil */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl">✏️</span>
        </div>
        <div>
          <h2 className="text-white font-bold">FUNIL DE ATENDIMENTO</h2>
          <p className="text-gray-400 text-sm">CLIENTE: PADARIA SABOR REAL</p>
        </div>
      </div>

      {/* Designer de JA */}
      <div>
        <h3 className="text-gray-400 text-xs uppercase mb-2">✨ DESIGNER DE JA</h3>
        <textarea
          placeholder="Descreva a automação..."
          className="w-full p-3 bg-slate-700 text-white rounded border border-slate-600 resize-none"
          rows={3}
        />
      </div>

      {/* Botões de Ação */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 font-semibold">
            🔄 ATUALIZAR FLUXO
          </button>
          <button className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 font-semibold">
            + NOVA ETAPA
          </button>
        </div>

        {/* 👉 NOVO BOTÃO MCP */}
        <button
          onClick={() => setShowMCPModal(true)}
          className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 font-semibold shadow-lg transition-all"
        >
          ➕ Adicionar Ação (Integração)
        </button>

        {/* Botões auxiliares */}
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 text-sm">
            Aplicar exemplo de API
          </button>
          <button className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 text-sm">
            Resetar Erros
          </button>
        </div>
      </div>

      {/* 👉 NOVO PAINEL DE MCPs */}
      <div className="border-t border-slate-700 pt-4">
        <MCPListPanel onAddMCP={() => setShowMCPModal(true)} />
      </div>

      {/* Modal de Seleção MCP */}
      <AddActionModal
        isOpen={showMCPModal}
        onClose={() => setShowMCPModal(false)}
        onAdd={handleAddMCPNode}
        availableVars={availableVars}
      />
    </div>
  );
}

/**
 * OPÇÃO 2: Renderizar nodes MCP no canvas
 * 
 * Adicione esta lógica no componente que renderiza os nodes
 */

export function WorkflowCanvas({ workflow, onEditNode, onDeleteNode }) {
  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* Renderizar todos os steps */}
      {workflow.steps.map((step) => {
        // Se for node MCP, usar componente especial
        if (step.type === StepType.MCP) {
          return (
            <div
              key={step.id}
              style={{
                position: 'absolute',
                left: step.position.x,
                top: step.position.y,
                width: 280
              }}
            >
              <ActionStepNode
                node={step}
                onEdit={onEditNode}
                onDelete={onDeleteNode}
              />
            </div>
          );
        }

        // Renderizar nodes normais (Trigger, Action, Data, Logic)
        return (
          <div
            key={step.id}
            style={{
              position: 'absolute',
              left: step.position.x,
              top: step.position.y
            }}
          >
            <DefaultNodeCard node={step} />
          </div>
        );
      })}

      {/* Conexões entre nodes */}
      {workflow.steps.map((step) =>
        step.nextSteps?.map((nextId) => (
          <Connection
            key={`${step.id}-${nextId}`}
            from={step.id}
            to={nextId}
          />
        ))
      )}
    </div>
  );
}

/**
 * OPÇÃO 3: Menu de contexto no canvas (botão direito)
 */

export function useCanvasContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({ x: 0, y: 0, visible: false });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    });
  };

  const ContextMenu = ({ onAddMCP }: { onAddMCP: () => void }) => {
    if (!contextMenu.visible) return null;

    return (
      <div
        style={{
          position: 'fixed',
          left: contextMenu.x,
          top: contextMenu.y,
          zIndex: 1000
        }}
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
      >
        <div className="p-1">
          <div className="text-xs text-gray-400 px-3 py-2">Adicionar Node</div>
          
          <button className="w-full text-left px-3 py-2 hover:bg-slate-700 text-white text-sm flex items-center gap-2">
            <span>⚡</span> Gatilho
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-slate-700 text-white text-sm flex items-center gap-2">
            <span>⚙️</span> Ação
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-slate-700 text-white text-sm flex items-center gap-2">
            <span>📊</span> Dados
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-slate-700 text-white text-sm flex items-center gap-2">
            <span>🧠</span> Lógica
          </button>

          <div className="border-t border-slate-700 my-1"></div>

          {/* 👉 NOVA OPÇÃO MCP */}
          <button
            onClick={onAddMCP}
            className="w-full text-left px-3 py-2 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 text-white text-sm flex items-center gap-2 font-semibold"
          >
            <span>🔌</span> Adicionar Ação (Integração)
          </button>
        </div>
      </div>
    );
  };

  return { handleContextMenu, ContextMenu };
}

/**
 * OPÇÃO 4: Exemplo completo de uso
 */

export function CompleteWorkflowEditor() {
  const [workflow, setWorkflow] = useState({
    id: '1',
    name: 'Funil de Atendimento',
    steps: [],
    lastModified: Date.now()
  });

  const [showMCPModal, setShowMCPModal] = useState(false);
  const { handleContextMenu, ContextMenu } = useCanvasContextMenu();

  const handleAddMCPNode = (mcpConfig: any) => {
    const newStep = {
      id: `mcp-${Date.now()}`,
      type: StepType.MCP,
      title: `${mcpConfig.service} - ${mcpConfig.action}`,
      description: 'MCP Integration',
      params: { mcp: mcpConfig },
      position: { x: 400, y: 300 }
    };

    setWorkflow({
      ...workflow,
      steps: [...workflow.steps, newStep]
    });
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="w-96 border-r border-slate-700 overflow-y-auto">
        <WorkflowSidebarWithMCP
          workflow={workflow}
          onUpdateWorkflow={setWorkflow}
        />
      </div>

      {/* Canvas */}
      <div
        className="flex-1 relative"
        onContextMenu={handleContextMenu}
        onClick={() => setContextMenu({ ...contextMenu, visible: false })}
      >
        <WorkflowCanvas
          workflow={workflow}
          onEditNode={(id) => console.log('Edit', id)}
          onDeleteNode={(id) => {
            setWorkflow({
              ...workflow,
              steps: workflow.steps.filter(s => s.id !== id)
            });
          }}
        />

        {/* Menu de contexto */}
        <ContextMenu onAddMCP={() => setShowMCPModal(true)} />

        {/* Barra inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <button className="px-6 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 font-semibold">
              ▶ SIMULAR FLUXO
            </button>
            <div className="flex gap-2 text-gray-400">
              <button className="p-2 hover:bg-slate-700 rounded">🔍</button>
              <button className="p-2 hover:bg-slate-700 rounded">🔎</button>
              <button className="p-2 hover:bg-slate-700 rounded">↻</button>
              <button className="p-2 hover:bg-slate-700 rounded">👁️</button>
              <button className="p-2 hover:bg-slate-700 rounded">⊞</button>
              <button className="p-2 hover:bg-slate-700 rounded">⬇</button>
            </div>
            <div className="flex gap-2 text-sm text-gray-400">
              <button className="hover:text-white">Patch Genérico</button>
              <button className="hover:text-white">Export ChatGuru</button>
              <button className="hover:text-white">Export chat-ia</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal MCP */}
      <AddActionModal
        isOpen={showMCPModal}
        onClose={() => setShowMCPModal(false)}
        onAdd={handleAddMCPNode}
      />
    </div>
  );
}

// Funções auxiliares
function getMCPLabel(service: string): string {
  const labels: Record<string, string> = {
    stripe: 'Stripe',
    sendgrid: 'SendGrid',
    twilio: 'Twilio',
    hubspot: 'HubSpot',
    zendesk: 'Zendesk',
    'google-calendar': 'Google Calendar',
    docusign: 'DocuSign',
    clicksign: 'Clicksign',
    rdstation: 'RD Station',
    pagarme: 'Pagar.me',
    advbox: 'Advbox',
    mongodb: 'MongoDB'
  };
  return labels[service] || service;
}

function getMCPActionLabel(action: string): string {
  // Mapear ações para labels amigáveis
  const labels: Record<string, string> = {
    createCheckout: 'Criar Checkout',
    sendEmail: 'Enviar Email',
    sendSMS: 'Enviar SMS',
    createContact: 'Criar Contato',
    createTicket: 'Criar Ticket'
  };
  return labels[action] || action;
}

// Componente auxiliar para renderizar nodes padrão
function DefaultNodeCard({ node }: { node: any }) {
  const colors = {
    TRIGGER: 'from-green-600 to-green-400',
    ACTION: 'from-blue-600 to-blue-400',
    DATA: 'from-purple-600 to-purple-400',
    LOGIC: 'from-orange-600 to-orange-400'
  };

  return (
    <div className="w-64 bg-slate-800 rounded-lg border-2 border-slate-600 p-3">
      <div className={`bg-gradient-to-r ${colors[node.type]} text-white text-xs uppercase px-2 py-1 rounded mb-2`}>
        {node.type}
      </div>
      <div className="text-white font-semibold text-sm">{node.title}</div>
      <div className="text-gray-400 text-xs mt-1">{node.description}</div>
    </div>
  );
}

// Componente de conexão entre nodes
function Connection({ from, to }: { from: string; to: string }) {
  // Implementar SVG line entre nodes
  return <svg className="absolute inset-0 pointer-events-none">{/* ... */}</svg>;
}
