# 🔌 Guia: Menu de Contexto MCP

## ✅ Implementado com Sucesso!

A **Opção 3: Menu de Contexto** foi completamente integrada ao seu sistema AutoFlow!

---

## 🎯 Como Usar

### 1️⃣ **Abrir o Menu de Contexto**

No canvas do workflow, **clique com o botão direito** em qualquer área vazia:

```
┌──────────────────────────────────────┐
│                                      │
│         [CANVAS DO WORKFLOW]         │
│                                      │
│              👆 (Botão Direito)     │
│                                      │
│  ┌──────────────────────┐           │
│  │ Adicionar Node       │           │
│  ├──────────────────────┤           │
│  │ ⚡ Gatilho           │           │
│  │ ⚙️  Ação             │           │
│  │ 📊 Dados             │           │
│  │ 🧠 Lógica            │           │
│  ├──────────────────────┤           │
│  │ 🔌 MCP Integration   │ ← NOVO!  │
│  └──────────────────────┘           │
│                                      │
└──────────────────────────────────────┘
```

---

### 2️⃣ **Selecionar "🔌 MCP Integration"**

Ao clicar na opção **MCP Integration**, abrirá um modal com 3 etapas:

#### **Etapa 1: Escolher Serviço**
```
┌─────────────────────────────────────────────┐
│  Selecionar Serviço MCP                     │
├─────────────────────────────────────────────┤
│                                             │
│  💳 Stripe          📧 SendGrid            │
│  📱 Twilio          🎯 HubSpot             │
│  🎫 Zendesk         📅 Google Calendar     │
│  📝 DocuSign        ✍️  Clicksign          │
│  📊 RD Station      💰 Pagar.me            │
│  ⚖️  Advbox          🍃 MongoDB            │
│                                             │
└─────────────────────────────────────────────┘
```

#### **Etapa 2: Escolher Ação**
Exemplo para **Stripe**:
```
┌─────────────────────────────────────────────┐
│  Ações Disponíveis - Stripe                 │
├─────────────────────────────────────────────┤
│                                             │
│  • createCheckout  - Criar Checkout         │
│  • createPaymentIntent - Criar Pagamento    │
│  • createCustomer - Criar Cliente           │
│                                             │
└─────────────────────────────────────────────┘
```

#### **Etapa 3: Configurar Parâmetros**
```
┌─────────────────────────────────────────────┐
│  Configurar Parâmetros                      │
├─────────────────────────────────────────────┤
│                                             │
│  amount: {{total}}                          │
│  currency: BRL                              │
│  customer_email: {{user.email}}             │
│                                             │
│  [Confirmar]                                │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 3️⃣ **Node MCP Criado no Canvas**

O node será criado **exatamente onde você clicou com o botão direito**:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│   ┌─────────────────────────────────┐          │
│   │ 💳  STRIPE                      │          │
│   │ ────────────────────────────    │          │
│   │                                 │          │
│   │ Stripe                          │          │
│   │ Criar Checkout                  │          │
│   │                                 │          │
│   │ [⚙️ Editar]  [🗑️ Deletar]      │          │
│   └─────────────────────────────────┘          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Características do Node MCP:**
- ✅ **Emoji do serviço** (💳 Stripe, 📧 SendGrid, etc.)
- ✅ **Cor específica** do serviço (azul #635BFF para Stripe)
- ✅ **Badge "MCP"** indicando integração
- ✅ **Badge do serviço** (STRIPE, TWILIO, etc.)
- ✅ **Título e descrição** da ação

---

## 🎨 Cores e Emojis por Serviço

| Serviço | Emoji | Cor |
|---------|-------|-----|
| **Stripe** | 💳 | #635BFF (Azul) |
| **SendGrid** | 📧 | #1A82E2 (Azul) |
| **Twilio** | 📱 | #F22F46 (Vermelho) |
| **HubSpot** | 🎯 | #FF7A59 (Laranja) |
| **Zendesk** | 🎫 | #03363D (Verde escuro) |
| **Google Calendar** | 📅 | #4285F4 (Azul Google) |
| **DocuSign** | 📝 | #FFD200 (Amarelo) |
| **Clicksign** | ✍️ | #FF6B00 (Laranja) |
| **RD Station** | 📊 | #F15A24 (Laranja) |
| **Pagar.me** | 💰 | #65A300 (Verde) |
| **Advbox** | ⚖️ | #1E3A8A (Azul escuro) |
| **MongoDB** | 🍃 | #00ED64 (Verde) |

---

## 🚀 Funcionalidades Implementadas

### ✅ **Menu de Contexto**
- Botão direito no canvas abre menu
- Opções para todos os tipos de nodes
- Destaque especial para MCP Integration
- Fecha automaticamente ao clicar fora

### ✅ **Modal MCP Selector**
- 3 etapas intuitivas
- Seleção visual de serviços
- Lista de ações disponíveis por serviço
- Editor de parâmetros JSON

### ✅ **Renderização de Nodes MCP**
- Emojis específicos por serviço
- Cores personalizadas
- Badges informativos
- Visual consistente com o design

### ✅ **Posicionamento Inteligente**
- Node criado onde você clicou
- Snap automático para grid
- Mantém coordenadas do canvas

---

## 💡 Exemplos de Uso

### **Exemplo 1: Criar Checkout Stripe**
1. Botão direito no canvas → **🔌 MCP Integration**
2. Selecionar **💳 Stripe**
3. Escolher **createCheckout**
4. Configurar:
   ```json
   {
     "amount": "{{total}}",
     "currency": "BRL",
     "success_url": "https://seu-site.com/sucesso"
   }
   ```
5. ✅ Node criado no canvas!

### **Exemplo 2: Enviar WhatsApp com Twilio**
1. Botão direito → **🔌 MCP Integration**
2. **📱 Twilio** → **sendWhatsApp**
3. Parâmetros:
   ```json
   {
     "to": "{{user.phone}}",
     "message": "Olá! Sua automação foi ativada."
   }
   ```

### **Exemplo 3: Criar Ticket no Zendesk**
1. Botão direito → **🔌 MCP Integration**
2. **🎫 Zendesk** → **createTicket**
3. Configurar:
   ```json
   {
     "subject": "{{issue.title}}",
     "description": "{{issue.description}}",
     "priority": "high"
   }
   ```

---

## 🔧 Integração com Workflow

### **Conectar Nodes**
Os nodes MCP funcionam como qualquer outro node:

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Gatilho  │ ───> │ MCP Node │ ───> │  Ação    │
│ Webhook  │      │  Stripe  │      │ Notificar│
└──────────┘      └──────────┘      └──────────┘
```

