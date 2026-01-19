import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(
  error: FastifyError | any,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log strutturato con tutte le info utili
  request.log.error({
    err: error,
    url: request.url,
    method: request.method,
    statusCode: error.statusCode,
    validation: error.validation,
    stack: error.stack
  }, 'Request error');

  
  if (error.validation) {
    return reply.status(400).send({
      error: "Validation Error",
      message: error.message,
      details: error.validation,
      validationContext: error.validationContext 
    });
  }

  
  if (error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
    return reply.status(415).send({
      error: "Unsupported Media Type",
      message: "Content-Type non supportato. Usa application/json"
    });
  }

  if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    return reply.status(413).send({
      error: "Payload Too Large",
      message: "Il body della richiesta è troppo grande"
    });
  }

  if (error.code === 'FST_ERR_CTP_INVALID_CONTENT_LENGTH') {
    return reply.status(400).send({
      error: "Bad Request",
      message: "Content-Length non valido"
    });
  }

  
  const statusCode = error.statusCode || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;
  const isProduction = process.env.NODE_ENV === 'production';

  
  const shouldShowDetails = isClientError || !isProduction;


const response: any = {
  error: getErrorName(statusCode),
  message: shouldShowDetails ? error.message : "Si è verificato un errore interno"
};
if (error.details && shouldShowDetails) {
  response.details = error.details;
}
if (!isProduction && !isClientError && error.stack) {
  response.stack = error.stack;
}

return reply.status(statusCode).send(response);
}


function getErrorName(statusCode: number): string {
  const errorNames: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    415: "Unsupported Media Type",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable"
  };
  
  return errorNames[statusCode] || (statusCode >= 500 ? "Internal Server Error" : "Error");
}