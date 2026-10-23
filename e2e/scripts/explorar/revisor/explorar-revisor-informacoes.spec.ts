// Exploração: valida o Revisor global (support/actions/Revisor.ts) num LTCAT salvo nos 3 idiomas:
// drawer "Informações" (Criação/Revisão) e tooltip do "i" da linha de Anexos. Não altera nada.
import { test, expect } from "@support"
import { esperarCriacao, esperarRevisao, esperarRotulos, lerData } from "@support/actions/Revisor"
import { URLS } from "@support/urls"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"

test("revisor - drawer e tooltip nos 3 idiomas", async ({ login, idioma, ltcatCadastroPage: c, ltcatAnexosPage: a, revisor, page }) => {
  test.setTimeout(240000)
  await login.entrar()

  const instantes: Record<string, number | undefined> = {}
  await revisor.emCadaIdioma(idioma, async (id) => {
    await page.goto(`${URLS.ltcatCadastro}?idkey=${IDKEY}`)
    // título e botões têm nome traduzido: o "i" do cabeçalho é o sinal de tela carregada em qualquer idioma
    await revisor.botaoInformacoes.waitFor({ state: "visible" })

    await revisor.abrirInformacoes()
    await expect(revisor.tituloDrawer).toBeVisible()
    const criacao = await revisor.lerSecao("criacao")
    const revisao = await revisor.lerSecao("revisao")
    console.log(id, "blocos:", await revisor.secoes(), criacao.campos, revisao.campos)
    esperarRotulos(criacao.texto, id, ["criadoPor", "dataCriacao"])
    esperarRotulos(revisao.texto, id, ["revisadoPor", "dataRevisao"])
    esperarCriacao(criacao.campos, id)
    esperarRevisao(revisao.campos, { editado: true, idioma: id })
    instantes[id] = lerData(revisao.campos.dataRevisao!, id)?.getTime()
    await revisor.fecharInformacoes()

    await page.getByRole("tab").nth(2).click() // a aba "Anexos" muda de nome conforme o idioma
    const icone = revisor.iconeDaLinha(a.linhasAnexo.first())
    const texto = await revisor.textoDoTooltip(icone)
    console.log(id, "tooltip:", texto)
    esperarRotulos(texto, id, ["criadoPor", "dataCriacao", "revisadoPor", "dataRevisao"])
    await expect(await revisor.abrirTooltip(icone)).toContainText(texto.slice(0, 8))
  })

  // o mesmo instante tem que aparecer igual nos 3 idiomas (só muda a ordem dia/mês)
  expect(instantes.en).toBe(instantes.pt)
  expect(instantes.es).toBe(instantes.pt)
})
