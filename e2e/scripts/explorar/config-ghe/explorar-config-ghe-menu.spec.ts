// Script de apoio: repete o fluxo manual (sem recarregar a página): abre LTCAT salvo, vai ao GRO pelo menu, grava Oculta, volta pelo menu
// e confere a flag; depois recarrega a página (F5) e confere de novo. Mostra se a configuração só vale até recarregar.
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-menu
import { test } from "@support"
import { URLS } from "@support/urls"
import { ltcatValido } from "@support/data/ltcat"

test.setTimeout(240000)
test("GRO Oculta via menu", async ({ login, menuLateral: menu, configGheAbaGeraisPage: gro, ltcatPage: lista, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
  const flag = async () => {
    await c.opcao("EPCs").waitFor()
    return c.opcao("Incluir riscos associados às atividades do GHE").count()
  }
  const abrirSalvo = async () => {
    await lista.botaoPesquisar.click()
    await lista.linhas.first().waitFor()
    await lista.linhas.first().dblclick()
    await cadastro.titulo.waitFor()
    await cadastro.abrirAba("Configurações")
  }
  await login.entrar()
  await page.goto(URLS.ltcat)
  await lista.filtrarPorRegiao(ltcatValido.regiao)
  await abrirSalvo()
  console.log("1 antes (Visível):", await flag())
  await gro.abrir()
  const original = await gro.lerExibicao()
  try {
    await gro.definirExibicao("Oculta")
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
    const grupo = menu.grupo("Programas e Laudos")
    if (!(await menu.item(/LTCAT/).locator("visible=true").isVisible())) await grupo.click()
    await menu.item(/LTCAT/).locator("visible=true").click()
    if (!(await lista.regiao.inputValue())) await lista.filtrarPorRegiao(ltcatValido.regiao)
    await abrirSalvo()
    console.log("2 pelo menu, sem recarregar:", await flag())
    await page.reload()
    await cadastro.titulo.waitFor()
    await cadastro.abrirAba("Configurações")
    console.log("3 depois de F5:", await flag())
  } finally {
    await gro.abrir()
    await gro.definirExibicao(original)
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
  }
})
