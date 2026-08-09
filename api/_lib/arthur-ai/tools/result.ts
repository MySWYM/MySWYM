/**
 * Résultat standardisé des tools Arthur AI.
 */
export function toolOk(data = {}) {
  return { success: true, data, error: null };
}

export function toolFail(error, data = {}) {
  return {
    success: false,
    data,
    error: typeof error === "string" ? error : "tool_error",
  };
}
