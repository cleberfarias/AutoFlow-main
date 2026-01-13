// Internationalization (i18n) - Sistema de tradução multilíngue

import { Language } from './settingsManager';

interface Translations {
  [key: string]: {
    'pt-BR': string;
    'en-US': string;
    'es-ES': string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.dashboard': {
    'pt-BR': 'Dashboard',
    'en-US': 'Dashboard',
    'es-ES': 'Panel de Control'
  },
  'nav.workflows': {
    'pt-BR': 'Workflows',
    'en-US': 'Workflows',
    'es-ES': 'Flujos de Trabajo'
  },
  'nav.aiRouting': {
    'pt-BR': 'AI Routing',
    'en-US': 'AI Routing',
    'es-ES': 'Enrutamiento IA'
  },
  'nav.mcpHub': {
    'pt-BR': 'MCP Hub',
    'en-US': 'MCP Hub',
    'es-ES': 'Centro MCP'
  },
  'nav.templates': {
    'pt-BR': 'Templates',
    'en-US': 'Templates',
    'es-ES': 'Plantillas'
  },
  'nav.versions': {
    'pt-BR': 'Versões',
    'en-US': 'Versions',
    'es-ES': 'Versiones'
  },
  'nav.logs': {
    'pt-BR': 'Logs',
    'en-US': 'Logs',
    'es-ES': 'Registros'
  },
  'nav.settings': {
    'pt-BR': 'Configurações',
    'en-US': 'Settings',
    'es-ES': 'Configuración'
  },

