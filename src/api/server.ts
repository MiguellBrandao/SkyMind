import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { registerAdminRoutes } from "./routes/admin";
import { registerHealthRoutes } from "./routes/health";

export async function startApiServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, trustProxy: true, bodyLimit: 1024 * 1024 });

  await app.register(cors, { origin: false });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  app.setErrorHandler(errorHandler);

  await registerHealthRoutes(app);
  await registerAdminRoutes(app);

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    logger.info({ port: env.API_PORT, host: env.API_HOST }, "API server listening");
  } catch (err) {
    logger.error({ err }, "Failed to start API server");
  }

  return app;
}
