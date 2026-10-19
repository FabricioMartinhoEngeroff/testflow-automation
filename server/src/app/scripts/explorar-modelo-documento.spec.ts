// Exploração (temporária): inativou o modelo QA-AUT-57265 criado ao explorar o cadastro de Modelo de documento.
// Excluir é bloqueado ("possui vínculo com outros cadastros"); inativar tira o modelo do catálogo do LTCAT.
import { test } from "../support"

test("inativar modelo de teste da exploração", async ({ login, modeloDocumentoPage: m, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(150000)
  await login.entrar()
  await m.pesquisar("Modelo automação QA")
  await m.linha("QA-AUT-57265").waitFor()
  await m.acaoDaLinha("QA-AUT-57265", "Visualizar")
  await m.codigo.waitFor()
  console.log("URL", page.url(), "CODIGO", await m.codigo.inputValue())
  await page.locator("apls-status-field mat-select").click()
  console.log("STATUS OPCOES", await page.locator("mat-option").evaluateAll((els) => els.map((e) => `${e.getAttribute("value")}|${(e as HTMLElement).innerText}|${e.querySelector("[aria-describedby]")?.getAttribute("aria-describedby")}`)))
  await page.locator("mat-option").nth(1).click()
  await m.botaoSalvar.click()
  await page.waitForTimeout(2000)
  console.log("TOAST", await page.locator("apls-toast").allInnerTexts())

  await cadastro.abrir()
  await cadastro.selecionarOpcao(cadastro.regiao, "71 - 71-CURITIBA")
  await page.waitForTimeout(2000)
  console.log("MODELO AUTO", JSON.stringify(await r.modeloDocumento.inputValue()))
})
