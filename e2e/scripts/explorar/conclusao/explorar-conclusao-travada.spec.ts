// Exploração temporária: por que o Salvar não habilita no LTCAT com 9MB gravados na Conclusão (não salva nada)
import { test, expect } from "@support"
import { URLS } from "@support/urls"

test("explorar conclusão travada", async ({ login, ltcatCadastroPage: c, ltcatConclusaoPage: co, page }) => {
  test.setTimeout(240000)
  const erros: string[] = []
  page.on("console", (m) => { if (m.type() === "error") erros.push(m.text().slice(0, 200)) })
  page.on("pageerror", (e) => erros.push("pageerror: " + String(e).slice(0, 200)))
  await login.entrar()
  await page.goto(`${URLS.ltcatCadastro}?idkey=145`)
  await c.titulo.waitFor({ timeout: 120000 })
  await c.abrirAba("Conclusão")
  await expect(co.editor).toBeVisible({ timeout: 120000 })
  await page.waitForTimeout(3000)
  const estado = async (r: string) => console.log(r, "| contador:", await co.contadorDeTamanho.textContent(), "| cor:",
    await co.contadorDeTamanho.evaluate((e) => getComputedStyle(e).color), "| salvar:", await c.botaoSalvar.isEnabled(),
    "| container:", await page.locator(".texto-docx-main-container").getAttribute("class"), "| tooltip contador:",
    await co.contadorDeTamanho.getAttribute("aria-describedby").then((id) => id ? page.locator(`#${id}`).textContent() : null))
  await estado("ao abrir")
  const ed = page.locator(".ck-editor__editable:not(.ck-editor__nested-editable)")
  await ed.evaluate((e: any) => e.ckeditorInstance.setData("<p>teste</p>"))
  await page.waitForTimeout(3000)
  await estado("após setData")
  await co.editor.click()
  await page.keyboard.type("x")
  await page.waitForTimeout(3000)
  await estado("após digitar")
  await c.abrirAba("Referências")
  await page.waitForTimeout(1000)
  await estado("após trocar de aba")
  console.log("erros:", erros.slice(0, 10))
  await page.screenshot({ path: "test-results/conclusao-travada.png" })
})
