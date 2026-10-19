// EF LTCAT > 5.1 Referências > Equipe (seção, modal "Adicionar equipe", grid e exclusão).
// O grid só vai pro banco no Salvar do LTCAT: quase tudo roda num LTCAT novo sem salvar.
import type { Locator, Page } from "@playwright/test"
import { test, expect } from "../../../../../support"
import { ltcatValido } from "../../../../../support/data/ltcat"

const MSG = {
  obrigatorios: "Existem um ou mais campos obrigatórios que não foram preenchidos.",
  sucesso: "Operação realizada com sucesso.",
  excluido: "Registro excluído com sucesso.",
  repetido: "Membro da equipe já adicionado. Favor verificar.",
  limite: "Limite máximo da equipe atingido. Favor verificar.",
}

// pode haver mais de um toast empilhado (o da operação anterior ainda não sumiu)
const aviso = (page: Page, texto: string) => expect(page.locator("apls-toast").filter({ hasText: texto })).toBeVisible()

// dblclick() do Playwright dispara os dois cliques quase juntos, mais rápido que uma pessoa.
// Se o botão sumir depois do primeiro (modal fechou), o segundo clique simplesmente não acontece.
const cliqueDuploHumano = async (page: Page, botao: Locator) => {
  await botao.click()
  await page.waitForTimeout(200)
  await botao.click({ timeout: 1000 }).catch(() => {})
}

const ATAIDE = "211.576.325-48 - Ataíde Soares Pina"
const OSMAR = "245.452.188-14 - Osmar José Farias"
const SILVIO = "962.175.459-34 - Silvio Marcos Braz"
const THIAGO = "033.543.510-63 - thiago"
const MARIA_ALICE = "834.396.010-64 - Maria Alice Testes Valendo Real"

// opção = "CPF - Nome - Registro"; profissional sem registro de conselho vem só "CPF - Nome"
const nomeDa = (opcao: string) => {
  const partes = opcao.split(" - ")
  return (partes.length > 2 ? partes.slice(1, -1) : partes.slice(1)).join(" - ")
}

