// Exploração temporária da aba Colaboradores do LTCAT (cadastro novo, nada é salvo)
import { test, expect } from "@support"

test("explorar aba Colaboradores", async ({ login, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m, page }) => {
  test.setTimeout(180000)
  await login.entrar()
  await c.abrir()
  await c.abrirAba("Colaboradores")
  console.log("orientação:", JSON.stringify(await a.orientacao.textContent()))
  console.log("grid vazio:", await a.semRegistros.count(), "linhas:", await a.linhasColaborador.count())
  console.log("ícone adicionar:", await a.botaoAdicionar.locator("mat-icon").textContent())
  console.log("cor botão adicionar:", await a.botaoAdicionar.evaluate((e) => getComputedStyle(e).color))

  await a.abrirModalAdicionar()
  console.log("título:", await m.titulo.textContent())
  console.log("maxlength colab/cargo:", await m.colaborador.getAttribute("maxlength"), await m.cargo.getAttribute("maxlength"))
  for (const b of [m.botaoFechar, m.botaoSalvarEAdicionarOutro, m.botaoSalvar])
    console.log("botão", await b.textContent(), await b.evaluate((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color, e.className].join(" | ")))

  await m.botaoSalvar.click()
  await page.waitForTimeout(1500)
  console.log("toasts vazio:", await page.locator("apls-toast").allTextContents())
  console.log("mat-error:", await page.locator("mat-error").allTextContents())

  await m.colaborador.fill("X".repeat(70))
  console.log("valor 70:", (await m.colaborador.inputValue()).length)
  // colagem
  await m.colaborador.fill("")
  await m.colaborador.focus()
  await page.evaluate(() => {
    const el = document.activeElement as HTMLInputElement
    const dt = new DataTransfer()
    dt.setData("text/plain", "C".repeat(80))
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }))
  })
  console.log("valor após paste event:", (await m.colaborador.inputValue()).length)
  await m.colaborador.pressSequentially("ab")
  await page.keyboard.press("Control+A")
  await page.keyboard.press("Control+C")
  await page.keyboard.press("End")
  await page.keyboard.press("Control+V")
  console.log("valor após ctrl+c/v:", await m.colaborador.inputValue())

  await m.preencher("Exploração Um", "Cargo Um")
  await m.botaoSalvar.click()
  await page.waitForTimeout(800)
  console.log("toasts salvar:", await page.locator("apls-toast").allTextContents())
  console.log("modal aberta após Salvar:", await m.titulo.count())

  await a.abrirModalAdicionar()
  await m.preencher("Exploração Dois", "Cargo Dois")
  await m.botaoSalvarEAdicionarOutro.click()
  await page.waitForTimeout(800)
  console.log("toasts salvar+outro:", await page.locator("apls-toast").allTextContents())
  console.log("após salvar+outro valores:", await m.colaborador.inputValue(), "|", await m.cargo.inputValue(), "linhas:", await a.linhasColaborador.count())
  await m.preencher("Não salvo", "Não salvo")
  await m.botaoFechar.click()
  await page.waitForTimeout(800)
  console.log("após fechar com dados: modal", await m.titulo.count(), "headings:", await page.getByRole("heading").allTextContents())
  const sair = page.getByRole("button", { name: /Sair sem salvar/ })
  if (await sair.count()) { console.log("pediu confirmação ao fechar"); await sair.click() }
  console.log("linhas:", await a.linhasColaborador.count(), "célula Não salvo:", await a.celula("Não salvo").count())

  // edição
  await expect(async () => {
    await a.botaoEditar(0).click()
    await expect(m.colaborador).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 20000 })
  console.log("edição título:", await page.getByRole("dialog").getByRole("heading").allTextContents())
  console.log("edição botões:", await page.getByRole("dialog").getByRole("button").allTextContents())
  console.log("edição valores:", await m.colaborador.inputValue(), "|", await m.cargo.inputValue())
  await m.botaoFechar.click()
  await page.waitForTimeout(500)
  if (await sair.count()) await sair.click()

  // exclusão
  await a.botaoExcluir(0).click()
  await page.waitForTimeout(800)
  console.log("popup exclusão:", await page.locator("body").evaluate(() =>
    [...document.querySelectorAll(".cdk-overlay-container *")].filter((e) => e.children.length === 0 && e.textContent?.trim()).map((e) => e.textContent!.trim()).join(" / ")))
  await page.getByRole("button", { name: "Excluir" }).last().click()
  await page.waitForTimeout(800)
  console.log("toasts excluir:", await page.locator("apls-toast").allTextContents(), "linhas:", await a.linhasColaborador.count())
  await page.screenshot({ path: "test-results/explorar-colab.png" })
})
