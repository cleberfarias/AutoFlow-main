# 🛠️ Guia do Sistema de Configurações

## Visão Geral

O AutoFlow possui um sistema completo de configurações que permite personalizar a aplicação de acordo com suas preferências, incluindo idioma, tema, cores e diversas opções de funcionalidade.

## 📁 Arquitetura

### Serviços

#### `services/settingsManager.ts`
Gerenciador central de todas as configurações da aplicação.

**Principais Funcionalidades:**
- ✅ Gerenciamento de idioma (Português, Inglês, Espanhol)
- ✅ Controle de tema (Dark, Light, Auto)
- ✅ Esquemas de cores (Blue, Violet, Emerald, Rose, Amber, Cyan)
- ✅ Configurações de notificações
- ✅ Gerenciamento de chaves API (OpenAI, Gemini)
- ✅ Configurações do editor
- ✅ Preferências de dados e backup
- ✅ Opções avançadas
- ✅ Persistência com localStorage
- ✅ Export/Import de configurações

**Estrutura de Configurações:**
```typescript
interface AppSettings {
  language: 'pt-BR' | 'en-US' | 'es-ES';
  theme: 'dark' | 'light' | 'auto';
  colorScheme: 'blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan';
  compactMode: boolean;
  animations: boolean;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    workflow: boolean;
    errors: boolean;
    success: boolean;
  };
  api: {
    openaiKey?: string;
    geminiKey?: string;
    timeout: number;
    retries: number;
  };
  editor: {
    autoSave: boolean;
    autoSaveInterval: number;
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;
  };
  data: {
    autoBackup: boolean;
    backupInterval: number;
    keepLogs: number;
    keepVersions: number;
  };
  advanced: {
    debugMode: boolean;
    telemetry: boolean;
    betaFeatures: boolean;
  };
}
```

**Métodos Principais:**
```typescript
// Obter configurações atuais
const settings = settingsManager.getSettings();

// Alterar idioma
settingsManager.setLanguage('pt-BR' | 'en-US' | 'es-ES');

// Alterar tema
settingsManager.setTheme('dark' | 'light' | 'auto');

// Alterar esquema de cores
settingsManager.setColorScheme('blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan');

// Atualizar configurações parcialmente
settingsManager.updateSettings({ compactMode: true, animations: false });

// Gerenciar chaves API
settingsManager.setApiKey('openai', 'sk-...');
settingsManager.hasApiKey('openai');
settingsManager.removeApiKey('openai');

// Export/Import
const json = settingsManager.exportSettings();
settingsManager.importSettings(json);

// Reset para padrões
settingsManager.resetToDefaults();

// Inscrever-se para mudanças
const unsubscribe = settingsManager.subscribe((settings) => {
  console.log('Configurações atualizadas:', settings);
});
```

#### `services/i18n.ts`
Sistema de internacionalização com suporte a 3 idiomas.

**Idiomas Suportados:**
- 🇧🇷 Português (pt-BR)
- 🇺🇸 Inglês (en-US)
- 🇪🇸 Espanhol (es-ES)

**Chaves de Tradução:**
- Navegação: `nav.dashboard`, `nav.workflows`, `nav.settings`, etc.
- Configurações: `settings.title`, `settings.language`, `settings.theme`, etc.
- Comum: `common.save`, `common.cancel`, `common.delete`, etc.

**Uso:**
```typescript
import { t, tf } from './services/i18n';

// Tradução simples
const title = t('settings.title'); // "Configurações" (pt-BR)

// Tradução com variáveis
const message = tf('settings.backup.created', { date: '2026-01-15' });
// "Backup criado em {date}" -> "Backup criado em 2026-01-15"

// Fallback personalizado
const text = t('chave.inexistente', 'Texto Padrão');
```

### Interface

#### `components/SettingsPage.tsx`
Página completa de configurações com interface visual intuitiva.

**Seções:**
1. **Idioma** - Seleção visual com bandeiras (🇧🇷 🇺🇸 🇪🇸)
2. **Aparência** - Tema (Dark/Light/Auto) e esquema de cores
3. **Notificações** - Controle de alertas e sons
4. **API** - Gerenciamento seguro de chaves OpenAI e Gemini
5. **Editor** - Configurações de auto-save e grid
6. **Dados** - Backup automático e export/import
7. **Avançado** - Debug mode e features beta
8. **Sobre** - Informações da aplicação

**Características:**
- ✅ Navegação por abas
- ✅ Preview em tempo real
- ✅ Feedback visual de salvamento
- ✅ Proteção de chaves API (input password)
- ✅ Export/Import de configurações
- ✅ Reset para configurações padrão
- ✅ Design responsivo e moderno

## 🎨 Temas e Cores

### Temas
- **Dark**: Tema escuro padrão
- **Light**: Tema claro (todo o sistema muda para cores claras)
- **Auto**: Sincroniza automaticamente com as preferências do sistema operacional

