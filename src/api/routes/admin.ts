import type { FastifyInstance } from "fastify";
import { linkedAccountRepository } from "../../database/repositories/linkedAccountRepository";
import { getHealthReport } from "../../services/healthService";
import { requireAdminToken } from "../middleware/auth";

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.get("/admin/health", { preHandler: requireAdminToken }, async (_req, reply) => {
    await reply.send(await getHealthReport());
  });

  app.get("/admin/stats", { preHandler: requireAdminToken }, async (_req, reply) => {
    const linkedAccounts = await linkedAccountRepository.countAll();
    await reply.send({ linkedAccounts });
  });
}
