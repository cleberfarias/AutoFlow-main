// Tool Registry: registro e execução de tools (MCP-style)
import fetch from 'node-fetch';

const tools = new Map();

// Timeout padrão para chamadas de tools (5 segundos)
const TOOL_TIMEOUT_MS = 5000;

/**
 * Registra uma tool no registry
 */
export function registerTool(tool) {
  tools.set(tool.name, tool);
  console.log(`[Tool Registry] Registered: ${tool.name}`);
}

/**
 * Lista todas as tools disponíveis
 */
export function listTools() {
  return Array.from(tools.values()).map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    handler: undefined
  }));
}

/**
 * Executa uma tool com timeout e tratamento de erro
 */
export async function callTool(toolName, args, context) {
  const tool = tools.get(toolName);
  
  if (!tool) {
    return { 
      success: false, 
      error: `Tool "${toolName}" not found. Available tools: ${Array.from(tools.keys()).join(', ')}` 
    };
  }

  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tool execution timeout')), TOOL_TIMEOUT_MS)
    );
    
    const resultPromise = tool.handler(args, context);
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    return { success: true, result };
  } catch (error) {
    console.error(`[Tool Registry] Error calling ${toolName}:`, error);
    return { 
      success: false, 
      error: error?.message || String(error) 
    };
  }
}

registerTool({
  name: 'calendar.findAvailability',
  description: 'Busca próxima disponibilidade no calendário para agendamento',
  inputSchema: {
    type: 'object',
    properties: {
      serviceId: { type: 'string', description: 'ID do serviço' },
      professionalId: { type: 'string', description: 'ID do profissional (opcional)' },
      durationMinutes: { type: 'number', description: 'Duração em minutos' },
      fromISO: { type: 'string', description: 'Data/hora inicial (ISO 8601)' }
    },
    required: []
  },
  handler: async (args) => {
    const response = await fetch('http://localhost:5050/api/poc/find-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    return await response.json();
  }
});

registerTool({
  name: 'calendar.createAppointment',
  description: 'Cria um novo agendamento no calendário',
  inputSchema: {
    type: 'object',
    properties: {
      clientId: { type: 'string', description: 'ID do cliente' },
      professionalId: { type: 'string', description: 'ID do profissional' },
      serviceId: { type: 'string', description: 'ID do serviço' },
      start: { type: 'string', description: 'Data/hora de início (ISO 8601)' },
      end: { type: 'string', description: 'Data/hora de fim (ISO 8601)' }
    },
    required: ['clientId', 'serviceId', 'start', 'end']
  },
  handler: async (args) => {
    const response = await fetch('http://localhost:5050/api/poc/create-appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    return await response.json();
  }
});

// Tool para envio via Gupshup (simulada/forward para local test endpoint)
registerTool({
  name: 'whatsapp.gupshup.sendMessage',
  description: 'Envia mensagem via Gupshup',
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string' },
      text: { type: 'string' }
    },
    required: ['to', 'text']
  },
  handler: async (args, context) => {
    // Em ambiente de teste, encaminha para um endpoint local que os testes podem espiar
    const target = process.env.GUPSHUP_FORWARD_URL || 'http://localhost:5050/api/poc/send-whatsapp';
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: args.to, text: args.text, context })
    });
    if (!res.ok) throw new Error(`Gupshup send failed: ${res.status}`);
    return res.json();
  }
});

// Tool para envio via Web (browser em produção, stub para testes)
registerTool({
  name: 'whatsapp.web.sendMessage',
  description: 'Envia mensagem via WhatsApp Web client (stub)',
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string' },
      text: { type: 'string' }
    },
    required: ['to', 'text']
  },
  handler: async (args, context) => {
    // In test env we forward to same poc endpoint
    const target = process.env.WHATSAPP_WEB_FORWARD_URL || 'http://localhost:5050/api/poc/send-whatsapp';
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: args.to, text: args.text, context })
    });
    if (!res.ok) throw new Error(`WhatsApp Web send failed: ${res.status}`);
    return res.json();
  }
});
