// Exploração (temporária, somente leitura): estado da tela Configuração Geral (coluna LTCAT) e da aba Configurações de um LTCAT novo.
import { test } from "../support"

test("config geral LTCAT", async ({ login, menuLateral, ltcatCadastroPage: cadastro, page }) => {
  test.setTimeout(150000)
  await login.entrar()
  await menuLateral.abrirModulo("seguranca")
  const item = menuLateral.item(/Configuração Geral/).locator("visible=true")
  if (!(await item.isVisible())) await menuLateral.grupo("Programas e Laudos").click()
  await item.click()
  await page.getByText("Defina as configurações padrão").waitFor()
  await page.waitForTimeout(2000)
  const linhas = await page.locator("tr.mat-row").evaluateAll((trs) =>
    trs.map((tr) => {
      const celula = tr.querySelector("td.mat-column-ltcat") as HTMLElement
      const estado = (b: Element) => ((b.querySelector("mat-icon") as HTMLElement)?.getAttribute("style") ?? "").includes("default-primary") ? "ON" : "off"
      const botoes = [...celula.querySelectorAll("button")]
      return {
        rotulo: (tr.querySelector("td.mat-column-configuracao") as HTMLElement).innerText.trim(),
        valor: [...celula.querySelectorAll("mat-select .mat-select-value-text")].map((e) => (e as HTMLElement).innerText.trim()).join("|") || [...celula.querySelectorAll("mat-checkbox")].map((e) => e.classList.contains("mat-checkbox-checked")).join("|"),
        lock: botoes[0] ? estado(botoes[0]) : "-",
        sugerir: botoes[1] ? estado(botoes[1]) : "-",
      }
    }),
  )
  console.log("LINHAS", JSON.stringify(linhas, null, 1))
  const cab = await page.locator("th.mat-column-ltcat button").evaluateAll((bs) => bs.map((b) => ((b.querySelector("mat-icon") as HTMLElement).getAttribute("style") ?? "")))
  console.log("CABECALHO LTCAT", cab)

  await cadastro.abrir()
  await cadastro.selecionarOpcao(cadastro.regiao, "71 - 71-CURITIBA")
  await cadastro.abrirAba("Configurações")
  await page.waitForTimeout(2000)
  const aba = await page.locator("apollus-ngx-ivy-ltcat-aba-configuracoes, apollus-ngx-ivy-ltcat-aba-configuracao").first().innerText().catch(() => "?")
  console.log("ABA", aba.replace(/\s+/g, " ").slice(0, 900))
  console.log("RADIOS", await page.locator("mat-radio-button").evaluateAll((e) => e.map((x) => `${(x as HTMLElement).innerText.trim()}=${x.classList.contains("mat-radio-checked")}${x.classList.contains("mat-radio-disabled") ? "(dis)" : ""}`)))
  console.log("CHECKS", await page.locator("mat-checkbox").evaluateAll((e) => e.map((x) => `${(x as HTMLElement).innerText.trim()}=${x.classList.contains("mat-checkbox-checked")}${x.classList.contains("mat-checkbox-disabled") ? "(dis)" : ""}`)))
})
