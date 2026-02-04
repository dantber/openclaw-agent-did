/**
 * Custom error class for agent-did plugin errors
 */
export class AgentDidError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentDidError';
  }
}

/**
 * Normalize errors for consistent user experience
 */
export function normalizeError(error: unknown): AgentDidError {
  if (error instanceof AgentDidError) {
    return error;
  }

  if (error instanceof Error) {
    // Add actionable suggestions for common errors
    let message = error.message;
    let code: string | undefined;

    if (message.includes('Passphrase required')) {
      code = 'MISSING_PASSPHRASE';
      message =
        'Passphrase required. Set AGENT_DID_PASSPHRASE environment variable or use --no-encryption flag.';
    } else if (message.includes('Invalid passphrase')) {
      code = 'INVALID_PASSPHRASE';
      message = 'Invalid passphrase. Check your AGENT_DID_PASSPHRASE environment variable.';
    } else if (message.includes('not found') || message.includes('does not exist')) {
      code = 'NOT_FOUND';
    } else if (message.includes('already exists')) {
      code = 'ALREADY_EXISTS';
    } else if (message.includes('permission denied')) {
      code = 'PERMISSION_DENIED';
    }

    return new AgentDidError(message, code);
  }

  return new AgentDidError('An unexpected error occurred', 'UNKNOWN', {
    originalError: String(error),
  });
}

/**
 * Format error for display
 */
export function formatError(error: AgentDidError): string {
  let output = `❌ Error: ${error.message}`;

  if (error.code) {
    output += `\n   Code: ${error.code}`;
  }

  if (error.details) {
    output += `\n   Details: ${JSON.stringify(error.details, null, 2)}`;
  }

  return output;
}
