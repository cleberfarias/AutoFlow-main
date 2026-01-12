# 🎨 Como Adicionar MCPs na Interface do Workflow

## 📍 3 Locais para Incluir MCPs na Tela

### **Opção 1: Botão "+ MCP" no Painel Lateral** ⭐ RECOMENDADO

```
┌─────────────────────────────────────┐
│ ← PAINEL                            │
│                                     │
│ 🎯 FUNIL DE ATENDIMENTO            │
│ CLIENTE: PADARIA SABOR REAL        │
│                                     │
│ ✨ DESIGNER DE JA                  │
│ ┌─────────────────────────────┐   │
│ │ Descreva a automação...     │   │
│ └─────────────────────────────┘   │
│                                     │
│ [🔄 ATUALIZAR FLUXO] [+ NOVA ETAPA]│
│                                     │
│ 👉 [🔌 + MCP INTEGRATION]  ← AQUI! │ ← Adicionar botão aqui
│                                     │
│ [Aplicar exemplo de API]           │
│ [Resetar Erros]                    │
└─────────────────────────────────────┘
```

### **Opção 2: Painel de MCPs Disponíveis** 

Adicionar seção abaixo dos botões:

```
┌─────────────────────────────────────┐
│ [🔄 ATUALIZAR FLUXO] [+ NOVA ETAPA]│
│ [🔌 + MCP]                          │
│                                     │
│ 🔌 INTEGRAÇÕES MCP       [+ ADD]   │ ← Nova seção
│ ┌─────────────────────────────┐   │
│ │ 💳 Stripe (3 ações)         │   │
│ │ 📧 SendGrid (2 ações)       │   │
│ │ 📱 Twilio (4 ações)         │   │
│ │ 🧲 HubSpot (2 ações)        │   │
│ │ 🎫 Zendesk (2 ações)        │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### **Opção 3: Menu Dropdown no Canvas**

Ao clicar com botão direito no canvas:

```
Canvas (área do workflow)
    │
    ├─ [Clique direito no canvas]
    │
    └─> Dropdown Menu:
         ┌─────────────────────┐
         │ + Novo Node         │
         │ ────────────────    │
         │ ⚡ Gatilho         │
         │ ⚙️  Ação           │
         │ 📊 Dados           │
         │ 🧠 Lógica          │
         │ ────────────────    │
         │ 🔌 MCP Integration │ ← Nova opção
         └─────────────────────┘
```

---

## 💻 Código para Implementar

### 1. Adicionar Botão "+ MCP" (MAIS FÁCIL)

Adicione no arquivo do painel lateral (provavelmente `Dashboard.tsx` ou similar):

```tsx
import { useState } from 'react';
import { MCPSelectorModal } from './components/MCPNode';

function WorkflowDesigner() {
  const [showMCPModal, setShowMCPModal] = useState(false);

  const handleAddMCP = (mcpConfig) => {
    // Criar novo node no workflow
    const newNode = {
      id: `mcp-${Date.now()}`,
      type: 'MCP',
      title: `${mcpConfig.service} - ${mcpConfig.action}`,
      description: 'Integração MCP',
      params: { mcp: mcpConfig },
      position: { x: 400, y: 300 }
    };
    
    // Adicionar ao workflow (adapte para seu estado)
    addStepToWorkflow(newNode);
  };

  return (
    <div>
      {/* Seus botões existentes */}
      <button>🔄 ATUALIZAR FLUXO</button>
      <button>+ NOVA ETAPA</button>
      
      {/* NOVO BOTÃO MCP */}
      <button
        onClick={() => setShowMCPModal(true)}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
      >
        🔌 + MCP Integration
      </button>

      {/* Modal de seleção */}
      <MCPSelectorModal
        isOpen={showMCPModal}
        onClose={() => setShowMCPModal(false)}
        onSelect={handleAddMCP}
      />
    </div>
  );
}
```

### 2. Adicionar Painel Lateral de MCPs

```tsx
import { MCPListPanel } from './components/MCPNode';

function Sidebar() {
  return (
    <div className="sidebar">
      {/* Conteúdo existente */}
      
      {/* NOVO PAINEL */}
      <MCPListPanel onAddMCP={() => setShowMCPModal(true)} />
    </div>
  );
}
```

### 3. Renderizar Node MCP no Canvas

No arquivo que renderiza os nodes (ex: `NodeCard.tsx`):

```tsx
import { MCPNodeCard } from './components/MCPNode';

function NodeCard({ node }) {
  // Se for node MCP, usar componente especial
  if (node.type === 'MCP') {
    return (
      <MCPNodeCard
        node={node}
        onEdit={(id) => handleEditNode(id)}
        onDelete={(id) => handleDeleteNode(id)}
      />
    );
  }

  // Renderização normal para outros tipos
  return <DefaultNodeCard node={node} />;
}
```

---

## 🎯 Fluxo de Uso

```
1. Usuário clica em [🔌 + MCP]
           ↓
2. Abre modal com:
   - Lista de 12 serviços (Stripe, Twilio, etc)
   - Seleção de ação (enviar SMS, criar checkout, etc)
   - Configuração de parâmetros
           ↓
3. Ao confirmar, cria node visual no canvas
           ↓
4. Node MCP aparece colorido com ícone do serviço
           ↓
5. Usuário conecta com outros nodes
           ↓
6. Ao executar workflow, ação MCP é chamada
```

---

## 📦 Componentes Criados

✅ **MCPNodeCard** - Card visual do node MCP no canvas
✅ **MCPSelectorModal** - Modal para escolher serviço e ação
✅ **MCPListPanel** - Painel lateral com lista de MCPs

---

## 🎨 Visual dos Nodes MCP

Cada serviço tem cor e ícone único:

```
┌─────────────────────────────────┐
│ 💳  Stripe          [⚙️] [🗑️]  │ ← Header azul (#635BFF)
├─────────────────────────────────┤
│ Criar Checkout                  │
│ Processar pagamento com Stripe  │
│                                 │
│ Ação: createCheckout           │
│                                 │
│ Parâmetros:                     │
│  priceId: price_123            │
│  customerEmail: user@...        │
│                                 │
│ 🟢 ──────────────────────── 🔵 │ ← Conectores
└─────────────────────────────────┘
```

---

## 🚀 Próximos Passos

1. **Copie o componente MCPNode.tsx** para sua pasta `components/`
2. **Adicione o botão** no painel lateral
3. **Teste o modal** de seleção
4. **Conecte com seu sistema** de workflow
5. **Execute uma ação** MCP de teste

---

## 💡 Dica Pro

Para melhor UX, adicione **templates pré-configurados**:

```tsx
const MCP_TEMPLATES = [
  {
    name: 'Enviar Email de Boas-Vindas',
    service: 'sendgrid',
    action: 'sendTemplate',
    params: {
      templateId: 'd-welcome',
      to: '{{user.email}}',
      dynamicData: { name: '{{user.name}}' }
    }
  },
  {
    name: 'Criar Contato no HubSpot',
    service: 'hubspot',
    action: 'createContact',
    params: {
      email: '{{user.email}}',
      firstname: '{{user.firstName}}'
    }
  }
];
```

Então adicione botão "📋 Templates" que pré-configura o MCP!

---

**Desenvolvido com ❤️ para AutoFlow**
