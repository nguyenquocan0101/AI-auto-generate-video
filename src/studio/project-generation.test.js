import { describe, expect, it } from "vitest";
import { readGenerationForm } from "../../studio/app/utils/project-generation.js";

describe("Studio generation form", () => {
  it("builds one request-scoped generation payload including the current API key", () => {
    const values = new Map([
      ["#generation-source-kind", "url"],
      ["#generation-source-value", " https://example.com/lesson "],
      ["#generation-provider", "openai"],
      ["#generation-model", " gpt-test "],
      ["#generation-api-key", " secret-canary "],
      ["#generation-renderer", "hyperframes"],
    ]);
    const query = (selector) => ({ value: values.get(selector) ?? "" });

    expect(readGenerationForm(query)).toEqual({
      source: { kind: "url", value: "https://example.com/lesson" },
      generation: { provider: "openai", model: "gpt-test", apiKey: "secret-canary" },
      renderer: "hyperframes",
    });
  });

  it("omits blank model and key values", () => {
    const query = (selector) => ({
      value: selector === "#generation-source-kind" ? "topic"
        : selector === "#generation-source-value" ? "Sorting"
          : selector === "#generation-provider" ? "local"
            : selector === "#generation-renderer" ? "ct-short-clip"
              : "",
    });

    expect(readGenerationForm(query).generation).toEqual({ provider: "local", model: undefined, apiKey: undefined });
  });
});
