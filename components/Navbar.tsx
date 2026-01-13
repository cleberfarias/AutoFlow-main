import React from 'react';
import { 
  LayoutDashboard, Workflow, Zap, Boxes, BookTemplate, 
  GitBranch, FileText, Settings, ChevronDown, LogOut 
} from 'lucide-react';
import { t } from '../services/i18n';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout?: () => void;
}

export default function Navbar({ currentPage, onPageChange, onLogout }: NavbarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  console.log('Navbar renderizado! Página atual:', currentPage);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'workflows', label: t('nav.workflows'), icon: Workflow },
    { id: 'ai-routing', label: t('nav.aiRouting'), icon: Zap },
    { id: 'mcp-hub', label: t('nav.mcpHub'), icon: Boxes },
    { id: 'templates', label: t('nav.templates'), icon: BookTemplate },
    { id: 'versions', label: t('nav.versions'), icon: GitBranch },
    { id: 'logs', label: t('nav.logs'), icon: FileText },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-slate-950 text-white transition-all duration-300 z-40 flex flex-col ${
      isCollapsed ? 'w-20' : 'w-64'
    }`} style={{ display: 'flex' }}>
      {/* Logo/Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center font-bold">
              AF
            </div>
            <span className="font-bold text-lg">AutoFlow</span>
          </div>
        )}
        {isCollapsed && <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center font-bold mx-auto">AF</div>}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          title={isCollapsed ? t('common.logout') : ''}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">{t('common.logout')}</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <ChevronDown size={20} className={`transition-transform ${isCollapsed ? 'rotate-90' : '-rotate-90'}`} />
        </button>
      </div>
    </aside>
  );
}
