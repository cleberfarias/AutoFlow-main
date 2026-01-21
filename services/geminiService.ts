import { StepType, WorkflowStep } from "../types";
import { settingsManager } from './settingsManager';

export async function generateWorkflowFromPrompt(prompt: string): Promise<WorkflowStep[]> {
  try {
    // Obter chave de API salva nas configurações
    const apiKey = settingsManager.getSettings().api.openaiKey;
    
    console.log('🤖 Gerando workflow com prompt:', prompt.substring(0, 50) + '...');
    console.log('🔑 Chave API configurada:', apiKey ? 'Sim' : 'Não');
    
    // Chamar backend para gerar workflow
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-OpenAI-Key': apiKey })
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('❌ Backend retornou erro:', response.status, error);
      throw new Error(error?.error || `Backend retornou status ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Resposta do backend:', data);
    
    const steps = data?.steps || [];
    
    if (!Array.isArray(steps)) {
      console.error('❌ Resposta não é um array:', steps);
      throw new Error('Backend retornou formato inválido (steps não é um array)');
    }
    
    if (steps.length === 0) {
      console.warn('⚠️ Backend retornou array vazio');
      throw new Error('Backend retornou resposta vazia. Tente um prompt mais específico.');
    }
    
    console.log(`✅ ${steps.length} steps recebidos do backend`);
    
    const TYPE_LABELS: Record<string, string> = {
      TRIGGER: 'Gatilho',
      ACTION: 'Ação',
      DATA: 'Dados',
      LOGIC: 'Lógica',
      ERROR_HANDLER: 'Erro'
    };

    const VALID_TYPES = Object.values(StepType);
    return steps.map((s: any, idx: number) => {
      const type = VALID_TYPES.includes(s.type) ? s.type : StepType.ACTION;
      return {
        id: s.id || String(idx + 1),
        type,
        title: s.title || `${TYPE_LABELS[type] || type}`,
        description: s.description || '',
        params: s.params || { inputs: [], outputs: [] },
        nextSteps: s.nextSteps || [],
        position: { x: 0, y: 0 }
      } as WorkflowStep;
    });
  } catch (error: any) {
    console.error('❌ Erro na geração do workflow:', error);
    throw new Error(error?.message || 'Erro ao gerar workflow via backend');
  }
}

export async function getSuggestions(prompt: string): Promise<string[]> {
  try {
    // Obter chave de API salva nas configurações
    const apiKey = settingsManager.getSettings().api.openaiKey;
    
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-OpenAI-Key': apiKey })
      },
      body: JSON.stringify({ prompt })
    });
    if (!resp.ok) return ["Fidelização Automática", "Upsell no Checkout", "Lembrete de Reagendamento"];
    const data = await resp.json().catch(() => ({}));
    // Try to extract suggestions from returned steps or suggestions field
    if (Array.isArray(data?.suggestions)) return data.suggestions;
    if (Array.isArray(data?.steps)) return (data.steps || []).slice(0,3).map((s:any)=> s.title || s.id || 'Sugestão');
    return ["Fidelização Automática", "Upsell no Checkout", "Lembrete de Reagendamento"];
  } catch (e) {
    return ["Fidelização Automática", "Upsell no Checkout", "Lembrete de Reagendamento"];
  }
}
