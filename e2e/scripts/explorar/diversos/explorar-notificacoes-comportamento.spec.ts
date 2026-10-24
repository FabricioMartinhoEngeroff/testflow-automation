// Exploração temporária da modal Notificações (TST589-TST615): estados dos campos, mensagens, confirmação de saída e catálogo de grupos.
import { test } from "@support"

test("explorar comportamento da modal Notificações", async ({ login, ltcatCadastroPage: c, page }) => {
  test.setTimeout(240000)
  await login.entrar()
  await c.abrir()
  await c.botaoNotificacoes.click()
  const modal = page.locator("apollus-ngx-ivy-ltcat-modal-notificacoes")
  await modal.getByRole("heading", { name: "Notificações" }).waitFor()
  const toast = page.locator("apls-toast")

  const estado = async (momento: string) => {
    const radios = await modal.getByRole("radio").evaluateAll((rs) => rs.map((r) => {
      const i = r as HTMLInputElement
      return { valor: i.value, marcado: i.checked, desabilitado: i.disabled }
    }))
    const inputs = await modal.locator("input:not([type=checkbox]):not([type=radio])").evaluateAll((is) => is.map((i) => {
      const el = i as HTMLInputElement
      return { fc: el.closest("[formcontrolname]")?.getAttribute("formcontrolname") ?? el.getAttribute("formcontrolname"), valor: el.value, desabilitado: el.disabled, req: el.getAttribute("aria-required"), ph: el.getAttribute("data-placeholder"), max: el.getAttribute("max"), min: el.getAttribute("min") }
    }))
    console.log(momento, JSON.stringify({ radios, inputs }))
  }

  console.log("TEXTO:", JSON.stringify(await modal.innerText()))
  await estado("ao abrir:")

  await modal.getByText("30 dias", { exact: true }).click()
  await estado("30 marcado:")
  await modal.getByText("60 dias", { exact: true }).click()
  await estado("30+60 marcados:")

  // salvar sem radio e sem grupo
  await modal.getByRole("button", { name: "Salvar", exact: true }).click()
  await page.waitForTimeout(800)
  console.log("salvar sem radio/grupo -> toast:", JSON.stringify(await toast.allInnerTexts()), "| modal aberta:", await modal.isVisible())
  console.log("campos inválidos:", await modal.locator(".mat-form-field-invalid, .ng-invalid[formcontrolname]").evaluateAll((es) => es.map((e) => e.getAttribute("formcontrolname") ?? e.className.slice(0, 60))))
  await toast.first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})

  await modal.getByRole("radio", { name: "A seguinte data:" }).check({ force: true })
  await estado("seguinte data:")
  await modal.getByRole("radio", { name: "A data fim da vigência do laudo" }).check({ force: true })
  await estado("fim vigência:")
  await modal.getByRole("radio", { name: "A seguinte data:" }).check({ force: true })

  // datas: passada, inválida, futura
  const data = modal.locator("input[matinput]").filter({ hasNot: page.locator("[role=combobox]") }).and(modal.locator("input:not([role=combobox])")).first()
  for (const valor of ["01012020", "32132026", "01012030"]) {
    await data.click()
    await data.press("Control+A")
    await data.press("Backspace")
    await data.pressSequentially(valor)
    await data.press("Tab")
    await page.waitForTimeout(500)
    console.log(`data ${valor} ->`, JSON.stringify({ valor: await data.inputValue(), invalido: await data.getAttribute("aria-invalid"), erros: await modal.locator("mat-error").allInnerTexts(), toast: await toast.allInnerTexts() }))
  }

  // grupos
  const grupos = modal.getByRole("combobox")
  await grupos.click()
  await page.getByRole("option").first().waitFor()
  const opcoes = (await page.getByRole("option").allInnerTexts()).map((o) => o.trim())
  console.log("grupos:", opcoes.length, JSON.stringify(opcoes.slice(0, 40)))
  console.log("multi? html do campo:", (await modal.locator("apls-autocomplete[formcontrolname=gruposEmail]").innerHTML()).slice(0, 600))
  await page.getByRole("option").first().click()
  await page.waitForTimeout(400)
  await estado("1 grupo escolhido:")
  console.log("chips:", await modal.locator("mat-chip, .mat-chip").allInnerTexts())

  // pesquisa
  const termo = opcoes[1]?.split(" - ").pop()?.slice(0, 5) ?? "a"
  await grupos.click()
  await grupos.fill(termo)
  await page.waitForTimeout(800)
  console.log(`pesquisa "${termo}":`, JSON.stringify(await page.getByRole("option").allInnerTexts()))
  await page.keyboard.press("Escape")

  // desmarcar tudo
  await modal.getByText("30 dias", { exact: true }).click()
  await modal.getByText("60 dias", { exact: true }).click()
  await estado("tudo desmarcado:")

  // fechar com alteração
  await modal.getByText("15 dias", { exact: true }).click()
  await modal.getByRole("button", { name: "Fechar" }).click()
  await page.waitForTimeout(800)
  const popup = page.locator("apls-popup").last()
  console.log("fechar c/ alteração -> popup:", JSON.stringify(await popup.innerText().catch(() => "nenhum")), "| botões:", await popup.locator("button").allInnerTexts().catch(() => []))
  console.log("popup tag:", await popup.evaluate((e) => e.parentElement?.className).catch(() => "?"))
  await page.screenshot({ path: "test-results/explorar-notificacoes-fechar.png" })
})
