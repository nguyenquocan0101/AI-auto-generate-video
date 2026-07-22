function value(query, selector) {
  return query(selector)?.value?.trim() || "";
}

export function readGenerationForm(query = (selector) => document.querySelector(selector)) {
  const provider = value(query, "#generation-provider");
  return {
    source: {
      kind: value(query, "#generation-source-kind"),
      value: value(query, "#generation-source-value"),
    },
    generation: {
      provider,
      model: value(query, "#generation-model") || undefined,
      apiKey: value(query, "#generation-api-key") || undefined,
    },
    renderer: value(query, "#generation-renderer"),
  };
}
