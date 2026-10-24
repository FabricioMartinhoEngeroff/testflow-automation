// EF LTCAT > Cabeçalho > Revisões > Modal "Histórico de revisões".
// Regras de permissão (Corporativo/Adm. Máster riscadas → INC/ALT) ficam fora: os testes de permissão estão desativados.
// A maioria roda num LTCAT novo e não salva nada; os de linhas já salvas usam LTCAT_SALVO (154, com 53 revisões).
import { fileURLToPath } from "node:url"
import path from "node:path"
import { test, expect } from "@support"
import type { LtcatHistoricoRevisoesModal } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATHistoricoRevisoes"

const LTCAT_SALVO = 154
const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../support/arquivos")

const dd = (n: number) => String(n).padStart(2, "0")
const hoje = new Date()
const HOJE = `${dd(hoje.getDate())}/${dd(hoje.getMonth() + 1)}/${hoje.getFullYear()}`
const amanha = new Date(hoje.getTime() + 86400000)
const AMANHA = `${dd(amanha.getDate())}/${dd(amanha.getMonth() + 1)}/${amanha.getFullYear()}`

const revisao = (versao: string, extra: { data?: string; dataBase?: string; motivo?: string } = {}) => ({
  versao,
  motivo: `Motivo ${versao}`,
  ...extra,
})

// preenche a revisão e joga na tabela pelo "+"
const incluirRevisao = async (modal: LtcatHistoricoRevisoesModal, versao = "1") => {
  await modal.preencher(revisao(versao))
  await modal.botaoIncluirNaTabela.click()
  await expect(modal.linhas).toHaveCount(1)
}

