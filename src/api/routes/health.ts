import { readFileSync } from "node:fs";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { getHealthReport } from "../../services/healthService";

// Resolved from the working directory rather than __dirname, since __dirname differs between
// tsx (runs from src/) and the compiled dist/src/ output - same reasoning as the drizzle
// migrations folder in src/database/migrate.ts. The Dockerfile copies public/ alongside dist/.
const landingPageHtml = readFileSync(path.join(process.cwd(), "public", "landing.html"), "utf8");

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_req, reply) => {
    await reply.type("text/html; charset=utf-8").send(landingPageHtml);
  });

  app.get("/health", async (_req, reply) => {
    const report = await getHealthReport();
    const healthy = report.database && report.redis;
    await reply.code(healthy ? 200 : 503).send({ status: healthy ? "ok" : "degraded", ...report });
  });
}
