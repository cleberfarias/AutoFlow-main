# 🐛 DEBUG: Menu MCP

## ✅ Melhorias Aplicadas

1. **Console.log adicionado** - Vai aparecer no console quando clicar
2. **Menu com borda verde** - Agora tem borda `border-teal-500` 
3. **Botão MCP destacado** - Gradiente roxo→azul, maior
4. **Overlay transparente** - Fecha o menu ao clicar fora
5. **Dica visual no topo** - "Botão Direito para menu MCP 🔌"

## 🔍 Como Testar AGORA

### 1. Abra o Console
```
Pressione F12 no navegador
Vá na aba "Console"
```

### 2. Clique com Botão Direito no Canvas
Você verá estas mensagens:
```
🔌 Menu de Contexto MCP ativado! {x: 500, y: 300}
📍 Posição calculada: {screenX: 500, screenY: 300, canvasX: 420, canvasY: 220}
```

### 3. O Menu Deve Aparecer Assim

```
┌────────────────────────┐
│ ✨ ADICIONAR NODE      │ ← Header verde/teal
├────────────────────────┤
│ ⚡ Gatilho             │
│ ⚙️  Ação               │
│ 📊 Dados               │
│ 🧠 Lógica              │
├────────────────────────┤
│ 🔌 MCP Integration     │ ← ROXO/AZUL BRILHANTE
└────────────────────────┘
     ↑ Borda verde/teal
```

## 🎯 Checklist de Debug

### Se APARECER NO CONSOLE mas NÃO VER o menu:

1. **Problema de Z-index**
   - Abra DevTools (F12)
   - Clique com botão direito
   - Vá em "Elements" (Elementos)
   - Procure por `div` com `zIndex: 9999`
   - Verifique se está visível

2. **Menu fora da tela**
   - Tente clicar mais no CENTRO do canvas
   - Não clique muito perto das bordas

3. **CSS não carregou**
   - Refresh com Ctrl+Shift+R (limpa cache)

### Se NÃO APARECER NO CONSOLE:

1. **Evento não disparou**
   - Você está dentro de um workflow?
   - Canvas é a área escura com pontinhos
   - Não clique em cima de nodes

2. **JavaScript com erro**
   - Olhe a aba "Console" por erros em vermelho
   - Me mande screenshot dos erros

## 🚨 Teste Rápido

Execute no Console do navegador:

```javascript
// Verificar se o menu está funcionando
console.log('Testando menu MCP...');

// Simular clique com botão direito
const canvas = document.querySelector('main');
if (canvas) {
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    clientX: 500,
    clientY: 300
  });
  canvas.dispatchEvent(event);
  console.log('✅ Evento disparado!');
} else {
  console.log('❌ Canvas não encontrado');
}
```

## 📸 Me Envie

Se ainda não funcionar, me envie:

1. **Screenshot do Console (F12)**
   - Mostre as mensagens (ou falta delas)

2. **Screenshot da tela inteira**
   - Mostrando o workflow aberto

3. **Responda:**
   - Você vê as mensagens no console? (Sim/Não)
   - O menu aparece mas não consegue clicar? (Sim/Não)
   - Algum erro em vermelho no console? (Sim/Não)

---

**Agora teste e me diga o que acontece!** 🚀
