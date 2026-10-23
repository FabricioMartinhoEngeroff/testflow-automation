// Exploração (temporária): abre o modelo QA-AUT-57265 e lê o status e as abrangências, para comparar com o catálogo do LTCAT.
import { test } from "@support"

test("status do modelo QA-AUT-57265", async ({ login, modeloDocumentoPage: m, page }) => {
  test.setTimeout(120000)
  await login.entrar()
  await m.pesquisar("Modelo automação QA")
  await m.linha("QA-AUT-57265").waitFor()
  await m.acaoDaLinha("QA-AUT-57265", "Visualizar")
  await m.codigo.waitFor()
  await page.waitForTimeout(2000)
  const status = page.locator("apls-status-field mat-select")
  console.log("STATUS", await status.innerHTML())
  console.log("TEXTO", JSON.stringify((await page.locator("main, apls-modelo-documento, body").first().innerText()).replace(/\s+/g, " ").slice(0, 1200)))
})