test.describe("LTCAT - Referências - Equipe", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  test.describe("Seção", () => {
    test("01 - subtítulo, help e botão Adicionar com ícone add circle", async ({ ltcatReferenciasPage: r, page }) => {
      await expect(r.secaoEquipe.getByText("Equipe", { exact: true })).toBeVisible()
      const helpId = await r.helpEquipe.getAttribute("aria-describedby")
      await expect(page.locator(`#${helpId}`)).toHaveText("Adicione os membros da equipe que deverão ser inseridos no documento.")
      await expect(r.botaoAdicionarEquipe).toBeVisible()
      await expect(r.botaoAdicionarEquipe.locator("mat-icon")).toHaveText("add_circle_outline")
    })

    test("02 - grid começa vazio e não permite ordenar por coluna", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.secaoEquipe.getByText("Sem registros para listar.")).toBeVisible()
      await expect(r.secaoEquipe.locator(".mat-sort-header:not(.mat-sort-header-disabled)")).toHaveCount(0)
    })
  })

  test.describe("Modal Adicionar equipe", () => {
    test("03 - título, campo obrigatório com placeholder e botões", async ({ ltcatReferenciasPage: r, ltcatEquipeModal: m }) => {
      await r.botaoAdicionarEquipe.click()
      await expect(m.titulo).toBeVisible()
      await expect(m.membros).toHaveAttribute("placeholder", "Informe o CPF ou o nome")
      await expect(m.membros).toHaveValue("")
      await expect(m.campoMembros.locator(".mat-form-field-required-marker")).toHaveText("*")
      await expect(m.botaoFechar).toBeVisible()
      await expect(m.botaoSalvarEAdicionarOutro).toBeVisible()
      await expect(m.botaoSalvar).toBeEnabled()
    })

    test("04 - clique duplo em Adicionar abre uma modal só", async ({ ltcatReferenciasPage: r, ltcatEquipeModal: m, page }) => {
      await cliqueDuploHumano(page, r.botaoAdicionarEquipe)
      await expect(m.titulo).toBeVisible()
      await expect(m.modal).toHaveCount(1)
    })

    for (const [titulo, fechar] of [
      ["05 - Fechar não grava nada", "botaoFechar"],
      ["06 - X da modal não grava nada", "botaoFecharX"],
    ] as const) {
      test(titulo, async ({ ltcatReferenciasPage: r, ltcatEquipeModal: m }) => {
        await r.botaoAdicionarEquipe.click()
        await m.selecionar("Ataíde")
        await m[fechar].click()
        await expect(m.modal).toHaveCount(0)
        await expect(r.linhasEquipe).toHaveCount(0)
      })
    }

    test("07 - reabrir depois de fechar sem salvar vem limpa", async ({ ltcatReferenciasPage: r, ltcatEquipeModal: m }) => {
      await r.botaoAdicionarEquipe.click()
      await m.selecionar("Ataíde")
      await m.botaoFechar.click()
      await r.botaoAdicionarEquipe.click()
      await expect(m.membros).toHaveValue("")
    })

    test("08 - Salvar sem membro emite [campos_obrigatorios] e mantém a modal", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r, page }) => {
      await r.botaoAdicionarEquipe.click()
      await m.botaoSalvar.click()
      await aviso(page, MSG.obrigatorios)
      await expect(m.modal).toBeVisible()
    })
  })

  test.describe("Catálogo e pesquisa", () => {
    test.beforeEach(async ({ ltcatReferenciasPage: r }) => {
      await r.botaoAdicionarEquipe.click()
    })

    test("09 - opções começam com CPF + nome e vêm em ordem crescente de nome", async ({ ltcatEquipeModal: m }) => {
      await m.membros.click()
      await expect(m.opcoes.first()).toBeVisible()
      const opcoes = (await m.opcoes.allInnerTexts()).map((o) => o.trim())
      for (const opcao of opcoes) expect(opcao).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2} - .+/)

      const nomes = opcoes.map(nomeDa)
      expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })))
    })

    // a Equipe não exige o checkbox "Responsável Técnico", só "Programas e laudos"
    test("10 - catálogo contém todos os profissionais do Responsável técnico e mais", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r, page }) => {
      await m.membros.click()
      await expect(m.opcoes.first()).toBeVisible()
      const daEquipe = await m.opcoes.allInnerTexts()
      await page.keyboard.press("Escape")
      await m.botaoFechar.click()

      await r.responsavelTecnico.click()
      await expect(r.opcoesResponsavel.first()).toBeVisible()
      const doResponsavel = await r.opcoesResponsavel.allInnerTexts()
      expect(daEquipe).toEqual(expect.arrayContaining(doResponsavel))
      expect(daEquipe.length).toBeGreaterThan(doResponsavel.length)
    })

    const casos = [
      { titulo: "11 - pesquisa por CPF com máscara", termo: "834.396.010-64", esperado: MARIA_ALICE },
      { titulo: "12 - pesquisa por CPF parcial", termo: "834.396", esperado: MARIA_ALICE },
      { titulo: "13 - pesquisa por nome ignorando maiúsculas", termo: "MARIA ALICE TESTES", esperado: MARIA_ALICE },
      { titulo: "14 - pesquisa ignorando acentos", termo: "Ataide", esperado: ATAIDE },
    ]
    for (const caso of casos) {
      test(caso.titulo, async ({ ltcatEquipeModal: m }) => {
        await m.pesquisar(caso.termo)
        await expect(m.opcoes).toHaveCount(1)
        await expect(m.opcoes).toContainText(caso.esperado)
      })
    }

    test("15 - termo inexistente mostra lista vazia sem erro", async ({ ltcatEquipeModal: m, page }) => {
      await m.pesquisar("zzzzqq")
      await expect(m.opcoes).toHaveText(["Nenhum registro encontrado."])
      await expect(page.locator("apls-toast")).toHaveCount(0)
    })

    test("16 - multiselect: marca vários, desmarca um e o contador acompanha", async ({ ltcatEquipeModal: m }) => {
      await m.pesquisar("Ataíde")
      await m.opcoes.first().click()
      await m.pesquisar("Osmar")
      await m.opcoes.first().click()
      await expect(m.contador).toHaveText(/^\s*2\//)

      await m.opcoes.first().click()
      await expect(m.contador).toHaveText(/^\s*1\//)
    })

    // EF: "quando houver apenas uma opção no catálogo trazer a opção selecionada" — o catálogo
    // do ambiente tem 81 profissionais; pesquisa que sobra 1 resultado não seleciona sozinha.
   // test.fixme("17 - catálogo com uma única opção vem selecionado", async () => {})
   // test.fixme("18 - profissional com 2 registros de conselho aparece uma vez por registro", async () => {})
   // test.fixme("19 - profissional sem 'Programas e laudos' não aparece", async () => {})
  })

  test.describe("Salvar", () => {
    test.beforeEach(async ({ ltcatReferenciasPage: r }) => {
      await r.botaoAdicionarEquipe.click()
    })

    test("20 - Salvar grava uma linha por membro em ordem, emite [info_sucesso] e fecha", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r, page }) => {
      await m.selecionar("Ataíde", "Osmar")
      await m.botaoSalvar.click()
      await aviso(page, MSG.sucesso)
      await expect(m.modal).toHaveCount(0)
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([ATAIDE, OSMAR])
    })

    test("21 - Salvar e adicionar outro grava e mantém a modal aberta e limpa", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r, page }) => {
      await m.selecionar("Ataíde")
      await m.salvarEAdicionarOutro()
      await aviso(page, MSG.sucesso)
      await expect(m.modal).toBeVisible()
      await expect(m.membros).toHaveValue("")
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([ATAIDE])
    })

    test("22 - grid mantém a ordem de inserção entre inclusões", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r }) => {
      for (const nome of ["thiago", "Ataíde", "Osmar"]) {
        await m.selecionar(nome)
        await m.salvarEAdicionarOutro()
        await expect(m.membros).toHaveValue("")
      }
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([THIAGO, ATAIDE, OSMAR])
    })

    test("23 - repetido emite [profissional_adicionado] e mantém a seleção pra correção", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r, page }) => {
      await m.selecionar("Ataíde")
      await m.salvarEAdicionarOutro()
      await expect(m.membros).toHaveValue("")

      await m.selecionar("Ataíde")
      await m.botaoSalvar.click()
      await aviso(page, MSG.repetido)
      await expect(m.modal).toBeVisible()
      await expect(m.membros).toHaveValue(new RegExp(`^${ATAIDE}`))
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([ATAIDE])
    })

    test("24 - repetido junto com um novo não grava nenhum dos dois", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r, page }) => {
      await m.selecionar("Ataíde")
      await m.salvarEAdicionarOutro()
      await expect(m.membros).toHaveValue("")

      await m.selecionar("Ataíde", "Osmar")
      await m.botaoSalvar.click()
      await aviso(page, MSG.repetido)
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([ATAIDE])
    })

    test("25 - quarto membro emite [limite_atingido] e não entra no grid", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r, page }) => {
      await m.selecionar("Ataíde", "Osmar", "Silvio")
      await m.salvarEAdicionarOutro()
      await expect(m.membros).toHaveValue("")

      await m.selecionar("thiago")
      await m.botaoSalvar.click()
      await aviso(page, MSG.limite)
      await expect(r.linhasEquipe).toHaveCount(3)
    })

    test("26 - mais de 3 de uma vez (Todos) é bloqueado sem gravar nenhum", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r, page }) => {
      await m.membros.click()
      await m.marcarTodos.click()
      await page.keyboard.press("Escape")
      await m.botaoSalvar.click()
      await aviso(page, MSG.limite)
      await expect(r.linhasEquipe).toHaveCount(0)
    })

    test("27 - clique duplo em Salvar não duplica as linhas", async ({ ltcatEquipeModal: m, ltcatReferenciasPage: r, page }) => {
      await m.selecionar("Ataíde", "Osmar")
      await cliqueDuploHumano(page, m.botaoSalvar)
      await expect(m.modal).toHaveCount(0)
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([ATAIDE, OSMAR])
    })
  })

  test.describe("Excluir", () => {
    test.beforeEach(async ({ ltcatReferenciasPage: r, ltcatEquipeModal: m }) => {
      await r.botaoAdicionarEquipe.click()
      await m.selecionar("Ataíde", "Osmar", "Silvio")
      await m.botaoSalvar.click()
      await expect(r.linhasEquipe).toHaveCount(3)
    })

    test("28 - lixeira em cada linha com tooltip 'Excluir'", async ({ ltcatReferenciasPage: r, page }) => {
      for (let i = 0; i < 3; i++) {
        const botao = r.botaoExcluirEquipe(i)
        await expect(botao.locator("mat-icon")).toHaveText("delete_outline")
        const tooltipId = await botao.getAttribute("aria-describedby")
        await expect(page.locator(`#${tooltipId}`)).toHaveText("Excluir")
      }
    })

    // DIVERGÊNCIA EF (2026-10-19): a EF manda exibir o botão "no início da linha"; ele fica no fim,
    // à direita do "CPF - Nome". Remover o test.fail se confirmarem que o layout atual está certo.
    test("29 - lixeira fica no início da linha", async ({ ltcatReferenciasPage: r }) => {
      test.fail(true, "lixeira renderizada no fim da linha")
      const botao = (await r.botaoExcluirEquipe(0).boundingBox())!
      const texto = (await r.linhasEquipe.first().locator("span.mat-tooltip-trigger").boundingBox())!
      expect(botao.x).toBeLessThan(texto.x)
    })

    test("30 - modal de exclusão: texto, Excluir em destaque e Fechar não exclui", async ({ ltcatReferenciasPage: r }) => {
      await r.botaoExcluirEquipe(0).click()
      await expect(r.popupExclusao).toBeVisible()
      await expect(r.popupExclusao.getByRole("button", { name: "Excluir" })).toHaveClass(/mat-primary/)
      await expect(r.popupExclusao.getByRole("button", { name: "Fechar" })).toHaveClass(/mat-secondary/)

      await r.popupExclusao.getByRole("button", { name: "Fechar" }).click()
      await expect(r.popupExclusao).toHaveCount(0)
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([ATAIDE, OSMAR, SILVIO])
    })

    for (const { titulo, linha, restam } of [
      { titulo: "31 - excluir o primeiro mantém os demais em ordem", linha: 0, restam: [OSMAR, SILVIO] },
      { titulo: "32 - excluir o do meio mantém os demais em ordem", linha: 1, restam: [ATAIDE, SILVIO] },
      { titulo: "33 - excluir o último mantém os demais em ordem", linha: 2, restam: [ATAIDE, OSMAR] },
    ]) {
      test(titulo, async ({ ltcatReferenciasPage: r, page }) => {
        await r.botaoExcluirEquipe(linha).click()
        await r.popupExclusao.getByRole("button", { name: "Excluir" }).click()
        await aviso(page, MSG.excluido)
        await expect(r.popupExclusao).toHaveCount(0)
        await expect.poll(() => r.profissionaisDaEquipe()).toEqual(restam)
      })
    }

    test("34 - depois de excluir com o limite atingido, aceita novo membro no fim", async ({ ltcatReferenciasPage: r, ltcatEquipeModal: m }) => {
      await r.botaoExcluirEquipe(0).click()
      await r.popupExclusao.getByRole("button", { name: "Excluir" }).click()
      await expect(r.linhasEquipe).toHaveCount(2)

      await r.botaoAdicionarEquipe.click()
      await m.selecionar("thiago")
      await m.botaoSalvar.click()
      await expect(m.modal).toHaveCount(0)
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([OSMAR, SILVIO, THIAGO])
    })

    test("37 - clique duplo no Excluir da confirmação remove um item só", async ({ ltcatReferenciasPage: r, page }) => {
      await cliqueDuploHumano(page, r.botaoExcluirEquipe(0))
      await expect(r.popupExclusao).toHaveCount(1)
      await cliqueDuploHumano(page, r.popupExclusao.getByRole("button", { name: "Excluir" }))
      await expect(r.popupExclusao).toHaveCount(0)
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([OSMAR, SILVIO])
    })

    test("35 - excluir todos deixa o grid vazio", async ({ ltcatReferenciasPage: r }) => {
      for (let i = 0; i < 3; i++) {
        await r.botaoExcluirEquipe(0).click()
        await r.popupExclusao.getByRole("button", { name: "Excluir" }).click()
        await expect(r.linhasEquipe).toHaveCount(2 - i)
      }
      await expect(r.secaoEquipe.getByText("Sem registros para listar.")).toBeVisible()
    })
  })

  test.describe("Exploratório e acessibilidade", () => {
    test("38 - adicionar e remover rápido várias vezes não duplica nem perde membros", async ({ ltcatReferenciasPage: r, ltcatEquipeModal: m }) => {
      for (let i = 0; i < 3; i++) {
        await r.botaoAdicionarEquipe.click()
        await m.selecionar("Ataíde")
        await m.botaoSalvar.click()
        await expect(r.linhasEquipe).toHaveCount(1)
        await r.botaoExcluirEquipe(0).click()
        await r.popupExclusao.getByRole("button", { name: "Excluir" }).click()
        await expect(r.linhasEquipe).toHaveCount(0)
      }
      await r.botaoAdicionarEquipe.click()
      await m.selecionar("Ataíde", "Osmar")
      await m.botaoSalvar.click()
      await expect.poll(() => r.profissionaisDaEquipe()).toEqual([ATAIDE, OSMAR])
    })

    test("39 - modal utilizável em resolução reduzida", async ({ ltcatReferenciasPage: r, ltcatEquipeModal: m, page }) => {
      await page.setViewportSize({ width: 768, height: 700 })
      await r.botaoAdicionarEquipe.click()
      for (const elemento of [m.titulo, m.membros, m.botaoFechar, m.botaoSalvarEAdicionarOutro, m.botaoSalvar]) {
        await expect(elemento).toBeInViewport()
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

      await m.selecionar("Ataíde")
      await m.botaoSalvar.click()
      await expect(r.linhasEquipe).toHaveCount(1)
    })

    test("40 - navega e salva só pelo teclado, com foco visível nos botões", async ({ ltcatReferenciasPage: r, ltcatEquipeModal: m, page }) => {
      await r.botaoAdicionarEquipe.click()
      await m.membros.focus()
      await m.membros.press("ArrowDown")
      await expect(m.opcoes.first()).toBeVisible()
      await m.membros.press("ArrowDown")
      await m.membros.press("Enter")
      await expect(m.contador).toHaveText(/^\s*1\//)
      await m.membros.press("Escape")

      // TAB até o Salvar; o Material marca o botão focado por teclado com cdk-keyboard-focused
      for (let i = 0; i < 8 && !(await m.botaoSalvar.evaluate((b) => b === document.activeElement)); i++) {
        await page.keyboard.press("Tab")
      }
      await expect(m.botaoSalvar).toBeFocused()
      await expect(m.botaoSalvar).toHaveClass(/cdk-keyboard-focused/)
      await page.keyboard.press("Enter")
      await expect(m.modal).toHaveCount(0)
      await expect(r.linhasEquipe).toHaveCount(1)
    })
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("36 - equipe persiste em ordem depois de salvar o LTCAT e recarregar", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, ltcatEquipeModal: m, page }) => {
    test.setTimeout(120000)
    await cadastro.preencherObrigatorios(ltcatValido)
    await cadastro.preencherConfiguracoesObrigatorias()
    await r.botaoAdicionarEquipe.click()
    await m.selecionar("Osmar", "Ataíde")
    await m.botaoSalvar.click()
    // clicar no Salvar do LTCAT com a modal ainda fechando perde o clique
    await expect(m.modal).toHaveCount(0)
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)

    await page.reload()
    await expect(r.linhasEquipe).toHaveCount(2)
    await expect.poll(() => r.profissionaisDaEquipe()).toEqual([OSMAR, ATAIDE])
  })
})