### Esquemas de Cores
- **Blue** (Azul) - Cor padrão da interface
- **Violet** (Violeta) - Tom roxo elegante
- **Emerald** (Esmeralda) - Verde vibrante
- **Rose** (Rosa) - Rosa suave
- **Amber** (Âmbar) - Laranja quente
- **Cyan** (Ciano) - Azul claro refrescante

**Aplicação Automática:**
As cores são aplicadas automaticamente ao `document.documentElement` através de classes CSS:
```html
<html class="dark color-violet">
```

## 🔐 Segurança

### Chaves API
- Armazenadas de forma segura no localStorage
- Input com tipo `password` para proteger visualização
- Validação de formato antes de salvar
- Opção de remover chaves a qualquer momento

### Validação
```typescript
// OpenAI: deve começar com "sk-"
validateApiKey('openai', 'sk-abc123'); // true

// Gemini: deve começar com "AIza"
validateApiKey('gemini', 'AIzaXYZ789'); // true
```

## 💾 Persistência

Todas as configurações são salvas automaticamente no localStorage com a chave `autoflow_settings`.

**Formato de Armazenamento:**
```json
{
  "language": "pt-BR",
  "theme": "dark",
  "colorScheme": "violet",
  "compactMode": false,
  "animations": true,
  "notifications": {
    "enabled": true,
    "sound": true,
    "desktop": false,
    "workflow": true,
    "errors": true,
    "success": true
  },
  "api": {
    "timeout": 30000,
    "retries": 3
  },
  "editor": {
    "autoSave": true,
    "autoSaveInterval": 30000,
    "showGrid": true,
    "snapToGrid": true,
    "gridSize": 20
  },
  "data": {
    "autoBackup": false,
    "backupInterval": 86400000,
    "keepLogs": 1000,
    "keepVersions": 50
  },
  "advanced": {
    "debugMode": false,
    "telemetry": false,
    "betaFeatures": false
  }
}
```

## 🔄 Integração com a Aplicação

### App.tsx
O App.tsx se inscreve nas mudanças de configurações e aplica o idioma automaticamente:

```typescript
useEffect(() => {
  const unsubscribe = settingsManager.subscribe((settings) => {
    i18n.setLanguage(settings.language);
  });

  i18n.setLanguage(settingsManager.getSettings().language);

  return unsubscribe;
}, []);
```

### Navbar.tsx
A navegação utiliza as traduções do i18n:

```typescript
const navItems = [
  { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
  { id: 'settings', label: t('nav.settings'), icon: Settings },
  // ...
];
```

## 📊 Estatísticas

- **60+ Chaves de Tradução**: Cobertura completa da interface
- **3 Idiomas**: Português, Inglês e Espanhol
- **6 Esquemas de Cores**: Personalização visual completa
- **8 Seções de Configurações**: Organização intuitiva
- **100% TypeScript**: Tipagem completa e segura

## 🚀 Próximos Passos

### Expandir Traduções
Atualmente apenas a navegação e a página de configurações estão traduzidas. Próximos passos:
1. Traduzir Dashboard
2. Traduzir páginas de Workflows
3. Traduzir modais e mensagens de erro
4. Adicionar mais idiomas (Francês, Alemão, etc.)

### Novas Funcionalidades
- [ ] Sincronização de configurações na nuvem
- [ ] Perfis de configuração (Trabalho, Pessoal, etc.)
- [ ] Atalhos de teclado personalizáveis
- [ ] Mais temas e esquemas de cores
- [ ] Exportação de tema customizado

## 📝 Exemplos de Uso

### Alterar Idioma Programaticamente
```typescript
import { settingsManager } from './services/settingsManager';

// Mudar para inglês
settingsManager.setLanguage('en-US');
```

### Verificar se Chave API Existe
```typescript
if (settingsManager.hasApiKey('openai')) {
  // Fazer chamada para OpenAI
} else {
  // Mostrar mensagem para configurar chave
}
```

### Exportar Configurações para Backup
```typescript
const backup = settingsManager.exportSettings();
localStorage.setItem('autoflow_backup', backup);
```

### Restaurar de Backup
```typescript
const backup = localStorage.getItem('autoflow_backup');
if (backup) {
  settingsManager.importSettings(backup);
}
```

## 🎯 Melhores Práticas

1. **Sempre use o sistema de tradução**: Nunca coloque strings hardcoded na interface
2. **Não armazene chaves API em texto plano**: Use o settingsManager
3. **Respeite as preferências do usuário**: Cheque as configurações antes de mostrar notificações
4. **Forneça feedback visual**: Use o sistema de notificações para confirmar ações
5. **Mantenha as configurações sincronizadas**: Use o padrão pub/sub do settingsManager

---

**Desenvolvido com ❤️ para o AutoFlow AI**
