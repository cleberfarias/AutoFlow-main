import { StepType, WorkflowStep } from "../types";

export async function generateWorkflowFromPrompt(prompt: string): Promise<WorkflowStep[]> {
  try {
    // Usar API do OpenAI diretamente do frontend
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Chave da API OpenAI não configurada. Adicione VITE_OPENAI_API_KEY no arquivo .env');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Você é um especialista em automação de fluxos de trabalho. Gere um workflow estruturado baseado na descrição do usuário.

TIPOS DE STEPS VÁLIDOS:
- TRIGGER: Gatilho inicial (webhook, evento, tempo)
- ACTION: Ação/operação (enviar email, criar registro, chamar API)
- DATA: Transformação de dados
- LOGIC: Condições e lógica (if/else, loops)
- ERROR_HANDLER: Tratamento de erros

Responda APENAS com JSON no formato:
{
  "steps": [
    {
      "id": "1",
      "type": "TRIGGER|ACTION|DATA|LOGIC|ERROR_HANDLER",
      "title": "Nome do passo",
      "description": "Descrição detalhada",
      "params": {
        "inputs": [],
        "outputs": []
      },
      "nextSteps": ["2"]
    }
  ]
}

Gere entre 3-8 steps conectados logicamente.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || `API retornou status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const steps = parsed?.steps || [];
    
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
    throw new Error(error?.message || 'Erro ao gerar workflow. Verifique sua chave da API OpenAI.');
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
