// Exploração temporária do campo Grupos de e-mail da modal Notificações: aceita mais de um grupo (TST603)? Como o escolhido aparece?
import { test } from "@support"

test("explorar Grupos de e-mail da modal Notificações", async ({ login, ltcatCadastroPage: c, page }) => {
  test.setTimeout(120000)
  await login.entrar()
  await c.abrir()
  await c.botaoNotificacoes.click()
  const modal = page.locator("apollus-ngx-ivy-ltcat-modal-notificacoes")
  await modal.getByText("30 dias", { exact: true }).click()
  const input = modal.locator("apls-autocomplete[formcontrolname=gruposEmail] input")
  const ver = async (momento: string) => console.log(momento, JSON.stringify({
    valor: await input.inputValue(),
    opcoesAbertas: await page.getByRole("option").count(),
    selecionadas: await page.getByRole("option", { selected: true }).allInnerTexts(),
    comCheckbox: await page.locator("mat-option mat-pseudo-checkbox, mat-option mat-checkbox").count(),
  }))

  await input.click()
  await page.getByRole("option").first().waitFor()
  await ver("lista aberta:")
  await page.getByRole("option", { name: "001 - Operacional" }).click()
  await page.waitForTimeout(500)
  await ver("depois de escolher 001:")
  await input.click()
  await page.waitForTimeout(500)
  await ver("reaberta:")
  await page.getByRole("option", { name: "RH - Recursos Humanos" }).click()
  await page.waitForTimeout(500)
  await ver("depois de escolher RH:")
  await page.keyboard.press("Escape")
  await ver("fechada:")
})
