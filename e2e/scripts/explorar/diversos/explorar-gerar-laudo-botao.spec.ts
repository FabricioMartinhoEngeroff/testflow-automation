// Exploração temporária: estados do botão "Gerar laudo" e o que a geração mostra (toast, Relatórios). Usa o LTCAT 145 sem salvar.
import { test, expect } from "@support"

test("explorar botão gerar laudo", async ({ login, ltcatCadastroPage: c, ltcatReferenciasPage: r, relatorios, page }) => {
  test.setTimeout(400000)
  await login.entrar()
  await c.abrir()
  await expect(c.botaoVoltar).toBeVisible()
  console.log("novo -> botões gerar laudo no DOM:", await c.botaoGerarLaudo.count())

  await page.goto("/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=145")
  await c.titulo.waitFor()
  await expect(c.botaoVoltar).toBeVisible()
  console.log("145 GHE:", await c.ghe.inputValue(), "| data base:", await c.dataBase.inputValue())
  console.log("145 salvo -> habilitado:", await c.botaoGerarLaudo.isEnabled())
  const artOriginal = await r.art.inputValue()
  await r.art.fill(artOriginal + "x")
  await page.waitForTimeout(500)
  console.log("145 com alteração -> no DOM:", await c.botaoGerarLaudo.count())
  await r.art.fill(artOriginal)
  await page.waitForTimeout(500)
  console.log("145 alteração desfeita -> no DOM:", await c.botaoGerarLaudo.count())

  await page.reload()
  await c.titulo.waitFor()
  await relatorios.abrir()
  const antes = await relatorios.nomesDosArquivos()
  await relatorios.fechar()
  await c.botaoGerarLaudo.click()
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(1500)
    console.log("t", i, "toasts:", await page.locator("apls-toast").allInnerTexts(), "| popups:", await page.locator("apls-popup").allInnerTexts(), "| url:", page.url())
  }
  await relatorios.abrir()
  const depois = await relatorios.nomesDosArquivos()
  const novos = depois.filter((n) => !antes.includes(n))
  console.log("novos relatórios:", novos)
  for (const n of novos) console.log(n, await relatorios.status(relatorios.linha(n)))
})
