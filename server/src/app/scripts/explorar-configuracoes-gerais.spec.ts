// Exploração (temporária): apagar o Modelo de documento e sair com ESC/TAB — o que o campo mostra e o que salva.
import { test } from "../support"

for (const saida of ["Escape", "Tab"]) {
  test(`apagar modelo e sair com ${saida}`, async ({ login, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    test.setTimeout(150000)
    await login.entrar()
    await cadastro.abrir()
    await cadastro.preencherObrigatorios()
    await cadastro.preencherConfiguracoesObrigatorias()
    console.log(saida, "ANTES", JSON.stringify(await r.modeloDocumento.inputValue()))
    await r.modeloDocumento.click()
    await r.modeloDocumento.selectText()
    await r.modeloDocumento.press("Backspace")
    console.log(saida, "APAGADO", JSON.stringify(await r.modeloDocumento.inputValue()))
    await r.modeloDocumento.press(saida)
    await page.waitForTimeout(1000)
    console.log(saida, "DEPOIS", JSON.stringify(await r.modeloDocumento.inputValue()), "| invalid:", /invalid/.test((await r.campoModeloDocumento.getAttribute("class")) ?? ""))
    await cadastro.salvar()
    await page.waitForTimeout(4000)
    console.log(saida, "SALVAR", await page.locator("apls-toast").allInnerTexts(), page.url())
    console.log(saida, "CAMPO APOS SALVAR", JSON.stringify(await r.modeloDocumento.inputValue()))
  })
}
