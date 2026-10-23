// Utilitário: volta a Conclusão do LTCAT existente para um conteúdo conhecido (padrão "<p>teste</p>").
// Ex.: LTCAT_IDKEY=145 CONCLUSAO="<p>teste</p>" npm run test:e2e:scripts -- restaurar-conclusao-ltcat
import { test, expect } from "@support"
import { URLS } from "@support/urls"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"
const CONCLUSAO = process.env.CONCLUSAO ?? "<p>teste</p>"

test("restaurar conclusão do LTCAT", async ({ login, ltcatCadastroPage: c, ltcatConclusaoPage: co, page }) => {
  test.setTimeout(300000)
  await login.entrar()
  await page.goto(`${URLS.ltcatCadastro}?idkey=${IDKEY}`)
  await c.titulo.waitFor({ timeout: 120000 })
  await c.abrirAba("Conclusão")
  await expect(co.editor).toBeVisible({ timeout: 120000 })
  const ed = page.locator(".ck-editor__editable:not(.ck-editor__nested-editable)")
  const antes = await ed.evaluate((e: any) => e.ckeditorInstance.getData() as string)
  console.log(`antes: ${antes.length} chars`)
  if (antes === CONCLUSAO) return
  // com conteúdo grande o editor só sincroniza com o formulário quando perde o foco (aviso no contador):
  // troca pela API, digita e apaga um caractere e sai do editor trocando de aba
  await ed.evaluate((e: any, h) => e.ckeditorInstance.setData(h), CONCLUSAO)
  await co.editor.click()
  await page.keyboard.press("End")
  await page.keyboard.type("x")
  await page.keyboard.press("Backspace")
  await c.abrirAba("Referências")
  await expect(c.botaoSalvar).toBeEnabled()
  await c.salvar()
  await expect(c.mensagemSalvoComSucesso).toBeVisible({ timeout: 120000 })
  await page.reload()
  await c.abrirAba("Conclusão")
  await expect(co.editor).toBeVisible({ timeout: 120000 })
  console.log("depois:", await ed.evaluate((e: any) => e.ckeditorInstance.getData()))
})
