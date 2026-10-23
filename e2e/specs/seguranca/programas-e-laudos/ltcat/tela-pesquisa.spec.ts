// Pesquisa de LTCAT — regressão com usuário de permissão total. Usa a Região 71
// (onde os scripts de carga criam LTCATs), mas não depende da quantidade nem dos
// valores exatos dos registros: compara o grid com o que a própria tela retorna.
import { test, expect } from "@support"
import { ltcatValido } from "@support/data/ltcat"
import type { Locator, Page } from "@playwright/test"
import { LtcatPage, type Coluna } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCAT"
import { URLS } from "@support/urls"

const REGIAO = ltcatValido.regiao
const MSG_CAMPOS_OBRIGATORIOS = "Existem um ou mais campos obrigatórios que não foram preenchidos."
// a única unidade da Região 71 com LTCAT de Setor preenchido (visto em 2026-10-20)
const UNIDADE_COM_SETOR = "711005 - ADM CURITIBA"
const FORMATO_CODIGO_DESCRICAO = /^\S+ - .+$/

// lê as opções de um autocomplete/select depois que a lista termina de carregar
async function opcoesCarregadas(page: Page, campo: Locator) {
  await campo.click()
  await page.locator("mat-option").first().waitFor()
  await expect(page.locator("mat-option mat-spinner, mat-option mat-progress-spinner")).toHaveCount(0)
  const textos = (await page.locator("mat-option").allInnerTexts()).map((t) => t.trim())
  await page.keyboard.press("Escape")
  return textos
}

// "Ascendente de Código" (EF). Na tela, códigos numéricos vêm em ordem numérica (001, 90, 3322,
// 711001, 71106700) e antes dos alfanuméricos (ALI, ANG...), que seguem em ordem alfabética
function expectOrdemDeCodigo(opcoes: string[]) {
  const codigos = opcoes.map((o) => o.split(" - ")[0].trim())
  const numerico = (c: string) => /^\d+$/.test(c)
  const compara = (a: string, b: string) => {
    if (numerico(a) && numerico(b)) return Number(a) - Number(b)
    if (numerico(a) !== numerico(b)) return numerico(a) ? -1 : 1
    return a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  }
  const foraDeOrdem = codigos.findIndex((c, i) => i > 0 && compara(codigos[i - 1], c) > 0)
  expect(foraDeOrdem, `fora de ordem em "${codigos[foraDeOrdem]}": ${codigos.join(", ")}`).toBe(-1)
}

