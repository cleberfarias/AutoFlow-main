export type LLMResponseOptions = {
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
};

export async function generateResponse(prompt: string, opts: LLMResponseOptions = {}): Promise<string> {
  // Use backend endpoint to perform LLM calls safely on server
  try {
    const res = await fetch('/api/autoflow/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, opts })
    });
    
    if (res.ok) {
      const data = await res.json();
      return data?.response || 'Desculpe, não consegui gerar uma resposta adequada.';
    } else {
      console.warn('LLM endpoint returned error:', res.status);
      return 'Desculpe, o serviço de IA está temporariamente indisponível.';
    }
  } catch (err) {
    console.warn('LLM endpoint unavailable', err);
    return 'Desculpe, não foi possível conectar ao serviço de IA. Tente novamente mais tarde.';
  }
}
