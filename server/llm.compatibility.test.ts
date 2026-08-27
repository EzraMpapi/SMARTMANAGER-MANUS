import { afterEach, describe, expect, it, vi } from "vitest";

function providerResponse() {
  return new Response(JSON.stringify({
    id: "test-response",
    created: 1,
    model: "test-model",
    choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
  }), { status: 200, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("LLM model-compatible completion limits", () => {
  it("sends max_completion_tokens for GPT-5 models", async () => {
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "test-key");
    vi.stubEnv("BUILT_IN_FORGE_API_URL", "https://forge.test");
    const fetchMock = vi.fn().mockResolvedValue(providerResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { invokeLLM } = await import("./_core/llm");

    await invokeLLM({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 1200,
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body));
    expect(payload.max_completion_tokens).toBe(1200);
    expect(payload.max_tokens).toBeUndefined();
  });

  it("keeps max_tokens for non-GPT models", async () => {
    vi.stubEnv("BUILT_IN_FORGE_API_KEY", "test-key");
    vi.stubEnv("BUILT_IN_FORGE_API_URL", "https://forge.test");
    const fetchMock = vi.fn().mockResolvedValue(providerResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { invokeLLM } = await import("./_core/llm");

    await invokeLLM({
      model: "claude-haiku-4-5",
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 1200,
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body));
    expect(payload.max_tokens).toBe(1200);
    expect(payload.max_completion_tokens).toBeUndefined();
  });
});
