// LTCAT > aba Anexos > Tooltip e Revisor (TST1222-TST1226, numeração assumida pela sequência da planilha).
// O ícone "i" da linha mostra a auditoria: criado por / data da criação / revisado por / data da revisão.
// A leitura e as regras do revisor vêm do Revisor global (support/actions/Revisor.ts), igual para todas as telas.
// A regra global da EF bate com a tela ("Revisado por" / "Data da revisão", data "dd/mm/aaaa, hh:mm:ss"):
// o antigo teste [EF] do item 5.4 ("Revisor: ... Data: ..." sem vírgula) foi removido por estar desatualizado.
import { test, expect } from "@support"
import { ltcatValido } from "@support/data/ltcat"
import {
  esperarCriacao,
  esperarDataRecente,
  esperarRevisao,
  esperarRotulos,
  lerData,
} from "@support/actions/Revisor"
import { abrirEdicaoAnexo, incluirAnexo, salvarLtcat } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

const TODOS_OS_CAMPOS = ["criadoPor", "dataCriacao", "revisadoPor", "dataRevisao"] as const

test.describe("LTCAT - Anexos - tooltip e revisor", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
    await ltcatCadastroPage.abrirAba("Anexos")
    await incluirAnexo(page, a, m, "Auditoria")
  })

  test("TST1222 - passar o mouse no ícone exibe o tooltip", async ({ ltcatAnexosPage: a, revisor }) => {
    const tooltip = await revisor.abrirTooltip(revisor.iconeDaLinha(a.linhasAnexo.first()))
    await expect(tooltip).toContainText("Revisado por:")
  })

  test("TST1223 - conteúdo: criado por, data da criação, revisado por e data da revisão", async ({ ltcatAnexosPage: a, revisor }) => {
    const texto = await revisor.textoDoTooltip(revisor.iconeDaLinha(a.linhasAnexo.first()))
    esperarRotulos(texto, "pt", [...TODOS_OS_CAMPOS])
    // criação antes da revisão no texto
    expect(texto.indexOf("Criado por")).toBeLessThan(texto.indexOf("Revisado por"))
    expect(texto).toMatch(/Criado por: @\S+ - .+/)
  })

  test("TST1224 - datas no padrão dd/mm/aaaa, hh:mm:ss e do momento da ação", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, revisor }) => {
    await abrirEdicaoAnexo(a, m)
    await m.descricao.fill("Revisado")
    await m.botaoSalvar.click()
    await expect(m.tituloEdicao).toHaveCount(0)

    const campos = await revisor.camposDoTooltip(revisor.iconeDaLinha(a.linhasAnexo.first()))
    esperarCriacao(campos)
    esperarRevisao(campos, { editado: true })
    esperarDataRecente(campos.dataCriacao, "pt")
    esperarDataRecente(campos.dataRevisao, "pt")
    expect(lerData(campos.dataRevisao!, "pt")!.getTime()).toBeGreaterThanOrEqual(lerData(campos.dataCriacao!, "pt")!.getTime())
  })

  test("TST1225 - editar atualiza o revisor e a data da revisão", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, revisor }) => {
    const icone = revisor.iconeDaLinha(a.linhasAnexo.first())
    esperarRevisao(await revisor.camposDoTooltip(icone), { editado: false })

    await abrirEdicaoAnexo(a, m)
    await m.descricao.fill("Depois da edição")
    await m.botaoSalvar.click()
    await expect(m.tituloEdicao).toHaveCount(0)

    const campos = await revisor.camposDoTooltip(icone)
    esperarRevisao(campos, { editado: true })
    expect(campos.revisadoPor).toMatch(/^@\S+ - .+/)
  })

  test("TST1226 - sem edição exibe só os dados de criação (revisão com hífen)", async ({ ltcatAnexosPage: a, revisor }) => {
    const campos = await revisor.camposDoTooltip(revisor.iconeDaLinha(a.linhasAnexo.first()))
    esperarCriacao(campos)
    esperarRevisao(campos, { editado: false })
  })
})

// Idiomas: o idioma é preferência da CONTA e a troca recarrega a página, então precisa de um LTCAT salvo.
// Cria 1 LTCAT novo no ambiente de homologação (sem rollback).
test.describe("LTCAT - Anexos - revisor nos 3 idiomas", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  test("TST1222/TST1226 (idiomas) - tooltip e aba Informações em pt, en e es, com a data no padrão de cada idioma", async ({
    ltcatCadastroPage: c,
    ltcatAnexosPage: a,
    ltcatAnexoModal: m,
    idioma,
    revisor,
    page,
  }) => {
    test.setTimeout(420000)
    await c.abrirAba("Referências")
    await c.preencherObrigatorios(ltcatValido)
    await c.preencherConfiguracoesObrigatorias()
    await c.abrirAba("Anexos")
    await incluirAnexo(page, a, m, "Sem revisão")
    await incluirAnexo(page, a, m, "Revisado")
    await abrirEdicaoAnexo(a, m, 1)
    await m.descricao.fill("Revisado!")
    await m.botaoSalvar.click()
    await expect(m.tituloEdicao).toHaveCount(0)

    // o "i" do cabeçalho só existe com o cadastro salvo ao menos uma vez
    await expect(revisor.botaoInformacoes).toHaveCount(0)
    await salvarLtcat(c, page)
    await expect(revisor.botaoInformacoes).toBeVisible()
    const url = page.url()

    // instante de cada data em cada idioma: tem que ser o mesmo, só muda a ordem dia/mês
    const instantes: Record<string, (number | undefined)[]> = {}
    await revisor.emCadaIdioma(idioma, async (id) => {
      await page.goto(url)
      // título e nomes de aba são traduzidos: o "i" do cabeçalho é o sinal de tela carregada em qualquer idioma
      await revisor.botaoInformacoes.waitFor({ state: "visible" })

      // aba Informações (cadastro)
      await revisor.abrirInformacoes()
      await expect(revisor.tituloDrawer).toBeVisible()
      const criacao = await revisor.lerSecao("criacao")
      esperarRotulos(criacao.texto, id, ["criadoPor", "dataCriacao"])
      esperarCriacao(criacao.campos, id)
      esperarDataRecente(criacao.campos.dataCriacao, id, 60)
      await revisor.fecharInformacoes()

      // tooltip dos anexos (a aba "Anexos" tem nome traduzido: acha pela posição)
      await page.getByRole("tab").nth(2).click()
      await expect(a.linhasAnexo).toHaveCount(2)
      const [semRevisao, revisado] = await Promise.all(
        [0, 1].map(async (i) => {
          const icone = revisor.iconeDaLinha(a.linhasAnexo.nth(i))
          return { texto: await revisor.textoDoTooltip(icone), campos: await revisor.camposDoTooltip(icone) }
        }),
      )
      for (const { texto } of [semRevisao, revisado]) esperarRotulos(texto, id, [...TODOS_OS_CAMPOS])
      esperarCriacao(semRevisao.campos, id)
      esperarRevisao(semRevisao.campos, { editado: false, idioma: id })
      esperarCriacao(revisado.campos, id)
      esperarRevisao(revisado.campos, { editado: true, idioma: id })
      esperarDataRecente(revisado.campos.dataRevisao, id, 60)
      await (await revisor.abrirTooltip(revisor.iconeDaLinha(a.linhasAnexo.nth(1)))).waitFor()

      instantes[id] = [lerData(revisado.campos.dataCriacao!, id)?.getTime(), lerData(revisado.campos.dataRevisao!, id)?.getTime()]
    })
    expect(instantes.en).toEqual(instantes.pt)
    expect(instantes.es).toEqual(instantes.pt)
  })
})
