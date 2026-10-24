// EF LTCAT > 5.1 Referências > Responsável Técnico (+ botão Limpar).
// Profissionais usados existem no ambiente dev em 2026-10-19 (catálogo com 47 linhas).
import { test, expect } from "@support"
import { ltcatValido } from "@support/data/ltcat"
import { tooltipDe } from "@support/utils/material"

const LTCAT_SALVO = 154
const FORMATO_OPCAO = /^\d{3}\.\d{3}\.\d{3}-\d{2} - .+ - .+$/
const MSG_OBRIGATORIOS = "Existem um ou mais campos obrigatórios que não foram preenchidos."

const ATAIDE = "211.576.325-48 - Ataíde Soares Pina - 55555555555555555555"
const MARIA_ALICE = "834.396.010-64 - Maria Alice Testes Valendo Real - CRM25636-9"

// o nome fica entre o CPF e o registro, e pode ter " - " no meio ("Jean Scholl - Administrador Apollus")
const nomeDa = (opcao: string) => opcao.split(" - ").slice(1, -1).join(" - ")

test.describe("LTCAT - Referências - Responsável técnico", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  test.describe("Estado inicial", () => {
    test("TST647/TST649/TST653 - campo em branco, habilitado e com placeholder", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.responsavelTecnico).toHaveValue("")
      await expect(r.responsavelTecnico).toBeEnabled()
      await expect(r.responsavelTecnico).toHaveAttribute("placeholder", "Profissional responsável")
    })

    test("TST648 - é um select com pesquisa (autocomplete)", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.responsavelTecnico).toHaveAttribute("role", "combobox")
      await expect(r.responsavelTecnico).toHaveAttribute("aria-autocomplete", "list")
      await expect(r.responsavelTecnico).toBeEditable()
    })

    test("TST687 - label marca o campo como obrigatório", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.campoResponsavelTecnico.locator(".mat-form-field-required-marker")).toHaveText("*")
    })
  })

  test.describe("Catálogo", () => {
    test("TST655/TST658/TST674 - abre a lista em até 3s e exibe CPF + nome + registro do conselho", async ({ ltcatReferenciasPage: r }) => {
      const inicio = Date.now()
      await r.responsavelTecnico.click()
      await expect(r.opcoesResponsavel.first()).toBeVisible()
      expect(Date.now() - inicio).toBeLessThan(3000)

      for (const opcao of await r.opcoesResponsavel.allInnerTexts()) {
        expect(opcao.trim()).toMatch(FORMATO_OPCAO)
      }
    })

    test("TST675 - ordena pelo nome, sem diferenciar maiúsculas e acentos", async ({ ltcatReferenciasPage: r }) => {
      await r.responsavelTecnico.click()
      await expect(r.opcoesResponsavel.first()).toBeVisible()
      const nomes = (await r.opcoesResponsavel.allInnerTexts()).map((o) => nomeDa(o.trim()))
      const ordenados = [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))
      expect(nomes).toEqual(ordenados)
    })

    test("TST693 - não repete a mesma linha (CPF + registro)", async ({ ltcatReferenciasPage: r }) => {
      await r.responsavelTecnico.click()
      await expect(r.opcoesResponsavel.first()).toBeVisible()
      const opcoes = (await r.opcoesResponsavel.allInnerTexts()).map((o) => o.trim())
      expect(new Set(opcoes).size).toBe(opcoes.length)
    })

    // Pré-requisito de massa: cadastrar em Profissionais um com 2 linhas no GRID de registro
    // conselho, um sem o checkbox "Responsável Técnico" e um sem "Programas e laudos".
    // Nenhum profissional do ambiente tem 2 registros hoje.
   // test.fixme("TST660/TST661 - profissional com 2 registros de conselho aparece uma vez por registro", async () => {})
   // test.fixme("TST656 - profissional sem checkbox 'Responsável Técnico' não aparece", async () => {})
   // test.fixme("TST657 - profissional sem o módulo 'Programas e laudos' não aparece", async () => {})
  })

  test.describe("Pesquisa", () => {
    const casos = [
      { titulo: "TST665/TST666/TST672 - por CPF completo", termo: "834.396.010-64", esperado: [MARIA_ALICE] },
      { titulo: "TST670 - por CPF parcial", termo: "834.396", esperado: [MARIA_ALICE] },
      { titulo: "TST669 - por registro do conselho", termo: "CRM25636-9", contem: MARIA_ALICE },
      { titulo: "TST667/TST668 - por nome", termo: "Maria Alice", contem: MARIA_ALICE },
      { titulo: "TST671 - ignora maiúsculas/minúsculas", termo: "MARIA ALICE", contem: MARIA_ALICE },
      { titulo: "TST671 (acentos) - ignora acentos", termo: "Ataide", esperado: [ATAIDE] },
    ]

    for (const caso of casos) {
      test(caso.titulo, async ({ ltcatReferenciasPage: r }) => {
        await r.pesquisarResponsavel(caso.termo)
        if (caso.esperado) {
          await expect(r.opcoesResponsavel).toHaveText(caso.esperado)
        } else {
          await expect(r.opcoesResponsavel.filter({ hasText: caso.contem })).toHaveCount(1)
          for (const opcao of await r.opcoesResponsavel.allInnerTexts()) {
            expect(opcao.toLocaleLowerCase("pt-BR")).toContain(caso.termo.toLocaleLowerCase("pt-BR"))
          }
        }
      })
    }

    test("TST673 - termo inexistente mostra lista vazia sem erro", async ({ ltcatReferenciasPage: r, toast }) => {
      await r.pesquisarResponsavel("zzzzqq")
      await expect(r.opcoesResponsavel).toHaveText(["Nenhum registro encontrado."])
      await expect(toast.mensagem).toHaveCount(0)
    })

    test("TST662 (texto não selecionado) - texto digitado sem escolher opção não fica no campo", async ({ ltcatReferenciasPage: r }) => {
      await r.selecionarOpcao(r.responsavelTecnico, ATAIDE)
      await r.pesquisarResponsavel("zzz")
      await r.responsavelTecnico.press("Tab")
      await expect(r.responsavelTecnico).toHaveValue(ATAIDE)
    })
  })

  test.describe("Seleção", () => {
    test("TST662 - selecionar preenche o campo com a opção escolhida", async ({ ltcatReferenciasPage: r }) => {
      await r.selecionarOpcao(r.responsavelTecnico, ATAIDE)
      await expect(r.responsavelTecnico).toHaveValue(ATAIDE)
    })

    test("TST685 - seleciona pelo teclado (setas + ENTER) e sai com TAB mantendo o valor", async ({ ltcatReferenciasPage: r }) => {
      await r.responsavelTecnico.focus()
      await r.responsavelTecnico.press("ArrowDown")
      await expect(r.opcoesResponsavel.first()).toBeVisible()
      await r.responsavelTecnico.press("ArrowDown")
      await r.responsavelTecnico.press("Enter")
      await expect(r.responsavelTecnico).toHaveValue(FORMATO_OPCAO)

      const valor = await r.responsavelTecnico.inputValue()
      await r.responsavelTecnico.press("Tab")
      await expect(r.responsavelTecnico).not.toBeFocused()
      await expect(r.responsavelTecnico).toHaveValue(valor)
    })

    test("TST683 - apagar e escolher outro mantém só o último", async ({ ltcatReferenciasPage: r }) => {
      await r.selecionarOpcao(r.responsavelTecnico, MARIA_ALICE)
      await r.apagarResponsavel()
      await expect(r.responsavelTecnico).toHaveValue("")
      await r.selecionarOpcao(r.responsavelTecnico, ATAIDE)
      await expect(r.responsavelTecnico).toHaveValue(ATAIDE)
    })

    test("TST690 - alternar rápido entre selecionar e apagar não deixa lixo", async ({ ltcatReferenciasPage: r }) => {
      for (let i = 0; i < 5; i++) {
        await r.responsavelTecnico.click()
        await r.opcoesResponsavel.nth(i).click()
        await r.apagarResponsavel()
      }
      await r.selecionarOpcao(r.responsavelTecnico, ATAIDE)
      await expect(r.responsavelTecnico).toHaveValue(ATAIDE)
    })

    test("TST692 - nome longo não quebra o layout", async ({ ltcatReferenciasPage: r, page }) => {
      await r.responsavelTecnico.click()
      await expect(r.opcoesResponsavel.first()).toBeVisible()
      const opcoes = await r.opcoesResponsavel.allInnerTexts()
      const maisLonga = opcoes.reduce((a, b) => (b.length > a.length ? b : a)).trim()
      const larguraAntes = (await r.campoResponsavelTecnico.boundingBox())!.width

      await r.opcoesResponsavel.filter({ hasText: maisLonga }).click()
      await expect(r.responsavelTecnico).toHaveValue(maisLonga)
      expect((await r.campoResponsavelTecnico.boundingBox())!.width).toBe(larguraAntes)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })

    test("TST686 - em resolução reduzida o campo continua acessível e sem rolagem horizontal", async ({ ltcatReferenciasPage: r, page }) => {
      await page.setViewportSize({ width: 768, height: 900 })
      await expect(r.responsavelTecnico).toBeVisible()
      await r.selecionarOpcao(r.responsavelTecnico, ATAIDE)
      await expect(r.responsavelTecnico).toHaveValue(ATAIDE)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  })

  test.describe("Obrigatoriedade", () => {
    test("TST650/TST651/TST652 - salvar sem responsável é bloqueado com a mensagem de obrigatório", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page }) => {
      await cadastro.preencherObrigatorios()
      await cadastro.preencherConfiguracoesObrigatorias()
      await r.apagarResponsavel()
      await cadastro.salvar()

      await toast.temTexto(MSG_OBRIGATORIOS)
      await expect(r.campoResponsavelTecnico).toHaveClass(/mat-form-field-invalid/)
      await expect(page).not.toHaveURL(/idkey=/)
    })
  })

  test.describe("Botão Limpar", () => {
    test("TST679/TST680 - X aparece ao focar o campo e tem tooltip 'Limpar'", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.botaoLimparResponsavel).toHaveCount(0)
      await r.responsavelTecnico.click()
      await expect(r.botaoLimparResponsavel).toBeVisible()
      await expect(await tooltipDe(r.botaoLimparResponsavel)).toHaveText("Limpar")
    })

    test("TST678/TST681/TST682 - Limpar deixa o campo em branco e o salvar volta a ser bloqueado", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page }) => {
      await cadastro.preencherObrigatorios({ ...ltcatValido, responsavelTecnico: ATAIDE })
      await cadastro.preencherConfiguracoesObrigatorias()
      await r.limparResponsavel()
      await expect(r.responsavelTecnico).toHaveValue("")

      await cadastro.salvar()
      await toast.temTexto(MSG_OBRIGATORIOS)
      await expect(page).not.toHaveURL(/idkey=/)
    })

    test("TST684 - Limpar e selecionar outro mantém só o último", async ({ ltcatReferenciasPage: r }) => {
      await r.selecionarOpcao(r.responsavelTecnico, MARIA_ALICE)
      await r.limparResponsavel()
      await r.selecionarOpcao(r.responsavelTecnico, ATAIDE)
      await expect(r.responsavelTecnico).toHaveValue(ATAIDE)
    })
  })
})

