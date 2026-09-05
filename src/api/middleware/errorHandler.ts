import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger";

export function errorHandler(error: FastifyError, _req: FastifyRequest, reply: FastifyReply): void {
  logger.error({ err: error }, "API request error");
  const statusCode = error.statusCode ?? 500;
  reply.code(statusCode).send({ error: statusCode >= 500 ? "Internal server error" : error.message });
}
