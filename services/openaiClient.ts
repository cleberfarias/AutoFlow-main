import OpenAI from "openai";

export function getOpenAI() {
  // Prevent accidental use of OpenAI directly from the browser.
  if (typeof window !== 'undefined') {
    throw new Error(
      "OpenAI usage from browser is forbidden. Move OpenAI calls to the server and expose a backend endpoint (ex: POST /api/autoflow/suggest) instead."
    );
  }

  // Server-side usage: read API key from process.env
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY on the server");
  }
  return new OpenAI({ apiKey });
}