test.describe("LTCAT - Modal Histórico de revisões (LTCAT novo)", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage: cadastro, ltcatHistoricoRevisoesModal: modal }) => {
    await login.entrar()
    await cadastro.abrir()
    await modal.abrir()
  })

  test.describe("Formulário", () => {
    test("TST276 - exibe o box fixo de orientação", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await expect(modal.orientacao).toBeVisible()
    })

    test("TST281/TST282/TST285 - Versão em branco, obrigatória e com até 30 caracteres", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await expect(modal.versao).toHaveValue("")
      await expect(modal.versao).toHaveAttribute("required", "")
      await modal.versao.fill("x".repeat(40))
      await expect(modal.versao).toHaveValue("x".repeat(30))
    })

    test("TST311 - Responsável técnico exibe CPF + nome + registro do conselho", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.responsavelTecnico.click()
      await expect(modal.opcoesResponsavel.first()).toHaveText(/^\s*\d{3}\.\d{3}\.\d{3}-\d{2} - .+ - .+\s*$/)
    })

    test("TST345 - Data da revisão vem preenchida com a data atual", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await expect(modal.dataRevisao).toHaveValue(HOJE)
    })

    test("TST346 - Data da revisão não aceita data futura", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.preencher(revisao("1", { data: AMANHA }))
      await modal.botaoIncluirNaTabela.click()
      await expect(modal.linhas).toHaveCount(0)
    })
  })

  test.describe("Botão Adicionar", () => {
    test("TST390 - sem obrigatórios emite [campos_obrigatorios] e não inclui", async ({ ltcatHistoricoRevisoesModal: modal, toast }) => {
      await modal.botaoIncluirNaTabela.click()
      await expect(toast.mensagem).toBeVisible()
      console.log("[campos_obrigatorios]:", await toast.mensagem.innerText())
      await expect(modal.linhas).toHaveCount(0)
    })

    test("TST389/TST392 - inclui a linha e exibe [info_sucesso]", async ({ ltcatHistoricoRevisoesModal: modal, toast }) => {
      await incluirRevisao(modal)
      await expect(toast.mensagem).toBeVisible()
      console.log("[info_sucesso] adicionar:", await toast.mensagem.innerText())
    })

    test("TST391 - versão repetida emite [versao_unica] e não inclui", async ({ ltcatHistoricoRevisoesModal: modal, toast }) => {
      await incluirRevisao(modal)
      await toast.aguardarSumir()
      await modal.preencher(revisao("1", { motivo: "Outra" }))
      await modal.botaoIncluirNaTabela.click()
      await expect(toast.mensagem).toBeVisible()
      console.log("[versao_unica]:", await toast.mensagem.innerText())
      await expect(modal.linhas).toHaveCount(1)
    })
  })

  test.describe("Grid", () => {
    test("TST429/TST433/TST437 - colunas: Responsável <cpf> - <nome>, Documentos e Data base com traço quando vazios", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.preencher(revisao("1"))
      await modal.substituirData(modal.dataBase, "")
      await modal.botaoIncluirNaTabela.click()
      const celulas = modal.linha(0).locator("td")
      await expect(celulas.nth(1)).toHaveText(/^\s*\d{3}\.\d{3}\.\d{3}-\d{2} - [^-]+$/)
      await expect(celulas.nth(3)).toHaveText(/^\s*-\s*$/)
      await expect(celulas.nth(4)).toHaveText(/^\s*-\s*$/)
    })

    test("TST422 - ordenação padrão por Data da revisão decrescente", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      for (const [v, data] of [["1", "01/01/2025"], ["2", "01/01/2026"], ["3", "01/06/2025"]]) {
        await modal.preencher(revisao(v, { data }))
        await expect(async () => {
          await modal.botaoIncluirNaTabela.click()
          await expect(modal.linhas.filter({ hasText: `Motivo ${v}` })).toHaveCount(1, { timeout: 2000 })
        }).toPass({ timeout: 20000 })
      }
      await expect(modal.linhas.locator("td:nth-child(3)")).toHaveText(["01/01/2026", "01/06/2025", "01/01/2025"])
    })

    test("TST439 - Documentos: mais de 3 anexos mostra 3 miniaturas e reticências", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.preencher(revisao("1"))
      await modal.inputArquivo.setInputFiles(["minimo.pdf", "imagem.png", "documento.doc", "anexo-teste.pdf"].map((f) => path.join(FIXTURES, f)))
      await modal.botaoIncluirNaTabela.click()
      const documentos = modal.linha(0).locator("td").nth(3)
      await expect(documentos.locator(".file")).toHaveCount(3)
      await expect(documentos).toContainText("...")
    })
  })

  test.describe("Edição de linha", () => {
    test.beforeEach(async ({ ltcatHistoricoRevisoesModal: modal }) => incluirRevisao(modal))

    test("TST393/TST394/TST473/TST474 - Editar preenche o formulário, esconde Adicionar e mostra Salvar/Cancelar", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.botaoDaLinha(0, "Editar").click()
      await expect(modal.versao).toHaveValue("1")
      await expect(modal.motivo).toHaveValue("Motivo 1")
      await expect(modal.botaoIncluirNaTabela).toBeHidden()
      await expect(modal.botaoSalvarEdicao).toBeVisible()
      await expect(modal.botaoCancelarEdicao).toBeVisible()
    })

    test("TST401/TST403/TST482 - Cancelar edição limpa o formulário e não altera a linha", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.botaoDaLinha(0, "Editar").click()
      await modal.motivo.fill("Alterado")
      await modal.botaoCancelarEdicao.click()
      await expect(modal.versao).toHaveValue("")
      await expect(modal.motivo).toHaveValue("")
      await expect(modal.linha(0)).toContainText("Motivo 1")
    })

    test("TST398/TST481 - Salvar edição atualiza a linha e exibe [info_sucesso]", async ({ ltcatHistoricoRevisoesModal: modal, toast }) => {
      await toast.aguardarSumir()
      await modal.botaoDaLinha(0, "Editar").click()
      await modal.motivo.fill("Alterado")
      await modal.botaoSalvarEdicao.click()
      await expect(modal.linha(0)).toContainText("Alterado")
      await expect(toast.mensagem).toBeVisible()
      console.log("[info_sucesso] edição:", await toast.mensagem.innerText())
    })

    test("TST532 - Excluir com edição em andamento emite [edicao_andamento] e não exclui", async ({ ltcatHistoricoRevisoesModal: modal, toast }) => {
      await toast.aguardarSumir()
      await modal.botaoDaLinha(0, "Editar").click()
      await modal.botaoDaLinha(0, "Excluir").click()
      await expect(toast.mensagem).toBeVisible()
      console.log("[edicao_andamento] excluir:", await toast.mensagem.innerText())
      await expect(modal.linhas).toHaveCount(1)
    })

    test("TST575 - Salvar da modal com edição em andamento emite [edicao_andamento] e mantém a modal", async ({ ltcatHistoricoRevisoesModal: modal, toast }) => {
      await toast.aguardarSumir()
      await modal.botaoDaLinha(0, "Editar").click()
      await modal.botaoSalvar.click()
      await expect(toast.mensagem).toBeVisible()
      console.log("[edicao_andamento] salvar modal:", await toast.mensagem.innerText())
      await expect(modal.titulo).toBeVisible()
    })
  })

  test.describe("Exclusão de linha não salva", () => {
    test.beforeEach(async ({ ltcatHistoricoRevisoesModal: modal }) => incluirRevisao(modal))

    test("TST518 - lixeira aparece logo após adicionar a linha, sem salvar a modal nem o LTCAT", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await expect(modal.botaoDaLinha(0, "Excluir")).toBeVisible()
      await expect(page).not.toHaveURL(/idkey=/)
    })

    test("TST523/TST525/TST526 - Excluir abre confirmação com Fechar/Excluir; Fechar mantém o item", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.botaoDaLinha(0, "Excluir").click()
      const confirmacao = modal.confirmacao("Deseja realmente excluir este item?")
      await expect(confirmacao).toBeVisible()
      await expect(confirmacao.getByRole("button", { name: "Fechar" })).toBeVisible()
      await confirmacao.getByRole("button", { name: "Fechar" }).click()
      await expect(modal.linhas).toHaveCount(1)
      await expect(modal.titulo).toBeVisible()
    })

    test("TST527/TST528 - confirmar exclusão remove o item e exibe [info_sucesso]", async ({ ltcatHistoricoRevisoesModal: modal, toast }) => {
      await toast.aguardarSumir()
      await modal.botaoDaLinha(0, "Excluir").click()
      await modal.confirmacao("Deseja realmente excluir este item?").getByRole("button", { name: "Excluir" }).click()
      await expect(modal.linhas).toHaveCount(0)
      await expect(toast.mensagem).toBeVisible()
      console.log("[info_sucesso] excluir:", await toast.mensagem.innerText())
    })
  })

  test.describe("Botões da modal", () => {
    test("TST570 - Fechar sem alterações fecha direto", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.botaoFechar.click()
      await expect(modal.titulo).toBeHidden()
    })

    test("TST571/TST572 - Fechar com alterações pede confirmação; 'Sair sem Salvar' descarta", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await incluirRevisao(modal)
      await modal.botaoFechar.click()
      const confirmacao = modal.confirmacao("Existem informações que não foram salvas. Deseja salvá-las antes de sair?")
      await expect(confirmacao).toBeVisible()
      await expect(confirmacao.getByRole("button", { name: "Salvar e Sair" })).toBeVisible()
      await confirmacao.getByRole("button", { name: "Sair sem Salvar" }).click()
      await expect(modal.titulo).toBeHidden()
      await modal.abrir()
      await expect(modal.linhas).toHaveCount(0)
    })

    test("TST576/TST577 - Salvar fecha a modal, exibe [info_sucesso] e mantém a linha ao reabrir", async ({ ltcatHistoricoRevisoesModal: modal, toast }) => {
      await incluirRevisao(modal)
      await toast.aguardarSumir()
      await modal.botaoSalvar.click()
      await expect(modal.titulo).toBeHidden()
      await expect(toast.mensagem).toBeVisible()
      console.log("[info_sucesso] salvar modal:", await toast.mensagem.innerText())
      await modal.abrir()
      await expect(modal.linhas).toHaveCount(1)
    })
  })
})

