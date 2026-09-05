import type { FastifyInstance } from "fastify";
import { getHealthReport } from "../../services/healthService";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_req, reply) => {
    await reply.send({ name: "SkyMind", status: "running" });
  });

  app.get("/health", async (_req, reply) => {
    const report = await getHealthReport();
    const healthy = report.database && report.redis;
    await reply.code(healthy ? 200 : 503).send({ status: healthy ? "ok" : "degraded", ...report });
  });
}
