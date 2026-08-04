// Errors from soxa carry a .config with the Authorization header attached
// (and a .toJSON() that serializes it back out), so only ever log the
// message - never the raw error/cause/config, which could leak the token.
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
