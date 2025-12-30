import db from './db.js';

// Agents: store as array of { id, name, available:true }
// Rotation pointer stored in db.data.agentRotationIndex

export async function addAgent(id, name) {
  if (!db.data) await db.read();
  if (!db.data.agents) db.data.agents = [];
  if (db.data.agents.some(a => a.id === id)) return db.data.agents.find(a => a.id === id);
  const agent = { id, name: name || id, available: true };
  db.data.agents.push(agent);
  try { await db.write(); } catch (err) { /* best-effort */ }
  return agent;
}

export async function removeAgent(id) {
  if (!db.data) await db.read();
  if (!db.data.agents) return false;
  const before = db.data.agents.length;
  db.data.agents = db.data.agents.filter(a => a.id !== id);
  if (db.data.agents.length !== before) {
    try { await db.write(); } catch (err) {}
    return true;
  }
  return false;
}

export async function listAgents() {
  if (!db.data) await db.read();
  return db.data.agents || [];
}

export async function setAgentAvailability(id, available) {
  if (!db.data) await db.read();
  if (!db.data.agents) return null;
  const agent = db.data.agents.find(a => a.id === id);
  if (!agent) return null;
  agent.available = !!available;
  try { await db.write(); } catch (err) {}
  return agent;
}

export async function getNextAgent() {
  if (!db.data) await db.read();
  const agents = db.data.agents || [];
  const available = agents.filter(a => a.available !== false);
  if (available.length === 0) return null;
  db.data.agentRotationIndex = db.data.agentRotationIndex || 0;
  const idx = db.data.agentRotationIndex % available.length;
  const agent = available[idx];
  // advance pointer relative to available list
  db.data.agentRotationIndex = (db.data.agentRotationIndex + 1) % available.length;
  try { await db.write(); } catch (err) {}
  return agent;
}

export async function assignChat(chatId, agentId) {
  if (!db.data) await db.read();
  if (!db.data.chatAssignments) db.data.chatAssignments = {};
  db.data.chatAssignments[chatId] = { agentId, accepted: false, assignedAt: new Date().toISOString() };
  try { await db.write(); } catch (err) {}
  return { chatId, agentId };
}

export async function getChatAssignment(chatId) {
  if (!db.data) await db.read();
  if (!db.data.chatAssignments) return null;
  return db.data.chatAssignments[chatId] || null;
}

export async function clearChatAssignment(chatId) {
  if (!db.data) await db.read();
  if (!db.data.chatAssignments) return false;
  if (db.data.chatAssignments[chatId]) {
    delete db.data.chatAssignments[chatId];
    try { await db.write(); } catch (err) {}
    return true;
  }
  return false;
}

export async function acceptAssignment(chatId, agentId) {
  if (!db.data) await db.read();
  if (!db.data.chatAssignments || !db.data.chatAssignments[chatId]) return false;
  const a = db.data.chatAssignments[chatId];
  if (a.agentId !== agentId) return false;
  a.accepted = true;
  a.acceptedAt = new Date().toISOString();
  try { await db.write(); } catch (err) {}
  return true;
}

export async function rejectAssignment(chatId, agentId) {
  if (!db.data) await db.read();
  if (!db.data.chatAssignments || !db.data.chatAssignments[chatId]) return false;
  const a = db.data.chatAssignments[chatId];
  if (a.agentId !== agentId) return false;
  // remove assignment
  delete db.data.chatAssignments[chatId];
  try { await db.write(); } catch (err) {}
  return true;
}

export default { addAgent, removeAgent, listAgents, setAgentAvailability, getNextAgent, assignChat, getChatAssignment, clearChatAssignment };