// Script de apoio: confere se "Oculta" realmente persiste no GRO depois de Salvar (texto do toast e releitura em tela recarregada).
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-persistencia
import { test } from "@support"
import { URLS } from "@support/urls"

test.setTimeout(180000)
test("persistência do GRO", async ({ login, configGheAbaGeraisPage: gro, page }) => {
  await login.entrar()
  await page.goto(URLS.ltcat)
  await gro.abrir()
  const original = await gro.lerExibicao()
  try {
    await gro.definirExibicao("Oculta")
    await gro.botaoSalvar.click()
    await page.locator("apls-toast").first().waitFor()
    console.log("TOAST:", await page.locator("apls-toast").allInnerTexts())
    await page.reload()
    await gro.exibicao("Visível").waitFor()
    console.log("APÓS RELOAD:", await gro.lerExibicao())
  } finally {
    await page.goto(URLS.ltcat)
    await gro.abrir()
    await gro.definirExibicao(original)
    if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
  }
})
