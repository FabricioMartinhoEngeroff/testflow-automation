// Script de apoio: alterna Oculta/Visível no GRO e imprime se a flag "Incluir riscos associados às atividades do GHE" aparece no LTCAT novo.
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-ciclo
import { test } from "../support"
import { URLS } from "../support/urls"
import { ltcatValido } from "../support/data/ltcat"

test.setTimeout(180000)
test("ciclo GRO x LTCAT", async ({ login, configGheAbaGeraisPage: gro, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
  await login.entrar()
  await page.goto(URLS.ltcat)
  await gro.abrir()
  const original = await gro.lerExibicao()
  console.log("ORIGINAL:", original)
  try {
    for (const valor of ["Oculta", "Visível", "Oculta"] as const) {
      await page.goto(URLS.ltcat)
      console.log("1 goto ok")
      await gro.abrir()
      console.log("2 gro aberto")
      await gro.definirExibicao(valor)
      console.log("3 lido:", await gro.lerExibicao(), "salvar habilitado:", await gro.botaoSalvar.isEnabled())
      if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
      await cadastro.abrir()
      console.log("4 cadastro aberto")
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await cadastro.abrirAba("Configurações")
      await c.opcao("EPCs").waitFor()
      console.log(`GRO=${valor} -> flag no LTCAT:`, await c.opcao("Incluir riscos associados às atividades do GHE").count())
    }
  } finally {
    await page.goto(URLS.ltcat)
    await gro.abrir()
    await gro.definirExibicao(original)
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
  }
})
