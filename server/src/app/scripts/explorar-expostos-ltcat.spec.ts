// Exploração (temporária): comportamento dos campos "Expostos" e do "Total de expostos" na aba Referências do LTCAT.
import { test } from "../support"

test("expostos LTCAT", async ({ login, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, idioma, context, page }) => {
  test.setTimeout(200000)
  await login.entrar()
  await cadastro.abrir()
  const campo = r.expostosMulheres
  console.log("ATTR", await campo.evaluate((e) => ({ type: e.getAttribute("type"), max: e.getAttribute("maxlength"), ro: (e as HTMLInputElement).readOnly })))
  console.log("TOTAL attr", await r.totalExpostos.evaluate((e) => ({ ro: (e as HTMLInputElement).readOnly, dis: (e as HTMLInputElement).disabled, v: (e as HTMLInputElement).value })))
  for (const entrada of ["-5", "10.5", "@#%", "10abc", "00010", "   ", " 10 ", "123456789012345", "0", "9999999999"]) {
    await campo.fill("")
    await campo.pressSequentially(entrada)
    await campo.press("Tab")
    console.log("ENTRADA", JSON.stringify(entrada), "->", JSON.stringify(await campo.inputValue()))
  }
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  for (const colado of ["123456789012345", "abc", "10abc", " 10 "]) {
    await page.evaluate((t) => navigator.clipboard.writeText(t), colado)
    await campo.fill("")
    await campo.click()
    await page.keyboard.press("Control+V")
    console.log("COLADO", JSON.stringify(colado), "->", JSON.stringify(await campo.inputValue()))
  }
  for (const [nome, c] of [["mulheres", r.expostosMulheres], ["homens", r.expostosHomens], ["pcds", r.expostosPcds], ["total", r.totalExpostos]] as const) {
    const icone = c.locator("xpath=ancestor::mat-form-field[1]").locator("apls-icon")
    console.log("HELP", nome, await icone.count(), await icone.count() ? await (await idioma.textoDoHelp(icone.first())).textContent() : null)
  }
  await r.expostosMulheres.fill("10"); await r.expostosHomens.fill("5"); await r.expostosPcds.fill("2")
  await r.expostosPcds.press("Tab")
  console.log("TOTAL 10+5+2 ->", await r.totalExpostos.inputValue())
  await r.expostosMulheres.fill("")
  await r.expostosMulheres.press("Tab")
  console.log("TOTAL sem mulheres ->", await r.totalExpostos.inputValue())
  await r.expostosPcds.fill("99"); await r.expostosPcds.press("Tab")
  console.log("TOTAL pcd 99 ->", await r.totalExpostos.inputValue())
})
