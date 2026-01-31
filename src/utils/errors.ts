/**
 * Standardized error codes for BertBot
 */
export enum ErrorCode {
  // Client errors (4xx equivalent)
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_MESSAGE = "INVALID_MESSAGE",
  INVALID_JSON = "INVALID_JSON",
  UNAUTHORIZED = "UNAUTHORIZED",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMITED = "RATE_LIMITED",

  // Server errors (5xx equivalent)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  TOOL_ERROR = "TOOL_ERROR",
  CONFIG_ERROR = "CONFIG_ERROR",
  HANDLER_ERROR = "HANDLER_ERROR",

  // Security errors
  SECURITY_VIOLATION = "SECURITY_VIOLATION",
  SANDBOX_VIOLATION = "SANDBOX_VIOLATION",
  PATH_TRAVERSAL = "PATH_TRAVERSAL",
  SSRF_ATTEMPT = "SSRF_ATTEMPT",

  // Legacy
  APP_ERROR = "APP_ERROR"
}

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  type: "error";
  code: ErrorCode | string;
  message: string;
  details?: unknown;
  retryable?: boolean;
}

/**
 * Base error class for BertBot with standardized error codes
 */
export class AppError extends Error {
  code: string;
  details?: unknown;
  retryable: boolean;

  constructor(message: string, code: ErrorCode | string = ErrorCode.APP_ERROR, details?: unknown, retryable = false) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    Error.captureStackTrace(this, this.constructor);
  }

  toResponse(): ErrorResponse {
    return {
      type: "error",
      code: this.code,
      message: this.message,
      details: this.details,
      retryable: this.retryable
    };
  }
}

/**
 * Alias for backward compatibility
 */
export class BertBotError extends AppError {}

/**
 * Convert any error to a standardized ErrorResponse
 */
export function toErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return error.toResponse();
  }

  if (error instanceof Error) {
    return {
      type: "error",
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message,
      retryable: false
    };
  }

  return {
    type: "error",
    code: ErrorCode.INTERNAL_ERROR,
    message: String(error),
    retryable: false
  };
}

/**
 * Determines if an error is recoverable and the service should continue
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }
  return false;
}

/**
 * Determines if an error is fatal and the service should stop
 */
export function isFatalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.code === ErrorCode.CONFIG_ERROR && !error.retryable;
  }
  return false;
}

/**
 * Get a user-friendly error message for common errors
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCode.RATE_LIMITED:
        return "You're sending messages too quickly. Please wait a moment and try again.";
      case ErrorCode.UNAUTHORIZED:
        return "You are not authorized to perform this action.";
      case ErrorCode.INVALID_INPUT:
      case ErrorCode.INVALID_MESSAGE:
      case ErrorCode.INVALID_JSON:
        return "Your request was invalid. Please check your input and try again.";
      case ErrorCode.PROVIDER_ERROR:
        return "The AI provider encountered an error. Please try again later.";
      case ErrorCode.TOOL_ERROR:
        return "A tool encountered an error while processing your request.";
      case ErrorCode.SECURITY_VIOLATION:
      case ErrorCode.SANDBOX_VIOLATION:
      case ErrorCode.PATH_TRAVERSAL:
      case ErrorCode.SSRF_ATTEMPT:
        return "Your request was blocked for security reasons.";
      default:
        return "Sorry, something went wrong. Please try again.";
    }
  }

  return "Sorry, something went wrong. Please try again.";
}
