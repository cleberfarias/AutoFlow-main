// Template Manager Service - Sistema de gerenciamento de templates de workflows

import { WorkflowStep } from '../types';
import { logger } from './logger';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'atendimento' | 'vendas' | 'suporte' | 'marketing' | 'operacional';
  steps: WorkflowStep[];
  stepsCount: number;
  usageCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  tags: string[];
  isPublic: boolean;
  isFeatured: boolean;
  metadata?: Record<string, any>;
}

class TemplateManager {
  private templates: WorkflowTemplate[] = [];
  private subscribers: ((templates: WorkflowTemplate[]) => void)[] = [];
  private maxTemplates = 100;

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultTemplates();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('autoflow_templates');
      if (stored) {
        this.templates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar templates do localStorage', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('autoflow_templates', JSON.stringify(this.templates));
    } catch (error) {
      console.error('Erro ao salvar templates no localStorage', error);
    }
  }

  private notify() {
    this.subscribers.forEach(callback => callback([...this.templates]));
  }

  private initializeDefaultTemplates() {
    // Só inicializa se não houver templates
    if (this.templates.length === 0) {
      const defaultTemplates: WorkflowTemplate[] = [
        {
          id: 'default-1',
          name: 'Atendimento Inicial',
          description: 'Template completo para primeiro contato com clientes, incluindo saudação, qualificação e direcionamento.',
          category: 'atendimento',
          steps: [],
          stepsCount: 8,
          usageCount: 0,
          rating: 4.8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'Sistema',
          tags: ['whatsapp', 'saudação', 'qualificação'],
          isPublic: true,
          isFeatured: true
        },
        {
          id: 'default-2',
          name: 'Funil de Vendas',
          description: 'Workflow otimizado para conversão de leads, com follow-up automático e scoring de interesse.',
          category: 'vendas',
          steps: [],
          stepsCount: 12,
          usageCount: 0,
          rating: 4.9,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'Sistema',
          tags: ['leads', 'conversão', 'follow-up', 'crm'],
          isPublic: true,
          isFeatured: true
        },
        {
          id: 'default-3',
          name: 'Suporte Técnico',
          description: 'Triagem e roteamento inteligente de tickets de suporte com base em prioridade e categoria.',
          category: 'suporte',
          steps: [],
          stepsCount: 10,
          usageCount: 0,
          rating: 4.7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'Sistema',
          tags: ['tickets', 'prioridade', 'roteamento', 'sla'],
          isPublic: true,
          isFeatured: false
        }
      ];

      this.templates = defaultTemplates;
      this.saveToStorage();
    }
  }

  createTemplate(
    name: string,
    description: string,
    category: 'atendimento' | 'vendas' | 'suporte' | 'marketing' | 'operacional',
    steps: WorkflowStep[],
    author: string,
    options?: {
      tags?: string[];
      isPublic?: boolean;
      isFeatured?: boolean;
    }
  ): WorkflowTemplate {
    const newTemplate: WorkflowTemplate = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      description,
      category,
      steps: JSON.parse(JSON.stringify(steps)), // Deep clone
      stepsCount: steps.length,
      usageCount: 0,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author,
      tags: options?.tags || [],
      isPublic: options?.isPublic ?? false,
      isFeatured: options?.isFeatured ?? false,
      metadata: {
        originalStepsCount: steps.length
      }
    };

    this.templates.push(newTemplate);

    // Limitar número de templates
    if (this.templates.length > this.maxTemplates) {
      // Remover templates menos usados (exceto featured)
      const sorted = [...this.templates]
        .filter(t => !t.isFeatured)
        .sort((a, b) => a.usageCount - b.usageCount);
      
      const toRemove = sorted[0];
      this.templates = this.templates.filter(t => t.id !== toRemove.id);
    }

    this.saveToStorage();
    this.notify();

    logger.logTemplateApply(name, author);

    return newTemplate;
  }

  getTemplates(filters?: {
    category?: string;
    isPublic?: boolean;
    isFeatured?: boolean;
    searchQuery?: string;
  }): WorkflowTemplate[] {
    let result = [...this.templates];

    if (filters) {
      if (filters.category && filters.category !== 'all') {
        result = result.filter(t => t.category === filters.category);
      }
      if (filters.isPublic !== undefined) {
        result = result.filter(t => t.isPublic === filters.isPublic);
      }
      if (filters.isFeatured !== undefined) {
        result = result.filter(t => t.isFeatured === filters.isFeatured);
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        result = result.filter(t => 
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
    }

    return result.sort((a, b) => {
      // Featured primeiro
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Depois por rating
      if (a.rating !== b.rating) return b.rating - a.rating;
      // Depois por uso
      return b.usageCount - a.usageCount;
    });
  }

  getTemplate(templateId: string): WorkflowTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  }

  applyTemplate(templateId: string, author: string): WorkflowStep[] | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      logger.error('Template não encontrado', {
        action: 'template.apply.error',
        user: author,
        details: `Template ${templateId} não encontrado`
      });
      return null;
    }

    // Incrementar contador de uso
    template.usageCount++;
    template.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.notify();

    logger.logTemplateApply(template.name, author);

    // Retornar deep clone dos steps
    return JSON.parse(JSON.stringify(template.steps));
  }

  updateTemplate(
    templateId: string,
    updates: Partial<WorkflowTemplate>,
    author: string
  ): boolean {
    const template = this.getTemplate(templateId);
    if (!template) return false;

    Object.assign(template, updates, {
      updatedAt: new Date().toISOString()
    });

    if (updates.steps) {
      template.stepsCount = updates.steps.length;
    }

    this.saveToStorage();
    this.notify();

    logger.info('Template atualizado', {
      workflow: template.name,
      user: author,
      action: 'template.update',
      details: `Template "${template.name}" atualizado`,
      metadata: { templateId }
    });

    return true;
  }

  deleteTemplate(templateId: string, author: string): boolean {
    const template = this.getTemplate(templateId);
    if (!template) return false;

    // Não permitir deletar templates do sistema (featured)
    if (template.isFeatured && template.author === 'Sistema') {
      logger.warning('Tentativa de deletar template do sistema', {
        workflow: template.name,
        user: author,
        action: 'template.delete.blocked',
        details: 'Templates do sistema não podem ser deletados'
      });
      return false;
    }

    this.templates = this.templates.filter(t => t.id !== templateId);
    this.saveToStorage();
    this.notify();

    logger.info('Template deletado', {
      workflow: template.name,
      user: author,
      action: 'template.delete',
      details: `Template "${template.name}" deletado`,
      metadata: { templateId }
    });

    return true;
  }

  rateTemplate(templateId: string, rating: number, author: string): boolean {
    const template = this.getTemplate(templateId);
    if (!template) return false;

    // Calcular nova média (simplificado - em produção seria mais sofisticado)
    const totalRatings = template.usageCount || 1;
    template.rating = ((template.rating * totalRatings) + rating) / (totalRatings + 1);
    template.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.notify();

    logger.info('Template avaliado', {
      workflow: template.name,
      user: author,
      action: 'template.rate',
      details: `Avaliação: ${rating} estrelas`,
      metadata: { templateId, rating, newAverage: template.rating.toFixed(1) }
    });

    return true;
  }

  duplicateTemplate(templateId: string, author: string, newName?: string): WorkflowTemplate | null {
    const original = this.getTemplate(templateId);
    if (!original) return null;

    const duplicated = this.createTemplate(
      newName || `${original.name} (Cópia)`,
      original.description,
      original.category,
      original.steps,
      author,
      {
        tags: [...original.tags, 'duplicado'],
        isPublic: false,
        isFeatured: false
      }
    );

    logger.info('Template duplicado', {
      workflow: original.name,
      user: author,
      action: 'template.duplicate',
      details: `Template "${original.name}" duplicado como "${duplicated.name}"`,
      metadata: { originalId: templateId, duplicatedId: duplicated.id }
    });

    return duplicated;
  }

  subscribe(callback: (templates: WorkflowTemplate[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  exportTemplates(format: 'json' = 'json'): string {
    return JSON.stringify(this.templates, null, 2);
  }

  importTemplates(data: string, author: string): { success: number; errors: number } {
    try {
      const imported = JSON.parse(data) as WorkflowTemplate[];
      let success = 0;
      let errors = 0;

      imported.forEach(template => {
        try {
          this.createTemplate(
            template.name,
            template.description,
            template.category,
            template.steps,
            author,
            {
              tags: template.tags,
              isPublic: template.isPublic,
              isFeatured: false // Não importar como featured
            }
          );
          success++;
        } catch (error) {
          errors++;
        }
      });

      logger.info('Templates importados', {
        user: author,
        action: 'template.import',
        details: `${success} templates importados, ${errors} erros`,
        metadata: { success, errors }
      });

      return { success, errors };
    } catch (error) {
      logger.error('Erro ao importar templates', {
        user: author,
        action: 'template.import.error',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return { success: 0, errors: 1 };
    }
  }

  getStats() {
    const totalTemplates = this.templates.length;
    const publicTemplates = this.templates.filter(t => t.isPublic).length;
    const featuredTemplates = this.templates.filter(t => t.isFeatured).length;
    const totalUsage = this.templates.reduce((sum, t) => sum + t.usageCount, 0);
    const avgRating = this.templates.reduce((sum, t) => sum + t.rating, 0) / totalTemplates || 0;

    const categoryCounts = this.templates.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTemplates,
      publicTemplates,
      featuredTemplates,
      totalUsage,
      avgRating: parseFloat(avgRating.toFixed(1)),
      categoryCounts
    };
  }
}

// Singleton instance
export const templateManager = new TemplateManager();
