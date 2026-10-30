import { defineConfig } from "@playwright/test"
import base from "./playwright.config"

// Relatório para apresentar a automação: uma seleção da aba Anexos do LTCAT, com vídeo lento, trace e print de cada teste
// (npm run test:e2e:apresentacao, depois npm run test:e2e:apresentacao:abrir). Pausa entre ações com SLOWMO=<ms> (padrão 800).
const slowMo = Number(process.env.SLOWMO ?? 800)

export default defineConfig({
  ...base,
  outputDir: "apresentacao/resultados",
  reporter: [["html", { open: "never", outputFolder: "apresentacao/relatorio" }]],
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
  // o timeout de 60s do project ltcat não comporta o slowMo.
  // O bug do arrasto (TST1208) só aparece em velocidade normal: com slowMo a grade chega a rolar e a linha vai para o topo.
  projects: base.projects!.filter((p) => p.name === "ltcat").flatMap((p) => [
    { ...p, timeout: 600000, grepInvert: /TST1208 - \[bug\]/ },
    { ...p, name: "ltcat-velocidade-normal", timeout: 900000, grep: /TST1208 - \[bug\]/, use: { ...p.use, launchOptions: { slowMo: 0 } } },
  ]),
  grep: [
    /TST1133 - upload via clique/,
    /TST1134 - upload aceito: pdf válido/,
    /TST1138 - upload recusado: maior que 5MB/,
    /TST1139 - upload recusado: formato inválido/,
    /TST1181 - Salvar com campos vazios/,
    // TST1183 fica de fora: com o slowMo o toast [info_salvar] some antes da conferência
    /TST1150 - salva com dados válidos/,
    /TST1155 - salvar a edição atualiza o grid/,
    /TST1217 - confirmar remove o item/,
    /TST1202 - soltar o item em nova posição/,
    /TST1223 - conteúdo: criado por/,
    /TST1149\/TST1167 - anexo persiste/,
    // bugs conhecidos (test.fail): o relatório mostra o motivo em "fail"
    /TST1208 - \[bug\] arrastar a última linha/,
    /TST1138\/TST1139 - \[arquivo_invalido\] com o texto do catálogo da EF/,
  ],
})
