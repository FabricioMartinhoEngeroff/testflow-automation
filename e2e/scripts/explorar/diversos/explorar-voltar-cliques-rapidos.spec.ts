// Exploração temporária do TST1399 (flaky): o que fica por cima do Voltar quando a confirmação abre, e o que um 2º clique ali faz.
import { test } from "@support"
import { ltcatValido } from "@support/data/ltcat"

test("explorar cliques rápidos no Voltar", async ({ login, ltcatCadastroPage: c, page }) => {
  test.setTimeout(120000)
  await login.entrar()
  await c.abrir()
  await c.selecionarOpcao(c.regiao, ltcatValido.regiao)
  await c.botaoVoltar.click()
  await c.confirmacaoSaida.waitFor()

  const caixa = (await c.botaoVoltar.boundingBox())!
  const [x, y] = [caixa.x + caixa.width / 2, caixa.y + caixa.height / 2]
  console.log("no ponto do Voltar:", await page.evaluate(([px, py]) => {
    const el = document.elementFromPoint(px, py)
    return el && `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} | "${el.textContent?.trim().slice(0, 40)}"`
  }, [x, y]))
  await page.screenshot({ path: "test-results/explorar-voltar-cliques-popup.png" })

  await page.mouse.click(x, y)
  await page.waitForTimeout(1500)
  console.log("depois do 2º clique -> url:", page.url(), "| confirmações:", await c.confirmacaoSaida.count())
})