  // Settings Page
  'settings.title': {
    'pt-BR': 'Configurações',
    'en-US': 'Settings',
    'es-ES': 'Configuración'
  },
  'settings.subtitle': {
    'pt-BR': 'Personalize sua experiência no AutoFlow',
    'en-US': 'Customize your AutoFlow experience',
    'es-ES': 'Personaliza tu experiencia en AutoFlow'
  },
  'settings.language': {
    'pt-BR': 'Idioma',
    'en-US': 'Language',
    'es-ES': 'Idioma'
  },
  'settings.language.desc': {
    'pt-BR': 'Escolha o idioma da interface',
    'en-US': 'Choose the interface language',
    'es-ES': 'Elige el idioma de la interfaz'
  },
  'settings.theme': {
    'pt-BR': 'Tema',
    'en-US': 'Theme',
    'es-ES': 'Tema'
  },
  'settings.theme.desc': {
    'pt-BR': 'Ajuste a aparência do sistema',
    'en-US': 'Adjust the system appearance',
    'es-ES': 'Ajusta la apariencia del sistema'
  },
  'settings.theme.dark': {
    'pt-BR': 'Escuro',
    'en-US': 'Dark',
    'es-ES': 'Oscuro'
  },
  'settings.theme.light': {
    'pt-BR': 'Claro',
    'en-US': 'Light',
    'es-ES': 'Claro'
  },
  'settings.theme.auto': {
    'pt-BR': 'Automático',
    'en-US': 'Auto',
    'es-ES': 'Automático'
  },
  'settings.colorScheme': {
    'pt-BR': 'Esquema de Cores',
    'en-US': 'Color Scheme',
    'es-ES': 'Esquema de Color'
  },
  'settings.colorScheme.desc': {
    'pt-BR': 'Escolha a cor principal da interface',
    'en-US': 'Choose the main interface color',
    'es-ES': 'Elige el color principal de la interfaz'
  },
  'settings.appearance': {
    'pt-BR': 'Aparência',
    'en-US': 'Appearance',
    'es-ES': 'Apariencia'
  },
  'settings.compactMode': {
    'pt-BR': 'Modo Compacto',
    'en-US': 'Compact Mode',
    'es-ES': 'Modo Compacto'
  },
  'settings.animations': {
    'pt-BR': 'Animações',
    'en-US': 'Animations',
    'es-ES': 'Animaciones'
  },
  'settings.notifications': {
    'pt-BR': 'Notificações',
    'en-US': 'Notifications',
    'es-ES': 'Notificaciones'
  },
  'settings.notifications.desc': {
    'pt-BR': 'Configure alertas e avisos do sistema',
    'en-US': 'Configure system alerts and warnings',
    'es-ES': 'Configura alertas y avisos del sistema'
  },
  'settings.notifications.enabled': {
    'pt-BR': 'Notificações Ativadas',
    'en-US': 'Notifications Enabled',
    'es-ES': 'Notificaciones Activadas'
  },
  'settings.notifications.sound': {
    'pt-BR': 'Som de Notificação',
    'en-US': 'Notification Sound',
    'es-ES': 'Sonido de Notificación'
  },
  'settings.notifications.desktop': {
    'pt-BR': 'Notificações Desktop',
    'en-US': 'Desktop Notifications',
    'es-ES': 'Notificaciones de Escritorio'
  },
  'settings.api': {
    'pt-BR': 'API e Integrações',
    'en-US': 'API & Integrations',
    'es-ES': 'API e Integraciones'
  },
  'settings.api.desc': {
    'pt-BR': 'Configure chaves de API e serviços externos',
    'en-US': 'Configure API keys and external services',
    'es-ES': 'Configura claves API y servicios externos'
  },
  'settings.api.openai': {
    'pt-BR': 'OpenAI API Key',
    'en-US': 'OpenAI API Key',
    'es-ES': 'Clave API OpenAI'
  },
  'settings.api.gemini': {
    'pt-BR': 'Google Gemini API Key',
    'en-US': 'Google Gemini API Key',
    'es-ES': 'Clave API Google Gemini'
  },
  'settings.editor': {
    'pt-BR': 'Editor',
    'en-US': 'Editor',
    'es-ES': 'Editor'
  },
  'settings.editor.desc': {
    'pt-BR': 'Preferências do editor de workflows',
    'en-US': 'Workflow editor preferences',
    'es-ES': 'Preferencias del editor de flujos'
  },
  'settings.editor.autoSave': {
    'pt-BR': 'Salvamento Automático',
    'en-US': 'Auto Save',
    'es-ES': 'Guardado Automático'
  },
  'settings.editor.showGrid': {
    'pt-BR': 'Mostrar Grade',
    'en-US': 'Show Grid',
    'es-ES': 'Mostrar Cuadrícula'
  },
  'settings.editor.snapToGrid': {
    'pt-BR': 'Ajustar à Grade',
    'en-US': 'Snap to Grid',
    'es-ES': 'Ajustar a Cuadrícula'
  },
  'settings.data': {
    'pt-BR': 'Dados e Privacidade',
    'en-US': 'Data & Privacy',
    'es-ES': 'Datos y Privacidad'
  },
  'settings.data.desc': {
    'pt-BR': 'Gerencie seus dados e preferências de privacidade',
    'en-US': 'Manage your data and privacy preferences',
    'es-ES': 'Administra tus datos y preferencias de privacidad'
  },
  'settings.data.autoBackup': {
    'pt-BR': 'Backup Automático',
    'en-US': 'Auto Backup',
    'es-ES': 'Copia Automática'
  },
  'settings.data.export': {
    'pt-BR': 'Exportar Dados',
    'en-US': 'Export Data',
    'es-ES': 'Exportar Datos'
  },
  'settings.data.import': {
    'pt-BR': 'Importar Dados',
    'en-US': 'Import Data',
    'es-ES': 'Importar Datos'
  },
  'settings.data.clear': {
    'pt-BR': 'Limpar Todos os Dados',
    'en-US': 'Clear All Data',
    'es-ES': 'Borrar Todos los Datos'
  },
  'settings.advanced': {
    'pt-BR': 'Avançado',
    'en-US': 'Advanced',
    'es-ES': 'Avanzado'
  },
  'settings.advanced.desc': {
    'pt-BR': 'Configurações avançadas do sistema',
    'en-US': 'Advanced system settings',
    'es-ES': 'Configuración avanzada del sistema'
  },
  'settings.advanced.debugMode': {
    'pt-BR': 'Modo Debug',
    'en-US': 'Debug Mode',
    'es-ES': 'Modo Depuración'
  },
  'settings.advanced.betaFeatures': {
    'pt-BR': 'Recursos Beta',
    'en-US': 'Beta Features',
    'es-ES': 'Funciones Beta'
  },
  'settings.about': {
    'pt-BR': 'Sobre',
    'en-US': 'About',
    'es-ES': 'Acerca de'
  },
  'settings.about.version': {
    'pt-BR': 'Versão',
    'en-US': 'Version',
    'es-ES': 'Versión'
  },
  'settings.reset': {
    'pt-BR': 'Restaurar Padrões',
    'en-US': 'Reset to Defaults',
    'es-ES': 'Restaurar Valores'
  },
  'settings.save': {
    'pt-BR': 'Salvar Alterações',
    'en-US': 'Save Changes',
    'es-ES': 'Guardar Cambios'
  },
  'settings.saved': {
    'pt-BR': 'Configurações salvas com sucesso!',
    'en-US': 'Settings saved successfully!',
    'es-ES': '¡Configuración guardada con éxito!'
  },

