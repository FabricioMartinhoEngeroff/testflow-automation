// Exploração: o PGR 2156 apareceu em espanhol depois de page.reload() (aba "Adjuntos"). Acontece só no PGR? Só no reload?
import { test } from "../support"
import { URLS } from "../support/urls"

const rotulos = async (page: import("@playwright/test").Page) => {
  const tabs = page.getByRole("tab")
  await tabs.first().waitFor({ state: "visible" })
  const nomes = await tabs.allInnerTexts()
  const saudacao = (await page.getByText(/Olá|Hola|Hello/).first().innerText().catch(() => "?")).trim()
  return `${saudacao} | abas: ${nomes.map((n) => n.trim()).join(", ")}`
}

for (const [nome, url] of [
  ["PGR 2156", `${URLS.pgr}/cadastro?idkey=2156`],
  ["LTCAT 145", `${URLS.ltcatCadastro}?idkey=145`],
] as const) {
  test(`idioma ${nome}`, async ({ login, page }) => {
    await login.entrar()
    await page.goto(url)
    console.log(`${nome} - entrando direto: ${await rotulos(page)}`)
    await page.reload()
    console.log(`${nome} - depois de F5:     ${await rotulos(page)}`)
    await page.reload()
    console.log(`${nome} - depois de F5 (2): ${await rotulos(page)}`)
    await page.goto(url)
    console.log(`${nome} - goto de novo:     ${await rotulos(page)}`)
  })
}
