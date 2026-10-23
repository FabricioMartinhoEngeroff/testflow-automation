// Exploração (temporária): checkboxes "Incluir data de realização na capa" e "Incluir anexo de ART" da aba Referências.
import { test } from "@support"

test("explorar checkboxes de referências", async ({ login, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(150000)
  await login.entrar()
  await cadastro.abrir()
  for (const nome of ["Incluir data de realização na capa do laudo", "Incluir anexo de Anotação de Responsabilidade Técnica (ART)"] as const) {
    const cb = r.opcao(nome)
    const host = page.locator("mat-checkbox").filter({ hasText: nome })
    console.log("CB", nome, "checked:", await host.locator("input").isChecked(), "disabled:", await host.locator("input").isDisabled())
    console.log("HOST HTML", (await host.evaluate((e) => e.parentElement!.outerHTML)).slice(0, 1500))
    const icone = host.locator("xpath=..").locator("apls-icon, mat-icon")
    for (let i = 0; i < (await icone.count()); i++) {
      const id = await icone.nth(i).getAttribute("aria-describedby")
      if (id) console.log("HELP", nome, await page.locator(`#${id}`).textContent())
    }
    void cb
  }

  await cadastro.preencherObrigatorios()
  await cadastro.preencherConfiguracoesObrigatorias()
  const art = page.locator("mat-checkbox").filter({ hasText: "Incluir anexo de Anotação de Responsabilidade Técnica (ART)" })
  if (!(await art.locator("input").isChecked())) await art.locator("label").click()
  console.log("ART checked agora", await art.locator("input").isChecked(), "ART valor", JSON.stringify(await r.art.inputValue()))
  console.log("ART aria-required", await r.art.getAttribute("aria-required"))
  await cadastro.salvar()
  await page.waitForTimeout(4000)
  console.log("TOASTS", await page.locator("apls-toast").allInnerTexts())
  console.log("URL", page.url())
})
