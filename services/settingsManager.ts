// Settings Manager Service - Sistema de gerenciamento de configurações

import { logger } from './logger';

export type Language = 'pt-BR' | 'en-US' | 'es-ES';
export type Theme = 'dark' | 'light' | 'auto';
export type ColorScheme = 'blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan';

export interface AppSettings {
  // Idioma
  language: Language;
  
  // Aparência
  theme: Theme;
  colorScheme: ColorScheme;
  compactMode: boolean;
  animations: boolean;
  
  // Notificações
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    workflow: boolean;
    errors: boolean;
    success: boolean;
  };
  
  // API e Integrações
  api: {
    openaiKey?: string;
    geminiKey?: string;
    timeout: number;
    retries: number;
  };
  
  // Editor
  editor: {
    autoSave: boolean;
    autoSaveInterval: number; // em segundos
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;
  };
  
  // Dados e Privacidade
  data: {
    autoBackup: boolean;
    backupInterval: number; // em horas
    keepLogs: number; // dias
    keepVersions: number; // quantidade
  };
  
  // Avançado
  advanced: {
    debugMode: boolean;
    telemetry: boolean;
    betaFeatures: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'pt-BR',
  
  theme: 'dark',
  colorScheme: 'violet',
  compactMode: false,
  animations: true,
  
  notifications: {
    enabled: true,
    sound: true,
    desktop: false,
    workflow: true,
    errors: true,
    success: true
  },
  
  api: {
    timeout: 30000,
    retries: 3
  },
  
  editor: {
    autoSave: true,
    autoSaveInterval: 30,
    showGrid: true,
    snapToGrid: true,
    gridSize: 20
  },
  
  data: {
    autoBackup: true,
    backupInterval: 24,
    keepLogs: 30,
    keepVersions: 50
  },
  
  advanced: {
    debugMode: false,
    telemetry: true,
    betaFeatures: false
  }
};

