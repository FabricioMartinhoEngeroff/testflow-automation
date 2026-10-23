// Exploração temporária da aba Conclusão do LTCAT (CKEditor 5). Cadastro novo, nada é salvo,
// e lê (sem alterar) a conclusão do LTCAT existente.
import { test, expect } from "@support"
import { URLS } from "@support/urls"
import { arquivoDeTeste } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"

test("explorar aba Conclusão", async ({ login, ltcatCadastroPage: c, ltcatConclusaoPage: co, page, context }) => {
  test.setTimeout(240000)
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await login.entrar()
  await c.abrir()
  await c.abrirAba("Conclusão")
  await expect(co.editor).toBeVisible()

  const editavel = page.locator(".ck-editor__editable:not(.ck-editor__nested-editable)")
  console.log("placeholder:", await editavel.locator("p").first().getAttribute("data-placeholder"))
  console.log("contenteditable:", await editavel.getAttribute("contenteditable"), "| contador:", await co.contadorDeTamanho.textContent())
  console.log("ckeditorInstance existe:", await editavel.evaluate((e: any) => !!e.ckeditorInstance))
  console.log("botões visíveis:", await co.barraDeFerramentas.locator("button.ck-button").evaluateAll((bs) =>
    bs.map((b) => b.getAttribute("data-cke-tooltip-text")).filter(Boolean)))

  await co.ferramenta("Exibir mais itens").click()
  await page.waitForTimeout(500)
  console.log("mais itens:", await page.locator(".ck-toolbar__grouped-dropdown .ck-dropdown__panel button").evaluateAll((bs) =>
    bs.map((b) => b.getAttribute("data-cke-tooltip-text") || b.textContent?.trim())))
  console.log("inputs de arquivo:", await page.locator(".ck input[type=file]").evaluateAll((is) => is.map((i) => (i as HTMLInputElement).accept)))
  await page.keyboard.press("Escape")

  // digitação e formatação
  await co.digitar("Texto simples ")
  await page.keyboard.press("Control+B")
  await co.editor.pressSequentially("negrito")
  console.log("HTML após digitar:", await editavel.evaluate((e: any) => e.ckeditorInstance.getData()))

  // imagem pelo input do CKEditor
  const input = page.locator(".ck input[type=file]").first()
  if (await input.count()) {
    await input.setInputFiles(arquivoDeTeste("imagem.png"))
    await page.waitForTimeout(3000)
    console.log("imgs:", await editavel.locator("img").count(), "| src começa:", (await editavel.locator("img").first().getAttribute("src"))?.slice(0, 40))
    console.log("contador com imagem:", await co.contadorDeTamanho.textContent())
    console.log("toasts imagem:", await page.locator("apls-toast").allTextContents())
  }

  // colagem com HTML (como se viesse do Word)
  await editavel.evaluate((e: any) => e.ckeditorInstance.setData(""))
  await co.editor.click()
  await editavel.evaluate((el) => {
    const dt = new DataTransfer()
    dt.setData("text/html", '<p style="font-size:20pt;color:red"><b>Word negrito</b> <i>itálico</i> <a href="https://exemplo.com">link</a></p><ul><li>item 1</li><li>item 2</li></ul><table><tr><td>célula</td></tr></table>')
    dt.setData("text/plain", "Word negrito itálico link")
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }))
  })
  await page.waitForTimeout(800)
  console.log("HTML após colar:", await editavel.evaluate((e: any) => e.ckeditorInstance.getData()))

  // textos grandes e limite
  for (const tamanho of [5000, 15000, 20000]) {
    await editavel.evaluate((e: any, n) => e.ckeditorInstance.setData(`<p>${"a".repeat(n)}</p>`), tamanho)
    await page.waitForTimeout(500)
    const dados = await editavel.evaluate((e: any) => e.ckeditorInstance.getData().length)
    console.log(`texto ${tamanho}: getData=${dados} contador=${await co.contadorDeTamanho.textContent()}`)
  }
  // ~11 MB: imagem base64 falsa grande
  await editavel.evaluate((e: any) => e.ckeditorInstance.setData(`<p>x</p><img src="data:image/png;base64,${"A".repeat(11 * 1024 * 1024)}">`))
  await page.waitForTimeout(1500)
  console.log("~11MB contador:", await co.contadorDeTamanho.textContent(), "| cor:", await co.contadorDeTamanho.evaluate((e) => getComputedStyle(e).color))
  console.log("classe invalid:", await page.locator(".texto-docx-main-container").getAttribute("class"))
  await c.salvar()
  await page.waitForTimeout(2000)
  console.log("toasts ao salvar >10MB:", await page.locator("apls-toast").allTextContents())

  // LTCAT existente: só leitura
  await page.goto(`${URLS.ltcatCadastro}?idkey=${IDKEY}`)
  await c.titulo.waitFor()
  await c.abrirAba("Conclusão")
  await expect(co.editor).toBeVisible()
  const atual = await page.locator(".ck-editor__editable:not(.ck-editor__nested-editable)").evaluate((e: any) => e.ckeditorInstance.getData())
  console.log(`LTCAT ${IDKEY} conclusão atual (${atual.length} chars):`, atual.slice(0, 200))
})
