export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function toErrorBody(error, requestId) {
  const safe = error instanceof ApiError
    ? error
    : new ApiError(500, "INTERNAL_ERROR", "Internal server error");

  return {
    status: safe.status,
    body: {
      error: {
        code: safe.code,
        message: safe.message,
        requestId,
        details: safe.details
      }
    }
  };
}
