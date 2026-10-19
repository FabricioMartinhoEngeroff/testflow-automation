// Exploração (temporária): help, colagem com quebra de linha, espaços e obrigatoriedade do campo "Avaliação ... realizada em".
import { test } from "../support"

test("explorar campo avaliação realizada em", async ({ login, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(120000)
  await login.entrar()
  await cadastro.abrir()
  const campo = r.avaliacaoRealizadaEm
  const help = page.locator("apls-input[formcontrolname=avaliacaoCondicoesRealizadaEm] apls-icon")
  const id = await help.getAttribute("aria-describedby")
  console.log("HELP TXT", JSON.stringify(await page.locator(`#${id}`).textContent()))
  await help.hover()
  await page.waitForTimeout(800)
  console.log("TOOLTIP VISIVEL", await page.locator("mat-tooltip-component").allInnerTexts())
  console.log("ICON", await help.locator("mat-icon").innerText())

  await campo.click()
  await page.keyboard.insertText("linha 1\nlinha 2\r\nlinha 3")
  console.log("NEWLINE", JSON.stringify(await campo.inputValue()))
  await campo.fill("")
  await campo.pressSequentially("a    b     c")
  console.log("ESPACOS", JSON.stringify(await campo.inputValue()))
  await campo.fill("")
  await campo.press("Tab")
  console.log("FF CLASS after blur empty", await page.locator("apls-input[formcontrolname=avaliacaoCondicoesRealizadaEm] mat-form-field").getAttribute("class"))

  await cadastro.preencherObrigatorios()
  await cadastro.preencherConfiguracoesObrigatorias()
  await campo.fill("")
  await cadastro.salvar()
  await page.waitForTimeout(1500)
  console.log("TOAST", await page.locator("apls-toast").allInnerTexts())
  console.log("URL", page.url())
  console.log("FF CLASS after save", await page.locator("apls-input[formcontrolname=avaliacaoCondicoesRealizadaEm] mat-form-field").getAttribute("class"))
  console.log("LABEL COLOR", await page.locator("apls-input[formcontrolname=avaliacaoCondicoesRealizadaEm] label").evaluate((e) => getComputedStyle(e).color))

  await campo.fill("     ")
  await cadastro.salvar()
  await page.waitForTimeout(3000)
  console.log("SO ESPACOS TOAST", await page.locator("apls-toast").allInnerTexts(), page.url())
})
