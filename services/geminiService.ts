import { StepType, WorkflowStep } from "../types";

export async function generateWorkflowFromPrompt(prompt: string): Promise<WorkflowStep[]> {
  try {
    // Chamar backend para gerar workflow (sem expor chave no frontend)
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error?.error || `Backend retornou status ${response.status}`);
    }

    const data = await response.json();
    const steps = data?.steps || [];
    
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Backend retornou resposta inválida ou vazia');
    }
    
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
    console.error('Erro na geração do workflow:', error);
    throw new Error(error?.message || 'Erro ao gerar workflow via backend');
  }
}

export async function getSuggestions(prompt: string): Promise<string[]> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Sugira 3 formas rápidas de aumentar o faturamento usando automação.
Responda SOMENTE com JSON no formato { "suggestions": ["...", "...", "..."] }.`
      },
      { role: "user", content: `Pedido: "${prompt}"` }
    ]
  });
  try { 
    const content = response.choices[0]?.message?.content || "";
    const parsed = parseJson<{ suggestions?: string[] } | string[]>(content);
    if (Array.isArray(parsed)) return parsed;
    return parsed?.suggestions || []; 
  } catch { 
    return ["Fidelização Automática", "Upsell no Checkout", "Lembrete de Reagendamento"]; 
  }
}
