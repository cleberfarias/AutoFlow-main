
import { StepType, WorkflowStep } from "../types";

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
  // Send request to backend which should run the LLM safely on the server.
  try {
    const res = await fetch('/api/autoflow/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type: 'workflow' })
    });
    if (res.ok) {
      const data = await res.json();
      const steps: any[] = data?.steps || data?.generated?.steps || [];
      const TYPE_LABELS: Record<string, string> = {
        TRIGGER: 'Gatilho',
        ACTION: 'Ação',
        DATA: 'Dados',
        LOGIC: 'Lógica',
        ERROR_HANDLER: 'Erro'
      };

      return (steps || []).map((s: any) => {
        const type = Object.values(StepType).includes(s.type) ? s.type : StepType.ACTION;
        return {
          ...s,
          type,
          title: s.title || `${TYPE_LABELS[type] || type}`,
          description: s.description || '',
          params: s.params || { inputs: [], outputs: [] },
          nextSteps: s.nextSteps || []
        } as WorkflowStep;
      });
    }
  } catch (err) {
    console.warn('Backend /api/autoflow/suggest unavailable or failed', err);
  }

  // Fallback: no remote LLM available in browser
  console.warn('No suggestion available - remote LLM required');
  return [];
}

export async function getSuggestions(prompt: string): Promise<string[]> {
  try {
    const res = await fetch('/api/autoflow/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type: 'suggestions' })
    });
    if (res.ok) {
      const data = await res.json();
      return data?.suggestions || [];
    }
  } catch (err) {
    console.warn('suggestions endpoint unavailable', err);
  }
  // local fallback suggestions
  return ["Fidelização Automática", "Upsell no Checkout", "Lembrete de Reagendamento"];
}
