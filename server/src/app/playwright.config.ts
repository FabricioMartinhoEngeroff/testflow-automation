import { defineConfig, devices } from "@playwright/test"
import { env } from "./shared/env"

// usa o Edge instalado no Windows em vez do Chromium baixado pelo Playwright
const edge = { ...devices["Desktop Edge"], channel: "msedge" }

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
    screenshot: "on",
    video: "on",
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
      use: { ...edge },
    },
    {
      name: "ltcat",
      testDir: "./e2e/specs/seguranca/programas-e-laudos/ltcat",
      // login (~10s) + preenchimento do cadastro passam dos 30s padrão
      timeout: 60000,
      use: { ...edge },
    },
    {
      name: "pgr",
      testDir: "./e2e/specs/seguranca/programas-e-laudos/pgr",
      use: { ...edge },
    },
    {
      name: "profissional",
      testDir: "./e2e/specs/seguranca/gro/profissional",
      use: { ...edge },
    },
    {
      name: "modelos-de-documento",
      testDir: "./e2e/specs/cadastros-auxiliares/gerais/modelos-de-documento",
      use: { ...edge },
    },
    {
      name: "perfis-de-acesso",
      testDir: "./e2e/specs/perfis-de-acesso/gerenciar-perfis",
      use: { ...edge },
    },
    {
      // scripts de carga, não são testes de verdade: sem trace nem vídeo
      name: "scripts",
      testDir: "./scripts",
      use: { ...edge, trace: "off", video: "off" },
    },
  ],
})
