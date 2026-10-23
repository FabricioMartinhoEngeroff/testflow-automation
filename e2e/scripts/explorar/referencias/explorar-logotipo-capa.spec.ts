// Exploração (temporária): por que o checkbox "Incluir logotipo na capa" não marca com um clique.
import { test } from "@support"

test("explorar logotipo na capa", async ({ login, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(90000)
  await login.entrar()
  await cadastro.abrir()
  const cb = r.opcao("Incluir logotipo na capa")
  const input = cb.locator("input")
  for (let i = 1; i <= 3; i++) {
    await cb.click()
    await page.waitForTimeout(1000)
    console.log(`CLIQUE ${i}`, await input.isChecked(), await page.locator("apls-toast").allInnerTexts())
  }
  await page.waitForTimeout(2000)
  console.log("DEPOIS DE 2s", await input.isChecked())
  await cb.locator("label").click()
  await page.waitForTimeout(1000)
  console.log("CLIQUE NO LABEL", await input.isChecked())
  console.log("IDIOMA", await page.locator("html").getAttribute("lang"), await cadastro.titulo.count())
})
