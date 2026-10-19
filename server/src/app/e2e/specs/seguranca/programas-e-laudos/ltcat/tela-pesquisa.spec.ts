// Pesquisa de LTCAT — regressão com usuário de permissão total. Usa a Região 71
// (onde os scripts de carga criam LTCATs), mas não depende da quantidade nem dos
// valores exatos dos registros: compara o grid com o que a própria tela retorna.
import { test, expect } from "../../../support"
import { ltcatValido } from "../../../support/data/ltcat"
import type { LtcatPage } from "../../../support/actions/LTCAT/LTCAT"

const REGIAO = ltcatValido.regiao
const MSG_CAMPOS_OBRIGATORIOS = "Existem um ou mais campos obrigatórios que não foram preenchidos."

const paraData = (texto: string) => {
  const [dia, mes, ano] = texto.split("/").map(Number)
  return new Date(ano, mes - 1, dia).getTime()
}

const estaEmOrdemCrescente = (datas: string[]) => {
  const tempos = datas.map(paraData)
  return tempos.every((t, i) => i === 0 || tempos[i - 1] <= t)
}

// percorre as páginas de 5 em 5, esperando cada uma ter as linhas certas antes de ler
async function lerTodasAsPaginas(ltcatPage: LtcatPage, total: number) {
  const textos: string[] = []
  const fins: string[] = []
  while (true) {
    await expect(ltcatPage.linhas).toHaveCount(Math.min(5, total - textos.length))
    textos.push(...(await ltcatPage.textoDasLinhas()))
    fins.push(...(await ltcatPage.celulas("dataFim")))
    if (textos.length >= total || !(await ltcatPage.irParaProximaPagina())) break
  }
  return { textos, fins }
}

