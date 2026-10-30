import { defineConfig } from "@playwright/test"
import base from "./playwright.config"

// Vídeos lentos dos cenários principais de permissão do LTCAT, para conferir a olho (npm run test:e2e:video).
// slowMo pausa entre cada ação do navegador; mude a pausa com SLOWMO=<ms> (padrão 1500); a pausa vale para ações (goto, clique, digitação), não para os expect.
// Saem em videos-lentos/ (pasta só deles: o Playwright limpa a pasta de saída a cada execução).
const slowMo = Number(process.env.SLOWMO ?? 1500)

export default defineConfig({
  ...base,
  outputDir: "videos-lentos",
  retries: 0,
  workers: 1,
  timeout: 600000,
  use: {
    ...base.use,
    trace: "off",
    video: { mode: "on", size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
    launchOptions: { slowMo },
  },
  // um cenário de cada tipo de perfil
  grep: [
    /sem permissão no LTCAT .* TST00[12]/,
    /QAutomatizador_vis_h1 \(VIS em Curitiba\) .* menu da linha segue a matriz/,
    /QAutomatizador_(vis|alt|exc)_h1 \(\w+ em Curitiba\) .* duplo clique/,
    /QAutomatizador_inc_h1 \(INC em Curitiba\) .* botão Novo/,
    /QAutomatizador_inc_h1 \(Ex\. 2\)/,
    /QAutomatizador_alt_h1 \(Ex\. 3\)/,
    /QAutomatizador_vis_h1 \(Ex\. 5\)/,
    /QAutomatizador_exc_h1 \(Ex\. 4\)/,
    /registro próprio .* QAutomatizador_todas_h1 /,
    /QAutomatizador_alt_h1_h2 .*TST062 \(pesquisa\)/,
  ],
})
