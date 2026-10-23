// Script de apoio: com o GRO em Oculta, reabre o LTCAT a cada 20s (até 4 min) para ver se a flag só some depois de um tempo (cache do backend).
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-demora
import { test } from "@support"
import { URLS } from "@support/urls"
import { ltcatValido } from "@support/data/ltcat"

test.setTimeout(420000)
test("flag some com o tempo?", async ({ login, configGheAbaGeraisPage: gro, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
  await login.entrar()
  await page.goto(URLS.ltcat)
  await gro.abrir()
  const original = await gro.lerExibicao()
  try {
    await gro.definirExibicao("Oculta")
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
    const inicio = Date.now()
    for (let i = 0; i < 12; i++) {
      await cadastro.abrir()
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await cadastro.abrirAba("Configurações")
      const n = await c.opcao("Incluir riscos associados às atividades do GHE").count()
      console.log(`+${Math.round((Date.now() - inicio) / 1000)}s flag:`, n)
      if (n === 0) break
      await page.waitForTimeout(20000)
    }
  } finally {
    await page.goto(URLS.ltcat)
    await gro.abrir()
    await gro.definirExibicao(original)
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
  }
})
