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

export class ValidationError extends AppError {
  constructor(message: string, public readonly field?: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class ConfigNotFoundError extends AppError {
  constructor(configId: string, configType: string = "Configuration") {
    super(`${configType} with id ${configId} not found`, "CONFIG_NOT_FOUND", 404);
  }
}