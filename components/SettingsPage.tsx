import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Globe, Palette, Bell, Key, Database,
  Code2, Info, Save, RotateCcw, Download, Upload, Trash2,
  Sun, Moon, Monitor, Check, Eye, EyeOff
} from 'lucide-react';
import { settingsManager, AppSettings, Language, Theme, ColorScheme } from '../services/settingsManager';
import { i18n, t } from '../services/i18n';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(settingsManager.getSettings());
  const [activeTab, setActiveTab] = useState<string>('language');
  const [showApiKeys, setShowApiKeys] = useState({ openai: false, gemini: false });
  const [tempApiKeys, setTempApiKeys] = useState({ openai: '', gemini: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = settingsManager.subscribe((updatedSettings) => {
      setSettings(updatedSettings);
      i18n.setLanguage(updatedSettings.language);
    });

    // Inicializar idioma
    i18n.setLanguage(settings.language);

    return unsubscribe;
  }, []);

  const handleLanguageChange = (language: Language) => {
    settingsManager.setLanguage(language);
    showSavedMessage();
  };

  const handleThemeChange = (theme: Theme) => {
    console.log('🌓 Mudando tema para:', theme);
    settingsManager.setTheme(theme);
    // Forçar re-render
    setSettings({ ...settingsManager.getSettings() });
    showSavedMessage();
  };

  const handleColorSchemeChange = (colorScheme: ColorScheme) => {
    console.log('🎨 Mudando cor para:', colorScheme);
    settingsManager.setColorScheme(colorScheme);
    // Forçar re-render
    setSettings({ ...settingsManager.getSettings() });
    showSavedMessage();
  };

  const handleSettingChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    settingsManager.updateSettings(newSettings);
    showSavedMessage();
  };

  const handleSaveApiKey = (service: 'openai' | 'gemini') => {
    const key = tempApiKeys[service];
    if (key && settingsManager.setApiKey(service, key)) {
      setTempApiKeys({ ...tempApiKeys, [service]: '' });
      setShowApiKeys({ ...showApiKeys, [service]: false });
      showSavedMessage();
    } else {
      alert('Chave de API inválida!');
    }
  };

  const handleRemoveApiKey = (service: 'openai' | 'gemini') => {
    if (confirm(`Remover chave de API ${service}?`)) {
      settingsManager.removeApiKey(service);
      showSavedMessage();
    }
  };

  const handleExportSettings = () => {
    const data = settingsManager.exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autoflow-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = event.target?.result as string;
          if (settingsManager.importSettings(data)) {
            alert(t('settings.saved'));
          } else {
            alert('Erro ao importar configurações!');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetSettings = () => {
    if (confirm('Tem certeza que deseja restaurar todas as configurações para o padrão?')) {
      settingsManager.resetToDefaults();
      showSavedMessage();
    }
  };

  const showSavedMessage = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'language', label: t('settings.language'), icon: Globe },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'api', label: t('settings.api'), icon: Key },
    { id: 'editor', label: t('settings.editor'), icon: Code2 },
    { id: 'data', label: t('settings.data'), icon: Database },
    { id: 'advanced', label: t('settings.advanced'), icon: SettingsIcon },
    { id: 'about', label: t('settings.about'), icon: Info }
  ];

  const colorSchemes: { id: ColorScheme; label: string; color: string }[] = [
    { id: 'blue', label: 'Azul', color: 'bg-blue-500' },
    { id: 'violet', label: 'Violeta', color: 'bg-violet-500' },
    { id: 'emerald', label: 'Esmeralda', color: 'bg-emerald-500' },
    { id: 'rose', label: 'Rosa', color: 'bg-rose-500' },
    { id: 'amber', label: 'Âmbar', color: 'bg-amber-500' },
    { id: 'cyan', label: 'Ciano', color: 'bg-cyan-500' }
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <SettingsIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{t('settings.title')}</h1>
              <p className="text-slate-400">{t('settings.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Check size={18} />
                <span>{t('settings.saved')}</span>
              </div>
            )}
            <button
              onClick={handleResetSettings}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              <RotateCcw size={20} />
              {t('settings.reset')}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-slate-800 rounded-xl border border-slate-700 p-4 h-fit sticky top-8">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-violet-500 text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
              
              {/* Language Tab */}
              {activeTab === 'language' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('settings.language')}</h2>
                  <p className="text-slate-400 mb-6">{t('settings.language.desc')}</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { code: 'pt-BR' as Language, label: 'Português (Brasil)', flag: '🇧🇷' },
                      { code: 'en-US' as Language, label: 'English (US)', flag: '🇺🇸' },
                      { code: 'es-ES' as Language, label: 'Español', flag: '🇪🇸' }
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          settings.language === lang.code
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-4xl mb-2">{lang.flag}</div>
                        <div className="text-white font-medium">{lang.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t('settings.theme')}</h2>
                    <p className="text-slate-400 mb-6">{t('settings.theme.desc')}</p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'dark' as Theme, label: t('settings.theme.dark'), icon: Moon },
                        { value: 'light' as Theme, label: t('settings.theme.light'), icon: Sun },
                        { value: 'auto' as Theme, label: t('settings.theme.auto'), icon: Monitor }
                      ].map(theme => {
                        const Icon = theme.icon;
                        return (
                          <button
                            key={theme.value}
                            onClick={() => handleThemeChange(theme.value)}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              settings.theme === theme.value
                                ? 'border-violet-500 bg-violet-500/10'
                                : 'border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <Icon size={32} className="text-white mb-3 mx-auto" />
                            <div className="text-white font-medium">{theme.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('settings.colorScheme')}</h3>
                    <p className="text-slate-400 mb-6">{t('settings.colorScheme.desc')}</p>
                    
                    <div className="grid grid-cols-6 gap-4">
                      {colorSchemes.map(scheme => (
                        <button
                          key={scheme.id}
                          onClick={() => handleColorSchemeChange(scheme.id)}
                          className={`aspect-square rounded-xl border-2 transition-all ${
                            settings.colorScheme === scheme.id
                              ? 'border-white scale-110'
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className={`w-full h-full rounded-lg ${scheme.color} flex items-center justify-center`}>
                            {settings.colorScheme === scheme.id && <Check size={24} className="text-white" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.compactMode')}</span>
                      <input
                        type="checkbox"
                        checked={settings.compactMode}
                        onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.animations')}</span>
                      <input
                        type="checkbox"
                        checked={settings.animations}
                        onChange={(e) => handleSettingChange('animations', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('settings.notifications')}</h2>
                  <p className="text-slate-400 mb-6">{t('settings.notifications.desc')}</p>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.notifications.enabled')}</span>
                      <input
                        type="checkbox"
                        checked={settings.notifications.enabled}
                        onChange={(e) => handleSettingChange('notifications.enabled', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.notifications.sound')}</span>
                      <input
                        type="checkbox"
                        checked={settings.notifications.sound}
                        onChange={(e) => handleSettingChange('notifications.sound', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.notifications.desktop')}</span>
                      <input
                        type="checkbox"
                        checked={settings.notifications.desktop}
                        onChange={(e) => handleSettingChange('notifications.desktop', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* API Tab */}
              {activeTab === 'api' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('settings.api')}</h2>
                  <p className="text-slate-400 mb-6">{t('settings.api.desc')}</p>
                  
                  <div className="space-y-6">
                    {/* OpenAI */}
                    <div className="p-6 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">{t('settings.api.openai')}</h3>
                        {settingsManager.hasApiKey('openai') ? (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
                            Configurada
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-600 text-slate-400 text-sm rounded-full">
                            Não configurada
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <input
                            type={showApiKeys.openai ? 'text' : 'password'}
                            value={tempApiKeys.openai}
                            onChange={(e) => setTempApiKeys({ ...tempApiKeys, openai: e.target.value })}
                            placeholder="sk-..."
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => setShowApiKeys({ ...showApiKeys, openai: !showApiKeys.openai })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showApiKeys.openai ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <button
                          onClick={() => handleSaveApiKey('openai')}
                          className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <Save size={20} />
                        </button>
                        {settingsManager.hasApiKey('openai') && (
                          <button
                            onClick={() => handleRemoveApiKey('openai')}
                            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Gemini */}
                    <div className="p-6 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">{t('settings.api.gemini')}</h3>
                        {settingsManager.hasApiKey('gemini') ? (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
                            Configurada
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-600 text-slate-400 text-sm rounded-full">
                            Não configurada
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <input
                            type={showApiKeys.gemini ? 'text' : 'password'}
                            value={tempApiKeys.gemini}
                            onChange={(e) => setTempApiKeys({ ...tempApiKeys, gemini: e.target.value })}
                            placeholder="AIza..."
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => setShowApiKeys({ ...showApiKeys, gemini: !showApiKeys.gemini })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showApiKeys.gemini ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <button
                          onClick={() => handleSaveApiKey('gemini')}
                          className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <Save size={20} />
                        </button>
                        {settingsManager.hasApiKey('gemini') && (
                          <button
                            onClick={() => handleRemoveApiKey('gemini')}
                            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Tab */}
              {activeTab === 'editor' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('settings.editor')}</h2>
                  <p className="text-slate-400 mb-6">{t('settings.editor.desc')}</p>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.editor.autoSave')}</span>
                      <input
                        type="checkbox"
                        checked={settings.editor.autoSave}
                        onChange={(e) => handleSettingChange('editor.autoSave', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.editor.showGrid')}</span>
                      <input
                        type="checkbox"
                        checked={settings.editor.showGrid}
                        onChange={(e) => handleSettingChange('editor.showGrid', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.editor.snapToGrid')}</span>
                      <input
                        type="checkbox"
                        checked={settings.editor.snapToGrid}
                        onChange={(e) => handleSettingChange('editor.snapToGrid', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('settings.data')}</h2>
                  <p className="text-slate-400 mb-6">{t('settings.data.desc')}</p>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.data.autoBackup')}</span>
                      <input
                        type="checkbox"
                        checked={settings.data.autoBackup}
                        onChange={(e) => handleSettingChange('data.autoBackup', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                    
                    <button
                      onClick={handleExportSettings}
                      className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <span className="text-white font-medium">{t('settings.data.export')}</span>
                      <Download size={20} className="text-violet-400" />
                    </button>
                    
                    <button
                      onClick={handleImportSettings}
                      className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <span className="text-white font-medium">{t('settings.data.import')}</span>
                      <Upload size={20} className="text-violet-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('settings.advanced')}</h2>
                  <p className="text-slate-400 mb-6">{t('settings.advanced.desc')}</p>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.advanced.debugMode')}</span>
                      <input
                        type="checkbox"
                        checked={settings.advanced.debugMode}
                        onChange={(e) => handleSettingChange('advanced.debugMode', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{t('settings.advanced.betaFeatures')}</span>
                      <input
                        type="checkbox"
                        checked={settings.advanced.betaFeatures}
                        onChange={(e) => handleSettingChange('advanced.betaFeatures', e.target.checked)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t('settings.about')}</h2>
                  <div className="mt-8 text-center">
                    <div className="inline-block p-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl mb-4">
                      <SettingsIcon size={64} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">AutoFlow AI</h3>
                    <p className="text-slate-400 mb-2">{t('settings.about.version')}: 1.0.0</p>
                    <p className="text-slate-400 mb-6">© 2026 AutoFlow. Todos os direitos reservados.</p>
                    <div className="inline-flex gap-4 text-sm text-slate-500">
                      <span>React 18</span>
                      <span>•</span>
                      <span>TypeScript</span>
                      <span>•</span>
                      <span>Vite</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
