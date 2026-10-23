// Exploração temporária das falhas da suíte de Colaboradores (LTCAT novo, nada é salvo)
import { test, expect } from "@support"
import { incluirColaborador, popupExclusao } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradoresFluxos"

test("explorar falhas", async ({ login, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m, page }) => {
  test.setTimeout(180000)
  await login.entrar()
  await c.abrir()
  await c.abrirAba("Colaboradores")
  await page.waitForTimeout(1000)

  // TST1278: o que acontece com dois cliques no Adicionar
  const caixa = (await a.botaoAdicionar.boundingBox())!
  const x = caixa.x + caixa.width / 2
  const y = caixa.y + caixa.height / 2
  await page.mouse.click(x, y)
  for (const t of [100, 300, 600]) {
    await page.waitForTimeout(t === 100 ? 100 : 200)
    console.log(`após 1º clique +${t}ms: diálogos`, await page.getByRole("dialog").count())
  }
  console.log("o que está no ponto do 2º clique:", await page.evaluate(([px, py]) => {
    const el = document.elementFromPoint(px, py)
    return el ? `${el.tagName}.${el.className}` : "nada"
  }, [x, y]))
  await page.mouse.click(x, y)
  await page.waitForTimeout(800)
  console.log("após 2º clique: diálogos", await page.getByRole("dialog").count(), "título", await m.titulo.count())
  await m.botaoFechar.click()
  await expect(m.titulo).toHaveCount(0)

  // TST1310: cor do Excluir da confirmação ao longo do tempo
  await incluirColaborador(a, m, "Cor", "Cor")
  await a.botaoExcluir(0).click()
  const excluir = popupExclusao(page).getByRole("button", { name: "Excluir" })
  for (const t of [0, 300, 1000]) {
    await page.waitForTimeout(t)
    console.log(`Excluir +${t}ms:`, await excluir.evaluate((e) => {
      const s = getComputedStyle(e)
      return [s.backgroundColor, s.opacity, e.className].join(" | ")
    }))
  }
  console.log("opacidade dos ancestrais:", await excluir.evaluate((e) => {
    const r: string[] = []
    for (let el: Element | null = e; el; el = el.parentElement) {
      const s = getComputedStyle(el)
      if (s.opacity !== "1") r.push(`${el.tagName}.${el.className}=${s.opacity}`)
    }
    return r.join(" ; ")
  }))
  await popupExclusao(page).getByRole("button", { name: "Fechar" }).click()

  // TST1279: estrutura e cores de um toast de Atenção (o de campos obrigatórios também é Atenção)
  await a.abrirModalAdicionar()
  await m.botaoSalvar.click()
  const toast = page.locator("apls-toast").filter({ hasText: "Atenção" }).first()
  await expect(toast).toBeVisible()
  console.log("toast Atenção:", await toast.evaluate((el) =>
    [el, ...el.querySelectorAll("*")].map((e) => {
      const s = getComputedStyle(e)
      return `${e.tagName}.${(e as HTMLElement).className} bg=${s.backgroundColor} borda=${s.borderLeftColor}`
    }).slice(0, 8).join("\n")))
  console.log("overlay pai:", await toast.evaluate((el) => {
    const r: string[] = []
    for (let p = el.parentElement; p && r.length < 4; p = p.parentElement) r.push(`${p.tagName}.${p.className} bg=${getComputedStyle(p).backgroundColor}`)
    return r.join("\n")
  }))
})
