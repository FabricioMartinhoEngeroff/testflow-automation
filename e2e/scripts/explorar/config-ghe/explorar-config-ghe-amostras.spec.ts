// Script de apoio: para cada valor do GRO (Oculta, Visível), recarrega o LTCAT idkey=154 várias vezes e imprime a flag a cada leitura (detecta resposta inconsistente).
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-amostras
import { test } from "@support"
import { URLS } from "@support/urls"

test.setTimeout(420000)
test("amostras da flag", async ({ login, configGheAbaGeraisPage: gro, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
  const amostrar = async (rotulo: string) => {
    const lidas: number[] = []
    for (let i = 0; i < 8; i++) {
      await page.goto(`${URLS.ltcatCadastro}?idkey=154`)
      await cadastro.titulo.waitFor()
      await cadastro.abrirAba("Configurações")
      await c.opcao("EPCs").waitFor()
      await page.waitForTimeout(1500)
      lidas.push(await c.opcao("Incluir riscos associados às atividades do GHE").count())
    }
    console.log(rotulo, lidas.join(" "))
  }
  await login.entrar()
  await page.goto(URLS.ltcat)
  await gro.abrir()
  const original = await gro.lerExibicao()
  try {
    for (const valor of ["Oculta", "Visível"] as const) {
      await page.goto(URLS.ltcat)
      await gro.abrir()
      await gro.definirExibicao(valor)
      if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
      await amostrar(`GRO ${valor}:`)
    }
  } finally {
    await page.goto(URLS.ltcat)
    await gro.abrir()
    await gro.definirExibicao(original)
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
  }
})
