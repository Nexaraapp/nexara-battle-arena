import { toast } from "sonner";

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

// Standard error interface
export interface AppError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
}

// Error codes mapping
export const ErrorCodes = {
  AUTHENTICATION: {
    NOT_AUTHENTICATED: "AUTH001",
    INVALID_CREDENTIALS: "AUTH002",
    SESSION_EXPIRED: "AUTH003"
  },
  TRANSACTION: {
    INSUFFICIENT_BALANCE: "TRX001",
    FAILED_PROCESSING: "TRX002",
    INVALID_AMOUNT: "TRX003"
  },
  MATCH: {
    JOIN_FAILED: "MATCH001",
    FULL_CAPACITY: "MATCH002",
    INVALID_STATE: "MATCH003"
  },
  API: {
    NETWORK_ERROR: "API001",
    TIMEOUT: "API002",
    INVALID_RESPONSE: "API003"
  }
};

// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  shouldRetry: (error: any) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  shouldRetry: (error: any) => {
    // By default, retry on network errors or timeouts
    return error.code === ErrorCodes.API.NETWORK_ERROR ||
           error.code === ErrorCodes.API.TIMEOUT;
  }
};

// Main error handler
export const handleError = (
  error: Error | AppError | any,
  context?: Record<string, any>
): void => {
  let appError: AppError;

  // Normalize error to AppError format
  if ((error as AppError).code) {
    appError = error as AppError;
  } else {
    appError = {
      code: "UNKNOWN",
      message: error.message || "An unexpected error occurred",
      severity: ErrorSeverity.MEDIUM,
      context
    };
  }

  // Log error based on severity
  const logError = () => {
    const errorDetails = {
      code: appError.code,
      message: appError.message,
      context: { ...appError.context, ...context },
      timestamp: new Date().toISOString()
    };

    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
        console.error("CRITICAL ERROR:", errorDetails);
        break;
      case ErrorSeverity.HIGH:
        console.error("ERROR:", errorDetails);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn("WARNING:", errorDetails);
        break;
      case ErrorSeverity.LOW:
        console.info("INFO:", errorDetails);
        break;
    }
  };

  // Show user feedback
  const notifyUser = () => {
    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(appError.message, {
          duration: 5000,
          description: "Please contact support if this persists."
        });
        break;
      case ErrorSeverity.HIGH:
        toast.error(appError.message, { duration: 4000 });
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(appError.message, { duration: 3000 });
        break;
      case ErrorSeverity.LOW:
        toast.info(appError.message, { duration: 2000 });
        break;
    }
  };

  logError();
  notifyUser();
}

// Retry mechanism for async operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...defaultRetryConfig, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === retryConfig.maxAttempts || !retryConfig.shouldRetry(error)) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, retryConfig.delayMs));
    }
  }

  throw lastError;
}

// Create specific error instances
export const createAuthError = (
  code: keyof typeof ErrorCodes.AUTHENTICATION,
  message: string,
  context?: Record<string, any>
): AppError => ({
  code: ErrorCodes.AUTHENTICATION[code],
  message,
  severity: ErrorSeverity.HIGH,
  context
});

export const createTransactionError = (
  code: keyof typeof ErrorCodes.TRANSACTION,
  message: string,
  context?: Record<string, any>
): AppError => ({
  code: ErrorCodes.TRANSACTION[code],
  message,
  severity: ErrorSeverity.HIGH,
  context
});

export const createMatchError = (
  code: keyof typeof ErrorCodes.MATCH,
  message: string,
  context?: Record<string, any>
): AppError => ({
  code: ErrorCodes.MATCH[code],
  message,
  severity: ErrorSeverity.MEDIUM,
  context
});

export const createApiError = (
  code: keyof typeof ErrorCodes.API,
  message: string,
  context?: Record<string, any>
): AppError => ({
  code: ErrorCodes.API[code],
  message,
  severity: ErrorSeverity.HIGH,
  context
}); 