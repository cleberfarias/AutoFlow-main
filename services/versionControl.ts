// Version Control Service - Sistema de versionamento de workflows

import { WorkflowStep } from '../types';
import { logger } from './logger';

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  workflowName: string;
  version: string;
  tag?: 'production' | 'staging' | 'beta' | 'development';
  description: string;
  author: string;
  timestamp: string;
  steps: WorkflowStep[];
  changes: {
    added: number;
    modified: number;
    removed: number;
  };
  status: 'active' | 'archived' | 'draft';
  isCurrent: boolean;
  metadata?: Record<string, any>;
}

class VersionControl {
  private versions: WorkflowVersion[] = [];
  private subscribers: ((versions: WorkflowVersion[]) => void)[] = [];
  private maxVersionsPerWorkflow = 50;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('autoflow_versions');
      if (stored) {
        this.versions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar versões do localStorage', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('autoflow_versions', JSON.stringify(this.versions));
    } catch (error) {
      console.error('Erro ao salvar versões no localStorage', error);
    }
  }

  private notify() {
    this.subscribers.forEach(callback => callback([...this.versions]));
  }

  private calculateChanges(oldSteps: WorkflowStep[], newSteps: WorkflowStep[]): {
    added: number;
    modified: number;
    removed: number;
  } {
    const oldIds = new Set(oldSteps.map(s => s.id));
    const newIds = new Set(newSteps.map(s => s.id));
    
    const added = newSteps.filter(s => !oldIds.has(s.id)).length;
    const removed = oldSteps.filter(s => !newIds.has(s.id)).length;
    
    // Detectar modificados comparando steps que existem em ambos
    let modified = 0;
    newSteps.forEach(newStep => {
      const oldStep = oldSteps.find(s => s.id === newStep.id);
      if (oldStep) {
        // Comparação simples - pode ser melhorada com deep comparison
        if (JSON.stringify(oldStep) !== JSON.stringify(newStep)) {
          modified++;
        }
      }
    });

    return { added, modified, removed };
  }

  private generateVersionNumber(workflowId: string, changeType: 'major' | 'minor' | 'patch' = 'patch'): string {
    const workflowVersions = this.versions
      .filter(v => v.workflowId === workflowId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    if (workflowVersions.length === 0) {
      return 'v1.0.0';
    }

    const lastVersion = workflowVersions[0].version;
    const match = lastVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
    
    if (!match) {
      return 'v1.0.0';
    }

    let [, major, minor, patch] = match.map(Number);

    switch (changeType) {
      case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor++;
        patch = 0;
        break;
      case 'patch':
        patch++;
        break;
    }

    return `v${major}.${minor}.${patch}`;
  }

  createVersion(
    workflowId: string,
    workflowName: string,
    steps: WorkflowStep[],
    author: string,
    options?: {
      description?: string;
      tag?: 'production' | 'staging' | 'beta' | 'development';
      changeType?: 'major' | 'minor' | 'patch';
      autoArchive?: boolean;
    }
  ): WorkflowVersion {
    // Pegar versão anterior para calcular mudanças
    const previousVersions = this.versions.filter(v => v.workflowId === workflowId);
    const previousVersion = previousVersions.find(v => v.isCurrent);
    const oldSteps = previousVersion?.steps || [];
    
    // Calcular mudanças
    const changes = this.calculateChanges(oldSteps, steps);
    
    // Determinar tipo de mudança automaticamente se não especificado
    let changeType = options?.changeType || 'patch';
    if (changes.added > 5 || changes.removed > 3) {
      changeType = 'major';
    } else if (changes.added > 0 || changes.removed > 0) {
      changeType = 'minor';
    }

    // Gerar número de versão
    const version = this.generateVersionNumber(workflowId, changeType);

    // Marcar versão anterior como não-atual
    if (previousVersion) {
      previousVersion.isCurrent = false;
      if (options?.autoArchive !== false) {
        previousVersion.status = 'archived';
      }
    }

    // Criar nova versão
    const newVersion: WorkflowVersion = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      workflowId,
      workflowName,
      version,
      tag: options?.tag,
      description: options?.description || this.generateDescription(changes),
      author,
      timestamp: new Date().toISOString(),
      steps: JSON.parse(JSON.stringify(steps)), // Deep clone
      changes,
      status: 'active',
      isCurrent: true,
      metadata: {
        totalSteps: steps.length,
        previousVersion: previousVersion?.version
      }
    };

    this.versions.push(newVersion);

    // Limitar versões por workflow
    const workflowVersions = this.versions
      .filter(v => v.workflowId === workflowId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    if (workflowVersions.length > this.maxVersionsPerWorkflow) {
      const toRemove = workflowVersions.slice(this.maxVersionsPerWorkflow);
      this.versions = this.versions.filter(v => !toRemove.includes(v));
    }

    this.saveToStorage();
    this.notify();

    // Log
    logger.logVersionCreate(workflowName, version, author, options?.tag);

    return newVersion;
  }

  private generateDescription(changes: { added: number; modified: number; removed: number }): string {
    const parts = [];
    if (changes.added > 0) parts.push(`${changes.added} passo${changes.added > 1 ? 's' : ''} adicionado${changes.added > 1 ? 's' : ''}`);
    if (changes.modified > 0) parts.push(`${changes.modified} modificado${changes.modified > 1 ? 's' : ''}`);
    if (changes.removed > 0) parts.push(`${changes.removed} removido${changes.removed > 1 ? 's' : ''}`);
    
    if (parts.length === 0) return 'Versão inicial';
    return parts.join(', ');
  }

  getVersions(workflowId?: string): WorkflowVersion[] {
    let result = [...this.versions];
    if (workflowId) {
      result = result.filter(v => v.workflowId === workflowId);
    }
    return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  getCurrentVersion(workflowId: string): WorkflowVersion | null {
    return this.versions.find(v => v.workflowId === workflowId && v.isCurrent) || null;
  }

  getVersion(versionId: string): WorkflowVersion | null {
    return this.versions.find(v => v.id === versionId) || null;
  }

  restoreVersion(versionId: string, author: string): WorkflowStep[] | null {
    const version = this.getVersion(versionId);
    if (!version) {
      logger.error('Versão não encontrada', {
        action: 'version.restore.error',
        user: author,
        details: `Versão ${versionId} não encontrada`
      });
      return null;
    }

    // Criar nova versão com os passos restaurados
    this.createVersion(
      version.workflowId,
      version.workflowName,
      version.steps,
      author,
      {
        description: `Restaurado da versão ${version.version}`,
        tag: 'development',
        changeType: 'minor'
      }
    );

    logger.success('Versão restaurada', {
      workflow: version.workflowName,
      user: author,
      action: 'version.restore',
      details: `Versão ${version.version} restaurada com sucesso`,
      metadata: { restoredVersion: version.version }
    });

    return version.steps;
  }

  tagVersion(versionId: string, tag: 'production' | 'staging' | 'beta' | 'development', author: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;

    version.tag = tag;
    this.saveToStorage();
    this.notify();

    logger.info('Tag de versão atualizada', {
      workflow: version.workflowName,
      user: author,
      action: 'version.tag',
      details: `Versão ${version.version} marcada como ${tag}`,
      metadata: { version: version.version, tag }
    });

    return true;
  }

  deleteVersion(versionId: string, author: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;

    if (version.isCurrent) {
      logger.warning('Tentativa de deletar versão atual', {
        workflow: version.workflowName,
        user: author,
        action: 'version.delete.blocked',
        details: 'Não é possível deletar a versão atual'
      });
      return false;
    }

    this.versions = this.versions.filter(v => v.id !== versionId);
    this.saveToStorage();
    this.notify();

    logger.info('Versão deletada', {
      workflow: version.workflowName,
      user: author,
      action: 'version.delete',
      details: `Versão ${version.version} deletada`,
      metadata: { version: version.version }
    });

    return true;
  }

  subscribe(callback: (versions: WorkflowVersion[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  exportVersions(format: 'json' = 'json'): string {
    return JSON.stringify(this.versions, null, 2);
  }

  getStats() {
    const totalVersions = this.versions.length;
    const activeVersions = this.versions.filter(v => v.status === 'active').length;
    const workflowsWithVersions = new Set(this.versions.map(v => v.workflowId)).size;
    const taggedVersions = this.versions.filter(v => v.tag).length;

    return {
      totalVersions,
      activeVersions,
      workflowsWithVersions,
      taggedVersions
    };
  }
}

// Singleton instance
export const versionControl = new VersionControl();
