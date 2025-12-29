
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
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Você é um Consultor Sênior de Crescimento para PMEs brasileiros.

Sua tarefa é desenhar o fluxo de trabalho ideal focado em LUCRO e ECONOMIA DE TEMPO.
Use termos de NEGÓCIO claros.

ESTRUTURA DOS NÓS:
1. TRIGGER: O que inicia o processo (ex: "Recebeu Mensagem", "Novo Pedido").
2. ACTION: Uma tarefa realizada (ex: "Calcular Desconto", "Enviar Notificação").
3. DATA: Armazenar ou buscar info (ex: "Salvar na Planilha Financeira", "Consultar Estoque").
4. LOGIC: Uma decisão (ex: "Cliente é VIP?", "Valor acima de R$100?").

REGRAS:
- 'inputs' e 'outputs' devem ter nomes legíveis por humanos (ex: ["valor_total", "data_entrega"]).
- 'nextSteps' deve conectar os IDs corretamente para formar um fluxo lógico.
Responda SOMENTE com JSON no formato { "steps": [...] }.`
      },
      { role: "user", content: `Pedido do cliente: "${prompt}"` }
    ]
  });

  try {
    const content = response.choices[0]?.message?.content || "";
    const parsed = parseJson<{ steps?: WorkflowStep[] } | WorkflowStep[]>(content);
    const steps = Array.isArray(parsed) ? parsed : parsed?.steps || [];
    const TYPE_LABELS: Record<string, string> = {
      TRIGGER: 'Gatilho',
      ACTION: 'Ação',
      DATA: 'Dados',
      LOGIC: 'Lógica',
      ERROR_HANDLER: 'Erro'
    };

    return steps.map((s: any) => {
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
  } catch (error) {
    console.error("Erro na geração do workflow:", error);
    return [];
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
