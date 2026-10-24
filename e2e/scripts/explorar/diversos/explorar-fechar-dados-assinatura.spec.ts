// Exploração temporária: quais formas fecham a modal "Dados da assinatura digital" (X, Esc, Fechar, clique fora).
import { test, expect } from "@support"

test("explorar fechar dados da assinatura", async ({ login, ltcatCadastroPage: c, ltcatDadosAssinaturaModal: m, page }) => {
  test.setTimeout(180000)
  await login.entrar()
  await page.goto("/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=8")
  await c.titulo.waitFor()
  for (const [como, fechar] of [["X", () => m.botaoX.click()], ["Esc", () => page.keyboard.press("Escape")], ["clique fora", () => page.mouse.click(5, 5)], ["Fechar", () => m.botaoFechar.click()]] as const) {
    if (!(await m.modal.isVisible())) {
      await page.waitForTimeout(2500)
      await c.botaoDadosAssinatura.click()
      await expect(m.titulo).toBeVisible()
    }
    await fechar()
    await page.waitForTimeout(1500)
    console.log(como, "-> modal aberta?", await m.modal.isVisible())
  }
})
