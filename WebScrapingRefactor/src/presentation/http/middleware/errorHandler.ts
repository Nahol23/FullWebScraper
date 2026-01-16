import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log dell'errore
  console.error(error);

  // Gestione errori custom
  if (error.message.includes("Nome obbligatorio")) {
    return reply.status(400).send({ error: "Nome obbligatorio" });
  }
  if (error.message.includes("Configurazione non trovata")) {
    return reply.status(404).send({ error: "Configurazione non trovata" });
  }

  // Errore generico
  return reply.status(500).send({ error: "Errore interno del server" });
}