  // Common
  'common.save': {
    'pt-BR': 'Salvar',
    'en-US': 'Save',
    'es-ES': 'Guardar'
  },
  'common.cancel': {
    'pt-BR': 'Cancelar',
    'en-US': 'Cancel',
    'es-ES': 'Cancelar'
  },
  'common.delete': {
    'pt-BR': 'Deletar',
    'en-US': 'Delete',
    'es-ES': 'Eliminar'
  },
  'common.edit': {
    'pt-BR': 'Editar',
    'en-US': 'Edit',
    'es-ES': 'Editar'
  },
  'common.create': {
    'pt-BR': 'Criar',
    'en-US': 'Create',
    'es-ES': 'Crear'
  },
  'common.export': {
    'pt-BR': 'Exportar',
    'en-US': 'Export',
    'es-ES': 'Exportar'
  },
  'common.import': {
    'pt-BR': 'Importar',
    'en-US': 'Import',
    'es-ES': 'Importar'
  },
  'common.search': {
    'pt-BR': 'Buscar',
    'en-US': 'Search',
    'es-ES': 'Buscar'
  },
  'common.loading': {
    'pt-BR': 'Carregando...',
    'en-US': 'Loading...',
    'es-ES': 'Cargando...'
  },
  'common.error': {
    'pt-BR': 'Erro',
    'en-US': 'Error',
    'es-ES': 'Error'
  },
  'common.success': {
    'pt-BR': 'Sucesso',
    'en-US': 'Success',
    'es-ES': 'Éxito'
  },
  'common.confirm': {
    'pt-BR': 'Confirmar',
    'en-US': 'Confirm',
    'es-ES': 'Confirmar'
  },
  'common.logout': {
    'pt-BR': 'Sair',
    'en-US': 'Logout',
    'es-ES': 'Cerrar Sesión'
  },
  'common.close': {
    'pt-BR': 'Fechar',
    'en-US': 'Close',
    'es-ES': 'Cerrar'
  },
  'common.back': {
    'pt-BR': 'Voltar',
    'en-US': 'Back',
    'es-ES': 'Volver'
  },
  'common.next': {
    'pt-BR': 'Próximo',
    'en-US': 'Next',
    'es-ES': 'Siguiente'
  },
  'common.previous': {
    'pt-BR': 'Anterior',
    'en-US': 'Previous',
    'es-ES': 'Anterior'
  },
  'common.add': {
    'pt-BR': 'Adicionar',
    'en-US': 'Add',
    'es-ES': 'Añadir'
  },
  'common.remove': {
    'pt-BR': 'Remover',
    'en-US': 'Remove',
    'es-ES': 'Eliminar'
  },
  'common.duplicate': {
    'pt-BR': 'Duplicar',
    'en-US': 'Duplicate',
    'es-ES': 'Duplicar'
  },
  'common.view': {
    'pt-BR': 'Visualizar',
    'en-US': 'View',
    'es-ES': 'Ver'
  },
  'common.download': {
    'pt-BR': 'Baixar',
    'en-US': 'Download',
    'es-ES': 'Descargar'
  },
  'common.upload': {
    'pt-BR': 'Enviar',
    'en-US': 'Upload',
    'es-ES': 'Subir'
  },
  'common.filter': {
    'pt-BR': 'Filtrar',
    'en-US': 'Filter',
    'es-ES': 'Filtrar'
  },
  'common.sort': {
    'pt-BR': 'Ordenar',
    'en-US': 'Sort',
    'es-ES': 'Ordenar'
  },
  'common.refresh': {
    'pt-BR': 'Atualizar',
    'en-US': 'Refresh',
    'es-ES': 'Actualizar'
  },
  'common.settings': {
    'pt-BR': 'Configurações',
    'en-US': 'Settings',
    'es-ES': 'Configuración'
  },
  'common.help': {
    'pt-BR': 'Ajuda',
    'en-US': 'Help',
    'es-ES': 'Ayuda'
  },
  'common.info': {
    'pt-BR': 'Informação',
    'en-US': 'Information',
    'es-ES': 'Información'
  },
  'common.warning': {
    'pt-BR': 'Aviso',
    'en-US': 'Warning',
    'es-ES': 'Advertencia'
  },
  'common.yes': {
    'pt-BR': 'Sim',
    'en-US': 'Yes',
    'es-ES': 'Sí'
  },
  'common.no': {
    'pt-BR': 'Não',
    'en-US': 'No',
    'es-ES': 'No'
  },
  
