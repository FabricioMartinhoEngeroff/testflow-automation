// Script de apoio: abre o LTCAT salvo idkey=154 com o GRO em Visível e em Oculta e imprime se a flag "Incluir riscos associados..." aparece.
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-idkey
import { test } from "@support"
import { URLS } from "@support/urls"

test.setTimeout(240000)
test("idkey=154 x GRO", async ({ login, configGheAbaGeraisPage: gro, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
  const flag = async (rotulo: string) => {
    await page.goto(`${URLS.ltcatCadastro}?idkey=154`)
    await cadastro.titulo.waitFor()
    await cadastro.abrirAba("Configurações")
    await c.opcao("EPCs").waitFor()
    await page.waitForTimeout(2000)
    console.log(rotulo, "-> flag:", await c.opcao("Incluir riscos associados às atividades do GHE").count())
  }
  await login.entrar()
  await page.goto(URLS.ltcat)
  await gro.abrir()
  const original = await gro.lerExibicao()
  try {
    await gro.definirExibicao("Visível")
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
    await flag("GRO Visível")
    await page.goto(URLS.ltcat)
    await gro.abrir()
    await gro.definirExibicao("Oculta")
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
    await flag("GRO Oculta")
  } finally {
    await page.goto(URLS.ltcat)
    await gro.abrir()
    await gro.definirExibicao(original)
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
  }
})
