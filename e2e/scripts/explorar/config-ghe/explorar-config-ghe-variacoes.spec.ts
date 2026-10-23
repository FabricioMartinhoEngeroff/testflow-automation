// Script de apoio: com o GRO em Oculta, vê se a flag "Incluir riscos associados..." some em variações do cadastro de LTCAT (GHE escolhido, recarga, tempo).
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-variacoes
import { test } from "@support"
import { URLS } from "@support/urls"
import { ltcatValido } from "@support/data/ltcat"

test.setTimeout(240000)
test("variações com GRO Oculta", async ({ login, configGheAbaGeraisPage: gro, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
  await login.entrar()
  await page.goto(URLS.ltcat)
  await gro.abrir()
  const original = await gro.lerExibicao()
  const flag = () => c.opcao("Incluir riscos associados às atividades do GHE").count()
  try {
    await gro.definirExibicao("Oculta")
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
    await cadastro.abrir()
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await cadastro.abrirAba("Configurações")
    console.log("A região só:", await flag())
    await page.waitForTimeout(5000)
    console.log("B após 5s:", await flag())
    await cadastro.abrirAba("Referências")
    await cadastro.abrirAba("Configurações")
    console.log("C trocando de aba:", await flag())
    await page.reload()
    await cadastro.titulo.waitFor()
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await cadastro.abrirAba("Configurações")
    console.log("D após reload:", await flag())
    await cadastro.selecionarOpcao(cadastro.ghe, /.*/)
    await cadastro.abrirAba("Configurações")
    console.log("E com GHE:", await flag())
  } finally {
    await page.goto(URLS.ltcat)
    await gro.abrir()
    await gro.definirExibicao(original)
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
  }
})
