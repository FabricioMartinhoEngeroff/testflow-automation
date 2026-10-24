// Exploração temporária: requisições que o "Gerar laudo" do LTCAT 145 dispara.
import { test, expect } from "@support"

test("explorar requisição do gerar laudo", async ({ login, ltcatCadastroPage: c, page }) => {
  test.setTimeout(180000)
  await login.entrar()
  await page.goto("/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=145")
  await c.titulo.waitFor()
  await expect(c.botaoGerarLaudo).toBeVisible()
  page.on("request", (req) => {
    if (["xhr", "fetch"].includes(req.resourceType())) console.log(req.method(), req.url().replace(/^https:\/\/[^/]+/, ""), (req.postData() ?? "").slice(0, 200))
  })
  await c.botaoGerarLaudo.click()
  await page.waitForTimeout(6000)
})
