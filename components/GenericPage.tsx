import React from 'react';

interface GenericPageProps {
  title: string;
  description: string;
  icon?: any;
}

export default function GenericPage({ title, description, icon: Icon }: GenericPageProps) {
  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          {Icon && <Icon size={48} className="text-teal-600" />}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
            <p className="text-slate-400">{description}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center py-16">
          <p className="text-slate-400 text-lg">Funcionalidade em desenvolvimento</p>
          <p className="text-slate-500 text-sm mt-2">Esta página será preenchida em breve.</p>
        </div>
      </div>
    </div>
  );
}
