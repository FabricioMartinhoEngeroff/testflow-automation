// Exploração (temporária): lista os modelos de documento que o catálogo do LTCAT oferece em Curitiba (sem e com Unidade).
import { test } from "../support"

test("listar modelos do catálogo por abrangência", async ({ login, ltcatCadastroPage: c, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(120000)
  await login.entrar()
  await c.abrir()
  const listar = async (rotulo: string) => {
    await r.modeloDocumento.click()
    await r.modeloDocumento.selectText()
    await r.modeloDocumento.press("Backspace")
    await page.waitForTimeout(1500)
    console.log(rotulo, JSON.stringify((await page.getByRole("option").allInnerTexts()).map((t) => t.trim())))
    await page.keyboard.press("Escape")
  }
  await c.selecionarOpcao(c.regiao, "71 - 71-CURITIBA")
  await listar("SO H1")
  await c.selecionarOpcao(c.unidade, /711001/)
  await listar("H1+H2 711001")
})
