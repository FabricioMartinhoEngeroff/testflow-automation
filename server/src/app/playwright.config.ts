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
      testIgnore: ["permissoes-*.spec.ts", "configuracoes-reflexo-config-geral.spec.ts"],
      // login (~10s) + preenchimento do cadastro passam dos 30s padrão
      timeout: 60000,
      use: { ...edge },
    },
    {
      // mexe na Configuração Geral (vale para todo o ambiente): roda sozinho, um teste por vez
      name: "ltcat-config-geral",
      testDir: "./e2e/specs/seguranca/programas-e-laudos/ltcat",
      testMatch: "configuracoes-reflexo-config-geral.spec.ts",
      workers: 1,
      timeout: 240000,
      use: { ...edge },
    },
    {
      // loga cada usuário QAutomatizador_* e salva a sessão em .auth/ (dependência dos testes de permissão)
      name: "auth",
      testDir: "./e2e",
      testMatch: "auth.setup.ts",
      fullyParallel: true,
      use: { ...edge, video: "off", screenshot: "only-on-failure" },
    },
    {
      // cada teste já entra logado; os que gravam usam um ano só deles: pode rodar em paralelo (--workers)
      name: "ltcat-permissoes",
      testDir: "./e2e/specs/seguranca/programas-e-laudos/ltcat",
      testMatch: "permissoes-*.spec.ts",
      dependencies: ["auth"],
      fullyParallel: true,
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
