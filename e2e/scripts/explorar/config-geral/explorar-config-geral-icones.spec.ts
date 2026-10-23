// Exploração (temporária): como os ícones Bloquear/Sugerir do cabeçalho e das linhas (coluna LTCAT) se comportam. NÃO clica em Salvar.
import { test } from "@support"

test("ícones config geral", async ({ login, menuLateral, page }) => {
  test.setTimeout(200000)
  await login.entrar()
  await menuLateral.abrirModulo("seguranca")
  const item = menuLateral.item(/Configuração Geral/).locator("visible=true")
  if (!(await item.isVisible())) await menuLateral.grupo("Programas e Laudos").click()
  await item.click()
  await page.getByText("Defina as configurações padrão").waitFor()
  await page.waitForTimeout(2000)
  const resumo = async (rotulo: string) => {
    const r = await page.locator("tr.mat-row").evaluateAll((trs) => {
      const on = (b?: Element) => !!b && ((b.querySelector("mat-icon") as HTMLElement).getAttribute("style") ?? "").includes("default-primary")
      let lock = 0, sug = 0, semIcone = 0
      for (const tr of trs) {
        const bs = [...(tr.querySelector("td.mat-column-ltcat") as HTMLElement).querySelectorAll("button")]
        if (!bs.length) { semIcone++; continue }
        if (on(bs[0])) lock++
        if (on(bs[1])) sug++
      }
      return { linhas: trs.length, lock, sug, semIcone }
    })
    const cab = await page.locator("th.mat-column-ltcat button").evaluateAll((bs) => bs.map((b) => ((b.querySelector("mat-icon") as HTMLElement).getAttribute("style") ?? "").includes("default-primary")))
    const salvar = await page.getByRole("button", { name: "Salvar" }).isEnabled()
    console.log("RESUMO", rotulo, JSON.stringify(r), "cabecalho[lock,sug]", JSON.stringify(cab), "salvarHabilitado", salvar)
  }
  await resumo("inicial")
  const linhaBtns = page.locator("tr.mat-row").nth(3).locator("td.mat-column-ltcat button")
  await linhaBtns.nth(0).click(); await page.waitForTimeout(500)
  await resumo("linha 4: bloquear (já estava ON) - clique 1")
  await linhaBtns.nth(1).click(); await page.waitForTimeout(500)
  await resumo("linha 4: sugerir")
  await linhaBtns.nth(1).click(); await page.waitForTimeout(500)
  await resumo("linha 4: sugerir de novo")
  console.log("Todos col", await page.locator("th.mat-column-todos button").evaluateAll((bs) => bs.map((b) => ((b.querySelector("mat-icon") as HTMLElement).getAttribute("style") ?? ""))))
})
