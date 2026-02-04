/**
 * Output data as formatted JSON
 */
export function outputJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Output data as a simple table
 */
export function outputTable(data: Record<string, unknown>): string {
  const lines: string[] = [];
  const maxKeyLength = Math.max(...Object.keys(data).map((k) => k.length));

  for (const [key, value] of Object.entries(data)) {
    const paddedKey = key.padEnd(maxKeyLength);
    lines.push(`${paddedKey} : ${value}`);
  }

  return lines.join('\n');
}

/**
 * Format output based on JSON flag
 */
export function formatOutput(data: unknown, asJson = false): string {
  if (asJson) {
    return outputJson(data);
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return outputTable(data as Record<string, unknown>);
  }

  return outputJson(data);
}

/**
 * Format a DID for display (truncate if too long)
 */
export function formatDid(did: string, maxLength = 60): string {
  if (did.length <= maxLength) return did;
  return did.slice(0, maxLength - 3) + '...';
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString();
  } catch {
    return dateStr;
  }
}
