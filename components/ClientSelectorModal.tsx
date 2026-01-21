import React, { useState } from 'react';
import { X, Users, Plus, Search } from 'lucide-react';

interface ClientSelectorModalProps {
  isOpen: boolean;
  clients: any[];
  onClose: () => void;
  onSelectClient: (client: any) => void;
  onCreateNewClient: () => void;
}

const ClientSelectorModal: React.FC<ClientSelectorModalProps> = ({ 
  isOpen, 
  clients, 
  onClose, 
  onSelectClient, 
  onCreateNewClient 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Selecionar Cliente</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 pt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-teal-600 focus:bg-white rounded-xl outline-none font-medium text-slate-800 transition-all"
            />
          </div>

          {/* Create New Client Button */}
          <button
            onClick={onCreateNewClient}
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Plus size={18} strokeWidth={3} /> Criar Novo Cliente
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ou selecione existente</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Clients List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
            {filteredClients.length > 0 ? (
              filteredClients.map((client, idx) => (
                <button
                  key={client.id || idx}
                  onClick={() => onSelectClient(client)}
                  className="w-full p-4 bg-slate-50 hover:bg-teal-50 border-2 border-transparent hover:border-teal-500 rounded-xl flex items-center gap-4 transition-all group"
                >
                  <div className="w-12 h-12 bg-white border border-slate-200 group-hover:border-teal-500 rounded-lg flex items-center justify-center text-teal-600 transition-all">
                    <Users size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-slate-900">{client.name}</h3>
                    <p className="text-sm text-slate-500">{client.automations?.length || 0} workflows</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-2">Nenhum cliente encontrado</p>
                {searchTerm && (
                  <button
                    onClick={onCreateNewClient}
                    className="text-sm text-teal-600 font-semibold hover:underline"
                  >
                    Criar novo cliente
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSelectorModal;