class SettingsManager {
  private settings: AppSettings;
  private subscribers: ((settings: AppSettings) => void)[] = [];
  private storageKey = 'autoflow_settings';

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge com defaults para garantir que novos campos existam
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      this.notify();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }

  private notify() {
    this.subscribers.forEach(callback => callback({ ...this.settings }));
  }

  // Getters
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  getLanguage(): Language {
    return this.settings.language;
  }

  getTheme(): Theme {
    return this.settings.theme;
  }

  getColorScheme(): ColorScheme {
    return this.settings.colorScheme;
  }

  // Setters individuais
  setLanguage(language: Language) {
    this.settings.language = language;
    this.saveSettings();
    logger.info('Idioma alterado', {
      action: 'settings.language',
      user: 'Usuário',
      details: `Idioma alterado para ${language}`
    });
  }

  setTheme(theme: Theme) {
    this.settings.theme = theme;
    this.applyTheme();
    this.saveSettings();
    logger.info('Tema alterado', {
      action: 'settings.theme',
      user: 'Usuário',
      details: `Tema alterado para ${theme}`
    });
  }

  setColorScheme(colorScheme: ColorScheme) {
    this.settings.colorScheme = colorScheme;
    this.applyColorScheme();
    this.saveSettings();
    logger.info('Esquema de cores alterado', {
      action: 'settings.colorScheme',
      user: 'Usuário',
      details: `Esquema de cores alterado para ${colorScheme}`
    });
  }

  // Update completo ou parcial
  updateSettings(updates: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    
    // Aplicar mudanças visuais se necessário
    if (updates.theme) this.applyTheme();
    if (updates.colorScheme) this.applyColorScheme();
    
    logger.info('Configurações atualizadas', {
      action: 'settings.update',
      user: 'Usuário',
      details: 'Configurações do sistema atualizadas'
    });
  }

  // Reset para defaults
  resetToDefaults() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.applyTheme();
    this.applyColorScheme();
    
    logger.warning('Configurações resetadas', {
      action: 'settings.reset',
      user: 'Usuário',
      details: 'Todas as configurações foram restauradas para o padrão'
    });
  }

  // Aplicar tema no documento
  private applyTheme() {
    const root = document.documentElement;
    
    if (this.settings.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.toggle('light', !prefersDark);
    } else {
      // Remove ambas as classes primeiro
      root.classList.remove('dark', 'light');
      // Adiciona a classe apropriada
      if (this.settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (this.settings.theme === 'light') {
        root.classList.add('light');
      }
    }
    console.log('✅ Tema aplicado:', this.settings.theme, 'Classes:', root.className);
  }

  // Aplicar esquema de cores
  private applyColorScheme() {
    const root = document.documentElement;
    const schemes: ColorScheme[] = ['blue', 'violet', 'emerald', 'rose', 'amber', 'cyan'];
    
    // Remove todos os esquemas
    schemes.forEach(scheme => root.classList.remove(`color-${scheme}`));
    
    // Adiciona o esquema atual
    root.classList.add(`color-${this.settings.colorScheme}`);
    console.log('🎨 Cor aplicada:', this.settings.colorScheme, 'Classes:', root.className);
  }

  // Export/Import
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(data: string): boolean {
    try {
      const parsed = JSON.parse(data) as AppSettings;
      this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      this.saveSettings();
      this.applyTheme();
      this.applyColorScheme();
      
      logger.success('Configurações importadas', {
        action: 'settings.import',
        user: 'Usuário',
        details: 'Configurações importadas com sucesso'
      });
      
      return true;
    } catch (error) {
      logger.error('Erro ao importar configurações', {
        action: 'settings.import.error',
        user: 'Usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return false;
    }
  }

  // Subscribe para mudanças
  subscribe(callback: (settings: AppSettings) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Inicializar aplicação
  initialize() {
    this.applyTheme();
    this.applyColorScheme();
    
    // Listener para mudanças de preferência do sistema
    if (this.settings.theme === 'auto') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        this.applyTheme();
      });
    }
  }

  // Validar chave de API
  validateApiKey(service: 'openai' | 'gemini', key: string): boolean {
    // Validação básica de formato
    if (service === 'openai') {
      return key.startsWith('sk-') && key.length > 20;
    }
    if (service === 'gemini') {
      return key.length > 30;
    }
    return false;
  }

  // Salvar chave de API
  setApiKey(service: 'openai' | 'gemini', key: string) {
    if (!this.validateApiKey(service, key)) {
      logger.warning('Chave de API inválida', {
        action: 'settings.api.invalid',
        user: 'Usuário',
        details: `Chave de API ${service} com formato inválido`
      });
      return false;
    }
    
    if (service === 'openai') {
      this.settings.api.openaiKey = key;
    } else {
      this.settings.api.geminiKey = key;
    }
    
    this.saveSettings();
    
    logger.success('Chave de API salva', {
      action: 'settings.api.saved',
      user: 'Usuário',
      details: `Chave de API ${service} configurada`
    });
    
    return true;
  }

  // Remover chave de API
  removeApiKey(service: 'openai' | 'gemini') {
    if (service === 'openai') {
      delete this.settings.api.openaiKey;
    } else {
      delete this.settings.api.geminiKey;
    }
    
    this.saveSettings();
    
    logger.info('Chave de API removida', {
      action: 'settings.api.removed',
      user: 'Usuário',
      details: `Chave de API ${service} removida`
    });
  }

  // Verificar se API está configurada
  hasApiKey(service: 'openai' | 'gemini'): boolean {
    if (service === 'openai') {
      return !!this.settings.api.openaiKey;
    }
    return !!this.settings.api.geminiKey;
  }
}

// Singleton instance
export const settingsManager = new SettingsManager();

// Inicializar automaticamente quando o DOM estiver pronto
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      settingsManager.initialize();
    });
  } else {
    // DOM já está pronto
    settingsManager.initialize();
  }
}