// texto do tooltip ligado pelo aria-describedby (fica num container oculto do Material)
async function tooltipDe(page: Page, elemento: Locator) {
  const id = await elemento.getAttribute("aria-describedby")
  return page.locator(`#${id}`)
}

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
      // a linha do próprio registro (início 01/02/2019): nunca mexe num LTCAT real de 2019
      const proprio = () => ltcatPage.celulas("dataInicio").then((d) => d.indexOf("01/02/2019"))
      expect(await proprio()).toBeGreaterThanOrEqual(0)

      await ltcatPage.abrirMenuDaLinha(await proprio())
      await ltcatPage.menuDaLinha.filter({ hasText: "Excluir" }).click()
      await expect(ltcatPage.modalExclusao).toBeVisible()
      // a EF fala em "Cancelar", mas o botão do modal se chama "Fechar" (conferido em 2026-10-14)
      await ltcatPage.modalExclusao.getByRole("button", { name: "Fechar" }).click()
      await expect(ltcatPage.modalExclusao).toBeHidden()
      expect(await ltcatPage.totalDeRegistros()).toBe(antes)

      await ltcatPage.abrirMenuDaLinha(await proprio())
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

    // "Gerar LTCAT assinado digitalmente" só aparece em LTCAT assinado: fica para a suíte de assinatura
    test("o menu da linha oferece Gerar LTCAT, Visualizar e Excluir", async ({ ltcatPage }) => {
      await ltcatPage.abrirMenuDaLinha()
      await expect(ltcatPage.itemDoMenu("Gerar LTCAT")).toBeVisible()
      await expect(ltcatPage.itemDoMenu("Visualizar")).toBeVisible()
      await expect(ltcatPage.itemDoMenu("Excluir")).toBeVisible()
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

    test("Visualizar do menu da linha abre o LTCAT", async ({ ltcatPage, ltcatCadastroPage, page }) => {
      await ltcatPage.abrirMenuDaLinha()
      await ltcatPage.itemDoMenu("Visualizar").click()
      await expect(ltcatCadastroPage.titulo).toBeVisible()
      await expect(page).toHaveURL(/idkey=\d+/)
    })

    test("modal de exclusão abre com o foco em Excluir (botão padrão) e Fechar não remove", async ({ ltcatPage }) => {
      const antes = await ltcatPage.totalDeRegistros()
      await ltcatPage.abrirMenuDaLinha()
      await ltcatPage.itemDoMenu("Excluir").click()
      await expect(ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" })).toBeFocused()
      await ltcatPage.modalExclusao.getByRole("button", { name: "Fechar" }).click()
      await expect(ltcatPage.modalExclusao).toBeHidden()
      expect(await ltcatPage.totalDeRegistros()).toBe(antes)
    })
  })

  test.describe("Opções dos filtros", () => {
    test.beforeEach(async ({ ltcatPage }) => {
      await ltcatPage.limpar()
    })

    test("Região lista 'código - descrição' em ordem crescente de código", async ({ ltcatPage, page }) => {
      const opcoes = await opcoesCarregadas(page, ltcatPage.regiao)
      for (const o of opcoes) expect(o).toMatch(FORMATO_CODIGO_DESCRICAO)
      expectOrdemDeCodigo(opcoes)
    })

    test("Unidade lista 'código - descrição' em ordem crescente de código, incluindo inativas", async ({ ltcatPage, page }) => {
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      const opcoes = await opcoesCarregadas(page, ltcatPage.unidade)
      for (const o of opcoes) expect(o).toMatch(FORMATO_CODIGO_DESCRICAO)
      expectOrdemDeCodigo(opcoes)
      expect(opcoes.some((o) => /\(Inativo\)\s*$/.test(o)), "alguma unidade inativa na lista").toBe(true)
    })

    test("Setor habilita com uma Unidade e lista 'código - descrição'", async ({ ltcatPage, page }) => {
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.selecionarOpcao(ltcatPage.unidade, UNIDADE_COM_SETOR)
      await expect(ltcatPage.setor).toBeEnabled()
      const opcoes = await opcoesCarregadas(page, ltcatPage.setor)
      expect(opcoes.length).toBeGreaterThan(0)
      for (const o of opcoes) expect(o).toMatch(FORMATO_CODIGO_DESCRICAO)
    })

    test("pesquisa por Região + Unidade + Setor traz só aquele setor", async ({ ltcatPage }) => {
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
      const setores = await ltcatPage.celulas("setor")
      const unidades = await ltcatPage.celulas("unidade")
      const i = setores.findIndex((s) => s.trim())
      test.skip(i < 0, "nenhum LTCAT da Região 71 tem Setor preenchido")

      await ltcatPage.selecionarOpcao(ltcatPage.unidade, unidades[i].trim())
      await ltcatPage.selecionarOpcao(ltcatPage.setor, setores[i].trim())
      await ltcatPage.pesquisar()
      expect(new Set((await ltcatPage.celulas("setor")).map((s) => s.trim()))).toEqual(new Set([setores[i].trim()]))
    })

    // EF Pesquisar, regra 4: não diferencia maiúsculas, minúsculas e acentos
    for (const termo of ["fabrica curitiba", "FÁBRICA CURITIBA", "Fabrica Curitiba"]) {
      test(`buscar "${termo}" na Unidade encontra a FÁBRICA CURITIBA`, async ({ ltcatPage, page }) => {
        await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
        await ltcatPage.unidade.click()
        await ltcatPage.unidade.pressSequentially(termo)
        await expect(page.locator("mat-option", { hasText: "711001 - FÁBRICA CURITIBA" })).toBeVisible()
      })
    }
  })

  // o admin tem várias opções em cada nível, então Região (H1), Unidade (H2) e Setor (H3) vêm como
  // multiselect (com 1 opção só, como nos perfis de permissão, é seleção única). Mesmos testes nos 3 níveis.
  test.describe("Multiselect de Região, Unidade e Setor", () => {
    type Nivel = "Região" | "Unidade" | "Setor"
    const NIVEIS: Nivel[] = ["Região", "Unidade", "Setor"]
    const campoDo = (ltcatPage: LtcatPage, nivel: Nivel) =>
      ({ Região: ltcatPage.regiao, Unidade: ltcatPage.unidade, Setor: ltcatPage.setor })[nivel]

    // deixa os níveis de cima com uma opção só, para o nível testado habilitar
    async function prepararNivel(ltcatPage: LtcatPage, nivel: Nivel) {
      if (nivel !== "Região") await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
      if (nivel === "Setor") await ltcatPage.marcarEConfirmar(ltcatPage.unidade, UNIDADE_COM_SETOR)
      return campoDo(ltcatPage, nivel)
    }

    // textos das duas primeiras opções do nível (abre e fecha o painel)
    async function duasOpcoes(ltcatPage: LtcatPage, page: Page, campo: Locator) {
      const opcoes = await opcoesCarregadas(page, campo)
      test.skip(opcoes.length < 2, "o nível tem só uma opção")
      return opcoes.slice(0, 2)
    }

    test.beforeEach(async ({ ltcatPage }) => {
      await ltcatPage.limpar()
    })

    for (const nivel of NIVEIS) {
      test.describe(nivel, () => {
        test("painel tem Todos, contador, X e ✓ com tooltip 'Confirmar'", async ({ ltcatPage, page }) => {
          const campo = await prepararNivel(ltcatPage, nivel)
          await campo.click()
          await expect(ltcatPage.marcarTodos).toBeVisible()
          await expect(ltcatPage.contadorSelecao).toHaveText(/^\s*0\/\d+\s*$/)
          await expect(ltcatPage.botaoDesmarcarTodos).toBeVisible()
          await expect(await tooltipDe(page, ltcatPage.botaoConfirmarSelecao)).toHaveText("Confirmar")
        })

        test("marcar uma opção atualiza o contador e o ✓ coloca no campo", async ({ ltcatPage, page }) => {
          const campo = await prepararNivel(ltcatPage, nivel)
          const [primeira] = await duasOpcoes(ltcatPage, page, campo)
          await campo.click()
          await ltcatPage.opcao(primeira).click()
          await expect(ltcatPage.opcao(primeira)).toHaveClass(/apls-selected/)
          await expect(ltcatPage.contadorSelecao).toHaveText(/^\s*1\/\d+\s*$/)
          await ltcatPage.botaoConfirmarSelecao.click()
          await expect(ltcatPage.painelMultiplo).toBeHidden()
          await expect(campo).toHaveValue(primeira)
        })

        test("X desmarca tudo e, confirmando, o campo fica vazio", async ({ ltcatPage, page }) => {
          const campo = await prepararNivel(ltcatPage, nivel)
          const [a, b] = await duasOpcoes(ltcatPage, page, campo)
          await campo.click()
          await ltcatPage.opcao(a).click()
          await ltcatPage.opcao(b).click()
          await expect(ltcatPage.contadorSelecao).toHaveText(/^\s*2\/\d+\s*$/)
          await ltcatPage.botaoDesmarcarTodos.click()
          await expect(ltcatPage.contadorSelecao).toHaveText(/^\s*0\/\d+\s*$/)
          await expect(ltcatPage.opcoesMarcadas).toHaveCount(0)
          await ltcatPage.botaoConfirmarSelecao.click()
          await expect(campo).toHaveValue("")
        })

        test("Todos marca todas as opções", async ({ ltcatPage }) => {
          const campo = await prepararNivel(ltcatPage, nivel)
          await campo.click()
          await ltcatPage.marcarTodos.click()
          const [marcadas, total] = (await ltcatPage.contadorSelecao.innerText()).trim().split("/")
          expect(marcadas).toBe(total)
        })

        test("pesquisa com duas opções traz só registros delas", async ({ ltcatPage, page }) => {
          const campo = await prepararNivel(ltcatPage, nivel)
          const escolhidas = await duasOpcoes(ltcatPage, page, campo)
          await ltcatPage.marcarEConfirmar(campo, ...escolhidas)
          await ltcatPage.pesquisar()
          const coluna = ({ Região: "regiao", Unidade: "unidade", Setor: "setor" } as const)[nivel]
          for (const valor of new Set(await ltcatPage.celulas(coluna))) expect(escolhidas).toContain(valor.trim())
        })
      })
    }

    // EF: com mais de uma H1 a H2 fica em branco e bloqueada; o mesmo da H2 para a H3
    test("com duas Regiões a Unidade fica em branco e bloqueada", async ({ ltcatPage, page }) => {
      const [a, b] = await duasOpcoes(ltcatPage, page, ltcatPage.regiao)
      await ltcatPage.marcarEConfirmar(ltcatPage.regiao, a)
      await expect(ltcatPage.unidade).toBeEnabled()
      await ltcatPage.marcarEConfirmar(ltcatPage.regiao, b)
      await expect(ltcatPage.unidade).toHaveValue("")
      await expect(ltcatPage.unidade).toBeDisabled()
    })

    test("com duas Unidades o Setor fica em branco e bloqueado", async ({ ltcatPage }) => {
      await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
      await ltcatPage.marcarEConfirmar(ltcatPage.unidade, UNIDADE_COM_SETOR)
      await expect(ltcatPage.setor).toBeEnabled()
      await ltcatPage.marcarEConfirmar(ltcatPage.unidade, "711001 - FÁBRICA CURITIBA")
      await expect(ltcatPage.setor).toHaveValue("")
      await expect(ltcatPage.setor).toBeDisabled()
    })
  })

  // Planilha QA "Campo - ano" + EF (Ano: atual ±10, crescente, sem digitar; filtra pelos anos da vigência)
  test.describe("Campo Ano", () => {
    type Registro = { texto: string; inicio: string; fim: string }
    const anoDe = (data: string) => data.trim().slice(-4)
    const exato = (ano: string | number) => new RegExp(`^\\s*${ano}\\s*$`)
    const ANO_ATUAL = new Date().getFullYear()
    const ANOS_ESPERADOS = Array.from({ length: 21 }, (_, i) => String(ANO_ATUAL - 10 + i))

    let base: Registro[] = []
    let unidadesBase: string[] = []
    let setoresBase: string[] = []
    let itensOriginais = 30

    // base = todos os LTCATs da Região 71 sem Ano, numa página só (60), para comparar com cada filtro
    test.beforeEach(async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
      itensOriginais = Number((await ltcatPage.itensPorPagina.innerText()).trim())
      await ltcatPage.definirItensPorPagina(60)
      test.skip((await ltcatPage.totalDeRegistros()) > 60, "mais de 60 LTCATs na Região 71: a base não cabe numa página")
      const textos = await ltcatPage.textoDasLinhas()
      const inicios = await ltcatPage.celulas("dataInicio")
      const fins = await ltcatPage.celulas("dataFim")
      unidadesBase = (await ltcatPage.celulas("unidade")).map((u) => u.trim())
      setoresBase = (await ltcatPage.celulas("setor")).map((s) => s.trim())
      base = textos.map((texto, i) => ({ texto, inicio: inicios[i], fim: fins[i] }))
    })

    test.afterEach(async ({ ltcatPage }) => {
      await ltcatPage.definirItensPorPagina(itensOriginais).catch(() => {})
    })

    // regra da EF: o LTCAT entra se o ano está em um dos campos da vigência (início ou fim)
    const esperadosNoAno = (ano: string) => base.filter((r) => anoDe(r.inicio) === ano || anoDe(r.fim) === ano)

    async function pesquisarAnoEConferir(ltcatPage: LtcatPage, ano: string) {
      await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ano))
      await ltcatPage.pesquisar()
      const esperados = esperadosNoAno(ano)
      if (esperados.length === 0) {
        await expect(ltcatPage.mensagemSemRegistros).toBeVisible()
        return
      }
      await expect.poll(() => ltcatPage.totalDeRegistros()).toBe(esperados.length)
      const inicios = await ltcatPage.celulas("dataInicio")
      const fins = await ltcatPage.celulas("dataFim")
      inicios.forEach((inicio, i) => expect([anoDe(inicio), anoDe(fins[i])], `linha ${i + 1}`).toContain(ano))
      expect((await ltcatPage.textoDasLinhas()).sort()).toEqual(esperados.map((r) => r.texto).sort())
    }

    test.describe("exibição e tipo", () => {
      test("aparece visível, habilitado, com o label 'Ano' e sem valor padrão", async ({ ltcatPage, page }) => {
        await expect(ltcatPage.ano).toBeVisible()
        await expect(ltcatPage.ano).toBeEnabled()
        await expect(page.locator("mat-label", { hasText: /^Ano$/ }).first()).toBeVisible()
        expect(await ltcatPage.anoSelecionado()).toBe("")
      })

      test("é um select, sem campo para digitar", async ({ ltcatPage }) => {
        expect(await ltcatPage.ano.evaluate((e) => e.tagName)).toBe("MAT-SELECT")
        await expect(ltcatPage.ano.locator("input, textarea")).toHaveCount(0)
      })

      test("clicar abre o painel com o título 'Ano', o X e o ✓", async ({ ltcatPage }) => {
        await ltcatPage.ano.click()
        await expect(ltcatPage.rotuloPainelAno).toHaveText("Ano")
        await expect(ltcatPage.botaoLimparAno).toBeVisible()
        await expect(ltcatPage.botaoConfirmarAno).toBeVisible()
      })

      test("clicar fora fecha o painel sem selecionar", async ({ ltcatPage, page }) => {
        await ltcatPage.ano.click()
        await expect(ltcatPage.painelAno).toBeVisible()
        await page.locator(".cdk-overlay-backdrop").click({ position: { x: 5, y: 5 } })
        await expect(ltcatPage.painelAno).toBeHidden()
        expect(await ltcatPage.anoSelecionado()).toBe("")
      })
    })

    test.describe("lista de anos", () => {
      let opcoes: string[] = []
      test.beforeEach(async ({ ltcatPage, page }) => {
        opcoes = await opcoesCarregadas(page, ltcatPage.ano)
      })

      test("tem exatamente 21 anos", () => {
        expect(opcoes).toHaveLength(21)
      })

      test("inclui o ano atual", () => {
        expect(opcoes).toContain(String(ANO_ATUAL))
      })

      test("inclui os 10 anos anteriores", () => {
        expect(opcoes.slice(0, 10)).toEqual(ANOS_ESPERADOS.slice(0, 10))
      })

      test("inclui os 10 anos posteriores", () => {
        expect(opcoes.slice(11)).toEqual(ANOS_ESPERADOS.slice(11))
      })

      test("está em ordem crescente numérica", () => {
        expect(opcoes).toEqual([...opcoes].sort((a, b) => Number(a) - Number(b)))
        expect(opcoes).toEqual(ANOS_ESPERADOS)
      })
    })

    // o relógio do navegador vai para 1º de janeiro do ano seguinte: a lista deve andar junto
    test("na virada do ano a lista passa a usar o novo ano atual", async ({ ltcatPage, page }) => {
      const proximo = ANO_ATUAL + 1
      await page.clock.setFixedTime(new Date(proximo, 0, 1, 8, 0, 0))
      await ltcatPage.abrir()
      const opcoes = await opcoesCarregadas(page, ltcatPage.ano)
      expect(opcoes).toEqual(Array.from({ length: 21 }, (_, i) => String(proximo - 10 + i)))
    })

    test.describe("não permite digitar", () => {
      test("teclas de letras são ignoradas e o select continua funcionando", async ({ ltcatPage, page }) => {
        await ltcatPage.ano.focus()
        await page.keyboard.type("abcxyz")
        await page.keyboard.press("Escape")
        await expect(ltcatPage.ano).not.toContainText(/[a-z]{3}/i)
        expect(await ltcatPage.anoSelecionado()).toBe("")
        await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ANO_ATUAL))
        expect(await ltcatPage.anoSelecionado()).toBe(String(ANO_ATUAL))
      })

      test("colar texto não entra no campo", async ({ ltcatPage, page }) => {
        await ltcatPage.ano.focus()
        await page.keyboard.insertText("texto colado 1999")
        await page.keyboard.press("Escape")
        await expect(ltcatPage.ano).not.toContainText("texto colado")
        expect(await ltcatPage.anoSelecionado()).not.toBe("1999")
      })
    })

    test.describe("seleção pelo teclado", () => {
      test("Enter abre, seta navega e Enter seleciona um ano", async ({ ltcatPage, page }) => {
        await ltcatPage.ano.focus()
        await page.keyboard.press("Enter")
        await expect(ltcatPage.painelAno).toBeVisible()
        await page.keyboard.press("ArrowDown")
        await page.keyboard.press("Enter")
        await expect.poll(() => ltcatPage.anoSelecionado()).toMatch(/^\d{4}$/)
      })

      test("o Ano entra na sequência do TAB", async ({ ltcatPage, page }) => {
        await ltcatPage.regiao.focus()
        let chegou = false
        for (let i = 0; i < 12 && !chegou; i++) {
          await page.keyboard.press("Tab")
          chegou = await ltcatPage.ano.evaluate((e) => e === document.activeElement || e.contains(document.activeElement))
        }
        expect(chegou, "o foco chega no Ano usando TAB a partir da Região").toBe(true)
      })
    })

    test.describe("selecionar e remover", () => {
      test("selecionar um ano aplica o filtro na pesquisa", async ({ ltcatPage }) => {
        await pesquisarAnoEConferir(ltcatPage, String(ANO_ATUAL))
      })

      test("o X do painel remove o ano e a pesquisa volta a trazer todos os anos", async ({ ltcatPage }) => {
        await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ANO_ATUAL))
        await ltcatPage.ano.click()
        await ltcatPage.botaoLimparAno.click()
        if (await ltcatPage.painelAno.isVisible()) await ltcatPage.botaoConfirmarAno.click()
        expect(await ltcatPage.anoSelecionado()).toBe("")
        await ltcatPage.pesquisar()
        await expect.poll(() => ltcatPage.totalDeRegistros()).toBe(base.length)
      })

      test("trocar o ano várias vezes seguidas filtra pelo último", async ({ ltcatPage }) => {
        for (const ano of [ANO_ATUAL - 1, ANO_ATUAL + 1, ANO_ATUAL - 2]) await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ano))
        await pesquisarAnoEConferir(ltcatPage, String(ANO_ATUAL))
      })

      test("menor ano da lista (atual - 10)", async ({ ltcatPage }) => {
        await pesquisarAnoEConferir(ltcatPage, ANOS_ESPERADOS[0])
      })

      test("maior ano da lista (atual + 10)", async ({ ltcatPage }) => {
        await pesquisarAnoEConferir(ltcatPage, ANOS_ESPERADOS[20])
      })
    })

    test.describe("pesquisa com Ano", () => {
      test("só o Ano, sem Região, cobra o campo obrigatório", async ({ ltcatPage, toast }) => {
        await ltcatPage.limpar()
        await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ANO_ATUAL))
        await ltcatPage.botaoPesquisar.click()
        await toast.temTexto(MSG_CAMPOS_OBRIGATORIOS)
      })

      test("Ano + Região traz só registros dos dois filtros", async ({ ltcatPage }) => {
        await pesquisarAnoEConferir(ltcatPage, String(ANO_ATUAL))
        expect(new Set((await ltcatPage.celulas("regiao")).map((r) => r.trim()))).toEqual(new Set([REGIAO]))
      })

      for (const niveis of [2, 3] as const) {
        test(`Ano + Região + Unidade${niveis === 3 ? " + Setor" : ""} respeita todos os filtros`, async ({ ltcatPage }) => {
          const linha = base.findIndex((r, k) => unidadesBase[k] && (niveis === 2 || setoresBase[k]) && ANOS_ESPERADOS.includes(anoDe(r.inicio)))
          test.skip(linha < 0, "nenhum LTCAT da Região 71 com esses níveis preenchidos e ano na lista")
          const ano = anoDe(base[linha].inicio)

          await ltcatPage.marcarEConfirmar(ltcatPage.unidade, unidadesBase[linha])
          if (niveis === 3) await ltcatPage.marcarEConfirmar(ltcatPage.setor, setoresBase[linha])
          await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ano))
          await ltcatPage.pesquisar()

          const inicios = await ltcatPage.celulas("dataInicio")
          const fins = await ltcatPage.celulas("dataFim")
          expect(inicios.length).toBeGreaterThan(0)
          inicios.forEach((inicio, k) => expect([anoDe(inicio), anoDe(fins[k])]).toContain(ano))
          expect(new Set((await ltcatPage.celulas("unidade")).map((u) => u.trim()))).toEqual(new Set([unidadesBase[linha]]))
          if (niveis === 3) expect(new Set((await ltcatPage.celulas("setor")).map((s) => s.trim()))).toEqual(new Set([setoresBase[linha]]))
        })
      }

      test("ano sem LTCAT mostra 'Sem registros para listar.' e a mensagem continua na tela", async ({ ltcatPage, page }) => {
        const vazio = ANOS_ESPERADOS.find((a) => esperadosNoAno(a).length === 0)
        test.skip(!vazio, "todos os anos da lista têm LTCAT na Região 71")
        await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(vazio!))
        await ltcatPage.pesquisar()
        await expect(ltcatPage.mensagemSemRegistros).toBeVisible()
        await page.waitForTimeout(6000)
        await expect(ltcatPage.mensagemSemRegistros).toBeVisible()
      })

      test("ano com vários LTCATs traz todos eles", async ({ ltcatPage }) => {
        const ano = [...ANOS_ESPERADOS].sort((a, b) => esperadosNoAno(b).length - esperadosNoAno(a).length)[0]
        test.skip(esperadosNoAno(ano).length < 2, "nenhum ano com mais de um LTCAT")
        await pesquisarAnoEConferir(ltcatPage, ano)
      })

      test("vigência com início e fim no mesmo ano", async ({ ltcatPage }) => {
        const r = base.find((x) => anoDe(x.inicio) === anoDe(x.fim) && ANOS_ESPERADOS.includes(anoDe(x.inicio)))
        test.skip(!r, "nenhum LTCAT com a vigência dentro de um ano só")
        await pesquisarAnoEConferir(ltcatPage, anoDe(r!.inicio))
      })

      for (const ponta of ["início", "fim"] as const) {
        test(`vigência que atravessa anos aparece pelo ano do ${ponta}`, async ({ ltcatPage }) => {
          const r = base.find((x) => anoDe(x.inicio) !== anoDe(x.fim) && ANOS_ESPERADOS.includes(anoDe(x.inicio)) && ANOS_ESPERADOS.includes(anoDe(x.fim)))
          test.skip(!r, "nenhum LTCAT com vigência em dois anos da lista")
          await pesquisarAnoEConferir(ltcatPage, anoDe(ponta === "início" ? r!.inicio : r!.fim))
          expect(await ltcatPage.textoDasLinhas()).toContain(r!.texto)
        })
      }

      test("vigência futura aparece no ano dela", async ({ ltcatPage }) => {
        const ano = ANOS_ESPERADOS.find((a) => Number(a) > ANO_ATUAL && esperadosNoAno(a).length > 0)
        test.skip(!ano, "nenhum LTCAT com vigência futura")
        await pesquisarAnoEConferir(ltcatPage, ano!)
      })

      test("vigência passada aparece no ano dela", async ({ ltcatPage }) => {
        const ano = ANOS_ESPERADOS.find((a) => Number(a) < ANO_ATUAL && esperadosNoAno(a).length > 0)
        test.skip(!ano, "nenhum LTCAT com vigência passada")
        await pesquisarAnoEConferir(ltcatPage, ano!)
      })

      test("pesquisa com Ano responde em até 10 segundos", async ({ ltcatPage }) => {
        await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ANO_ATUAL))
        const inicio = Date.now()
        await ltcatPage.botaoPesquisar.click()
        await expect(ltcatPage.linhas.first()).toBeVisible({ timeout: 10_000 })
        expect(Date.now() - inicio).toBeLessThan(10_000)
      })
    })

    test.describe("convivência com os outros filtros", () => {
      test("escolher o Ano não altera Região e Unidade", async ({ ltcatPage }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.unidade, UNIDADE_COM_SETOR)
        await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ANO_ATUAL))
        await expect(ltcatPage.regiao).toHaveValue(new RegExp(REGIAO))
        await expect(ltcatPage.unidade).toHaveValue(new RegExp(UNIDADE_COM_SETOR))
      })

      test("limpar a Unidade pelo X mantém o Ano escolhido", async ({ ltcatPage }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.unidade, UNIDADE_COM_SETOR)
        await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ANO_ATUAL))
        await ltcatPage.unidade.click()
        await ltcatPage.botaoDesmarcarTodos.click()
        await ltcatPage.botaoConfirmarSelecao.click()
        await expect(ltcatPage.unidade).toHaveValue("")
        expect(await ltcatPage.anoSelecionado()).toBe(String(ANO_ATUAL))
      })

      // a planilha aceita "mantém ou limpa conforme o padrão": o que não pode é ficar com outro ano
      test("recarregar a página não deixa o Ano com valor inconsistente", async ({ ltcatPage, page }) => {
        await ltcatPage.selecionarOpcao(ltcatPage.ano, exato(ANO_ATUAL))
        await page.reload()
        await ltcatPage.titulo.waitFor()
        expect(["", String(ANO_ATUAL)]).toContain(await ltcatPage.anoSelecionado())
      })
    })
  })

  // Planilha QA "Botões do grid de pesquisa - pesquisar, limpar, recolher/expandir filtros"
  test.describe("Botões do filtro (Pesquisar, Limpar, Recolher/Expandir)", () => {
    const icone = (botao: Locator) => botao.locator("mat-icon")
    const campoDoForm = (page: Page, campo: Locator) => page.locator("mat-form-field", { has: campo })

    test.beforeEach(async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      if (await ltcatPage.botaoExpandirFiltros.isVisible()) await ltcatPage.botaoExpandirFiltros.click()
    })

    test.describe("exibição inicial", () => {
      test("Pesquisar e Recolher filtros avançados aparecem, Limpar não", async ({ ltcatPage }) => {
        await expect(ltcatPage.botaoPesquisar).toBeVisible()
        await expect(ltcatPage.botaoRecolherFiltros).toBeVisible()
        await expect(ltcatPage.botaoLimpar).toBeHidden()
      })

      test("Limpar aparece ao preencher um campo e some ao esvaziar manualmente", async ({ ltcatPage }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await expect(ltcatPage.botaoLimpar).toBeVisible()
        await ltcatPage.regiao.click()
        await ltcatPage.botaoDesmarcarTodos.click()
        await ltcatPage.botaoConfirmarSelecao.click()
        await expect(ltcatPage.regiao).toHaveValue("")
        await expect(ltcatPage.botaoLimpar).toBeHidden()
      })
    })

    // DIVERGÊNCIA EF x tela (2026-10-20): a EF pede times/filter/keyboard_arrow_down/up; a tela usa
    // clear/search/expand_less/expand_more. Remover o test.fail quando a EF ou a tela for alinhada.
    test.describe("ícones conforme a EF", () => {
      test("Limpar usa o ícone 'times'", async ({ ltcatPage }) => {
        test.fail(true, "tela usa o ícone 'clear'")
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await expect(icone(ltcatPage.botaoLimpar)).toHaveText("times")
      })

      test("Pesquisar usa o ícone 'filter'", async ({ ltcatPage }) => {
        test.fail(true, "tela usa o ícone 'search'")
        await expect(icone(ltcatPage.botaoPesquisar)).toHaveText("filter")
      })

      test("Recolher usa 'keyboard_arrow_down' e Expandir 'keyboard_arrow_up'", async ({ ltcatPage, page }) => {
        test.fail(true, "tela usa 'expand_less' e 'expand_more'")
        const recolherExpandir = page.locator("button:visible", { hasText: /expand_|keyboard_arrow_/ })
        await expect(icone(recolherExpandir)).toHaveText("keyboard_arrow_down")
        await recolherExpandir.click()
        await expect(icone(recolherExpandir)).toHaveText("keyboard_arrow_up")
      })
    })

    test.describe("Limpar", () => {
      test("com Região, Unidade, Setor e Ano preenchidos volta tudo ao estado inicial", async ({ ltcatPage }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.marcarEConfirmar(ltcatPage.unidade, UNIDADE_COM_SETOR)
        await ltcatPage.setor.click()
        await ltcatPage.primeiraOpcao.click()
        await ltcatPage.botaoConfirmarSelecao.click()
        await ltcatPage.selecionarOpcao(ltcatPage.ano, String(new Date().getFullYear()))

        await ltcatPage.botaoLimpar.click()
        await expect(ltcatPage.regiao).toHaveValue("")
        await expect(ltcatPage.unidade).toHaveValue("")
        await expect(ltcatPage.unidade).toBeDisabled()
        await expect(ltcatPage.setor).toHaveValue("")
        await expect(ltcatPage.setor).toBeDisabled()
        expect(await ltcatPage.anoSelecionado()).toBe("")
        await expect(ltcatPage.botaoLimpar).toBeHidden()
      })

      test("Limpar funciona pelo teclado (Enter)", async ({ ltcatPage }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.botaoLimpar.focus()
        await ltcatPage.botaoLimpar.press("Enter")
        await expect(ltcatPage.regiao).toHaveValue("")
      })

      test("vários cliques rápidos no Limpar não quebram a tela", async ({ ltcatPage, page }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.selecionarOpcao(ltcatPage.ano, String(new Date().getFullYear()))
        await ltcatPage.botaoLimpar.click({ clickCount: 3 })
        await expect(ltcatPage.regiao).toHaveValue("")
        expect(await ltcatPage.anoSelecionado()).toBe("")
        await expect(page.locator("apls-toast")).toHaveCount(0)
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.pesquisar()
        expect(await ltcatPage.totalDeRegistros()).toBeGreaterThan(0)
      })

      test("depois de limpar, a pesquisa considera só os filtros que sobraram", async ({ ltcatPage }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.pesquisar()
        const totalRegiao = await ltcatPage.totalDeRegistros()

        await ltcatPage.marcarEConfirmar(ltcatPage.unidade, UNIDADE_COM_SETOR)
        await ltcatPage.pesquisar()
        expect(new Set((await ltcatPage.celulas("unidade")).map((u) => u.trim()))).toEqual(new Set([UNIDADE_COM_SETOR]))

        await ltcatPage.unidade.click()
        await ltcatPage.botaoDesmarcarTodos.click()
        await ltcatPage.botaoConfirmarSelecao.click()
        await ltcatPage.pesquisar()
        await expect.poll(() => ltcatPage.totalDeRegistros()).toBe(totalRegiao)
      })
    })

    test.describe("Pesquisar", () => {
      test("sem a Região destaca o campo obrigatório", async ({ ltcatPage, page, toast }) => {
        await ltcatPage.botaoPesquisar.click()
        await toast.temTexto(MSG_CAMPOS_OBRIGATORIOS)
        await expect(campoDoForm(page, ltcatPage.regiao)).toHaveClass(/mat-form-field-invalid/)
      })

      test("Enter num campo vazio também cobra o obrigatório", async ({ ltcatPage, toast }) => {
        await ltcatPage.regiao.focus()
        await ltcatPage.regiao.press("Enter")
        await toast.temTexto(MSG_CAMPOS_OBRIGATORIOS)
      })

      test("caracteres especiais na busca da Unidade não dão erro", async ({ ltcatPage, page }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.unidade.click()
        await ltcatPage.unidade.pressSequentially("@#!$%&*()'\"")
        await expect(page.locator("mat-option").first()).toBeVisible()
        await expect(page.locator("mat-option", { hasText: "Nenhum registro encontrado." })).toBeVisible()
        await expect(page.locator("apls-toast")).toHaveCount(0)
      })

      test("vários cliques rápidos no Pesquisar não duplicam o resultado", async ({ ltcatPage }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.pesquisar()
        const total = await ltcatPage.totalDeRegistros()
        const linhas = await ltcatPage.linhas.count()

        await ltcatPage.botaoPesquisar.click({ clickCount: 3 })
        await expect.poll(() => ltcatPage.totalDeRegistros()).toBe(total)
        await expect(ltcatPage.linhas).toHaveCount(linhas)
        const textos = await ltcatPage.textoDasLinhas()
        expect(new Set(textos).size, "nenhuma linha repetida na página").toBe(textos.length)
      })

      test("Pesquisar responde em até 10 segundos", async ({ ltcatPage }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        const inicio = Date.now()
        await ltcatPage.botaoPesquisar.click()
        await expect(ltcatPage.linhas.first()).toBeVisible({ timeout: 10_000 })
        expect(Date.now() - inicio).toBeLessThan(10_000)
      })
    })

    test.describe("Recolher/Expandir filtros avançados", () => {
      test("Recolher esconde Unidade, Setor e Ano e troca para Expandir com o tooltip certo", async ({ ltcatPage, page }) => {
        await ltcatPage.botaoRecolherFiltros.click()
        for (const campo of [ltcatPage.unidade, ltcatPage.setor, ltcatPage.ano]) await expect(campo).toBeHidden()
        await expect(ltcatPage.regiao).toBeVisible()
        await expect(ltcatPage.botaoRecolherFiltros).toBeHidden()
        await expect(await tooltipDe(page, ltcatPage.botaoExpandirFiltros)).toHaveText("Expandir filtros avançados")
      })

      test("Expandir mostra os filtros de novo", async ({ ltcatPage }) => {
        await ltcatPage.botaoRecolherFiltros.click()
        await ltcatPage.botaoExpandirFiltros.click()
        for (const campo of [ltcatPage.unidade, ltcatPage.setor, ltcatPage.ano]) await expect(campo).toBeVisible()
        await expect(ltcatPage.botaoRecolherFiltros).toBeVisible()
      })

      test("recolher e expandir preserva os valores preenchidos", async ({ ltcatPage }) => {
        const ano = String(new Date().getFullYear())
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.marcarEConfirmar(ltcatPage.unidade, UNIDADE_COM_SETOR)
        await ltcatPage.selecionarOpcao(ltcatPage.ano, ano)
        await ltcatPage.botaoRecolherFiltros.click()
        await ltcatPage.botaoExpandirFiltros.click()
        await expect(ltcatPage.regiao).toHaveValue(new RegExp(REGIAO))
        await expect(ltcatPage.unidade).toHaveValue(new RegExp(UNIDADE_COM_SETOR))
        expect(await ltcatPage.anoSelecionado()).toBe(ano)
      })

      test("Enter com os filtros recolhidos pesquisa normalmente", async ({ ltcatPage }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.botaoRecolherFiltros.click()
        await ltcatPage.regiao.focus()
        await ltcatPage.regiao.press("Enter")
        await expect(ltcatPage.linhas.first()).toBeVisible()
        expect(new Set((await ltcatPage.celulas("regiao")).map((r) => r.trim()))).toEqual(new Set([REGIAO]))
      })
    })

    test.describe("tela", () => {
      test("depois de recarregar, os botões ficam num estado coerente", async ({ ltcatPage, page }) => {
        await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
        await ltcatPage.botaoRecolherFiltros.click()
        await page.reload()
        await ltcatPage.titulo.waitFor()
        await expect(ltcatPage.botaoPesquisar).toBeVisible()
        // um dos dois, nunca os dois nem nenhum
        expect(Number(await ltcatPage.botaoRecolherFiltros.isVisible()) + Number(await ltcatPage.botaoExpandirFiltros.isVisible())).toBe(1)
        // Limpar só aparece se sobrou algum campo preenchido
        const preenchido = (await ltcatPage.regiao.inputValue()) !== "" || (await ltcatPage.anoSelecionado()) !== ""
        await expect(ltcatPage.botaoLimpar).toBeVisible({ visible: preenchido })
      })

      for (const { largura, altura } of [{ largura: 1024, altura: 768 }, { largura: 800, altura: 600 }]) {
        test(`em ${largura}x${altura} os botões continuam acessíveis`, async ({ ltcatPage, page }) => {
          await page.setViewportSize({ width: largura, height: altura })
          await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
          for (const botao of [ltcatPage.botaoPesquisar, ltcatPage.botaoLimpar, ltcatPage.botaoRecolherFiltros]) {
            await botao.scrollIntoViewIfNeeded()
            await expect(botao).toBeInViewport()
          }
          await ltcatPage.pesquisar()
          expect(await ltcatPage.totalDeRegistros()).toBeGreaterThan(0)
        })
      }
    })
  })

  // Planilha QA "Pesquisa > Resultado da consulta"
  test.describe("Resultado da consulta", () => {
    const TITULOS_DA_TELA = ["Região", "Unidade", "Setor", "Responsável", "Data início", "Data fim", "Data base", "Revisão"]
    const COLUNAS_TEXTO = ["regiao", "unidade", "setor", "responsavel", "revisao"] as const
    let itensOriginais = 30

    test.beforeEach(async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
      itensOriginais = Number((await ltcatPage.itensPorPagina.innerText()).trim())
    })

    test.afterEach(async ({ ltcatPage }) => {
      await ltcatPage.definirItensPorPagina(itensOriginais).catch(() => {})
    })

    test.describe("exibição", () => {
      test("pesquisa válida mostra o grid com linhas", async ({ ltcatPage }) => {
        await expect(ltcatPage.grade).toBeVisible()
        expect(await ltcatPage.totalDeRegistros()).toBeGreaterThan(0)
        await expect(ltcatPage.mensagemSemRegistros).toBeHidden()
      })

      test("abrir a tela sem pesquisar não mostra erro", async ({ ltcatPage, page }) => {
        await ltcatPage.limpar()
        await page.reload()
        await ltcatPage.titulo.waitFor()
        await expect(ltcatPage.grade).toBeVisible()
        await expect(page.locator("apls-toast")).toHaveCount(0)
      })

      test("colunas na ordem da tela: Região, Unidade, Setor, Responsável, Data início, Data fim, Data base, Revisão", async ({ ltcatPage }) => {
        expect(await ltcatPage.titulosDasColunas()).toEqual(TITULOS_DA_TELA)
      })

      // DIVERGÊNCIA EF/planilha x tela (2026-10-20): EF e planilha escrevem "Data Início" e "Data Fim";
      // a tela mostra "Data início" e "Data fim". Remover o test.fail quando alinharem.
      test("títulos de data com a grafia da EF ('Data Início', 'Data Fim', 'Data base')", async ({ ltcatPage }) => {
        test.fail(true, "tela usa 'Data início' e 'Data fim' (minúsculas)")
        const titulos = await ltcatPage.titulosDasColunas()
        expect(titulos.slice(4, 7)).toEqual(["Data Início", "Data Fim", "Data base"])
      })

      // DIVERGÊNCIA planilha x tela (2026-10-20): a planilha pede hífen nas células sem dado; a tela deixa
      // em branco (a EF não fala nada). Remover o test.fail quando definirem o padrão.
      test("célula sem dado mostra hífen", async ({ ltcatPage }) => {
        test.fail(true, "tela deixa Unidade/Setor vazios em vez de '-'")
        const unidades = await ltcatPage.celulas("unidade")
        const vazias = unidades.filter((u) => !u.trim() || u.trim() === "-")
        test.skip(vazias.length === 0, "nenhum LTCAT sem Unidade na página")
        for (const u of vazias) expect(u.trim()).toBe("-")
      })

      test("texto longo fica cortado com reticências e completo no tooltip", async ({ ltcatPage, page }) => {
        const setores = await ltcatPage.celulas("setor")
        const i = setores.findIndex((s) => s.trim().length > 20)
        test.skip(i < 0, "nenhum Setor longo na primeira página")
        const celula = ltcatPage.linhas.nth(i).locator("td").nth(2)
        expect(await celula.evaluate((e) => getComputedStyle(e).textOverflow)).toBe("ellipsis")
        await expect(await tooltipDe(page, celula)).toHaveText(setores[i].trim())
      })

      test("em 800x600 o grid continua utilizável (rola, abre o menu e pagina)", async ({ ltcatPage, page }) => {
        await page.setViewportSize({ width: 800, height: 600 })
        await expect(ltcatPage.grade).toBeVisible()
        await ltcatPage.abrirMenuDaLinha()
        await expect(ltcatPage.itemDoMenu("Visualizar")).toBeVisible()
        await page.keyboard.press("Escape")
        await ltcatPage.paginador.scrollIntoViewIfNeeded()
        await expect(ltcatPage.paginador).toBeInViewport()
      })

      test("pesquisar de novo com outro filtro atualiza o grid", async ({ ltcatPage }) => {
        const ano = (await ltcatPage.celulas("dataInicio"))[0].slice(-4)
        await ltcatPage.selecionarOpcao(ltcatPage.ano, new RegExp(`^\\s*${ano}\\s*$`))
        await ltcatPage.pesquisar()
        const inicios = await ltcatPage.celulas("dataInicio")
        const fins = await ltcatPage.celulas("dataFim")
        inicios.forEach((inicio, i) => expect(`${inicio} ${fins[i]}`).toContain(ano))
      })
    })

    // compara a linha do grid com o cadastro aberto por ela
    test("cada coluna mostra o valor do cadastro do LTCAT", async ({ ltcatPage, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r }) => {
      await ltcatPage.definirItensPorPagina(60)
      const setores = await ltcatPage.celulas("setor")
      let i = setores.findIndex((s) => s.trim())
      if (i < 0) i = 0
      const linha = Object.fromEntries(
        await Promise.all((["regiao", "unidade", "setor", "responsavel", "dataInicio", "dataFim", "dataBase"] as const).map(async (c) => [c, (await ltcatPage.celulas(c))[i].trim()])),
      ) as Record<string, string>

      await ltcatPage.linhas.nth(i).dblclick()
      await expect(cadastro.titulo).toBeVisible()
      await expect.soft(cadastro.regiao, "Hierarquia 1").toHaveValue(new RegExp(linha.regiao))
      if (linha.unidade) await expect.soft(cadastro.unidade, "Hierarquia 2").toHaveValue(new RegExp(linha.unidade))
      if (linha.setor) await expect.soft(cadastro.setor, "Hierarquia 3").toHaveValue(new RegExp(linha.setor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      await expect.soft(r.responsavelTecnico, "Responsável").toHaveValue(new RegExp(linha.responsavel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      await expect.soft(r.vigenciaInicio, "Data início = 1º campo da vigência").toHaveValue(linha.dataInicio)
      await expect.soft(r.vigenciaFim, "Data fim = 2º campo da vigência").toHaveValue(linha.dataFim)
      await expect.soft(cadastro.dataBase, "Data base").toHaveValue(linha.dataBase)
    })

    test.fixme("LTCAT só com revisões canceladas não mostra 'Sim' na Revisão", async () => {
      // falta saber como se cancela uma revisão no histórico (botão/fluxo) para montar o registro próprio
    })

    test.describe("ordenação", () => {
      for (const coluna of COLUNAS_TEXTO) {
        test(`coluna ${coluna}: decrescente é o inverso do crescente e especiais vêm antes no crescente`, async ({ ltcatPage }) => {
          await ltcatPage.definirItensPorPagina(60)
          test.skip((await ltcatPage.totalDeRegistros()) > 60, "a Região 71 não cabe numa página")
          await ltcatPage.ordenarAte(coluna, "ascending")
          const crescente = await ltcatPage.celulas(coluna)
          await ltcatPage.ordenarAte(coluna, "descending")
          expect(await ltcatPage.celulas(coluna)).toEqual([...crescente].reverse())

          const preenchidos = crescente.map((v) => v.trim()).filter(Boolean)
          const especial = preenchidos.map((v) => !/^[\p{L}\p{N}]/u.test(v))
          const ultimoEspecial = especial.lastIndexOf(true)
          const primeiroComum = especial.indexOf(false)
          if (ultimoEspecial >= 0 && primeiroComum >= 0) expect(ultimoEspecial).toBeLessThan(primeiroComum)
        })
      }

      test("a coluna ordenada mostra a seta e as outras não", async ({ ltcatPage }) => {
        await ltcatPage.ordenarAte("dataFim", "ascending")
        const opacidade = (c: Coluna) => ltcatPage.cabecalho(c).locator(".mat-sort-header-arrow").evaluate((e) => getComputedStyle(e).opacity)
        await expect.poll(() => opacidade("dataFim")).toBe("1")
        expect(await opacidade("dataBase")).toBe("0")
      })

      test("cliques rápidos no cabeçalho terminam numa ordenação coerente com os dados", async ({ ltcatPage }) => {
        await ltcatPage.cabecalho("dataInicio").locator("[role=button]").click({ clickCount: 5 })
        await expect.poll(() => ltcatPage.sentidoDaOrdenacao("dataInicio")).not.toBe(null)
        const sentido = await ltcatPage.sentidoDaOrdenacao("dataInicio")
        const datas = (await ltcatPage.celulas("dataInicio")).map(paraData)
        if (sentido === "ascending") expect(datas).toEqual([...datas].sort((a, b) => a - b))
        if (sentido === "descending") expect(datas).toEqual([...datas].sort((a, b) => b - a))
      })
    })

    test.describe("paginação", () => {
      test("navega para próxima, anterior, última e primeira página", async ({ ltcatPage }) => {
        await ltcatPage.definirItensPorPagina(5)
        const total = await ltcatPage.totalDeRegistros()
        test.skip(total <= 10, "poucos LTCATs para ter 3 páginas")
        const ultimaInicio = Math.floor((total - 1) / 5) * 5 + 1

        await ltcatPage.botaoProximaPagina.click()
        await expect(ltcatPage.paginador).toContainText(`6 - 10 de ${total}`)
        await ltcatPage.botaoPaginaAnterior.click()
        await expect(ltcatPage.paginador).toContainText(`1 - 5 de ${total}`)
        await ltcatPage.botaoUltimaPagina.click()
        await expect(ltcatPage.paginador).toContainText(`${ultimaInicio} - ${total} de ${total}`)
        await expect(ltcatPage.linhas).toHaveCount(total - ultimaInicio + 1)
        await expect(ltcatPage.botaoProximaPagina).toBeDisabled()
        await ltcatPage.botaoPrimeiraPagina.click()
        await expect(ltcatPage.paginador).toContainText(`1 - 5 de ${total}`)
        await expect(ltcatPage.botaoPaginaAnterior).toBeDisabled()
      })

      test("trocar o filtro e pesquisar volta para a primeira página", async ({ ltcatPage }) => {
        await ltcatPage.definirItensPorPagina(5)
        test.skip((await ltcatPage.totalDeRegistros()) <= 5, "poucos LTCATs para ter 2 páginas")
        await ltcatPage.irParaProximaPagina()
        await ltcatPage.marcarEConfirmar(ltcatPage.unidade, UNIDADE_COM_SETOR)
        await ltcatPage.pesquisar()
        await expect(ltcatPage.paginador).toContainText(/\b1 - \d+ de \d+/)
      })
    })
  })

  // Planilha QA "Pesquisa > Botões exibidos no dropdown". Permissão por item (INC/ALT/VIS/EXC) fica no
  // permissoes-ltcat.spec.ts; aqui o admin, que vê todos os itens de LTCAT não assinado.
  test.describe("Menu da linha", () => {
    const idkey = (url: string) => url.match(/idkey=(\d+)/)?.[1]

    test.beforeEach(async ({ ltcatPage }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
    })

    test.describe("abrir e fechar", () => {
      test("o menu só abre ao clicar nos três pontos e fecha com Esc", async ({ ltcatPage }) => {
        await expect(ltcatPage.menuDaLinha).toHaveCount(0)
        await ltcatPage.linhas.first().hover()
        await expect(ltcatPage.menuDaLinha).toHaveCount(0)
        await ltcatPage.abrirMenuDaLinha()
        await expect(ltcatPage.menuDaLinha.first()).toBeVisible()
        await ltcatPage.linhas.first().press("Escape")
        await expect(ltcatPage.menuDaLinha).toHaveCount(0)
      })

      test("clicar fora fecha o menu", async ({ ltcatPage, page }) => {
        await ltcatPage.abrirMenuDaLinha()
        await page.locator(".cdk-overlay-backdrop").click({ position: { x: 5, y: 5 } })
        await expect(ltcatPage.menuDaLinha).toHaveCount(0)
      })

      test("em 800x600 todos os itens do menu ficam visíveis na tela", async ({ ltcatPage, page }) => {
        await page.setViewportSize({ width: 800, height: 600 })
        await ltcatPage.abrirMenuDaLinha()
        for (const item of ["Gerar LTCAT", "Revisor", "Visualizar", "Excluir"]) await expect(ltcatPage.itemDoMenu(item)).toBeInViewport()
      })

      test("linha com texto longo abre o menu normalmente", async ({ ltcatPage }) => {
        const setores = await ltcatPage.celulas("setor")
        const i = setores.findIndex((s) => s.trim().length > 20)
        test.skip(i < 0, "nenhum Setor longo na primeira página")
        await ltcatPage.abrirMenuDaLinha(i)
        await expect(ltcatPage.itemDoMenu("Visualizar")).toBeInViewport()
      })

      test("depois de recarregar a página o menu continua funcionando", async ({ ltcatPage, page }) => {
        await page.reload()
        await ltcatPage.titulo.waitFor()
        if (!(await ltcatPage.linhas.first().isVisible())) {
          await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
          await ltcatPage.pesquisar()
        }
        await ltcatPage.abrirMenuDaLinha()
        await expect(ltcatPage.itemDoMenu("Visualizar")).toBeVisible()
      })
    })

    test.describe("itens", () => {
      // EF: Gerar LTCAT "print", Revisor "info", Visualizar "eye", Excluir "trash-alt". A tela usa os
      // equivalentes do Material: print, info_outline, visibility, delete_outline
      test("cada item tem o texto e o ícone esperados", async ({ ltcatPage }) => {
        await ltcatPage.abrirMenuDaLinha()
        const icones = { "Gerar LTCAT": "print", Revisor: "info_outline", Visualizar: "visibility", Excluir: "delete_outline" }
        for (const [item, nome] of Object.entries(icones)) {
          await expect(ltcatPage.itemDoMenu(item)).toBeVisible()
          await expect(ltcatPage.itemDoMenu(item).locator("mat-icon")).toHaveText(nome)
        }
      })

      test("Revisor aparece em todas as linhas da página", async ({ ltcatPage, page }) => {
        const linhas = Math.min(await ltcatPage.linhas.count(), 10)
        for (let i = 0; i < linhas; i++) {
          await ltcatPage.abrirMenuDaLinha(i)
          await expect(ltcatPage.itemDoMenu("Revisor"), `linha ${i + 1}`).toBeVisible()
          await page.keyboard.press("Escape")
        }
      })

      test("passar o mouse rápido por vários itens não deixa tooltip preso", async ({ ltcatPage, page }) => {
        await ltcatPage.abrirMenuDaLinha()
        for (const item of ["Gerar LTCAT", "Revisor", "Visualizar", "Excluir", "Revisor"]) await ltcatPage.itemDoMenu(item).hover()
        expect(await page.locator(".mat-tooltip").count(), "no máximo um tooltip por vez").toBeLessThanOrEqual(1)
        await page.keyboard.press("Escape")
        await page.mouse.move(0, 0)
        await expect(page.locator(".mat-tooltip")).toHaveCount(0, { timeout: 5000 })
      })
    })

    test.describe("Visualizar e duplo clique", () => {
      test("duplo clique abre exatamente o registro da linha clicada (o mesmo do Visualizar)", async ({ ltcatPage, page }) => {
        test.skip((await ltcatPage.linhas.count()) < 2, "precisa de 2 linhas")
        await ltcatPage.linhas.nth(1).dblclick()
        await expect(page).toHaveURL(/idkey=\d+/)
        const peloDuploClique = idkey(page.url())

        await ltcatPage.abrir()
        await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
        await ltcatPage.pesquisar()
        await ltcatPage.abrirMenuDaLinha(1)
        await ltcatPage.itemDoMenu("Visualizar").click()
        await expect(page).toHaveURL(/idkey=\d+/)
        expect(idkey(page.url())).toBe(peloDuploClique)

        await ltcatPage.abrir()
        await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
        await ltcatPage.pesquisar()
        await ltcatPage.linhas.nth(0).dblclick()
        await expect(page).toHaveURL(/idkey=\d+/)
        expect(idkey(page.url()), "linhas diferentes abrem registros diferentes").not.toBe(peloDuploClique)
      })
    })

    test.describe("modal de exclusão", () => {
      test("tem o texto 'Deseja realmente excluir este item?'", async ({ ltcatPage }) => {
        await ltcatPage.abrirMenuDaLinha()
        await ltcatPage.itemDoMenu("Excluir").click()
        await expect(ltcatPage.modalExclusao).toContainText("Deseja realmente excluir este item?")
        await expect(ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" })).toBeVisible()
        await ltcatPage.modalExclusao.getByRole("button", { name: "Fechar" }).click()
      })

      // DIVERGÊNCIA EF/planilha x tela (já anotada em 2026-10-14): o botão chama "Fechar", não "Cancelar"
      test("tem o botão 'Cancelar' (EF)", async ({ ltcatPage }) => {
        test.fail(true, "a tela usa 'Fechar'")
        await ltcatPage.abrirMenuDaLinha()
        await ltcatPage.itemDoMenu("Excluir").click()
        await expect(ltcatPage.modalExclusao.getByRole("button", { name: "Cancelar" })).toBeVisible({ timeout: 3000 })
      })
    })

    // registro próprio com revisão (vigência em maio de 2021): Revisor, assinatura e exclusão
    test("registro próprio: Revisor mostra quem alterou e quando, sem item de assinatura, e exclui com revisões", async ({ ltcatPage, ltcatCadastroPage: cadastro, ltcatHistoricoRevisoesModal: modal, page, toast }) => {
      test.setTimeout(240_000)
      const INICIO = "01/05/2021"
      const buscar = async () => {
        await ltcatPage.abrir()
        await ltcatPage.limpar()
        await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
        await ltcatPage.selecionarOpcao(ltcatPage.ano, /^\s*2021\s*$/)
        await ltcatPage.pesquisar()
        return (await ltcatPage.celulas("dataInicio")).indexOf(INICIO)
      }

      await test.step("cria o LTCAT com uma revisão", async () => {
        await cadastro.abrir()
        await cadastro.preencherObrigatorios({ ...ltcatValido, dataBase: INICIO, vigenciaInicio: INICIO, vigenciaFim: "31/05/2021" })
        await cadastro.preencherConfiguracoesObrigatorias()
        await modal.abrir()
        await modal.preencher({ versao: "1", motivo: "Revisão do teste do menu da linha" })
        await modal.botaoIncluirNaTabela.click()
        await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
        await modal.botaoSalvar.click()
        await expect(modal.titulo).toBeHidden()
        await cadastro.salvar()
        await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
      })

      try {
        const linha = await buscar()
        expect(linha, "o LTCAT criado aparece na pesquisa").toBeGreaterThanOrEqual(0)

        await test.step("Revisor: 'Revisor: <usuário> Data dd/mm/aaaa hh:mm:ss' com o usuário logado e a data de hoje", async () => {
          const saudacao = await page.locator("apls-navegador-superior .saudacao").innerText()
          const primeiroNome = saudacao.match(/Olá\s+(\S+?),/)?.[1] ?? ""
          const hoje = new Date().toLocaleDateString("pt-BR")
          await ltcatPage.abrirMenuDaLinha(linha)
          await ltcatPage.itemDoMenu("Revisor").hover()
          const tooltip = page.locator(".mat-tooltip").last()
          await expect(tooltip).toBeVisible()
          await expect.soft(tooltip).toHaveText(/Revisor: .+ Data \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/)
          await expect.soft(tooltip).toContainText(primeiroNome)
          await expect.soft(tooltip).toContainText(hoje)
        })

        await test.step("sem assinatura digital não aparece 'Gerar LTCAT assinado digitalmente'", async () => {
          await expect(ltcatPage.itemDoMenu("Gerar LTCAT assinado digitalmente")).toHaveCount(0)
          await page.keyboard.press("Escape")
        })

        await test.step("exclui o LTCAT com revisão: sucesso e some do grid", async () => {
          await ltcatPage.abrirMenuDaLinha(linha)
          await ltcatPage.itemDoMenu("Excluir").click()
          await ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" }).click()
          await toast.temTexto(/sucesso/i)
          expect(await buscar(), "o LTCAT não aparece mais").toBe(-1)
        })
      } finally {
        // se algum passo falhou antes da exclusão, apaga o registro próprio
        const sobrou = await buscar().catch(() => -1)
        if (sobrou >= 0) {
          await ltcatPage.abrirMenuDaLinha(sobrou)
          await ltcatPage.itemDoMenu("Excluir").click()
          await ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" }).click()
        }
      }
    })

    test.describe("pendências", () => {
      test.fixme("Gerar LTCAT: gera PDF/DOCX igual ao botão do cadastro, sem duplicar em cliques repetidos", async () => {
        // falta o HTML do que abre ao clicar (escolha de formato? alerta?) e por onde o arquivo chega
        // (painel Relatórios); o "Gerar laudo" do cadastro não devolveu arquivo em 4 min
      })
      test.fixme("integridade e conteúdo do PDF/DOCX (dados do LTCAT, acentos, logotipos)", async () => {})
      test.fixme("Download assinatura digital: aparece só em LTCAT assinado, para INC/ALT/VIS; gera PDF em segundo plano", async () => {
        // suíte de assinatura (precisa de LTCAT assinado). Obs.: a EF escreve o tooltip "Gerar PGR assinado
        // digitalmente"; a tela mostra "Gerar LTCAT assinado digitalmente" (erro de digitação na EF?)
      })
      test.fixme("exclusão de LTCAT assinado digitalmente", async () => {})
    })
  })

  // Planilha QA "Caminho", "Regra geral" e "Cenários gerais para o grid e cabeçalho" (só a tela; permissões
  // ficam no permissoes-ltcat.spec.ts)
  test.describe("Cenários gerais da tela", () => {
    test("Caminho: Segurança > Programas e Laudos > LTCAT abre a pesquisa", async ({ page, menuLateral, ltcatPage }) => {
      await page.goto("/apollus/")
      await menuLateral.abrirModulo("seguranca")
      if (!(await menuLateral.item(/LTCAT/).isVisible())) await menuLateral.grupo("Programas e Laudos").click()
      await menuLateral.item(/LTCAT/).click()
      await expect(ltcatPage.titulo).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`${URLS.ltcat}$`))
    })

    test("ao abrir pela primeira vez, campos, filtros, botões e grid carregam", async ({ ltcatPage, page }) => {
      await ltcatPage.limpar()
      await page.reload()
      await ltcatPage.titulo.waitFor()
      await expect(ltcatPage.regiao).toBeEnabled()
      await expect(ltcatPage.unidade).toBeDisabled()
      await expect(ltcatPage.setor).toBeDisabled()
      await expect(ltcatPage.ano).toBeVisible()
      for (const botao of [ltcatPage.botaoPesquisar, ltcatPage.botaoRecolherFiltros, ltcatPage.botaoNovo]) await expect(botao).toBeVisible()
      await expect(ltcatPage.grade).toBeVisible()
      await expect(page.locator("apls-toast")).toHaveCount(0)
    })

    test("espaços extras na busca da Unidade são desconsiderados", async ({ ltcatPage, page }) => {
      await ltcatPage.limpar()
      await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
      await ltcatPage.unidade.click()
      await ltcatPage.unidade.pressSequentially("   fabrica curitiba   ")
      await expect(page.locator("mat-option", { hasText: "711001 - FÁBRICA CURITIBA" })).toBeVisible()
    })

    test("busca por um valor que não existe mostra 'Nenhum registro encontrado.'", async ({ ltcatPage, page }) => {
      await ltcatPage.limpar()
      await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
      await ltcatPage.unidade.click()
      await ltcatPage.unidade.pressSequentially("zzzz unidade inexistente")
      await expect(page.locator("mat-option", { hasText: "Nenhum registro encontrado." })).toBeVisible()
    })

    // a planilha pede "validar qual mensagem é exibida": o texto vai para o log do teste
    test("sem conexão, pesquisar mostra uma mensagem e a tela não quebra", async ({ ltcatPage, page }) => {
      await ltcatPage.limpar()
      await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
      await page.context().setOffline(true)
      try {
        await ltcatPage.botaoPesquisar.click()
        await expect(page.locator("apls-toast")).toBeVisible({ timeout: 15_000 })
        console.log("[sem conexão] mensagem:", await page.locator("apls-toast").innerText())
        await expect(ltcatPage.titulo).toBeVisible()
      } finally {
        await page.context().setOffline(false)
      }
      await ltcatPage.pesquisar()
      expect(await ltcatPage.totalDeRegistros()).toBeGreaterThan(0)
    })

    test("duas abas da tela LTCAT funcionam ao mesmo tempo", async ({ ltcatPage, page }) => {
      const outraAba = await page.context().newPage()
      const outra = new LtcatPage(outraAba)
      await outra.abrir()
      for (const tela of [ltcatPage, outra]) {
        await tela.limpar()
        await tela.selecionarOpcao(tela.regiao, REGIAO)
        await tela.pesquisar()
      }
      expect(await outra.totalDeRegistros()).toBe(await ltcatPage.totalDeRegistros())
      await outraAba.close()
    })

    // chip do filtro aplicado (visto em 2026-10-20 com os filtros recolhidos: "Região : 71 - 71-CURITIBA ⊗").
    // O ⊗ foi suposto como mat-icon "cancel": se falhar, mandar o HTML do chip
    test("chips: o filtro aplicado vira chip e o ⊗ remove o filtro", async ({ ltcatPage, page }) => {
      await ltcatPage.limpar()
      await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
      await ltcatPage.botaoRecolherFiltros.click()
      const chip = page.locator(".fast-filters-row").getByText(new RegExp(`Região\\s*:\\s*${REGIAO}`))
      await expect(chip).toBeVisible()
      await page.locator(".fast-filters-row mat-icon", { hasText: "cancel" }).first().click()
      await expect(chip).toBeHidden()
      await ltcatPage.botaoExpandirFiltros.click()
      await expect(ltcatPage.regiao).toHaveValue("")
    })

    test.describe("menu de colunas do grid", () => {
      // tudo isso fica salvo no usuário: cada teste desfaz o que mudou
      const botaoMenuColunas = (page: Page) => page.locator("thead th.mat-column-menu button")
      const itemColuna = (page: Page, nome: string) => page.locator(".apls-customizable-table-menu-item", { hasText: nome })
      const cabecalhoDe = (page: Page, classe: string) => page.locator(`thead th.mat-column-${classe}`)

      test.beforeEach(async ({ ltcatPage }) => {
        await ltcatPage.limpar()
        await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
        await ltcatPage.pesquisar()
      })

      test("lista todas as colunas do grid", async ({ ltcatPage, page }) => {
        await botaoMenuColunas(page).click()
        const nomes = (await page.locator(".apls-customizable-table-menu-item span").allInnerTexts()).map((t) => t.trim())
        expect(nomes).toEqual(await ltcatPage.titulosDasColunas())
      })

      test("ocultar uma coluna tira ela do grid e mostrar devolve", async ({ page }) => {
        await botaoMenuColunas(page).click()
        await itemColuna(page, "Setor").locator("button").first().click()
        await page.keyboard.press("Escape")
        await expect(cabecalhoDe(page, "area3")).toHaveCount(0)
        await botaoMenuColunas(page).click()
        await itemColuna(page, "Setor").locator("button").first().click()
        await page.keyboard.press("Escape")
        await expect(cabecalhoDe(page, "area3")).toBeVisible()
      })

      test("só a primeira coluna pode ser fixada", async ({ page }) => {
        await botaoMenuColunas(page).click()
        await expect(itemColuna(page, "Região").locator("button", { hasText: "push_pin" })).toBeEnabled()
        for (const nome of ["Unidade", "Setor", "Responsável", "Data início", "Data fim", "Data base", "Revisão"]) {
          await expect(itemColuna(page, nome).locator("button", { hasText: "push_pin" }), nome).toBeDisabled()
        }
      })

      test("arrastar a borda redimensiona e o duplo clique volta à largura padrão", async ({ page }) => {
        const cabecalho = cabecalhoDe(page, "area1")
        const larguraOriginal = (await cabecalho.boundingBox())!.width
        const borda = cabecalho.locator(".cell-resizer")
        const caixa = (await borda.boundingBox())!
        await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2)
        await page.mouse.down()
        await page.mouse.move(caixa.x + 100, caixa.y + caixa.height / 2, { steps: 10 })
        await page.mouse.up()
        try {
          await expect.poll(async () => (await cabecalho.boundingBox())!.width).toBeGreaterThan(larguraOriginal + 40)
        } finally {
          await borda.dblclick()
        }
        await expect.poll(async () => Math.abs((await cabecalho.boundingBox())!.width - larguraOriginal)).toBeLessThan(5)
      })

      test("arrastar o cabeçalho reordena as colunas", async ({ ltcatPage, page }) => {
        const arrastar = async (de: Locator, para: Locator) => {
          const a = (await de.boundingBox())!
          const b = (await para.boundingBox())!
          await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
          await page.mouse.down()
          await page.mouse.move(b.x + 5, b.y + b.height / 2, { steps: 15 })
          await page.mouse.up()
        }
        const ordemOriginal = await ltcatPage.titulosDasColunas()
        await arrastar(cabecalhoDe(page, "area2"), cabecalhoDe(page, "area1"))
        try {
          await expect.poll(() => ltcatPage.titulosDasColunas()).toEqual(["Unidade", "Região", ...ordemOriginal.slice(2)])
        } finally {
          if ((await ltcatPage.titulosDasColunas())[0] === "Unidade") await arrastar(cabecalhoDe(page, "area1"), cabecalhoDe(page, "area2"))
        }
        await expect.poll(() => ltcatPage.titulosDasColunas()).toEqual(ordemOriginal)
      })
    })

    // dois LTCATs próprios com vigência em 2018: inclusão aparece, alteração reflete, exclusão com clique
    // rápido remove só um
    test("grid acompanha inclusão, alteração e exclusão (com clique rápido no Excluir)", async ({ ltcatPage, ltcatCadastroPage: cadastro, page, toast }) => {
      test.setTimeout(300_000)
      const A = { inicio: "01/06/2018", fim: "30/06/2018" }
      const B = { inicio: "01/07/2018", fim: "31/07/2018" }
      const buscar = async () => {
        await ltcatPage.abrir()
        await ltcatPage.limpar()
        await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
        await ltcatPage.selecionarOpcao(ltcatPage.ano, /^\s*2018\s*$/)
        await ltcatPage.pesquisar()
        return ltcatPage.celulas("dataInicio")
      }
      const excluir = async (inicio: string, cliques = 1) => {
        const i = (await buscar()).indexOf(inicio)
        if (i < 0) return
        await ltcatPage.abrirMenuDaLinha(i)
        await ltcatPage.itemDoMenu("Excluir").click()
        await ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" }).click({ clickCount: cliques })
      }

      try {
        await test.step("inclusão: os dois LTCATs aparecem na pesquisa", async () => {
          for (const { inicio, fim } of [A, B]) {
            await cadastro.abrir()
            await cadastro.preencherObrigatorios({ ...ltcatValido, dataBase: inicio, vigenciaInicio: inicio, vigenciaFim: fim })
            await cadastro.preencherConfiguracoesObrigatorias()
            await cadastro.salvar()
            await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
          }
          const inicios = await buscar()
          expect(inicios).toEqual(expect.arrayContaining([A.inicio, B.inicio]))
        })

        await test.step("alteração: a nova data base aparece no grid", async () => {
          await ltcatPage.linhas.nth((await ltcatPage.celulas("dataInicio")).indexOf(A.inicio)).dblclick()
          await expect(cadastro.titulo).toBeVisible()
          await cadastro.dataBase.fill("15/06/2018")
          await cadastro.salvar()
          await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
          const inicios = await buscar()
          expect((await ltcatPage.celulas("dataBase"))[inicios.indexOf(A.inicio)]).toBe("15/06/2018")
        })

        await test.step("exclusão com 3 cliques rápidos remove só um registro", async () => {
          const antes = (await buscar()).length
          await excluir(A.inicio, 3)
          await toast.temTexto(/sucesso/i)
          const depois = await buscar()
          expect(depois).toHaveLength(antes - 1)
          expect(depois).not.toContain(A.inicio)
          expect(depois).toContain(B.inicio)
        })
      } finally {
        await excluir(A.inicio).catch(() => {})
        await excluir(B.inicio).catch(() => {})
        await page.locator("apls-toast").waitFor({ state: "hidden" }).catch(() => {})
      }
    })

    // RG2: precisa de um usuário cujo CPF seja de um profissional Responsável Técnico (com e sem
    // certificado) — criar em Perfis de Acesso como os QAutomatizador_* e informar aqui
    test.describe("RG2 - modal de certificado digital", () => {
      test.fixme("Responsável Técnico sem certificado vê a modal ao abrir a tela", async () => {})
      test.fixme("escolher cadastrar o certificado leva ao fluxo de cadastro", async () => {})
      test.fixme("escolher não cadastrar deixa usar a tela normalmente", async () => {})
      test.fixme("fechar a modal mantém a tela funcionando", async () => {})
      test.fixme("abrir a tela de novo segue a regra sem exibir a modal indevidamente", async () => {})
      test.fixme("CPF fora do cadastro de Profissional: modal não aparece", async () => {})
      test.fixme("profissional sem a flag Responsável Técnico: modal não aparece", async () => {})
      test.fixme("profissional com certificado já cadastrado: modal não aparece", async () => {})
    })
  })

  // Planilha QA "Campo - hierarquia 1/2/3" (tela, com o admin). Permissões por H1/H2 ficam no permissoes-ltcat.spec.ts
  test.describe("Hierarquias (H1, H2, H3)", () => {
    type Nivel = "H1" | "H2" | "H3"
    const NOME: Record<Nivel, string> = { H1: "Região", H2: "Unidade", H3: "Setor" }
    const OUTRA_REGIAO = "70 - 70-ARGENTINA"
    const FABRICA = "711001 - FÁBRICA CURITIBA"
    const campoDo = (l: LtcatPage, n: Nivel) => ({ H1: l.regiao, H2: l.unidade, H3: l.setor })[n]
    const filhoDo = (l: LtcatPage, n: Nivel) => ({ H1: l.unidade, H2: l.setor, H3: null })[n]
    const SEM_RESULTADO = "Nenhum registro encontrado."

    // deixa os níveis de cima com uma opção só, para o nível testado habilitar
    async function preparar(l: LtcatPage, n: Nivel) {
      await l.limpar()
      if (n !== "H1") await l.marcarEConfirmar(l.regiao, REGIAO)
      if (n === "H3") await l.marcarEConfirmar(l.unidade, UNIDADE_COM_SETOR)
      return campoDo(l, n)
    }

    async function buscar(campo: Locator, termo: string) {
      await campo.click()
      await campo.fill("")
      await campo.pressSequentially(termo)
    }

    // troca a seleção do campo por uma única opção (X desmarca tudo, marca a nova e confirma)
    async function trocarPara(l: LtcatPage, campo: Locator, opcao: string) {
      await campo.click()
      await l.botaoDesmarcarTodos.click()
      await l.opcao(opcao).click()
      await l.botaoConfirmarSelecao.click()
    }

    async function esvaziar(l: LtcatPage, campo: Locator) {
      await campo.click()
      await l.botaoDesmarcarTodos.click()
      await l.botaoConfirmarSelecao.click()
    }

    const partes = (opcao: string) => {
      const [codigo, ...resto] = opcao.split(" - ")
      const descricao = resto.join(" - ")
      const palavra = descricao.split(/[\s-]+/).find((p) => p.length >= 4) ?? descricao
      return { codigo: codigo.trim(), descricao, palavra }
    }

    for (const nivel of ["H1", "H2", "H3"] as const) {
      test.describe(`${nivel} (${NOME[nivel]})`, () => {
        let opcoes: string[] = []

        test.beforeEach(async ({ ltcatPage, page }) => {
          const campo = await preparar(ltcatPage, nivel)
          opcoes = await opcoesCarregadas(page, campo)
        })

        test.describe("busca no campo", () => {
          test("por parte do código", async ({ ltcatPage, page }) => {
            const { codigo } = partes(opcoes[0])
            const trecho = codigo.length > 2 ? codigo.slice(0, codigo.length - 1) : codigo
            await buscar(campoDo(ltcatPage, nivel), trecho)
            await expect(page.locator("mat-option", { hasText: opcoes[0] })).toBeVisible()
          })

          test("por parte da descrição", async ({ ltcatPage, page }) => {
            const { palavra } = partes(opcoes[0])
            await buscar(campoDo(ltcatPage, nivel), palavra)
            await expect(page.locator("mat-option", { hasText: opcoes[0] })).toBeVisible()
          })

          for (const formato of ["minúsculas", "MAIÚSCULAS"] as const) {
            test(`em ${formato} encontra a mesma opção`, async ({ ltcatPage, page }) => {
              const { palavra } = partes(opcoes[0])
              await buscar(campoDo(ltcatPage, nivel), formato === "minúsculas" ? palavra.toLowerCase() : palavra.toUpperCase())
              await expect(page.locator("mat-option", { hasText: opcoes[0] })).toBeVisible()
            })
          }

          test("com espaços antes e depois", async ({ ltcatPage, page }) => {
            const { palavra } = partes(opcoes[0])
            await buscar(campoDo(ltcatPage, nivel), `   ${palavra}   `)
            await expect(page.locator("mat-option", { hasText: opcoes[0] })).toBeVisible()
          })

          test("com caracteres especiais não dá erro", async ({ ltcatPage, page }) => {
            await buscar(campoDo(ltcatPage, nivel), "@#!$%&*()'\"")
            await expect(page.locator("mat-option").first()).toBeVisible()
            await expect(page.locator("apls-toast")).toHaveCount(0)
          })

          test(`valor inexistente mostra '${SEM_RESULTADO}'`, async ({ ltcatPage, page }) => {
            await buscar(campoDo(ltcatPage, nivel), "zzzz valor inexistente")
            await expect(page.locator("mat-option", { hasText: SEM_RESULTADO })).toBeVisible()
          })
        })

        test.describe("lista de opções", () => {
          test("não tem opção repetida (código + descrição distinguem os registros)", () => {
            expect(new Set(opcoes).size).toBe(opcoes.length)
          })

          if (nivel === "H3") {
            test("está em 'código - descrição' e em ordem crescente de código", () => {
              for (const o of opcoes) expect(o).toMatch(FORMATO_CODIGO_DESCRICAO)
              expectOrdemDeCodigo(opcoes)
            })
          }

          if (nivel !== "H2") {
            // a H2 já tem esse teste em "Opções dos filtros"
            test("inclui inativas quando existem", () => {
              test.skip(!opcoes.some((o) => /\(Inativo\)/.test(o)), `nenhuma ${NOME[nivel]} inativa nesta base`)
              expect(opcoes.some((o) => /\(Inativo\)\s*$/.test(o))).toBe(true)
            })
          }

          test("descrição longa fica dentro da lista", async ({ ltcatPage, page }) => {
            const longa = [...opcoes].sort((a, b) => b.length - a.length)[0]
            await campoDo(ltcatPage, nivel).click()
            const opcao = page.locator("mat-option", { hasText: longa }).first()
            await opcao.scrollIntoViewIfNeeded()
            const caixaOpcao = (await opcao.boundingBox())!
            const caixaLista = (await page.locator(".mat-autocomplete-panel").boundingBox())!
            expect(caixaOpcao.x + caixaOpcao.width).toBeLessThanOrEqual(caixaLista.x + caixaLista.width + 1)
          })
        })

        test.describe("seleção", () => {
          test("remover uma de duas marcadas mantém a outra", async ({ ltcatPage }) => {
            test.skip(opcoes.length < 2, "o nível tem só uma opção")
            const campo = campoDo(ltcatPage, nivel)
            await campo.click()
            await ltcatPage.opcao(opcoes[0]).click()
            await ltcatPage.opcao(opcoes[1]).click()
            await ltcatPage.opcao(opcoes[0]).click()
            await expect(ltcatPage.contadorSelecao).toHaveText(/^\s*1\//)
            await ltcatPage.botaoConfirmarSelecao.click()
            await expect(campo).toHaveValue(opcoes[1])
          })

          test("desmarcar tudo deixa o campo vazio e ainda habilitado", async ({ ltcatPage }) => {
            const campo = campoDo(ltcatPage, nivel)
            await ltcatPage.marcarEConfirmar(campo, opcoes[0])
            await esvaziar(ltcatPage, campo)
            await expect(campo).toHaveValue("")
            await expect(campo).toBeEnabled()
          })

          test("marcar várias rápido conta todas, sem duplicar", async ({ ltcatPage }) => {
            const quantas = Math.min(3, opcoes.length)
            await campoDo(ltcatPage, nivel).click()
            for (const o of opcoes.slice(0, quantas)) await ltcatPage.opcao(o).click({ delay: 0 })
            await expect(ltcatPage.contadorSelecao).toHaveText(new RegExp(`^\\s*${quantas}/`))
            await expect(ltcatPage.opcoesMarcadas).toHaveCount(quantas)
          })

          test("cliques rápidos no campo não duplicam nem perdem a seleção", async ({ ltcatPage }) => {
            const campo = campoDo(ltcatPage, nivel)
            await ltcatPage.marcarEConfirmar(campo, opcoes[0])
            await campo.click({ clickCount: 3 })
            await expect(ltcatPage.contadorSelecao).toHaveText(/^\s*1\//)
            await expect(ltcatPage.opcoesMarcadas).toHaveCount(1)
          })

          test("pelo teclado: digitar, seta e Enter marcam a opção", async ({ ltcatPage, page }) => {
            const campo = campoDo(ltcatPage, nivel)
            await campo.focus()
            await campo.pressSequentially(partes(opcoes[0]).palavra)
            await page.keyboard.press("ArrowDown")
            await page.keyboard.press("Enter")
            await expect(ltcatPage.contadorSelecao).toHaveText(/^\s*1\//)
          })

          test("clicar fora fecha a lista sem perder o que foi marcado", async ({ ltcatPage, page }) => {
            const campo = campoDo(ltcatPage, nivel)
            await campo.click()
            await ltcatPage.opcao(opcoes[0]).click()
            await page.locator(".cdk-overlay-backdrop").click({ position: { x: 5, y: 5 } })
            await expect(ltcatPage.painelMultiplo).toBeHidden()
            await expect(campo).toHaveValue(opcoes[0])
          })
        })
      })
    }

    // dependências: H1 controla H2, H2 controla H3
    for (const nivel of ["H1", "H2"] as const) {
      test.describe(`${nivel} controla ${nivel === "H1" ? "H2" : "H3"}`, () => {
        test(`remover a única ${NOME[nivel]} bloqueia e esvazia o nível de baixo`, async ({ ltcatPage }) => {
          const campo = await preparar(ltcatPage, nivel)
          const filho = filhoDo(ltcatPage, nivel)!
          await ltcatPage.marcarEConfirmar(campo, nivel === "H1" ? REGIAO : UNIDADE_COM_SETOR)
          await expect(filho).toBeEnabled()
          await esvaziar(ltcatPage, campo)
          await expect(filho).toHaveValue("")
          await expect(filho).toBeDisabled()
        })

        test(`trocar a ${NOME[nivel]} limpa o que estava escolhido embaixo`, async ({ ltcatPage, page }) => {
          const campo = await preparar(ltcatPage, nivel)
          const filho = filhoDo(ltcatPage, nivel)!
          const [primeira, segunda] = nivel === "H1" ? [REGIAO, OUTRA_REGIAO] : [UNIDADE_COM_SETOR, FABRICA]
          await ltcatPage.marcarEConfirmar(campo, primeira)
          const [opcaoFilho] = await opcoesCarregadas(page, filho)
          await ltcatPage.marcarEConfirmar(filho, opcaoFilho)
          await trocarPara(ltcatPage, campo, segunda)
          await expect(filho).toHaveValue("")
        })

        test(`marcar várias ${NOME[nivel]} e voltar para uma reabilita o nível de baixo`, async ({ ltcatPage }) => {
          const campo = await preparar(ltcatPage, nivel)
          const filho = filhoDo(ltcatPage, nivel)!
          const [a, b] = nivel === "H1" ? [REGIAO, OUTRA_REGIAO] : [UNIDADE_COM_SETOR, FABRICA]
          await ltcatPage.marcarEConfirmar(campo, a, b)
          await expect(filho).toBeDisabled()
          await ltcatPage.marcarEConfirmar(campo, b)
          await expect(filho).toBeEnabled()
        })

        test(`marcar e limpar a ${NOME[nivel]} várias vezes seguidas mantém o nível de baixo sincronizado`, async ({ ltcatPage }) => {
          const campo = await preparar(ltcatPage, nivel)
          const filho = filhoDo(ltcatPage, nivel)!
          const opcao = nivel === "H1" ? REGIAO : UNIDADE_COM_SETOR
          for (let i = 0; i < 3; i++) {
            await ltcatPage.marcarEConfirmar(campo, opcao)
            await esvaziar(ltcatPage, campo)
          }
          await expect(filho).toHaveValue("")
          await expect(filho).toBeDisabled()
          await ltcatPage.marcarEConfirmar(campo, opcao)
          await expect(filho).toBeEnabled()
        })

        test(`o nível de baixo só lista opções da ${NOME[nivel]} escolhida`, async ({ ltcatPage, page }) => {
          const campo = await preparar(ltcatPage, nivel)
          const filho = filhoDo(ltcatPage, nivel)!
          const [a, b] = nivel === "H1" ? [REGIAO, OUTRA_REGIAO] : [UNIDADE_COM_SETOR, FABRICA]
          await ltcatPage.marcarEConfirmar(campo, a)
          const deA = (await opcoesCarregadas(page, filho)).filter((o) => o !== SEM_RESULTADO)
          await trocarPara(ltcatPage, campo, b)
          const deB = (await opcoesCarregadas(page, filho)).filter((o) => o !== SEM_RESULTADO)
          test.skip(deA.length === 0 || deB.length === 0, "uma das duas não tem opções embaixo")
          expect(deA.filter((o) => deB.includes(o)), "nenhuma opção em comum").toEqual([])
        })

        test(`${NOME[nivel]} sem nada vinculado: o nível de baixo habilita e mostra '${SEM_RESULTADO}'`, async ({ ltcatPage, page }) => {
          const campo = await preparar(ltcatPage, nivel)
          const filho = filhoDo(ltcatPage, nivel)!
          const candidatas = (await opcoesCarregadas(page, campo)).slice(0, 10)
          let achou = ""
          for (const c of candidatas) {
            await trocarPara(ltcatPage, campo, c)
            await filho.click()
            await page.locator("mat-option").first().waitFor()
            const vazia = await page.locator("mat-option", { hasText: SEM_RESULTADO }).isVisible()
            await page.keyboard.press("Escape")
            if (vazia) {
              achou = c
              break
            }
          }
          test.skip(!achou, `nenhuma das 10 primeiras opções de ${NOME[nivel]} está sem vínculo embaixo`)
          await expect(filho).toBeEnabled()
        })
      })
    }

    test("trocar a Região com Unidade e Setor escolhidos limpa os dois", async ({ ltcatPage, page }) => {
      await preparar(ltcatPage, "H3")
      const [setor] = await opcoesCarregadas(page, ltcatPage.setor)
      await ltcatPage.marcarEConfirmar(ltcatPage.setor, setor)
      await trocarPara(ltcatPage, ltcatPage.regiao, OUTRA_REGIAO)
      await expect(ltcatPage.unidade).toHaveValue("")
      await expect(ltcatPage.setor).toHaveValue("")
      await expect(ltcatPage.setor).toBeDisabled()
    })

    test("pesquisa com H1 + H2 + várias H3 traz só os setores marcados", async ({ ltcatPage, page }) => {
      await preparar(ltcatPage, "H3")
      const setores = (await opcoesCarregadas(page, ltcatPage.setor)).slice(0, 2)
      await ltcatPage.marcarEConfirmar(ltcatPage.setor, ...setores)
      await ltcatPage.pesquisar()
      for (const s of new Set((await ltcatPage.celulas("setor")).map((v) => v.trim()))) expect(setores).toContain(s)
    })

    test("TAB segue Região → Unidade → Setor → Ano", async ({ ltcatPage, page }) => {
      await preparar(ltcatPage, "H3")
      const focado = async () => {
        for (const [nome, campo] of [["Região", ltcatPage.regiao], ["Unidade", ltcatPage.unidade], ["Setor", ltcatPage.setor], ["Ano", ltcatPage.ano]] as const) {
          if (await campo.evaluate((e) => e === document.activeElement || e.contains(document.activeElement))) return nome
        }
        return ""
      }
      await ltcatPage.regiao.focus()
      const ordem: string[] = ["Região"]
      for (let i = 0; i < 15 && ordem.length < 4; i++) {
        await page.keyboard.press("Tab")
        const nome = await focado()
        if (nome && nome !== ordem[ordem.length - 1]) ordem.push(nome)
      }
      expect(ordem).toEqual(["Região", "Unidade", "Setor", "Ano"])
    })

    test("Unidade e Setor bloqueados não aceitam digitação e têm aparência desabilitada", async ({ ltcatPage, page }) => {
      await ltcatPage.limpar()
      for (const campo of [ltcatPage.unidade, ltcatPage.setor]) {
        await expect(campo).toBeDisabled()
        await expect(campo).not.toBeEditable()
        await expect(page.locator("mat-form-field", { has: campo })).toHaveClass(/mat-form-field-disabled/)
      }
    })

    test("labels: 'Região' com o asterisco de obrigatório, 'Unidade' e 'Setor' sem", async ({ ltcatPage, page }) => {
      const label = (campo: Locator) => page.locator("mat-form-field", { has: campo }).locator("mat-label")
      await expect(label(ltcatPage.regiao)).toHaveText(/^\s*Região\s*\*\s*$/)
      await expect(label(ltcatPage.unidade)).toHaveText(/^\s*Unidade\s*$/)
      await expect(label(ltcatPage.setor)).toHaveText(/^\s*Setor\s*$/)
    })

    test("Unidade e Setor não são obrigatórios: pesquisa só com a Região funciona", async ({ ltcatPage, page }) => {
      await ltcatPage.limpar()
      await ltcatPage.marcarEConfirmar(ltcatPage.regiao, REGIAO)
      await ltcatPage.pesquisar()
      await expect(page.locator("apls-toast")).toHaveCount(0)
      expect(await ltcatPage.totalDeRegistros()).toBeGreaterThan(0)
    })

    // a aplicação lembra os filtros: depois do refresh vale "mantém ou limpa", mas sem combinação inválida
    test("recarregar a página mantém H1, H2 e H3 coerentes entre si", async ({ ltcatPage, page }) => {
      await preparar(ltcatPage, "H3")
      const [setor] = await opcoesCarregadas(page, ltcatPage.setor)
      await ltcatPage.marcarEConfirmar(ltcatPage.setor, setor)
      await page.reload()
      await ltcatPage.titulo.waitFor()
      const [h1, h2, h3] = await Promise.all([ltcatPage.regiao, ltcatPage.unidade, ltcatPage.setor].map((c) => c.inputValue()))
      if (h3) expect(h2, "Setor preenchido exige Unidade").not.toBe("")
      if (h2) expect(h1, "Unidade preenchida exige Região").not.toBe("")
      if (!h1) await expect(ltcatPage.unidade).toBeDisabled()
    })

    test.fixme("Setor (H3) tem tooltip/help", async () => {
      // o campo não mostra ícone de help na tela; confirmar se a EF pede algum
    })
  })

  test.describe("Tooltips dos botões do filtro", () => {
    test("Pesquisar, Limpar e Recolher/Expandir filtros avançados", async ({ ltcatPage, page }) => {
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await expect(await tooltipDe(page, ltcatPage.botaoPesquisar)).toHaveText("Pesquisar")
      await expect(await tooltipDe(page, ltcatPage.botaoLimpar)).toHaveText("Limpar")
      await expect(await tooltipDe(page, ltcatPage.botaoRecolherFiltros)).toHaveText("Recolher filtros avançados")
      await ltcatPage.botaoRecolherFiltros.click()
      await expect(await tooltipDe(page, ltcatPage.botaoExpandirFiltros)).toHaveText("Expandir filtros avançados")
      await ltcatPage.botaoExpandirFiltros.click()
    })
  })

  test.describe("Coluna Revisão", () => {
    // cria 2 LTCATs próprios com vigência em 2020 (um com revisão, outro sem) e apaga só eles no fim
    const COM_REVISAO = { inicio: "01/03/2020", fim: "31/03/2020" }
    const SEM_REVISAO = { inicio: "01/04/2020", fim: "30/04/2020" }
    test.setTimeout(240_000)

    test.afterEach(async ({ ltcatPage }) => {
      for (const { inicio } of [COM_REVISAO, SEM_REVISAO]) {
        await ltcatPage.abrir()
        await ltcatPage.limpar()
        await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
        await ltcatPage.selecionarOpcao(ltcatPage.ano, /^\s*2020\s*$/)
        await ltcatPage.pesquisar()
        const indice = (await ltcatPage.celulas("dataInicio")).indexOf(inicio)
        if (indice < 0) continue
        await ltcatPage.abrirMenuDaLinha(indice)
        await ltcatPage.itemDoMenu("Excluir").click()
        await ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" }).click()
        await expect(ltcatPage.modalExclusao).toBeHidden()
      }
    })

    test("mostra 'Sim' para LTCAT com revisão e 'Não' sem revisão", async ({ ltcatPage, ltcatCadastroPage: cadastro, ltcatHistoricoRevisoesModal: modal, page }) => {
      for (const { inicio, fim } of [COM_REVISAO, SEM_REVISAO]) {
        await cadastro.abrir()
        await cadastro.preencherObrigatorios({ ...ltcatValido, dataBase: inicio, vigenciaInicio: inicio, vigenciaFim: fim })
        await cadastro.preencherConfiguracoesObrigatorias()
        if (inicio === COM_REVISAO.inicio) {
          await modal.abrir()
          await modal.preencher({ versao: "1", motivo: "Revisão do teste da coluna Revisão" })
          await modal.botaoIncluirNaTabela.click()
          await expect(modal.linhas).toHaveCount(1)
          await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
          await modal.botaoSalvar.click()
          await expect(modal.titulo).toBeHidden()
        }
        await cadastro.salvar()
        await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
      }

      await ltcatPage.abrir()
      await ltcatPage.limpar()
      await ltcatPage.selecionarOpcao(ltcatPage.regiao, REGIAO)
      await ltcatPage.selecionarOpcao(ltcatPage.ano, /^\s*2020\s*$/)
      await ltcatPage.pesquisar()
      const inicios = await ltcatPage.celulas("dataInicio")
      const revisoes = (await ltcatPage.celulas("revisao")).map((r) => r.trim())
      expect(revisoes[inicios.indexOf(COM_REVISAO.inicio)]).toBe("Sim")
      expect(revisoes[inicios.indexOf(SEM_REVISAO.inicio)]).toBe("Não")
    })
  })
})
