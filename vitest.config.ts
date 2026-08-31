import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: { reporter: ["text", "html"] },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./test-stubs/server-only.ts", import.meta.url),
      ),
      "client-only": fileURLToPath(
        new URL("./test-stubs/client-only.ts", import.meta.url),
      ),
    },
  },
});
