// EF LTCAT > Modal "Histórico de revisões" > Responsável técnico. É o mesmo componente da aba
// Referências (ver referencias-responsavel-tecnico.spec.ts); aqui só roda num LTCAT novo, sem salvar.
import { test, expect } from "@support"

const FORMATO_OPCAO = /^\d{3}\.\d{3}\.\d{3}-\d{2} - .+ - .+$/
const ATAIDE = "211.576.325-48 - Ataíde Soares Pina - 55555555555555555555"
const MARIA_ALICE = "834.396.010-64 - Maria Alice Testes Valendo Real - CRM25636-9"

const nomeDa = (opcao: string) => opcao.split(" - ").slice(1, -1).join(" - ")

test.describe("LTCAT - Modal Histórico de revisões - Responsável técnico", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage: cadastro, ltcatHistoricoRevisoesModal: modal }) => {
    await login.entrar()
    await cadastro.abrir()
    await modal.abrir()
  })

  test("TST308 - campo em branco, habilitado e marcado como obrigatório", async ({ ltcatHistoricoRevisoesModal: m }) => {
    await expect(m.responsavelTecnico).toHaveValue("")
    await expect(m.responsavelTecnico).toBeEnabled()
    await expect(m.responsavelTecnico).toHaveAttribute("aria-autocomplete", "list")
    await expect(m.campoResponsavelTecnico.locator(".mat-form-field-required-marker")).toHaveText("*")
  })

  test("TST311/TST336 - catálogo no formato CPF + nome + registro e ordenado pelo nome", async ({ ltcatHistoricoRevisoesModal: m }) => {
    await m.responsavelTecnico.click()
    await expect(m.opcoesResponsavel.first()).toBeVisible()
    const opcoes = (await m.opcoesResponsavel.allInnerTexts()).map((o) => o.trim())
    for (const opcao of opcoes) expect(opcao).toMatch(FORMATO_OPCAO)

    const nomes = opcoes.map(nomeDa)
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })))
  })

  test("TST322/TST323 (mesmo catálogo das Referências) - catálogo é o mesmo da aba Referências", async ({ ltcatHistoricoRevisoesModal: m, ltcatReferenciasPage: r, page }) => {
    await m.responsavelTecnico.click()
    await expect(m.opcoesResponsavel.first()).toBeVisible()
    const doModal = await m.opcoesResponsavel.allInnerTexts()
    await page.keyboard.press("Escape")
    await m.botaoFechar.click()

    await r.responsavelTecnico.click()
    await expect(r.opcoesResponsavel.first()).toBeVisible()
    expect(await r.opcoesResponsavel.allInnerTexts()).toEqual(doModal)
  })

  test.describe("Pesquisa", () => {
    const casos = [
      { titulo: "TST313 - por CPF completo", termo: "834.396.010-64", esperado: [MARIA_ALICE] },
      { titulo: "TST313 (parcial) - por CPF parcial", termo: "834.396", esperado: [MARIA_ALICE] },
      { titulo: "TST339 - ignora acentos", termo: "Ataide", esperado: [ATAIDE] },
      { titulo: "TST312 (registro do conselho) - por registro do conselho", termo: "CRM25636-9", contem: MARIA_ALICE },
      { titulo: "TST312 - por nome, ignorando maiúsculas", termo: "MARIA ALICE", contem: MARIA_ALICE },
    ]

    for (const caso of casos) {
      test(caso.titulo, async ({ ltcatHistoricoRevisoesModal: m }) => {
        await m.pesquisarResponsavel(caso.termo)
        if (caso.esperado) {
          await expect(m.opcoesResponsavel).toHaveText(caso.esperado)
        } else {
          await expect(m.opcoesResponsavel.filter({ hasText: caso.contem })).toHaveCount(1)
          for (const opcao of await m.opcoesResponsavel.allInnerTexts()) {
            expect(opcao.toLocaleLowerCase("pt-BR")).toContain(caso.termo.toLocaleLowerCase("pt-BR"))
          }
        }
      })
    }

    test("TST314 - termo inexistente mostra lista vazia sem erro", async ({ ltcatHistoricoRevisoesModal: m, toast }) => {
      await m.pesquisarResponsavel("zzzzqq")
      await expect(m.opcoesResponsavel).toHaveText(["Nenhum registro encontrado."])
      await expect(toast.mensagem).toHaveCount(0)
    })
  })

  test.describe("Seleção e botão Limpar", () => {
    test("TST316 - selecionar preenche o campo com a opção escolhida", async ({ ltcatHistoricoRevisoesModal: m }) => {
      await m.escolherResponsavel(ATAIDE)
      await expect(m.responsavelTecnico).toHaveValue(ATAIDE)
    })

    test("TST341 - seleciona pelo teclado (setas + ENTER)", async ({ ltcatHistoricoRevisoesModal: m }) => {
      await m.responsavelTecnico.focus()
      await m.responsavelTecnico.press("ArrowDown")
      await expect(m.opcoesResponsavel.first()).toBeVisible()
      await m.responsavelTecnico.press("ArrowDown")
      await m.responsavelTecnico.press("Enter")
      await expect(m.responsavelTecnico).toHaveValue(FORMATO_OPCAO)
    })

    test("TST317 (botão Limpar) - X aparece ao focar o campo e tem tooltip 'Limpar'", async ({ ltcatHistoricoRevisoesModal: m, page }) => {
      await expect(m.botaoLimparResponsavel).toHaveCount(0)
      await m.responsavelTecnico.click()
      await expect(m.botaoLimparResponsavel).toBeVisible()
      const tooltipId = await m.botaoLimparResponsavel.getAttribute("aria-describedby")
      await expect(page.locator(`#${tooltipId}`)).toHaveText("Limpar")
    })

    test("TST317 - Limpar deixa o campo em branco e permite escolher outro", async ({ ltcatHistoricoRevisoesModal: m }) => {
      await m.escolherResponsavel(MARIA_ALICE)
      await m.limparResponsavel()
      await expect(m.responsavelTecnico).toHaveValue("")
      await m.escolherResponsavel(ATAIDE)
      await expect(m.responsavelTecnico).toHaveValue(ATAIDE)
    })

    test("TST318 - depois de Limpar, Adicionar é bloqueado pela obrigatoriedade", async ({ ltcatHistoricoRevisoesModal: m, toast, page }) => {
      await m.preencher({ versao: "1", motivo: "Motivo 1", responsavel: ATAIDE })
      await m.limparResponsavel()
      // o X deixa a lista aberta por cima do "+"
      await page.keyboard.press("Escape")
      await m.botaoIncluirNaTabela.click()
      await toast.temTexto("obrigatórios")
      await expect(m.linhas).toHaveCount(0)
    })
  })
})
