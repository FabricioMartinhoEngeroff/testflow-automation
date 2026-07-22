import { defineConfig, devices } from "@playwright/test"
import { env } from "../shared/env"

export default defineConfig({
  // onde o Playwright procura os arquivos *.spec.ts
  testDir: "./specs",

  // roda um cenário de cada vez — evita dois testes mexendo no mesmo
  // registro/tela real do PGR ao mesmo tempo e colidindo
  fullyParallel: false,
  workers: 1,

  // relatório em HTML, mas "open: never" — sem isso o Playwright abre o
  // navegador com o relatório sozinho toda vez que um teste roda. Só abre
  // quando você pedir de propósito com "npm run test:e2e:report"
  reporter: [["html", { open: "never" }]],

  use: {
    // permite usar page.goto("/") em vez da URL completa em todo teste
    baseURL: env.baseUrl,
    // guarda passo a passo só quando um teste falha na 1ª tentativa e refaz
    trace: "on-first-retry",
    // screenshot automático quando um teste falha — vai virar o "print" do resultado
    screenshot: "only-on-failure",
  },

  // por enquanto só Chromium: o PGR é acessado sempre pelo mesmo navegador
  // corporativo, não precisamos validar em Firefox/Webkit ainda
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // sem webServer: diferente do projeto do curso, aqui não existe servidor
  // local para subir — o alvo é o sistema real da empresa, já no ar
})
