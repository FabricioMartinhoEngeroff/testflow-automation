import { defineConfig } from "@playwright/test"
import base from "./playwright.config"

// Relatório para apresentar a seção Configurações Gerais da aba Referências do LTCAT: uma seleção curta, com vídeo lento,
// trace e print de cada teste. Pasta própria para não apagar a apresentação dos Anexos. Pausa entre ações com SLOWMO=<ms> (padrão 800).
//   npx playwright test -c playwright.apresentacao-config-gerais.config.ts
//   npx playwright show-report apresentacao-config-gerais/relatorio
const slowMo = Number(process.env.SLOWMO ?? 800)

export default defineConfig({
  ...base,
  outputDir: "apresentacao-config-gerais/resultados",
  reporter: [["list"], ["html", { open: "never", outputFolder: "apresentacao-config-gerais/relatorio" }]],
  retries: 0,
  workers: 1,
  use: {
    ...base.use,
    trace: "on",
    screenshot: "on",
    video: { mode: "on", size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
    launchOptions: { slowMo },
  },
  // o timeout de 60s do project ltcat não comporta o slowMo
  projects: base.projects!.filter((p) => p.name === "ltcat").map((p) => ({ ...p, timeout: 600000, testMatch: "referencias-configuracoes-gerais.spec.ts" })),
  grep: [
    /TST885\/TST886 - todos os componentes/,
    /TST888 - em resolução reduzida/,
    /TST891 - Argentina com a Unidade 7003/,
    /TST905 - fim menor que o início/,
    /TST908 - data inválida 32\/13\/2026/,
    /TST910 - seleciona o período pelo teclado/,
    /TST939 - cliques rápidos/,
    /TST922\/TST923\/TST924 - histórico habilita/,
    /TST925 - marcado, ao remover/,
    /TST969\/TST997 - TAB percorre/,
    // bugs conhecidos (test.fail): o relatório mostra o motivo em "fail"
    /TST891 - Curitiba com a Unidade 711001/,
    /TST1025 - PCDs: help/,
    /TST971\/TST999 - salvar com 9999999999/,
  ],
})