test.describe("LTCAT - Tela de pesquisa (E2E)", () => {
  test.beforeEach(async ({ login, ltcatPage }) => {
    await login.entrar()
    await ltcatPage.abrir()
  })

  test("deve acessar a tela Lista de LTCATs", async ({ ltcatPage }) => {
    await expect(ltcatPage.titulo).toBeVisible()
    await expect(ltcatPage.botaoNovo).toBeVisible()
  })

  test.describe("Filtros", () => {
    test("não deve pesquisar com a Região vazia", async ({ ltcatPage, toast }) => {
      await ltcatPage.limpar()
      await ltcatPage.botaoPesquisar.click()
      await toast.temTexto(MSG_CAMPOS_OBRIGATORIOS)
    })

    test("Unidade e Setor ficam bloqueados sem Região e a Unidade habilita com uma Região", async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await expect(ltcatPage.unidade).toBeDisabled()
      await expect(ltcatPage.setor).toBeDisabled()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await expect(ltcatPage.unidade).toBeEnabled()
    })

    test("deve pesquisar só pela Região", async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
      const regioes = await ltcatPage.celulas("regiao")
      expect(regioes.length).toBeGreaterThan(0)
      expect(new Set(regioes)).toEqual(new Set([REGIAO]))
    })

    test("deve pesquisar por Região + Unidade", async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
      const [unidade] = (await ltcatPage.celulas("unidade")).filter(Boolean)
      test.skip(!unidade, "nenhum LTCAT da Região 71 tem Unidade preenchida")

      await ltcatPage.selecionarOpcao(ltcatPage.unidade, unidade)
      await ltcatPage.pesquisar()
      expect(new Set(await ltcatPage.celulas("unidade"))).toEqual(new Set([unidade]))
    })

    test("o filtro Ano lista o ano atual, 10 anteriores e 10 posteriores em ordem crescente", async ({ ltcatPage }) => {
      const atual = new Date().getFullYear()
      const esperado = Array.from({ length: 21 }, (_, i) => String(atual - 10 + i))
      const opcoes = await ltcatPage.opcoesDe(ltcatPage.ano)
      expect(opcoes.map((o) => o.trim())).toEqual(esperado)
    })

    test("deve pesquisar filtrando pelo Ano da vigência", async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
      const ano = (await ltcatPage.celulas("dataInicio"))[0].slice(-4)

      await ltcatPage.selecionarOpcao(ltcatPage.ano, new RegExp(`^\\s*${ano}\\s*$`))
      await ltcatPage.pesquisar()
      const inicios = await ltcatPage.celulas("dataInicio")
      const fins = await ltcatPage.celulas("dataFim")
      inicios.forEach((inicio, i) => {
        expect(`${inicio} ${fins[i]}`).toContain(ano)
      })
    })

    test("deve pesquisar ao pressionar Enter", async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.regiao.press("Enter")
      await expect(ltcatPage.linhas.first()).toBeVisible()
      expect(new Set(await ltcatPage.celulas("regiao"))).toEqual(new Set([REGIAO]))
    })

    test("Limpar esvazia os filtros e some quando o formulário está vazio", async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await expect(ltcatPage.botaoLimpar).toBeHidden()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await expect(ltcatPage.botaoLimpar).toBeVisible()
      await ltcatPage.botaoLimpar.click()
      await expect(ltcatPage.regiao).toHaveValue("")
      await expect(ltcatPage.botaoLimpar).toBeHidden()
    })

    test("deve exibir 'Sem registros para listar.' fixo quando não há resultado", async ({ ltcatPage, page }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.selecionarOpcao(ltcatPage.ano, /^\s*2016\s*$/)
      await ltcatPage.pesquisar()
      await expect(ltcatPage.mensagemSemRegistros).toBeVisible()
      await page.waitForTimeout(6000)
      await expect(ltcatPage.mensagemSemRegistros).toBeVisible()
    })
  })

  test.describe("Grid", () => {
    test.beforeEach(async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
    })

    test("deve vir ordenado por Data início decrescente", async ({ ltcatPage }) => {
      const datas = (await ltcatPage.celulas("dataInicio")).map(paraData)
      expect(datas).toEqual([...datas].sort((a, b) => b - a))
      expect(await ltcatPage.sentidoDaOrdenacao("dataInicio")).toBe("descending")
    })

    for (const coluna of ["dataInicio", "dataFim", "dataBase"] as const) {
      test(`${coluna}: 1º clique ordena crescente e o 2º decrescente (cronológico)`, async ({ ltcatPage }) => {
        await ltcatPage.ordenarPor(coluna)
        await expect.poll(() => ltcatPage.sentidoDaOrdenacao(coluna)).toBe("ascending")
        let datas = (await ltcatPage.celulas(coluna)).map(paraData)
        expect(datas).toEqual([...datas].sort((a, b) => a - b))

        await ltcatPage.ordenarPor(coluna)
        await expect.poll(() => ltcatPage.sentidoDaOrdenacao(coluna)).toBe("descending")
        datas = (await ltcatPage.celulas(coluna)).map(paraData)
        expect(datas).toEqual([...datas].sort((a, b) => b - a))
      })
    }

    test("ordenar uma coluna e depois outra mantém só a última ordenada", async ({ ltcatPage }) => {
      await ltcatPage.ordenarPor("dataFim")
      await expect.poll(() => ltcatPage.sentidoDaOrdenacao("dataFim")).toBe("ascending")
      await ltcatPage.ordenarPor("dataBase")
      await expect.poll(() => ltcatPage.sentidoDaOrdenacao("dataBase")).toBe("ascending")
      expect(await ltcatPage.sentidoDaOrdenacao("dataFim")).toBe("none")
      expect(await ltcatPage.sentidoDaOrdenacao("dataInicio")).toBe("none")
    })

    test("ao trocar de página a ordenação escolhida é mantida", async ({ ltcatPage }) => {
      // o Apollus lembra o tamanho de página do usuário: o finally devolve o padrão (30)
      try {
        await ltcatPage.definirItensPorPagina(5)
        const total = await ltcatPage.totalDeRegistros()
        test.skip(total <= 5, "poucos LTCATs na Região 71 para ter mais de uma página")

        await ltcatPage.ordenarPor("dataFim")
        await expect.poll(() => ltcatPage.sentidoDaOrdenacao("dataFim")).toBe("ascending")
        await expect.poll(async () => estaEmOrdemCrescente(await ltcatPage.celulas("dataFim"))).toBe(true)

        const { fins } = await lerTodasAsPaginas(ltcatPage, total)
        expect(estaEmOrdemCrescente(fins)).toBe(true)
        expect(await ltcatPage.sentidoDaOrdenacao("dataFim")).toBe("ascending")
      } finally {
        await ltcatPage.definirItensPorPagina(30)
      }
    })

    test("ao trocar de página nenhum registro repete ou falta", async ({ ltcatPage }) => {
      // BUG REAL (2026-10-14): com 5 por página e ordenação por Data fim (vários LTCATs com a mesma
      // data), a paginação perde um registro e repete outro, e às vezes oferece uma página a mais.
      // A EF espera "sem registro repetido nem faltando". Remover o test.fail quando corrigido.
      test.fail(true, "paginação com empate na coluna ordenada perde e repete registros")
      try {
        await ltcatPage.definirItensPorPagina(60)
        const total = await ltcatPage.totalDeRegistros()
        await expect.poll(async () => (await ltcatPage.textoDasLinhas()).length).toBe(total)
        const todas = await ltcatPage.textoDasLinhas()
        test.skip(total <= 5, "poucos LTCATs na Região 71 para ter mais de uma página")

        await ltcatPage.ordenarPor("dataFim")
        await expect.poll(() => ltcatPage.sentidoDaOrdenacao("dataFim")).toBe("ascending")
        await ltcatPage.definirItensPorPagina(5)

        const { textos } = await lerTodasAsPaginas(ltcatPage, total)
        expect(textos).toHaveLength(total)
        expect([...textos].sort()).toEqual([...todas].sort())
      } finally {
        await ltcatPage.definirItensPorPagina(30)
      }
    })

    test("o paginador vem com 30 itens e as opções 5, 10, 20, 30, 40, 50 e 60", async ({ ltcatPage }) => {
      await expect(ltcatPage.itensPorPagina).toHaveText("30")
      const opcoes = await ltcatPage.opcoesDe(ltcatPage.itensPorPagina)
      expect(opcoes.map((o) => o.trim()).slice(-7)).toEqual(["5", "10", "20", "30", "40", "50", "60"])
    })
  })

  test.describe("Excluir", () => {
    test("fechar o modal não remove; excluir remove, avisa e atualiza o contador do paginador", async ({ ltcatCadastroPage: cadastro, ltcatPage, toast }) => {
      test.setTimeout(120_000)
      // cria o próprio LTCAT, com vigência em 2019 para achá-lo no filtro Ano sem tocar nos demais
      await cadastro.abrir()
      await cadastro.preencherObrigatorios({
        ...ltcatValido,
        dataBase: "01/02/2019",
        vigenciaInicio: "01/02/2019",
        vigenciaFim: "28/02/2019",
        avaliacaoRealizadaEm: "LTCAT criado para o teste de exclusão",
        condicoesOperacionais: "Condições operacionais do teste de exclusão",
      })
      await cadastro.preencherConfiguracoesObrigatorias()
      await cadastro.salvar()
      await expect(cadastro.mensagemSalvoComSucesso).toBeVisible()

      await ltcatPage.abrir()
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.selecionarOpcao(ltcatPage.ano, /^\s*2019\s*$/)
      await ltcatPage.pesquisar()
      const antes = await ltcatPage.totalDeRegistros()
      expect(antes).toBeGreaterThan(0)

      await ltcatPage.abrirMenuDaLinha()
      await ltcatPage.menuDaLinha.filter({ hasText: "Excluir" }).click()
      await expect(ltcatPage.modalExclusao).toBeVisible()
      // a EF fala em "Cancelar", mas o botão do modal se chama "Fechar" (conferido em 2026-10-14)
      await ltcatPage.modalExclusao.getByRole("button", { name: "Fechar" }).click()
      await expect(ltcatPage.modalExclusao).toBeHidden()
      expect(await ltcatPage.totalDeRegistros()).toBe(antes)

      await ltcatPage.abrirMenuDaLinha()
      await ltcatPage.menuDaLinha.filter({ hasText: "Excluir" }).click()
      await ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" }).click()
      await toast.temTexto(/sucesso/i)
      await expect.poll(async () => ((await ltcatPage.mensagemSemRegistros.isVisible()) ? 0 : ltcatPage.totalDeRegistros())).toBe(antes - 1)
    })
  })

  test.describe("Ações", () => {
    test.beforeEach(async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
    })

    test("o menu da linha oferece Gerar LTCAT, Visualizar e Excluir, sem assinatura digital", async ({ ltcatPage }) => {
      await ltcatPage.abrirMenuDaLinha()
      await expect(ltcatPage.menuDaLinha.filter({ hasText: "Gerar LTCAT" })).toBeVisible()
      await expect(ltcatPage.menuDaLinha.filter({ hasText: "Visualizar" })).toBeVisible()
      await expect(ltcatPage.menuDaLinha.filter({ hasText: "Excluir" })).toBeVisible()
      await expect(ltcatPage.menuDaLinha.filter({ hasText: /assinatura/i })).toHaveCount(0)
    })

    test("duplo clique na linha abre o LTCAT", async ({ ltcatPage, ltcatCadastroPage, page }) => {
      await ltcatPage.linhas.first().dblclick()
      await expect(ltcatCadastroPage.titulo).toBeVisible()
      await expect(page).toHaveURL(/idkey=\d+/)
    })

    test("o botão Novo abre o cadastro de LTCAT", async ({ ltcatPage, ltcatCadastroPage }) => {
      await ltcatPage.botaoNovo.click()
      await expect(ltcatCadastroPage.titulo).toBeVisible()
    })
  })
})