### **Usar Variáveis**
Os nodes MCP suportam interpolação de variáveis:
- `{{user.email}}` - Email do usuário
- `{{total}}` - Total do pedido
- `{{order.id}}` - ID do pedido
- `{{previous.output}}` - Saída do node anterior

---

## 📊 Estrutura do Node MCP

Quando você cria um node MCP, ele é salvo com esta estrutura:

```typescript
{
  id: "mcp-1234567890",
  type: "MCP",
  title: "Stripe",
  description: "Criar Checkout",
  params: {
    mcp: {
      service: "stripe",
      action: "createCheckout",
      params: {
        amount: "{{total}}",
        currency: "BRL",
        success_url: "https://..."
      }
    }
  },
  position: { x: 400, y: 300 }
}
```

---

## 🎓 Dicas de Uso

1. **Planejamento**: Use o botão direito próximo aos nodes existentes para criar fluxos conectados

2. **Variáveis**: Configure variáveis no formato `{{nome}}` para usar dados de nodes anteriores

3. **Testes**: Sempre teste o workflow completo após adicionar nodes MCP

4. **Organização**: Use grupos para organizar nodes MCP relacionados

5. **Documentação**: Adicione descrições claras em cada node MCP

---

## 🐛 Solução de Problemas

### **Menu não abre?**
- Certifique-se de clicar em área vazia do canvas
- Não clique sobre nodes existentes

### **Node não aparece?**
- Verifique se completou todas as 3 etapas do modal
- Confirme que selecionou um serviço e ação

### **Cores não aparecem?**
- Verifique se o nome do serviço está correto
- Cores são aplicadas automaticamente por serviço

---

## 📚 Próximos Passos

Agora que você tem o menu de contexto funcionando, explore:

1. ✅ **Criar workflows completos** com MCPs
2. ✅ **Testar integrações** reais com APIs
3. ✅ **Conectar múltiplos MCPs** em sequência
4. ✅ **Usar variáveis** para passar dados entre nodes
5. ✅ **Exportar workflows** para produção

---

## 🎉 Conclusão

O **Menu de Contexto MCP** está 100% funcional! 

**Benefícios:**
- ⚡ Acesso rápido com botão direito
- 🎯 Criação precisa no local desejado
- 🎨 Visual atraente e informativo
- 🔌 12 serviços disponíveis
- 🚀 Integração perfeita com workflow

**Experimente agora:**
1. Abra qualquer workflow
2. Clique com botão direito no canvas
3. Selecione **🔌 MCP Integration**
4. Crie sua primeira integração!

---

**Desenvolvido com ❤️ para AutoFlow**
