#!/usr/bin/env node
/**
 * Exemplo de integração do AutoFlow MCP Server com o Claude Desktop
 * 
 * Este script ajuda a configurar automaticamente o Claude Desktop para usar o AutoFlow MCP Server
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detectar caminho do config do Claude Desktop baseado no OS
function getClaudeConfigPath() {
  const platform = os.platform();
  const home = os.homedir();
  
  switch (platform) {
    case 'darwin': // macOS
      return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    case 'win32': // Windows
      return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    case 'linux':
      return path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function setupClaudeDesktop() {
  console.log('🔧 AutoFlow MCP Server - Claude Desktop Setup\n');
  
  try {
    // Obter caminho absoluto do servidor MCP
    const serverPath = path.resolve(__dirname, 'server.js');
    console.log('📍 MCP Server path:', serverPath);
    
    // Verificar se servidor existe
    if (!fs.existsSync(serverPath)) {
      console.error('❌ MCP server not found at:', serverPath);
      process.exit(1);
    }
    
    // Obter caminho do config do Claude Desktop
    const configPath = getClaudeConfigPath();
    console.log('📍 Claude Desktop config:', configPath);
    
    // Verificar se diretório existe
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      console.log('📁 Creating config directory:', configDir);
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Ler config existente ou criar novo
    let config = { mcpServers: {} };
    if (fs.existsSync(configPath)) {
      console.log('📖 Reading existing config...');
      const existing = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(existing);
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
    }
    
    // Adicionar/atualizar AutoFlow server
    config.mcpServers.autoflow = {
      command: 'node',
      args: [serverPath],
      env: {
        NODE_ENV: 'production',
        PORT: '5050'
      }
    };
    
    // Salvar config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Configuration saved!');
    
    console.log('\n📝 Configuration:');
    console.log(JSON.stringify(config.mcpServers.autoflow, null, 2));
    
    console.log('\n✨ Setup complete!\n');
    console.log('Next steps:');
    console.log('1. Restart Claude Desktop');
    console.log('2. Look for the 🔌 icon indicating MCP server is connected');
    console.log('3. Try asking Claude to use AutoFlow tools!\n');
    console.log('Example: "List the available appointment times for tomorrow"\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nManual setup instructions:');
    console.error('1. Open:', getClaudeConfigPath());
    console.error('2. Add the AutoFlow MCP server configuration');
    console.error('3. See: server/mcp/claude_desktop_config.json for example\n');
    process.exit(1);
  }
}

// Executar setup
setupClaudeDesktop();
