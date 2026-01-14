#!/usr/bin/env node
/**
 * AutoFlow MCP Server
 * 
 * Implementação do Model Context Protocol (MCP) para expor ferramentas
 * do AutoFlow para clientes MCP como Claude Desktop, IDEs, etc.
 * 
 * Protocolo: JSON-RPC 2.0 sobre stdio
 * Especificação: https://spec.modelcontextprotocol.io/
 */

import { createInterface } from 'readline';
import { listTools as getRegistryTools, callTool as executeRegistryTool } from '../tools/registry.ts';

// MCP Protocol Version
const MCP_VERSION = '2024-11-05';

// Server Info
const SERVER_INFO = {
  name: 'autoflow-mcp-server',
  version: '1.0.0',
  protocolVersion: MCP_VERSION
};

// Capabilities
const SERVER_CAPABILITIES = {
  tools: {
    listChanged: true
  },
  resources: {
    subscribe: false,
    listChanged: false
  },
  prompts: {
    listChanged: false
  }
};

/**
 * Envia mensagem JSON-RPC via stdout
 */
function sendMessage(message) {
  const json = JSON.stringify(message);
  process.stdout.write(json + '\n');
}

/**
 * Envia resposta de sucesso JSON-RPC
 */
function sendResponse(id, result) {
  sendMessage({
    jsonrpc: '2.0',
    id,
    result
  });
}

/**
 * Envia erro JSON-RPC
 */
function sendError(id: number | string | null, code: any, message: any, data: any = null) {
  const error: any = { code, message };
  if (data) (error as any).data = data;
  
  sendMessage({
    jsonrpc: '2.0',
    id,
    error
  });
}

/**
 * Envia notificação JSON-RPC (sem id)
 */
function sendNotification(method, params) {
  sendMessage({
    jsonrpc: '2.0',
    method,
    params
  });
}

/**
 * Converte tools do registry para formato MCP
 */
function convertToolsToMCP() {
  const registryTools = getRegistryTools() as any[];
  
  return registryTools.map((tool: any) => ({
    name: tool.name,
    description: tool.description || null,
    inputSchema: {
      type: 'object',
      properties: (tool.inputSchema && tool.inputSchema.properties) || {},
      required: (tool.inputSchema && tool.inputSchema.required) || []
    }
  }));
}

/**
 * Handler: initialize
 */
async function handleInitialize(id, params) {
  const { protocolVersion, capabilities, clientInfo } = params;
  
  console.error('[MCP Server] Initialize request from:', clientInfo?.name || 'unknown');
  console.error('[MCP Server] Protocol version:', protocolVersion);
  
  // Verificar compatibilidade de versão
  if (protocolVersion !== MCP_VERSION) {
    console.error('[MCP Server] Warning: Protocol version mismatch');
  }
  
  sendResponse(id, {
    protocolVersion: MCP_VERSION,
    capabilities: SERVER_CAPABILITIES,
    serverInfo: SERVER_INFO
  });
  
  // Após initialize, enviar initialized notification
  setTimeout(() => {
    sendNotification('notifications/initialized', {});
  }, 10);
}

/**
 * Handler: tools/list
 */
async function handleToolsList(id) {
  const tools = convertToolsToMCP();
  
  console.error(`[MCP Server] Listing ${tools.length} tools`);
  
  sendResponse(id, {
    tools
  });
}

/**
 * Handler: tools/call
 */
async function handleToolsCall(id, params) {
  const { name, arguments: args } = params;
  
  console.error(`[MCP Server] Calling tool: ${name}`);
  
  try {
    const result = await executeRegistryTool(name, args || {}, {});
    
    if (!result.success) {
      sendError(id, -32603, `Tool execution failed: ${result.error}`);
      return;
    }
    
    // Retornar no formato MCP
    sendResponse(id, {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.result, null, 2)
        }
      ],
      isError: false
    });
  } catch (error) {
    console.error('[MCP Server] Tool execution error:', error);
    sendError(id, -32603, `Internal error: ${error.message}`);
  }
}

/**
 * Handler: resources/list
 */
async function handleResourcesList(id) {
  // Por enquanto, sem resources
  sendResponse(id, {
    resources: []
  });
}

/**
 * Handler: resources/read
 */
async function handleResourcesRead(id, params) {
  sendError(id, -32601, 'Resource not found');
}

