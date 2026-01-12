# 🎯 ONDE ESTÁ O MENU MCP? Guia Passo a Passo

## 📍 LOCALIZAÇÃO EXATA

Na tela que você me mostrou, veja onde clicar:

```
┌────────────────────────────────────────────────────────────────┐
│  PAINEL                    CANVAS (ÁREA ESCURA)                │
│  ┌──────────┐             ┌─────────────────────────────────┐ │
│  │ FUNIL    │             │  ⚫ ⚫ ⚫ (pontos no fundo)       │ │
│  │          │             │                                  │ │
│  │ DESIGNER │             │    [Node] → [Node] → [Node]     │ │
│  │ DE IA    │             │                                  │ │
│  │          │             │                                  │ │
│  │ ATUALIZAR│             │    👈 CLIQUE AQUI COM           │ │
│  │ FLUXO    │             │       BOTÃO DIREITO!            │ │
│  │          │             │       (área vazia, não no node) │ │
│  │ + NOVA   │             │                                  │ │
│  │ ETAPA    │             │                                  │ │
│  └──────────┘             └─────────────────────────────────┘ │
│                           SIMULAR FLUXO [🔍🔎↻👁️⊞⬇]         │
└────────────────────────────────────────────────────────────────┘
```

## ✅ PASSO A PASSO (COM IMAGENS)

### 1️⃣ Abra um Workflow
- Você já está em um workflow (vi na sua screenshot)
- Nome: "FUNIL DE ATENDIMENTO - PADARIA SABOR REAL"

### 2️⃣ Encontre a Área do Canvas
**É a parte escura com pontinhos** onde os nodes estão conectados!

### 3️⃣ Clique com BOTÃO DIREITO
❌ **NÃO clique em cima de um node existente**
✅ **SIM - Clique em qualquer espaço vazio** (área escura)

### 4️⃣ O Menu Aparece!
```
┌──────────────────────┐
│ Adicionar Node       │
├──────────────────────┤
│ ⚡ Gatilho           │
│ ⚙️  Ação             │
│ 📊 Dados             │
│ 🧠 Lógica            │
├──────────────────────┤
│ 🔌 MCP Integration   │ ← CLIQUE AQUI!
└──────────────────────┘
```

### 5️⃣ Modal MCP Abre
Você verá 12 serviços para escolher:
- 💳 Stripe
- 📧 SendGrid
- 📱 Twilio
- E mais 9...

## 🔍 COMO TESTAR AGORA

### Opção A: Teste Rápido no seu Navegador

1. Abra: http://localhost:3001
2. Entre no workflow "FUNIL DE ATENDIMENTO"
3. **Clique com botão direito no canvas** (área escura)
4. Menu aparece instantaneamente!

### Opção B: Teste no Console do Navegador

1. Pressione **F12** (abre DevTools)
2. Vá na aba **Console**
3. Digite:
   ```javascript
   // Verificar se o menu está configurado
   console.log('Context menu enabled');
   ```
4. Clique com botão direito no canvas
5. Se aparecer algum erro, me mostre!

## 🐛 SE NÃO APARECER

### Checklist:

1. ✅ **Você está dentro de um workflow?**
   - Precisa ter aberto um workflow (não na dashboard)

2. ✅ **Clicou no lugar certo?**
   - Área ESCURA com pontinhos
   - NÃO em cima de node
   - NÃO no painel lateral esquerdo

3. ✅ **Botão direito funcionou?**
   - Tente pressionar mais forte
   - Ou use: Shift + F10 (atalho)

4. ✅ **Código carregou?**
   - Veja no terminal se tem erro
   - Refresh da página: Ctrl + F5

## 🎬 DEMONSTRAÇÃO VISUAL

### ANTES (sem menu):
```
[Canvas escuro com nodes conectados]
     ⚫ ⚫ ⚫ ⚫ ⚫
     
   [Node] → [Node]
```

### DURANTE (clicando):
```
[Canvas escuro com nodes conectados]
     ⚫ ⚫ ⚫ ⚫ ⚫
           👆 (botão direito)
   [Node] → [Node]
```

### DEPOIS (menu aparece):
```
[Canvas escuro com nodes conectados]
     ⚫ ⚫ ⚫ 
     ┌──────────────────┐
   [N│ Adicionar Node   │→ [Node]
     ├──────────────────┤
     │ ⚡ Gatilho       │
     │ ⚙️  Ação         │
     │ 📊 Dados         │
     │ 🧠 Lógica        │
     ├──────────────────┤
     │ 🔌 MCP Integration│
     └──────────────────┘
```

## 💡 DICAS EXTRAS

### Atalho de Teclado
Se o botão direito não funcionar, tente:
- **Shift + F10** (abre menu de contexto)
- Ou configure um atalho custom

### Localização Alternativa
Na sua screenshot, clique em qualquer lugar nesta área:

```
┌─────────────────────────────────────────────┐
│                                             │
│  (ESPAÇO VAZIO ENTRE OS NODES)             │
│                                             │
│         ✓ Aqui                              │
│                    ✓ Aqui                   │
│                              ✓ Aqui         │
└─────────────────────────────────────────────┘
```

### Se AINDA não aparecer

**Me envie:**
1. Screenshot do Console (F12)
2. Print da tela inteira
3. Versão do navegador que está usando

Ou tente:
```bash
# Limpar cache e reiniciar
cd /home/cleber_delgado/workspace/AutoFlow-main
npm run dev
# Ctrl+F5 no navegador
```

## 🎯 TESTE FINAL

**Faça isso AGORA:**

1. ✅ Abra http://localhost:3001
2. ✅ Clique no workflow "FUNIL DE ATENDIMENTO"
3. ✅ Olhe para a área ESCURA (canvas)
4. ✅ Clique com BOTÃO DIREITO em espaço vazio
5. ✅ Menu aparece!
6. ✅ Clique em "🔌 MCP Integration"
7. ✅ Modal abre com 12 serviços!

---

**Se não funcionar, me responda:**
- "Consegui ver o menu" ✅
- "Não aparece nada" ❌
- "Aparece outro menu" ⚠️

E eu te ajudo a resolver! 🚀
