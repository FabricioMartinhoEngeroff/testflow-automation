// Exploração temporária: modal "Assinatura digital" (botão Assinar digitalmente) com senha errada, sem assinar.
import { test, expect } from "@support"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"

test("explorar assinar digitalmente", async ({ login, ltcatCadastroPage: c, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(240000)
  await login.entrar()
  await page.goto(`/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=${IDKEY}`)
  await c.titulo.waitFor()
  await expect(c.botaoDadosAssinatura.or(c.botaoAssinarDigitalmente)).toBeVisible()
  console.log("responsável:", await r.responsavelTecnico.inputValue())
  console.log("assinar visível:", await c.botaoAssinarDigitalmente.isVisible(), "| habilitado:", await c.botaoAssinarDigitalmente.isEnabled().catch(() => "-"))
  console.log("botão html:", (await c.botaoAssinarDigitalmente.evaluate((b) => b.outerHTML).catch(() => "")).slice(0, 400))

  await c.botaoAssinarDigitalmente.click()
  const modal = page.locator("apollus-ngx-ivy-modal-assinatura")
  await modal.waitFor()
  console.log("texto:", JSON.stringify(await modal.innerText()))
  console.log("botões:", await modal.locator("button").evaluateAll((bs) => bs.map((b) => ({ t: b.textContent?.trim(), dis: (b as HTMLButtonElement).disabled, c: b.className }))))
  const senha = modal.locator("input")
  console.log("inputs:", await senha.evaluateAll((is) => is.map((i) => ({ type: (i as HTMLInputElement).type, ph: i.getAttribute("placeholder"), fc: i.getAttribute("formcontrolname") }))))

  await senha.first().fill("senhaerrada")
  console.log("assinar habilitado com senha:", await modal.getByRole("button", { name: "Assinar digitalmente" }).isEnabled())
  await modal.getByRole("button", { name: "Assinar digitalmente" }).click()
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(2000)
    console.log("t", i, "toasts:", await page.locator("apls-toast").allInnerTexts(), "| popup:", await page.locator("apls-popup").allInnerTexts(), "| modal aberta:", await modal.isVisible())
  }
  await page.screenshot({ path: "test-results/explorar-assinar-senha-errada.png" })
  console.log("depois: dados visível:", await c.botaoDadosAssinatura.isVisible(), "| assinar visível:", await c.botaoAssinarDigitalmente.isVisible())
})
