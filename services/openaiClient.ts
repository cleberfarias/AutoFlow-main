import OpenAI from "openai";

export function getOpenAI() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_OPENAI_API_KEY");
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}
