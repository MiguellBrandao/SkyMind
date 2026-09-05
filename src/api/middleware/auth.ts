import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env";

export async function requireAdminToken(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!env.ADMIN_API_TOKEN) {
    await reply.code(503).send({ error: "Admin API is not configured (set ADMIN_API_TOKEN to enable it)" });
    return;
  }
  const header = req.headers.authorization;
  if (header !== `Bearer ${env.ADMIN_API_TOKEN}`) {
    await reply.code(401).send({ error: "Unauthorized" });
  }
}
