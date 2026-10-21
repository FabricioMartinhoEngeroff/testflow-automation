// Script de apoio: sem mexer no GRO (hoje em Visível), reabre o LTCAT novo a cada 30s e imprime se a flag aparece, para ver em quanto tempo a tela alcança o valor salvo.
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-estabilizar
import { test } from "../support"
import { ltcatValido } from "../support/data/ltcat"

test.setTimeout(900000)
test("quando a flag alcança o GRO", async ({ login, configGheAbaGeraisPage: gro, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
  await login.entrar()
  await gro.abrir()
  console.log("GRO:", await gro.lerExibicao())
  const inicio = Date.now()
  for (let i = 0; i < 24; i++) {
    await cadastro.abrir()
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await cadastro.abrirAba("Configurações")
    await c.opcao("EPCs").waitFor()
    const n = await c.opcao("Incluir riscos associados às atividades do GHE").count()
    console.log(`+${Math.round((Date.now() - inicio) / 1000)}s flag:`, n)
    if (n === 1) break
    await page.waitForTimeout(30000)
  }
})
