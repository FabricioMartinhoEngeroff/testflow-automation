// Script de apoio: com o GRO em Oculta, abre um LTCAT já salvo (1ª linha da lista) e vê se a flag "Incluir riscos associados..." aparece.
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-existente
import { test } from "../support"
import { URLS } from "../support/urls"
import { ltcatValido } from "../support/data/ltcat"

test.setTimeout(240000)
test("flag em LTCAT salvo", async ({ login, configGheAbaGeraisPage: gro, ltcatPage: lista, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
  await login.entrar()
  await page.goto(URLS.ltcat)
  await gro.abrir()
  const original = await gro.lerExibicao()
  try {
    await gro.definirExibicao("Oculta")
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
    await page.goto(URLS.ltcat)
    await lista.filtrarPorRegiao(ltcatValido.regiao)
    await lista.botaoPesquisar.click()
    await lista.linhas.first().waitFor()
    await lista.linhas.first().dblclick()
    await cadastro.titulo.waitFor()
    await cadastro.abrirAba("Configurações")
    console.log("URL:", page.url(), "flag em LTCAT salvo:", await c.opcao("Incluir riscos associados às atividades do GHE").count())
  } finally {
    await page.goto(URLS.ltcat)
    await gro.abrir()
    await gro.definirExibicao(original)
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
  }
})
