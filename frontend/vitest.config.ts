import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    // simula o DOM do navegador (localStorage, document, etc.) rodando em Node
    environment: "jsdom",
    // roda antes de cada arquivo de teste — limpa estado entre eles
    setupFiles: "./src/__tests__/setup/vitest.setup.ts",
    // permite usar describe/test/expect sem importar em cada arquivo
    globals: true,
  },
})
