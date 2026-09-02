export function logError(context: string, err: unknown): void {
  const error = err instanceof Error ? err : new Error(String(err));

  console.error(`[${context}] ${errorDetails(error)}`);
  console.error(error.stack);
}

function errorDetails(error: Error): string {
  const code = (error as { code?: unknown }).code;
  if (code === undefined) return error.message;

  return `${error.message} [${code}]`;
}
