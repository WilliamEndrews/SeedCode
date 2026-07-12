import { describe, it, expect, vi } from "vitest";
import { streamChat, AllModelsFailedError } from "./gateway";

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

vi.mock("./models", () => ({
  buildFallbackChain: () => ["llama-3.3-70b-versatile"],
  providerOf: () => "groq",
  MODEL_REGISTRY: {
    "llama-3.3-70b-versatile": {
      provider: "groq",
      build: () => ({ id: "llama-3.3-70b-versatile" }),
    },
  },
}));

vi.mock("./rate-limit", () => ({
  canUse: () => true,
  recordSuccess: vi.fn(),
  recordRateLimit: vi.fn(),
}));

import { streamText } from "ai";

function makeReader(values: any[]) {
  let i = 0;
  return {
    read: () =>
      Promise.resolve(
        i < values.length ? { done: false, value: values[i++] } : { done: true, value: undefined }
      ),
    cancel: () => Promise.resolve(),
  };
}

describe("streamChat", () => {
  it("returns stream when model responds", async () => {
    (streamText as any).mockReturnValue({
      fullStream: {
        getReader: () =>
          makeReader([{ type: "text-delta", textDelta: "Hello " }, { type: "text-delta", textDelta: "world" }]),
      },
    });

    const result = await streamChat({
      requested: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "hi" }],
    });

    expect(result.model).toBe("llama-3.3-70b-versatile");
    const reader = result.stream.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    expect(text).toBe("Hello world");
  });

  it("throws AllModelsFailedError when model fails", async () => {
    (streamText as any).mockReturnValue({
      fullStream: {
        getReader: () => makeReader([{ type: "error", error: new Error("boom") }]),
      },
    });

    await expect(
      streamChat({
        requested: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hi" }],
      }),
    ).rejects.toBeInstanceOf(AllModelsFailedError);
  });
});
