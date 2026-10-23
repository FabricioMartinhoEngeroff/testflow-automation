// Exploração temporária: imagem grande e salvar a Conclusão do LTCAT existente acima de 10MB.
// Restaura a conclusão original no final.
import { readFileSync } from "fs"
import type { Page } from "@playwright/test"
import { test, expect } from "@support"
import { URLS } from "@support/urls"
import { arquivoDeTeste } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"
import type { LtcatCadastroPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro"
import type { LtcatConclusaoPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATConclusao"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"

// com conteúdo grande o editor só passa o valor ao formulário quando perde o foco
const trocarConteudo = async (page: Page, c: LtcatCadastroPage, co: LtcatConclusaoPage, html: string) => {
  const ed = page.locator(".ck-editor__editable:not(.ck-editor__nested-editable)")
  await ed.evaluate((e: any, h) => e.ckeditorInstance.setData(h), html)
  await co.editor.click()
  await page.keyboard.press("Control+End")
  await page.keyboard.type("x")
  await page.keyboard.press("Backspace")
  await c.abrirAba("Referências")
  await c.abrirAba("Conclusão")
}

test("explorar limite de 10MB ao salvar", async ({ login, ltcatCadastroPage: c, ltcatConclusaoPage: co, page }) => {
  test.setTimeout(500000)
  await login.entrar()
  const abrir = async () => {
    await page.goto(`${URLS.ltcatCadastro}?idkey=${IDKEY}`)
    await c.titulo.waitFor({ timeout: 120000 })
    await c.abrirAba("Conclusão")
    await expect(co.editor).toBeVisible({ timeout: 120000 })
  }
  const ed = page.locator(".ck-editor__editable:not(.ck-editor__nested-editable)")
  const dados = () => ed.evaluate((e: any) => e.ckeditorInstance.getData() as string)
  const toasts = () => page.locator("apls-toast").allTextContents()
  await abrir()
  const original = await dados()
  console.log("original:", original)

  try {
    console.log("etapa 1: upload de imagem de 5,15MiB pelo botão (sem salvar)")
    await co.ferramenta("Exibir mais itens").click()
    await page.keyboard.press("Escape")
    const t1 = Date.now()
    await page.locator(".ck input[type=file]").first().setInputFiles(arquivoDeTeste("imagem_5_15MiB.jpg"), { timeout: 30000 })
      .catch((e) => console.log("setInputFiles falhou:", String(e).slice(0, 120)))
    await page.waitForTimeout(15000)
    console.log(`após ${Date.now() - t1}ms: imgs`, await ed.locator("img").count(), "| contador", await co.contadorDeTamanho.textContent(), "| toasts", await toasts())

    console.log("etapa 2: segundo upload pelo botão (png) e salvar")
    await ed.evaluate((e: any) => { const ck = e.ckeditorInstance; ck.model.change((w: any) => { const p = w.createElement("paragraph"); w.insert(p, ck.model.document.getRoot(), "end"); w.setSelection(p, "in") }) })
    await co.ferramenta("Exibir mais itens").click()
    await page.keyboard.press("Escape")
    await page.locator(".ck input[type=file]").first().setInputFiles(arquivoDeTeste("imagem_5_15MiB.png"), { timeout: 30000 })
      .catch((e) => console.log("setInputFiles 2 falhou:", String(e).slice(0, 120)))
    await page.waitForTimeout(15000)
    console.log("imgs", await ed.locator("img").count(), "| contador", await co.contadorDeTamanho.textContent(), "| toasts", await toasts())
    await c.abrirAba("Referências")
    await page.waitForTimeout(2000)
    await c.abrirAba("Conclusão")
    console.log("após tirar o foco: contador", await co.contadorDeTamanho.textContent(), "| cor", await co.contadorDeTamanho.evaluate((e) => getComputedStyle(e).color), "| invalid:", await page.locator(".texto-docx-main-container").getAttribute("class"))
    console.log("salvar habilitado:", await c.botaoSalvar.isEnabled(), "| toasts", await toasts())
    await c.salvar()
    const vistos = new Set<string>()
    for (let i = 0; i < 40; i++) { for (const t of await toasts()) vistos.add(t); await page.waitForTimeout(250) }
    console.log("toasts ao salvar >10MB (coletados por 10s):", [...vistos], "| diálogos:", await page.getByRole("dialog").allTextContents())
    await page.screenshot({ path: "test-results/conclusao-acima-10mb.png" })
    await abrir()
    console.log("reaberto: imgs", await ed.locator("img").count(), "| tamanho", (await dados()).length)
  } finally {
    await abrir()
    if ((await dados()) !== original) {
      await trocarConteudo(page, c, co, original)
      await c.salvar()
      await expect(c.mensagemSalvoComSucesso).toBeVisible({ timeout: 120000 })
      console.log("conclusão original restaurada")
    } else console.log("conclusão já estava original")
  }
})