  // Dashboard
  'dashboard.title': {
    'pt-BR': 'Dashboard',
    'en-US': 'Dashboard',
    'es-ES': 'Panel de Control'
  },
  'dashboard.welcome': {
    'pt-BR': 'Bem-vindo ao AutoFlow',
    'en-US': 'Welcome to AutoFlow',
    'es-ES': 'Bienvenido a AutoFlow'
  },
  'dashboard.totalWorkflows': {
    'pt-BR': 'Total de Workflows',
    'en-US': 'Total Workflows',
    'es-ES': 'Flujos Totales'
  },
  'dashboard.activeClients': {
    'pt-BR': 'Clientes Ativos',
    'en-US': 'Active Clients',
    'es-ES': 'Clientes Activos'
  },
  'dashboard.recentActivity': {
    'pt-BR': 'Atividade Recente',
    'en-US': 'Recent Activity',
    'es-ES': 'Actividad Reciente'
  },
  
  // Workflows
  'workflows.title': {
    'pt-BR': 'Workflows',
    'en-US': 'Workflows',
    'es-ES': 'Flujos de Trabajo'
  },
  'workflows.create': {
    'pt-BR': 'Criar Workflow',
    'en-US': 'Create Workflow',
    'es-ES': 'Crear Flujo'
  },
  'workflows.edit': {
    'pt-BR': 'Editar Workflow',
    'en-US': 'Edit Workflow',
    'es-ES': 'Editar Flujo'
  },
  'workflows.delete': {
    'pt-BR': 'Deletar Workflow',
    'en-US': 'Delete Workflow',
    'es-ES': 'Eliminar Flujo'
  },
  'workflows.empty': {
    'pt-BR': 'Nenhum workflow encontrado',
    'en-US': 'No workflows found',
    'es-ES': 'No se encontraron flujos'
  },
  
  // Templates
  'templates.title': {
    'pt-BR': 'Templates',
    'en-US': 'Templates',
    'es-ES': 'Plantillas'
  },
  'templates.create': {
    'pt-BR': 'Criar Template',
    'en-US': 'Create Template',
    'es-ES': 'Crear Plantilla'
  },
  'templates.apply': {
    'pt-BR': 'Aplicar Template',
    'en-US': 'Apply Template',
    'es-ES': 'Aplicar Plantilla'
  },
  'templates.usageCount': {
    'pt-BR': 'Uso: {count} vezes',
    'en-US': 'Used {count} times',
    'es-ES': 'Usado {count} veces'
  },
  
  // Versions
  'versions.title': {
    'pt-BR': 'Versões',
    'en-US': 'Versions',
    'es-ES': 'Versiones'
  },
  'versions.restore': {
    'pt-BR': 'Restaurar Versão',
    'en-US': 'Restore Version',
    'es-ES': 'Restaurar Versión'
  },
  'versions.current': {
    'pt-BR': 'Versão Atual',
    'en-US': 'Current Version',
    'es-ES': 'Versión Actual'
  },
  
  // Logs
  'logs.title': {
    'pt-BR': 'Logs',
    'en-US': 'Logs',
    'es-ES': 'Registros'
  },
  'logs.clear': {
    'pt-BR': 'Limpar Logs',
    'en-US': 'Clear Logs',
    'es-ES': 'Limpiar Registros'
  },
  'logs.level.info': {
    'pt-BR': 'Info',
    'en-US': 'Info',
    'es-ES': 'Info'
  },
  'logs.level.warn': {
    'pt-BR': 'Aviso',
    'en-US': 'Warning',
    'es-ES': 'Advertencia'
  },
  'logs.level.error': {
    'pt-BR': 'Erro',
    'en-US': 'Error',
    'es-ES': 'Error'
  },
  'logs.level.success': {
    'pt-BR': 'Sucesso',
    'en-US': 'Success',
    'es-ES': 'Éxito'
  }
};

