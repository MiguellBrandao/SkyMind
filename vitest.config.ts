import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      DISCORD_BOT_TOKEN: "test-discord-token",
      DISCORD_CLIENT_ID: "test-client-id",
      HYPIXEL_API_KEY: "test-hypixel-key",
      DATABASE_URL: "postgresql://skymind:skymind@localhost:5432/skymind_test",
      REDIS_URL: "redis://localhost:6379/15",
      ENCRYPTION_KEY: "0".repeat(64),
      DEFAULT_AI_API_KEY: "test-ai-key",
    },
  },
});