/**
 * Handler: prompts/list
 */
async function handlePromptsList(id) {
  // Prompts básicos do AutoFlow
  const prompts = [
    {
      name: 'create_workflow',
      description: 'Cria um workflow de automação baseado em descrição',
      arguments: [
        {
          name: 'description',
          description: 'Descrição do workflow desejado',
          required: true
        }
      ]
    },
    {
      name: 'schedule_appointment',
      description: 'Ajuda a agendar um compromisso',
      arguments: [
        {
          name: 'service',
          description: 'Tipo de serviço',
          required: false
        },
        {
          name: 'datetime',
          description: 'Data/hora desejada',
          required: false
        }
      ]
    }
  ];
  
  sendResponse(id, { prompts });
}

/**
 * Handler: prompts/get
 */
async function handlePromptsGet(id, params) {
  const { name, arguments: args } = params;
  
  if (name === 'create_workflow') {
    const description = args?.description || 'workflow genérico';
    sendResponse(id, {
      description: 'Prompt para criar workflow de automação',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Crie um workflow de automação para: ${description}. 
            
Use os seguintes tipos de steps:
- TRIGGER: O que inicia o processo
- ACTION: Uma tarefa realizada
- DATA: Armazenar ou buscar informação
- LOGIC: Uma decisão

Retorne JSON com { "steps": [...] }`
          }
        }
      ]
    });
  } else if (name === 'schedule_appointment') {
    const service = args?.service || 'consulta';
    const datetime = args?.datetime || 'próximo horário disponível';
    
    sendResponse(id, {
      description: 'Prompt para agendamento',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Preciso agendar: ${service} para ${datetime}. 
            
Use a ferramenta calendar.findAvailability para verificar horários disponíveis 
e depois calendar.createAppointment para confirmar o agendamento.`
          }
        }
      ]
    });
  } else {
    sendError(id, -32601, `Prompt not found: ${name}`);
  }
}

/**
 * Handler: ping
 */
async function handlePing(id) {
  sendResponse(id, {});
}

/**
 * Processa mensagem JSON-RPC recebida
 */
async function handleMessage(message) {
  try {
    const { jsonrpc, id, method, params } = message;
    
    // Validar JSON-RPC 2.0
    if (jsonrpc !== '2.0') {
      sendError(id, -32600, 'Invalid JSON-RPC version');
      return;
    }
    
    // Dispatch para handler apropriado
    switch (method) {
      case 'initialize':
        await handleInitialize(id, params);
        break;
        
      case 'tools/list':
        await handleToolsList(id);
        break;
        
      case 'tools/call':
        await handleToolsCall(id, params);
        break;
        
      case 'resources/list':
        await handleResourcesList(id);
        break;
        
      case 'resources/read':
        await handleResourcesRead(id, params);
        break;
        
      case 'prompts/list':
        await handlePromptsList(id);
        break;
        
      case 'prompts/get':
        await handlePromptsGet(id, params);
        break;
        
      case 'ping':
        await handlePing(id);
        break;
        
      default:
        console.error(`[MCP Server] Unknown method: ${method}`);
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    console.error('[MCP Server] Error handling message:', error);
    sendError(message?.id || null, -32603, 'Internal error', {
      message: error.message
    });
  }
}

/**
 * Main: Inicia servidor MCP via stdio
 */
function startMCPServer() {
  console.error('[MCP Server] Starting AutoFlow MCP Server...');
  console.error('[MCP Server] Protocol:', MCP_VERSION);
  console.error('[MCP Server] Listening on stdin/stdout');
  
  const rl = createInterface({
    input: process.stdin,
    terminal: false
  });
  
  rl.on('line', async (line) => {
    try {
      const message = JSON.parse(line);
      await handleMessage(message);
    } catch (error) {
      console.error('[MCP Server] Failed to parse message:', error);
      sendError(null, -32700, 'Parse error');
    }
  });
  
  rl.on('close', () => {
    console.error('[MCP Server] Connection closed');
    process.exit(0);
  });
  
  // Tratamento de erros
  process.on('uncaughtException', (error) => {
    console.error('[MCP Server] Uncaught exception:', error);
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('[MCP Server] Unhandled rejection:', reason);
  });
  
  console.error('[MCP Server] Ready for JSON-RPC messages');
}

// Iniciar servidor
startMCPServer();
