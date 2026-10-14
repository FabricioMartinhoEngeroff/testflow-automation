import { defineConfig, devices } from "@playwright/test"
import { env } from "./shared/env"

export default defineConfig({
  // roda um cenário de cada vez — evita dois testes mexendo no mesmo
  // registro/tela real do Apollus ao mesmo tempo e colidindo
  fullyParallel: false,
  workers: 1,

  // "open: never" — o relatório só abre quando pedido com "npm run test:e2e:report"
  reporter: [["html", { open: "never" }]],

  use: {
    baseURL: env.baseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // o navegador do Playwright abre "limpo" e o app decide o idioma pelo
    // navegador — sem isso carrega em inglês e os locators em português falham
    locale: "pt-BR",
  },

  // um project por módulo: roda um com "--project=pgr", ou todos de uma vez
  projects: [
    {
      name: "login",
      testDir: "./e2e/specs",
      testMatch: "login.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "ltcat",
      testDir: "./e2e/specs/ltcat",
      // login (~10s) + preenchimento do cadastro passam dos 30s padrão
      timeout: 60000,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "pgr",
      testDir: "./e2e/specs/pgr",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "profissional",
      testDir: "./e2e/specs/profissional",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // scripts de carga, não são testes de verdade: sem trace nem vídeo
      name: "scripts",
      testDir: "./scripts",
      use: { ...devices["Desktop Chrome"], trace: "off", video: "off" },
    },
  ],
})
