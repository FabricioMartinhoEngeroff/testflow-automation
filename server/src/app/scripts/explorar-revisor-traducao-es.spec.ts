// Exploração: o título do drawer "Informações" em espanhol ("Informaciónes") aparece em quais telas e em qual arquivo de tradução?
import { test } from "../support"
import { URLS } from "../support/urls"

const TELAS: Record<string, string> = {
  ltcat: `${URLS.ltcatCadastro}?idkey=${process.env.LTCAT_IDKEY ?? "145"}`,
  pgr: `${URLS.pgr}/cadastro?idkey=${process.env.PGR_IDKEY ?? "2156"}`,
  perfilAcesso: URLS.perfilAcesso,
}

test("revisor - título do drawer em es em várias telas", async ({ login, idioma, revisor, page }) => {
  test.setTimeout(240000)
  await login.entrar()
  await idioma.trocar("es")

  const arquivos = new Set<string>()
  page.on("response", async (r) => {
    const tipo = r.headers()["content-type"] ?? ""
    if (!/json|javascript|text/.test(tipo)) return
    const texto = await r.text().catch(() => "")
    if (texto.includes("Informaciónes")) arquivos.add(`ERRADO  ${r.url()}`)
    else if (/Informaciones/.test(texto)) arquivos.add(`certo   ${r.url()}`)
  })

  for (const [nome, url] of Object.entries(TELAS)) {
    await page.goto(url)
    await page.waitForTimeout(4000)
    if (!(await revisor.botaoInformacoes.first().isVisible().catch(() => false))) {
      console.log(nome, "=> sem ícone de Informações")
      continue
    }
    await revisor.botaoInformacoes.first().click()
    await page.waitForTimeout(1000)
    console.log(nome, "=> título:", JSON.stringify((await revisor.drawer.locator("h3").first().innerText().catch(() => "?")).trim()))
  }
  console.log([...arquivos].join("\n") || "nenhum arquivo traz a string")
})
