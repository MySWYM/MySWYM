/**
 * Résultat standardisé des tools Arthur AI.
 */
export function toolOk(data: Record<string, unknown> = {}) {
  return { success: true, data, error: null as string | null };
}

export function toolFail(
  error: unknown,
  data: Record<string, unknown> = {},
) {
  return {
    success: false,
    data,
    error: typeof error === "string" ? error : "tool_error",
  };
}
