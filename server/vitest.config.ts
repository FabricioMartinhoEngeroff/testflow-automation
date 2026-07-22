import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    // só lógica pura mora aqui — os specs do Playwright (E2E de verdade,
    // contra o PGR) ficam em execution/specs/ e rodam com "npm run test:e2e",
    // não com o vitest (são runners diferentes, não devem se misturar)
    include: ["src/__tests__/**/*.spec.ts"],
    globals: true,
  },
})
