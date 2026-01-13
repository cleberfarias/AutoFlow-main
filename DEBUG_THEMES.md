# 🔍 Guia de Debug - Temas e Cores

## Como Testar

### 1. Abrir o Console do Navegador
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá para a aba "Console"

### 2. Verificar Configurações Atuais
```javascript
// Ver configurações salvas
const settings = JSON.parse(localStorage.getItem('autoflow_settings'));
console.log('⚙️ Configurações:', settings);

// Ver classes do HTML
console.log('📋 Classes HTML:', document.documentElement.className);
```

### 3. Testar Manualmente

#### Aplicar Tema Dark
```javascript
document.documentElement.classList.remove('light');
document.documentElement.classList.add('dark');
console.log('Classes:', document.documentElement.className);
```

#### Aplicar Tema Light
```javascript
document.documentElement.classList.remove('dark');
document.documentElement.classList.add('light');
console.log('Classes:', document.documentElement.className);
```

#### Mudar Cor
```javascript
// Remover todas as cores
['blue', 'violet', 'emerald', 'rose', 'amber', 'cyan'].forEach(c => 
  document.documentElement.classList.remove('color-' + c)
);

// Adicionar nova cor
document.documentElement.classList.add('color-emerald');
console.log('Classes:', document.documentElement.className);
```

### 4. Verificar se Tailwind Está Funcionando

```javascript
// Criar elemento de teste
const test = document.createElement('div');
test.className = 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4';
test.textContent = 'Teste Dark Mode';
document.body.appendChild(test);

// Verificar estilos computados
const styles = window.getComputedStyle(test);
console.log('Background:', styles.backgroundColor);
console.log('Color:', styles.color);
```

### 5. Forçar Recarregamento das Configurações

```javascript
// Limpar e reconfigurar
localStorage.removeItem('autoflow_settings');

// Definir manualmente
localStorage.setItem('autoflow_settings', JSON.stringify({
  language: 'pt-BR',
  theme: 'light',
  colorScheme: 'emerald',
  compactMode: false,
  animations: true
}));

// Recarregar página
location.reload();
```

### 6. Verificar Logs Automáticos

Quando você mudar o tema ou cor na página de Configurações, deve ver no console:

```
🌓 Mudando tema para: light
✅ Tema aplicado: light Classes: color-violet light
🎨 Mudando cor para: emerald
🎨 Cor aplicada: emerald Classes: color-emerald light
```

## Problemas Comuns

### Tema Não Muda Visualmente

**Causa:** Classes `dark:` do Tailwind não estão funcionando

**Solução:**
1. Verifique se `<html>` tem classe `dark` ou `light`
2. Verifique no console: `document.documentElement.classList.contains('dark')`
3. Inspecione um elemento e veja se as classes `dark:bg-*` aparecem
4. Teste manualmente: `document.documentElement.classList.add('dark')`

### Cores Não Mudam

**Causa:** Variável CSS `--primary` não está sendo aplicada

**Solução:**
1. Verifique se classe `color-*` está presente no `<html>`
2. Teste no console:
   ```javascript
   getComputedStyle(document.documentElement).getPropertyValue('--primary')
   ```
3. Deve retornar a cor hex (ex: `#8b5cf6` para violet)

### Mudanças Não Persistem

**Causa:** localStorage não está salvando

**Solução:**
```javascript
// Verificar se localStorage funciona
localStorage.setItem('test', 'value');
console.log('Test:', localStorage.getItem('test')); // Deve retornar 'value'

// Ver todas as chaves
console.log('Keys:', Object.keys(localStorage));
```

## Teste Rápido

Execute este código no console para testar tudo:

```javascript
// Teste completo
(function testThemes() {
  console.log('🧪 Iniciando teste de temas...');
  
  const html = document.documentElement;
  
  // Teste 1: Dark
  console.log('1️⃣ Testando Dark...');
  html.classList.remove('light');
  html.classList.add('dark');
  setTimeout(() => {
    console.log('  Classes:', html.className);
    console.log('  BG deve ser escuro:', window.getComputedStyle(document.body).backgroundColor);
    
    // Teste 2: Light
    console.log('2️⃣ Testando Light...');
    html.classList.remove('dark');
    html.classList.add('light');
    setTimeout(() => {
      console.log('  Classes:', html.className);
      console.log('  BG deve ser claro:', window.getComputedStyle(document.body).backgroundColor);
      
      // Teste 3: Cores
      console.log('3️⃣ Testando Cores...');
      const cores = ['blue', 'violet', 'emerald', 'rose', 'amber', 'cyan'];
      cores.forEach((cor, i) => {
        setTimeout(() => {
          cores.forEach(c => html.classList.remove('color-' + c));
          html.classList.add('color-' + cor);
          const primary = getComputedStyle(html).getPropertyValue('--primary').trim();
          console.log(`  ${cor}: ${primary}`);
        }, i * 500);
      });
    }, 1000);
  }, 1000);
})();
```

## Resultados Esperados

### Com Dark Mode Ativo
- `<html class="dark color-violet">`
- Background escuro em toda interface
- Texto claro (branco/cinza claro)
- Navbar escura

### Com Light Mode Ativo
- `<html class="light color-violet">`
- Background claro em toda interface
- Texto escuro
- Navbar clara

### Cores (--primary)
- `blue`: `#3b82f6`
- `violet`: `#8b5cf6` ✅ (padrão)
- `emerald`: `#10b981`
- `rose`: `#f43f5e`
- `amber`: `#f59e0b`
- `cyan`: `#06b6d4`

## Arquivo de Teste

Abra `test-theme.html` no navegador para um teste isolado:

```bash
# Na pasta do projeto
open test-theme.html
# ou
xdg-open test-theme.html
```

Este arquivo testa SOMENTE o sistema de temas sem React, permitindo identificar se o problema é:
- Tailwind CDN
- Aplicação de classes
- React/componentes

---

**Se ainda não funcionar após estes testes, compartilhe:**
1. Screenshot do console com os logs
2. Resultado de `document.documentElement.className`
3. Resultado de `localStorage.getItem('autoflow_settings')`
