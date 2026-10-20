// Exploração (temporária): confere se o "1233 - joao" é corporativo e como o QA-AUT-57265 (abrangência: 70/7003 e 71/711005,
// só LTCAT) aparece no catálogo do LTCAT conforme Região/Unidade.
import { test } from "../support"

test("abrangência dos modelos no catálogo do LTCAT", async ({ login, modeloDocumentoPage: m, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(240000)
  await login.entrar()
  await m.pesquisar("joao")
  await m.linha("1233").waitFor()
  await m.acaoDaLinha("1233", "Visualizar")
  await m.codigo.waitFor()
  await page.waitForTimeout(1500)
  console.log("JOAO corporativo:", await page.locator("mat-checkbox", { hasText: "Modelo corporativo" }).locator("input").isChecked())
  console.log("JOAO flags:", await page.locator("mat-checkbox").evaluateAll((els) => els.map((e) => `${(e as HTMLElement).innerText.trim()}=${(e.querySelector("input") as HTMLInputElement).checked}`)))

  const listar = async (rotulo: string) => {
    await r.modeloDocumento.click()
    let anterior = ""
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(800)
      const atual = (await page.getByRole("option").allInnerTexts()).map((t) => t.trim()).join("|")
      if (atual === anterior && atual) break
      anterior = atual
    }
    const opcoes = (await page.getByRole("option").allInnerTexts()).map((t) => t.trim())
    console.log(rotulo, opcoes.length, "QA-AUT:", opcoes.some((o) => o.startsWith("QA-AUT-57265")), "joao:", opcoes.some((o) => o.startsWith("1233")))
    await page.keyboard.press("Escape")
  }

  const cenarios: [string, string, RegExp | null][] = [
    ["71 só H1", "71 - 71-CURITIBA", null],
    ["71 + 711005", "71 - 71-CURITIBA", /711005/],
    ["71 + 711001", "71 - 71-CURITIBA", /711001/],
    ["70 só H1", "70", null],
    ["70 + 7003", "70", /7003/],
  ]
  for (const [rotulo, regiao, unidade] of cenarios) {
    await cadastro.abrir()
    await cadastro.selecionarOpcao(cadastro.regiao, regiao.length > 2 ? regiao : /^70 - /)
    if (unidade) await cadastro.selecionarOpcao(cadastro.unidade, unidade)
    await listar(rotulo)
  }
})
