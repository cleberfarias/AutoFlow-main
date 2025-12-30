import { getOpenAI } from "./openaiClient";

export type LLMResponseOptions = {
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
};

export async function generateResponse(prompt: string, opts: LLMResponseOptions = {}): Promise<string> {
  const model = opts.model || "gpt-4o-mini";
  const openai = getOpenAI();
  try {
    const messages = [];
    if (opts.systemPrompt) messages.push({ role: "system", content: opts.systemPrompt });
    messages.push({ role: "user", content: prompt });

    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: opts.maxTokens || 350
    });
    return response.choices[0]?.message?.content || "";
  } catch (err) {
    console.error("llmResponder error:", err);
    return "";
  }
}
