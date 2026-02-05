/**
 * Domain Errors
 * Pure TypeScript - No React, No Axios dependencies
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ApiExecutionError extends AppError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseData?: any
  ) {
    super(message, "API_EXECUTION_ERROR", statusCode);
  }
}

export class ConfigNotFoundError extends AppError {
  constructor(configId: string) {
    super(`Configuration with id ${configId} not found`, "CONFIG_NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly field?: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}