test.describe("LTCAT - Referências - Responsável técnico (edição)", () => {
  test.beforeEach(async ({ login }) => {
    await login.entrar()
  })

  // LTCAT 154 guarda um responsável que já não aparece no catálogo
  test("TST654/TST677 - LTCAT salvo carrega o responsável e mantém o campo habilitado", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r }) => {
    await cadastro.abrir(LTCAT_SALVO)
    await expect(r.responsavelTecnico).toHaveValue(FORMATO_OPCAO)
    await expect(r.responsavelTecnico).toBeEnabled()
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("TST663/TST664/TST691 - salva, persiste após reload e grava a troca de responsável na edição", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    test.setTimeout(120000)
    await cadastro.abrir()
    await cadastro.preencherObrigatorios({ ...ltcatValido, responsavelTecnico: ATAIDE })
    await cadastro.preencherConfiguracoesObrigatorias()
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible()
    await expect(page).toHaveURL(/idkey=\d+/)

    await page.reload()
    await expect(r.responsavelTecnico).toHaveValue(ATAIDE)

    await r.apagarResponsavel()
    await r.selecionarOpcao(r.responsavelTecnico, MARIA_ALICE)
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible()

    await page.reload()
    await expect(r.responsavelTecnico).toHaveValue(MARIA_ALICE)
  })
})
