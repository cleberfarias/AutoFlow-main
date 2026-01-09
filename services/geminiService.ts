
import { StepType, WorkflowStep } from "../types";
import { getOpenAI } from "./openaiClient";

function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text);
  } catch {}
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function generateWorkflowFromPrompt(prompt: string): Promise<WorkflowStep[]> {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || 'generate_failed');
    }
    const data = await res.json();
    const steps = data?.steps || [];
    const TYPE_LABELS: Record<string, string> = {
      TRIGGER: 'Gatilho',
      ACTION: 'Ação',
      DATA: 'Dados',
      LOGIC: 'Lógica',
      ERROR_HANDLER: 'Erro'
    };

    const VALID_TYPES = Object.values(StepType);
    return steps.map((s: any) => {
      const type = VALID_TYPES.includes(s.type) ? s.type : StepType.ACTION;
      return {
        ...s,
        type,
        title: s.title || `${TYPE_LABELS[type] || type}`,
        description: s.description || '',
        params: s.params || { inputs: [], outputs: [] },
        nextSteps: s.nextSteps || []
      } as WorkflowStep;
    });
  } catch (error) {
    console.error('Erro na geração do workflow:', error);
    throw error;
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
