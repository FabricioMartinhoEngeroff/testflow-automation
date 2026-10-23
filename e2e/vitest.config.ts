import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@support": path.resolve(__dirname, "support"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    // só lógica pura mora aqui — os specs do Playwright (E2E de verdade,
    // contra o PGR) ficam em specs/ e rodam com "npm run test:e2e",
    // não com o vitest (são runners diferentes, não devem se misturar)
    include: ["__tests__/**/*.spec.ts"],
    globals: true,
  },
})
