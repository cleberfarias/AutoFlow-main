#!/usr/bin/env node
/**
 * Cliente de teste para o AutoFlow MCP Server
 * 
 * Envia mensagens JSON-RPC para testar o servidor MCP
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let requestId = 1;

/**
 * Envia mensagem JSON-RPC e aguarda resposta
 */
function sendRequest(server, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = requestId++;
    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    console.log('\n📤 Request:', JSON.stringify(message, null, 2));
    
    let responseReceived = false;
    let buffer = '';
    
    const onData = (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      
      // Manter última linha incompleta no buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const response = JSON.parse(line);
          if (response.id === id) {
            console.log('📥 Response:', JSON.stringify(response, null, 2));
            responseReceived = true;
            server.stdout.off('data', onData);
            resolve(response);
            return;
          } else if (response.method) {
            console.log('📢 Notification:', JSON.stringify(response, null, 2));
          }
        } catch (e) {
          // Ignorar linhas que não são JSON
        }
      }
    };
    
    server.stdout.on('data', onData);
    
    // Timeout
    setTimeout(() => {
      if (!responseReceived) {
        server.stdout.off('data', onData);
        reject(new Error('Request timeout'));
      }
    }, 5000);
    
    server.stdin.write(JSON.stringify(message) + '\n');
  });
}

/**
 * Executa sequência de testes
 */
async function runTests() {
  console.log('🚀 AutoFlow MCP Server - Test Client\n');
  console.log('Starting MCP server...\n');
  
  const serverPath = join(__dirname, 'server.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Log stderr para debug
  server.stderr.on('data', (data) => {
    console.log('🔍 Server log:', data.toString().trim());
  });
  
  try {
    // Aguardar servidor iniciar
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Teste 1: Initialize
    console.log('\n=== TEST 1: Initialize ===');
    await sendRequest(server, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'autoflow-test-client',
        version: '1.0.0'
      }
    });
    
    // Aguardar notification initialized
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Teste 2: List Tools
    console.log('\n=== TEST 2: List Tools ===');
    const toolsResponse = await sendRequest(server, 'tools/list');
    console.log(`\n✅ Found ${toolsResponse.result?.tools?.length || 0} tools`);
    
    // Teste 3: Call Tool (findAvailability)
    console.log('\n=== TEST 3: Call Tool (calendar.findAvailability) ===');
    await sendRequest(server, 'tools/call', {
      name: 'calendar.findAvailability',
      arguments: {
        serviceId: 's1',
        durationMinutes: 60
      }
    });
    
    // Teste 4: List Prompts
    console.log('\n=== TEST 4: List Prompts ===');
    const promptsResponse = await sendRequest(server, 'prompts/list');
    console.log(`\n✅ Found ${promptsResponse.result?.prompts?.length || 0} prompts`);
    
    // Teste 5: Get Prompt
    console.log('\n=== TEST 5: Get Prompt (create_workflow) ===');
    await sendRequest(server, 'prompts/get', {
      name: 'create_workflow',
      arguments: {
        description: 'atendimento ao cliente'
      }
    });
    
    // Teste 6: Ping
    console.log('\n=== TEST 6: Ping ===');
    await sendRequest(server, 'ping');
    
    // Teste 7: List Resources
    console.log('\n=== TEST 7: List Resources ===');
    await sendRequest(server, 'resources/list');
    
    console.log('\n\n✅ All tests passed!\n');
    
  } catch (error) {
    console.error('\n\n❌ Test failed:', error.message);
  } finally {
    // Fechar servidor
    server.kill();
    process.exit(0);
  }
}

// Executar testes
runTests().catch(console.error);
