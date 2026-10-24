// Exploração temporária da modal Notificações: estado inicial já carregado, como o grupo escolhido aparece, salvar/reabrir/recarregar (TST590, TST603, TST608-TST615).
import { test } from "@support"

test("explorar salvar e persistência da modal Notificações", async ({ login, ltcatCadastroPage: c, page }) => {
  test.setTimeout(240000)
  await login.entrar()
  await c.abrir()
  const modal = page.locator("apollus-ngx-ivy-ltcat-modal-notificacoes")
  const toast = page.locator("apls-toast")
  const grupos = modal.locator("apls-autocomplete[formcontrolname=gruposEmail]")
  const abrir = async () => {
    await c.botaoNotificacoes.click()
    await modal.getByText("15 dias", { exact: true }).waitFor()
  }
  const estado = async (momento: string) => console.log(momento, JSON.stringify({
    checados: await modal.locator("mat-checkbox.mat-checkbox-checked").allInnerTexts(),
    radios: await modal.getByRole("radio").evaluateAll((rs) => rs.map((r) => `${(r as HTMLInputElement).value}:${(r as HTMLInputElement).checked ? "x" : "-"}${(r as HTMLInputElement).disabled ? "(desab)" : ""}`)),
    gruposExiste: await grupos.count(),
    gruposDesab: await grupos.locator("input").isDisabled().catch(() => "?"),
    gruposTexto: await grupos.innerText().catch(() => "?"),
    data: await modal.locator("[formcontrolname=dataVencimentoConsiderar]").count(),
  }))

  await abrir()
  console.log("TEXTO:", JSON.stringify(await modal.innerText()))
  await estado("ao abrir (carregado):")
  console.log("box fixo:", JSON.stringify(await modal.locator(".apls-alerta-content, [class*=alerta]").allInnerTexts()))
  console.log("botões:", await modal.getByRole("button").allInnerTexts())

  await modal.getByRole("button", { name: "Fechar" }).click()
  await page.waitForTimeout(800)
  console.log("fechar sem alteração -> modal visível:", await modal.isVisible(), "| popups:", await page.locator("apls-popup").count())

  await abrir()
  await modal.getByText("30 dias", { exact: true }).click()
  await grupos.locator("input").click()
  await page.getByRole("option", { name: "001 - Operacional" }).click()
  await page.getByRole("option", { name: "RH - Recursos Humanos" }).click().catch(() => console.log("lista fechou após o 1º"))
  await page.keyboard.press("Escape")
  await estado("30 + 2 grupos:")
  console.log("grupos html:", (await grupos.innerHTML()).replace(/<!--.*?-->/g, "").replace(/ _ng[a-z]+-[a-z0-9-]+=""/g, "").slice(-1500))

  await modal.getByRole("button", { name: "Salvar", exact: true }).click()
  await page.waitForTimeout(800)
  console.log("salvar -> toast:", JSON.stringify(await toast.allInnerTexts()), "| modal visível:", await modal.isVisible())

  await abrir()
  await estado("reaberta após salvar:")
  await modal.getByText("60 dias", { exact: true }).click()
  await modal.getByRole("button", { name: "Fechar" }).click()
  await page.locator("apls-popup").getByRole("button", { name: "Sair sem salvar" }).click()
  await abrir()
  await estado("após Sair sem salvar (60 não deve estar):")
  await modal.getByText("90 dias", { exact: true }).click()
  await modal.getByRole("button", { name: "Fechar" }).click()
  await page.locator("apls-popup").getByRole("button", { name: "Salvar e sair" }).click()
  await page.waitForTimeout(800)
  console.log("salvar e sair -> toast:", JSON.stringify(await toast.allInnerTexts()), "| modal visível:", await modal.isVisible())
  await abrir()
  await estado("após Salvar e sair (90 deve estar):")
  await modal.getByRole("button", { name: "Fechar" }).click()

  console.log("Salvar do LTCAT habilitado?", await c.botaoSalvar.isEnabled())
  await page.reload()
  await c.titulo.waitFor()
  await abrir()
  await estado("após recarregar sem salvar o LTCAT:")
})
