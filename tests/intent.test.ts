import { describe, it, expect } from "vitest";
import { detectIntent, listIntents } from "../services/intentService";

describe("intentService PoC", () => {
  it("should load intents", async () => {
    const intents = await listIntents();
    expect(intents.length).toBeGreaterThan(0);
  });

  it("should exact-match greeting", async () => {
    const res = await detectIntent("Oi");
    expect(res.intentId).toBe("greeting");
    expect(res.score).toBe(1);
    expect(res.method).toBe("exact");
  });

  it("should find price_query by similarity", async () => {
    const res = await detectIntent("Quanto custa o zapgpt?");
    expect(res.intentId).toBe("price_query");
    expect(res.score).toBeGreaterThan(0);
    expect(["semantic", "exact", "fallback"]).toContain(res.method);
  });

  it("should fallback when unknown", async () => {
    const res = await detectIntent("qwertyuiop zxcvbnm");
    expect(res.intentId).toBeNull();
    expect(res.method).toBe("fallback");
  });
});
