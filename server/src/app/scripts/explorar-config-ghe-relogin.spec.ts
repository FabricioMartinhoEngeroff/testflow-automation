// Script de apoio: com o GRO em Oculta, vê se a flag some no LTCAT só depois de um novo login (hipótese: config lida no login e guardada em cache).
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-relogin
import { test } from "../support"
import { URLS } from "../support/urls"
import { ltcatValido } from "../support/data/ltcat"

test.setTimeout(240000)
test("flag após novo login", async ({ login, configGheAbaGeraisPage: gro, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
  await login.entrar()
  await page.goto(URLS.ltcat)
  await gro.abrir()
  const original = await gro.lerExibicao()
  const flag = async () => {
    await cadastro.abrir()
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await cadastro.abrirAba("Configurações")
    return c.opcao("Incluir riscos associados às atividades do GHE").count()
  }
  try {
    await gro.definirExibicao("Oculta")
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
    console.log("mesma sessão:", await flag())
    await page.context().clearCookies()
    await page.goto(URLS.ltcat)
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
    await login.entrar()
    console.log("após novo login:", await flag())
  } finally {
    await page.goto(URLS.ltcat)
    await gro.abrir()
    await gro.definirExibicao(original)
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
  }
})
