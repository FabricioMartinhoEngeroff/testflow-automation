// Exploração (temporária): salvar LTCAT com Expostos no limite (9999999999) e com valores menores; lê o toast e a resposta do servidor.
import { test } from "../support"
import { ltcatValido } from "../support/data/ltcat"

for (const valor of ["9999999999", "2147483647", "2147483648"]) {
  test(`salvar expostos homens = ${valor}`, async ({ login, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    test.setTimeout(150000)
    await login.entrar()
    await cadastro.abrir()
    await cadastro.preencherObrigatorios({ ...ltcatValido, vigenciaInicio: "01/01/2026", vigenciaFim: "31/12/2026" })
    await cadastro.preencherConfiguracoesObrigatorias()
    await r.expostosHomens.pressSequentially(valor)
    page.on("response", async (res) => {
      if (res.request().method() !== "GET" && res.url().includes("api")) console.log("RESP", valor, res.status(), res.url().slice(-60), (await res.text().catch(() => "")).slice(0, 300))
    })
    await cadastro.salvar()
    await page.waitForTimeout(3000)
    console.log("TOAST", valor, JSON.stringify(await page.locator("apls-toast").allInnerTexts()), page.url().includes("idkey"))
  })
}
