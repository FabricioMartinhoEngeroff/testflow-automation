// Exploração (LTCAT 145, ~51 anexos, NÃO salva): arrastar a última linha para a primeira funciona com a lista rolando?
// A grade tem altura fixa e rolagem própria. Testa: (A) segurar o ponteiro na borda de cima (autoscroll do CDK) e
// (B) girar a roda do mouse durante o arrasto. Linhas identificadas pelo nome do arquivo (as descrições se repetem).
import type { Page } from "@playwright/test"
import { test } from "../support"
import { URLS } from "../support/urls"
import type { LtcatAnexosPage } from "../support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexos"

const nomesDeArquivo = async (a: LtcatAnexosPage) =>
  (await a.linhasAnexo.locator("td.cdk-column-anexo span").allInnerTexts()).map((t) => t.trim())

test("arrastar última para primeira", async ({ login, ltcatCadastroPage: c, ltcatAnexosPage: a, page }) => {
  test.setTimeout(600000)
  await login.entrar()

  for (const estrategia of ["A: ponteiro na borda de cima", "B: roda do mouse durante o arrasto"]) {
    await page.goto(`${URLS.ltcatCadastro}?idkey=145`)
    await c.titulo.waitFor({ state: "visible" })
    await c.abrirAba("Anexos")
    await a.linhasAnexo.first().waitFor({ state: "visible" })

    const antes = await nomesDeArquivo(a)
    const total = antes.length
    const ultima = antes[total - 1]
    const contenedor = page.locator("apollus-ngx-ivy-ltcat-aba-anexos .apls-page-table")
    const caixa = (await contenedor.boundingBox())!

    await contenedor.evaluate((el) => (el.scrollTop = el.scrollHeight))
    await page.waitForTimeout(500)
    const alca = a.linhasAnexo.nth(total - 1).locator("mat-icon", { hasText: "open_with" })
    const o = (await alca.boundingBox())!
    const x = o.x + o.width / 2
    const yTopo = caixa.y + 8

    await page.mouse.move(x, o.y + o.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 30; i++) {
      await page.mouse.move(x, o.y + ((yTopo - o.y) * i) / 30)
      await page.waitForTimeout(25)
    }
    for (let t = 0; t < 30; t++) {
      if (estrategia.startsWith("B")) await page.mouse.wheel(0, -250)
      await page.mouse.move(x, yTopo + (t % 2))
      await page.waitForTimeout(150)
      if ((await contenedor.evaluate((el) => el.scrollTop)) === 0) break
    }
    const rolagem = await contenedor.evaluate((el) => el.scrollTop)
    const primeira = (await a.linhasAnexo.first().boundingBox())!
    await page.mouse.move(x, primeira.y + primeira.height / 2, { steps: 5 })
    await page.waitForTimeout(300)
    await page.mouse.up()
    await page.waitForTimeout(1000)

    const depois = await nomesDeArquivo(a)
    const posicao = depois.indexOf(ultima) + 1
    console.log(`[${estrategia}] scrollTop antes de soltar: ${rolagem} | a última passou da posição ${total} para a ${posicao} de ${depois.length}`)
  }
  // não salva: sair da tela descarta a nova ordem
})
