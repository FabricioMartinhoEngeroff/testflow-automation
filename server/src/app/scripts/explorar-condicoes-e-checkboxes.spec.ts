// Exploração (temporária): campo "Condições operacionais" e os 5 checkboxes da aba Referências.
import { test } from "../support"

const OPCOES = [
  "Incluir logotipo na capa",
  "Incluir logotipo no cabeçalho de todas as páginas",
  "Incluir anexo de Anotação de Responsabilidade Técnica (ART)",
  "Incluir histórico de revisões",
  "Incluir data de realização na capa do laudo",
] as const

test("explorar condições operacionais e checkboxes", async ({ login, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(120000)
  await login.entrar()
  await cadastro.abrir()
  const c = r.condicoesOperacionais
  console.log("COND ATTRS", await c.evaluate((e) => ({ tag: e.tagName, attrs: [...e.attributes].filter((a) => !a.name.startsWith("_ng")).map((a) => `${a.name}=${a.value}`) })))
  console.log("COND WRAPPER", (await c.evaluate((e) => e.closest("mat-form-field")!.parentElement!.outerHTML)).replace(/_ng\w+-\w+-c\d+=""/g, "").slice(0, 2500))
  await c.click()
  await page.keyboard.insertText("linha 1\nlinha 2")
  console.log("COND NEWLINE", JSON.stringify(await c.inputValue()))

  for (const nome of OPCOES) {
    const cb = r.opcao(nome)
    console.log("CB", nome, "| count", await cb.count(), "| class", await cb.getAttribute("class"), "| checked", await cb.locator("input").isChecked(), "| disabled", await cb.locator("input").isDisabled())
    const icone = cb.locator("apls-icon, .mat-tooltip-trigger")
    if (await icone.count()) {
      const id = await icone.first().getAttribute("aria-describedby")
      console.log("   HELP", id ? await page.locator(`#${id}`).textContent() : "(sem id)")
    }
  }
  console.log("CB HTML", (await r.opcao("Incluir histórico de revisões").evaluate((e) => e.outerHTML)).replace(/_ng\w+-\w+-c\d+=""/g, "").slice(0, 2000))
  console.log("BOTOES CONFIG", await page.getByRole("button", { name: /Configura/ }).allInnerTexts())
})
