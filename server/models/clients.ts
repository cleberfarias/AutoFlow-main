import crypto from 'crypto';
import { randomUUID } from 'crypto';
import db from '../db.ts';

const ALGO = 'aes-256-gcm';
const SECRET = process.env.CREDENTIALS_SECRET || 'dev-secret-change';

function encrypt(text){
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(SECRET).digest();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(enc){
  if (!enc) return null;
  const data = Buffer.from(enc, 'base64');
  const iv = data.slice(0,12);
  const tag = data.slice(12,28);
  const encrypted = data.slice(28);
  const key = crypto.createHash('sha256').update(SECRET).digest();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return out.toString('utf8');
}

export async function createClient({ name, provider, creds, phoneNumberId, status='inactive' }){
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const creds_encrypted = creds ? encrypt(JSON.stringify(creds)) : null;
  db.data.clients.unshift({ id, name, provider, creds_encrypted, phoneNumberId, status, createdAt });
  await db.write();
  return { id, name, provider, phoneNumberId, status, createdAt };
}

export function getClientById(id){
  const row = db.data.clients.find(c => c.id === id);
  if (!row) return null;
  return { ...row, creds: row.creds_encrypted ? JSON.parse(decrypt(row.creds_encrypted)) : null };
}

export function listClients(){
  return db.data.clients.map(({ id, name, provider, phoneNumberId, status, createdAt }) => ({ id, name, provider, phoneNumberId, status, createdAt }));
}

export async function updateClient(id, { name, provider, creds, phoneNumberId, status }){
  const idx = db.data.clients.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const existing = db.data.clients[idx];
  const creds_encrypted = creds ? encrypt(JSON.stringify(creds)) : existing.creds_encrypted;
  const updated = {
    ...existing,
    name: name || existing.name,
    provider: provider || existing.provider,
    creds_encrypted,
    phoneNumberId: phoneNumberId || existing.phoneNumberId,
    status: status || existing.status
  };
  db.data.clients[idx] = updated;
  await db.write();
  return getClientById(id);
}

export async function deleteClient(id){
  db.data.clients = db.data.clients.filter(c => c.id !== id);
  await db.write();
  return { ok: true };
}