class I18n {
  private currentLanguage: Language = 'pt-BR';

  setLanguage(language: Language) {
    this.currentLanguage = language;
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  t(key: string, fallback?: string): string {
    const translation = translations[key];
    
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return fallback || key;
    }

    return translation[this.currentLanguage] || translation['pt-BR'] || fallback || key;
  }

  // Helper para interpolação de variáveis
  tf(key: string, vars: Record<string, string | number>, fallback?: string): string {
    let text = this.t(key, fallback);
    
    Object.entries(vars).forEach(([varKey, varValue]) => {
      text = text.replace(new RegExp(`{${varKey}}`, 'g'), String(varValue));
    });
    
    return text;
  }
}

// WhatsApp MEOW translations added before class export
Object.assign(translations, {
  'whatsapp.title': {
    'pt-BR': 'WhatsApp MEOW',
    'en-US': 'WhatsApp MEOW',
    'es-ES': 'WhatsApp MEOW'
  },
  'whatsapp.subtitle': {
    'pt-BR': 'Gerenciar conexão e automações WhatsApp',
    'en-US': 'Manage WhatsApp connection and automations',
    'es-ES': 'Gestionar conexión y automatizaciones de WhatsApp'
  },
  'whatsapp.connectionStatus': {
    'pt-BR': 'Status da Conexão',
    'en-US': 'Connection Status',
    'es-ES': 'Estado de Conexión'
  },
  'whatsapp.connect': {
    'pt-BR': 'Conectar',
    'en-US': 'Connect',
    'es-ES': 'Conectar'
  },
  'whatsapp.disconnect': {
    'pt-BR': 'Desconectar',
    'en-US': 'Disconnect',
    'es-ES': 'Desconectar'
  },
  'whatsapp.logout': {
    'pt-BR': 'Logout',
    'en-US': 'Logout',
    'es-ES': 'Cerrar Sesión'
  },
  'whatsapp.confirmLogout': {
    'pt-BR': 'Tem certeza? Isso removerá a sessão e você precisará escanear o QR novamente.',
    'en-US': 'Are you sure? This will remove the session and you will need to scan the QR again.',
    'es-ES': '¿Estás seguro? Esto eliminará la sesión y tendrás que escanear el QR de nuevo.'
  },
  'whatsapp.status.ready': {
    'pt-BR': 'Conectado',
    'en-US': 'Connected',
    'es-ES': 'Conectado'
  },
  'whatsapp.status.qr': {
    'pt-BR': 'Aguardando QR Code',
    'en-US': 'Waiting for QR Code',
    'es-ES': 'Esperando Código QR'
  },
  'whatsapp.status.connecting': {
    'pt-BR': 'Conectando',
    'en-US': 'Connecting',
    'es-ES': 'Conectando'
  },
  'whatsapp.status.authenticated': {
    'pt-BR': 'Autenticado',
    'en-US': 'Authenticated',
    'es-ES': 'Autenticado'
  },
  'whatsapp.status.disconnected': {
    'pt-BR': 'Desconectado',
    'en-US': 'Disconnected',
    'es-ES': 'Desconectado'
  },
  'whatsapp.phoneNumber': {
    'pt-BR': 'Número',
    'en-US': 'Phone Number',
    'es-ES': 'Número'
  },
  'whatsapp.platform': {
    'pt-BR': 'Plataforma',
    'en-US': 'Platform',
    'es-ES': 'Plataforma'
  },
  'whatsapp.battery': {
    'pt-BR': 'Bateria',
    'en-US': 'Battery',
    'es-ES': 'Batería'
  },
  'whatsapp.scanQR': {
    'pt-BR': 'Escanear QR Code',
    'en-US': 'Scan QR Code',
    'es-ES': 'Escanear Código QR'
  },
  'whatsapp.qrInstructions': {
    'pt-BR': '1. Abra o WhatsApp no celular',
    'en-US': '1. Open WhatsApp on your phone',
    'es-ES': '1. Abre WhatsApp en tu teléfono'
  },
  'whatsapp.qrInstructions2': {
    'pt-BR': '2. Vá em Configurações > Dispositivos Vinculados',
    'en-US': '2. Go to Settings > Linked Devices',
    'es-ES': '2. Ve a Ajustes > Dispositivos Vinculados'
  },
  'whatsapp.qrInstructions3': {
    'pt-BR': '3. Escaneie este QR Code',
    'en-US': '3. Scan this QR Code',
    'es-ES': '3. Escanea este Código QR'
  },
  'whatsapp.sendTestMessage': {
    'pt-BR': 'Enviar Mensagem de Teste',
    'en-US': 'Send Test Message',
    'es-ES': 'Enviar Mensaje de Prueba'
  },
  'whatsapp.phoneFormat': {
    'pt-BR': 'Formato: código do país + DDD + número (sem +)',
    'en-US': 'Format: country code + area code + number (without +)',
    'es-ES': 'Formato: código de país + código de área + número (sin +)'
  },
  'whatsapp.message': {
    'pt-BR': 'Mensagem',
    'en-US': 'Message',
    'es-ES': 'Mensaje'
  },
  'whatsapp.messagePlaceholder': {
    'pt-BR': 'Digite sua mensagem...',
    'en-US': 'Type your message...',
    'es-ES': 'Escribe tu mensaje...'
  },
  'whatsapp.send': {
    'pt-BR': 'Enviar',
    'en-US': 'Send',
    'es-ES': 'Enviar'
  },
  'whatsapp.sending': {
    'pt-BR': 'Enviando...',
    'en-US': 'Sending...',
    'es-ES': 'Enviando...'
  },
  'whatsapp.fillPhoneAndMessage': {
    'pt-BR': 'Preencha o telefone e a mensagem',
    'en-US': 'Fill in the phone number and message',
    'es-ES': 'Completa el teléfono y el mensaje'
  },
  'whatsapp.messageSent': {
    'pt-BR': 'Mensagem enviada com sucesso!',
    'en-US': 'Message sent successfully!',
    'es-ES': '¡Mensaje enviado con éxito!'
  },
  'whatsapp.errorSending': {
    'pt-BR': 'Erro ao enviar',
    'en-US': 'Error sending',
    'es-ES': 'Error al enviar'
  },
  'whatsapp.recentMessages': {
    'pt-BR': 'Mensagens Recentes',
    'en-US': 'Recent Messages',
    'es-ES': 'Mensajes Recientes'
  },
  'whatsapp.noMessages': {
    'pt-BR': 'Nenhuma mensagem ainda',
    'en-US': 'No messages yet',
    'es-ES': 'No hay mensajes aún'
  },
  'whatsapp.group': {
    'pt-BR': 'Grupo',
    'en-US': 'Group',
    'es-ES': 'Grupo'
  },
  'whatsapp.logs': {
    'pt-BR': 'Logs de Atividade',
    'en-US': 'Activity Logs',
    'es-ES': 'Registros de Actividad'
  },
  'whatsapp.clearLogs': {
    'pt-BR': 'Limpar',
    'en-US': 'Clear',
    'es-ES': 'Limpiar'
  },
  'whatsapp.noLogs': {
    'pt-BR': 'Nenhum log ainda',
    'en-US': 'No logs yet',
    'es-ES': 'No hay registros aún'
  },
  'whatsapp.quickActions': {
    'pt-BR': 'Ações Rápidas',
    'en-US': 'Quick Actions',
    'es-ES': 'Acciones Rápidas'
  },
  'whatsapp.viewGroups': {
    'pt-BR': 'Ver Grupos',
    'en-US': 'View Groups',
    'es-ES': 'Ver Grupos'
  },
  'whatsapp.viewContacts': {
    'pt-BR': 'Ver Contatos',
    'en-US': 'View Contacts',
    'es-ES': 'Ver Contactos'
  },
  'whatsapp.sendMedia': {
    'pt-BR': 'Enviar Mídia',
    'en-US': 'Send Media',
    'es-ES': 'Enviar Multimedia'
  },
  'whatsapp.syncChats': {
    'pt-BR': 'Sincronizar',
    'en-US': 'Synchronize',
    'es-ES': 'Sincronizar'
  }
});

export const i18n = new I18n();

// Função helper para uso direto
export function t(key: string, fallback?: string): string {
  return i18n.t(key, fallback);
}

export function tf(key: string, vars: Record<string, string | number>, fallback?: string): string {
  return i18n.tf(key, vars, fallback);
}