test.describe("LTCAT - Modal Histórico de revisões (LTCAT já salvo)", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage: cadastro, ltcatHistoricoRevisoesModal: modal }) => {
    await login.entrar()
    await cadastro.abrir(LTCAT_SALVO)
    await modal.abrir()
  })

  // regra confirmada (2026-10-23): a lixeira também aparece nas revisões já salvas no LTCAT
  test("TST518 (salvas no LTCAT) - Excluir aparece nas linhas já salvas no LTCAT", async ({ ltcatHistoricoRevisoesModal: modal }) => {
    await expect(modal.linhas.first()).toBeVisible()
    await expect(modal.botaoDaLinha(0, "Excluir")).toBeVisible()
  })

  test("TST495/TST497 - tooltip do Revisor: matrícula + nome e data dd/mm/aaaa hh:mm:ss", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
    await modal.linha(0).getByRole("button").filter({ has: page.locator("mat-icon", { hasText: "info_outline" }) }).hover()
    const tooltip = page.locator(".mat-tooltip").last()
    await expect(tooltip).toBeVisible()
    const texto = await tooltip.innerText()
    console.log("tooltip revisor:", JSON.stringify(texto))
    expect(texto).toMatch(/\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}:\d{2}/)
  })

  test("TST251 (badge) - badge do botão Revisões mostra a quantidade de linhas", async ({ ltcatHistoricoRevisoesModal: modal }) => {
    const total = await modal.linhas.count()
    await modal.botaoFechar.click()
    await expect(modal.botaoRevisoes.locator(".mat-badge-content")).toHaveText(String(total))
  })
})
