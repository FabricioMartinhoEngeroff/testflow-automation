// Exploração temporária do botão Voltar do cadastro de LTCAT: modal "Atenção", botões, destaque e como fechar sem ação.
import { test } from "@support"

test("explorar Voltar", async ({ login, ltcatCadastroPage: c, ltcatPage, page }) => {
  test.setTimeout(240000)
  await login.entrar()

  await c.abrir()
  await c.botaoVoltar.click()
  await page.waitForTimeout(1500)
  console.log("sem alteração -> url:", page.url(), "| titulo pesquisa visível:", await ltcatPage.titulo.isVisible())

  await c.abrir()
  await c.selecionarOpcao(c.regiao, /71 - /)
  await c.botaoVoltar.click()
  const popup = page.locator("apls-popup")
  await popup.first().waitFor()
  console.log("popups:", await popup.count())
  console.log("texto:", JSON.stringify(await popup.first().innerText()))
  console.log("botões:", await popup.first().locator("button").evaluateAll((bs) =>
    bs.map((b) => ({ texto: b.textContent?.trim(), classe: b.className, foco: b === document.activeElement, aria: b.getAttribute("aria-label") }))))
  console.log("html:", (await popup.first().innerHTML()).slice(0, 2500))
  await page.screenshot({ path: "test-results/explorar-voltar-modal.png" })

  await page.keyboard.press("Escape")
  await page.waitForTimeout(800)
  console.log("após Escape -> popups:", await popup.count(), "| url:", page.url())
  if (await popup.count()) {
    await page.mouse.click(5, 5)
    await page.waitForTimeout(800)
    console.log("após clique fora -> popups:", await popup.count(), "| url:", page.url())
  }

  // alteração em outra aba
  await c.abrir()
  await c.abrirAba("Conclusão")
  await page.locator(".ck-editor__editable").first().click()
  await page.keyboard.type("x")
  await c.abrirAba("Referências")
  await c.botaoVoltar.click()
  await page.waitForTimeout(1000)
  console.log("só conclusão alterada -> popups:", await popup.count())
})
