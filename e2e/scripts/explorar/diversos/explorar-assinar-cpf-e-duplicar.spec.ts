// Exploração temporária: responsável e botão Assinar em LTCATs existentes, e o Duplicar do 145 (sem salvar).
import { test, expect } from "@support"

test("explorar cpf do responsável e duplicar", async ({ login, ltcatCadastroPage: c, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(240000)
  await login.entrar()
  for (const idkey of ["154", "8", "145", "174"]) {
    await page.goto(`/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=${idkey}`)
    await c.titulo.waitFor()
    await expect(c.botaoVoltar).toBeVisible()
    await page.waitForTimeout(1500)
    console.log(idkey, "| resp:", await r.responsavelTecnico.inputValue(), "| assinar:", await c.botaoAssinarDigitalmente.isVisible(), "| dados:", await c.botaoDadosAssinatura.isVisible())
  }

  await r.responsavelTecnico.click()
  const opcoes = (await page.getByRole("option").allInnerTexts()).filter((o) => /031\.044\.320-23/.test(o))
  console.log("031.044.320-23 no catálogo:", opcoes)
  await page.keyboard.press("Escape")

  await page.goto("/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=145")
  await c.titulo.waitFor()
  await c.botaoDuplicar.click()
  await page.waitForTimeout(3000)
  console.log("após duplicar url:", page.url(), "| popups:", await page.locator("apls-popup").allInnerTexts(), "| toasts:", await page.locator("apls-toast").allInnerTexts())
  console.log("resp:", await r.responsavelTecnico.inputValue(), "| salvar habilitado:", await c.botaoSalvar.isEnabled(), "| assinar:", await c.botaoAssinarDigitalmente.isVisible())
})
