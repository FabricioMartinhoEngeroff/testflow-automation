// Utilitário só de leitura: mostra o que está gravado na Conclusão do LTCAT existente.
import { test, expect } from "@support"
import { URLS } from "@support/urls"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"

test("ler conclusão do LTCAT", async ({ login, ltcatCadastroPage: c, ltcatConclusaoPage: co, page }) => {
  test.setTimeout(180000)
  await login.entrar()
  await page.goto(`${URLS.ltcatCadastro}?idkey=${IDKEY}`)
  await c.titulo.waitFor({ timeout: 120000 })
  await c.abrirAba("Conclusão")
  await expect(co.editor).toBeVisible({ timeout: 120000 })
  await page.waitForTimeout(3000)
  const ed = page.locator(".ck-editor__editable:not(.ck-editor__nested-editable)")
  const html = await ed.evaluate((e: any) => e.ckeditorInstance.getData() as string)
  console.log(`LTCAT ${IDKEY}: ${html.length} chars | início: ${html.slice(0, 80)} | contador: ${await co.contadorDeTamanho.textContent()} | salvar habilitado: ${await c.botaoSalvar.isEnabled()}`)
})
