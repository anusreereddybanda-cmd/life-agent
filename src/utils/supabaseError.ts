export function formatSupabaseError(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error instanceof Error) return error.message;
  if (typeof error !== 'object' || error === null) return fallback;

  const errorRecord = error as Record<string, unknown>;
  const fields = ['message', 'code', 'details', 'hint', 'statusCode'] as const;
  const parts = fields.flatMap((field) => {
    const value = errorRecord[field];
    return typeof value === 'string' && value.trim()
      ? [`${field === 'message' ? '' : `${field}: `}${value.trim()}`]
      : [];
  });

  return parts.length > 0 ? parts.join(' · ') : fallback;
}
