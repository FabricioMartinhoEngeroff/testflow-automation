// EF LTCAT > Cabeçalho > Revisões > Modal "Histórico de revisões".
// Regras de permissão (Corporativo/Adm. Máster riscadas → INC/ALT) ficam fora: os testes de permissão estão desativados.
// A maioria roda num LTCAT novo e não salva nada; os de linhas já salvas usam LTCAT_SALVO (154, com 53 revisões).
import { fileURLToPath } from "node:url"
import path from "node:path"
import { test, expect } from "@support"

const LTCAT_SALVO = "/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=154"
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

test.describe("LTCAT - Modal Histórico de revisões (LTCAT novo)", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage: cadastro, ltcatHistoricoRevisoesModal: modal }) => {
    await login.entrar()
    await cadastro.abrir()
    await modal.abrir()
  })

  test.describe("Formulário", () => {
    test("01 - exibe o box fixo de orientação", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await expect(modal.orientacao).toBeVisible()
    })

    test("02 - Versão em branco, obrigatória e com até 30 caracteres", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await expect(modal.versao).toHaveValue("")
      await expect(modal.versao).toHaveAttribute("required", "")
      await modal.versao.fill("x".repeat(40))
      await expect(modal.versao).toHaveValue("x".repeat(30))
    })

    test("03 - Responsável técnico exibe CPF + nome + registro do conselho", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await modal.responsavelTecnico.click()
      await expect(page.getByRole("option").first()).toHaveText(/^\s*\d{3}\.\d{3}\.\d{3}-\d{2} - .+ - .+\s*$/)
    })

    test("04 - Data da revisão vem preenchida com a data atual", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await expect(modal.dataRevisao).toHaveValue(HOJE)
    })

    test("05 - Data da revisão não aceita data futura", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.preencher(revisao("1", { data: AMANHA }))
      await modal.botaoIncluirNaTabela.click()
      await expect(modal.linhas).toHaveCount(0)
    })
  })

  test.describe("Botão Adicionar", () => {
    test("06 - sem obrigatórios emite [campos_obrigatorios] e não inclui", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await modal.botaoIncluirNaTabela.click()
      await expect(page.locator("apls-toast")).toBeVisible()
      console.log("[campos_obrigatorios]:", await page.locator("apls-toast").innerText())
      await expect(modal.linhas).toHaveCount(0)
    })

    test("07 - inclui a linha e exibe [info_sucesso]", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await modal.preencher(revisao("1"))
      await modal.botaoIncluirNaTabela.click()
      await expect(modal.linhas).toHaveCount(1)
      await expect(page.locator("apls-toast")).toBeVisible()
      console.log("[info_sucesso] adicionar:", await page.locator("apls-toast").innerText())
    })

    test("08 - versão repetida emite [versao_unica] e não inclui", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await modal.preencher(revisao("1"))
      await modal.botaoIncluirNaTabela.click()
      await expect(modal.linhas).toHaveCount(1)
      await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
      await modal.preencher(revisao("1", { motivo: "Outra" }))
      await modal.botaoIncluirNaTabela.click()
      await expect(page.locator("apls-toast")).toBeVisible()
      console.log("[versao_unica]:", await page.locator("apls-toast").innerText())
      await expect(modal.linhas).toHaveCount(1)
    })
  })

  test.describe("Grid", () => {
    test("09 - colunas: Responsável <cpf> - <nome>, Documentos e Data base com traço quando vazios", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.preencher(revisao("1"))
      await modal.substituirData(modal.dataBase, "")
      await modal.botaoIncluirNaTabela.click()
      const celulas = modal.linha(0).locator("td")
      await expect(celulas.nth(1)).toHaveText(/^\s*\d{3}\.\d{3}\.\d{3}-\d{2} - [^-]+$/)
      await expect(celulas.nth(3)).toHaveText(/^\s*-\s*$/)
      await expect(celulas.nth(4)).toHaveText(/^\s*-\s*$/)
    })

    test("10 - ordenação padrão por Data da revisão decrescente", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      for (const [v, data] of [["1", "01/01/2025"], ["2", "01/01/2026"], ["3", "01/06/2025"]]) {
        await modal.preencher(revisao(v, { data }))
        await expect(async () => {
          await modal.botaoIncluirNaTabela.click()
          await expect(modal.linhas.filter({ hasText: `Motivo ${v}` })).toHaveCount(1, { timeout: 2000 })
        }).toPass({ timeout: 20000 })
      }
      await expect(modal.linhas.locator("td:nth-child(3)")).toHaveText(["01/01/2026", "01/06/2025", "01/01/2025"])
    })

    test("11 - Documentos: mais de 3 anexos mostra 3 miniaturas e reticências", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.preencher(revisao("1"))
      await modal.inputArquivo.setInputFiles(["minimo.pdf", "imagem.png", "documento.doc", "anexo-teste.pdf"].map((f) => path.join(FIXTURES, f)))
      await modal.botaoIncluirNaTabela.click()
      const documentos = modal.linha(0).locator("td").nth(3)
      await expect(documentos.locator(".file")).toHaveCount(3)
      await expect(documentos).toContainText("...")
    })
  })

  test.describe("Edição de linha", () => {
    test.beforeEach(async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.preencher(revisao("1"))
      await modal.botaoIncluirNaTabela.click()
      await expect(modal.linhas).toHaveCount(1)
    })

    test("12 - Editar preenche o formulário, esconde Adicionar e mostra Salvar/Cancelar", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.botaoDaLinha(0, "Editar").click()
      await expect(modal.versao).toHaveValue("1")
      await expect(modal.motivo).toHaveValue("Motivo 1")
      await expect(modal.botaoIncluirNaTabela).toBeHidden()
      await expect(modal.botaoSalvarEdicao).toBeVisible()
      await expect(modal.botaoCancelarEdicao).toBeVisible()
    })

    test("13 - Cancelar edição limpa o formulário e não altera a linha", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.botaoDaLinha(0, "Editar").click()
      await modal.motivo.fill("Alterado")
      await modal.botaoCancelarEdicao.click()
      await expect(modal.versao).toHaveValue("")
      await expect(modal.motivo).toHaveValue("")
      await expect(modal.linha(0)).toContainText("Motivo 1")
    })

    test("14 - Salvar edição atualiza a linha e exibe [info_sucesso]", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
      await modal.botaoDaLinha(0, "Editar").click()
      await modal.motivo.fill("Alterado")
      await modal.botaoSalvarEdicao.click()
      await expect(modal.linha(0)).toContainText("Alterado")
      await expect(page.locator("apls-toast")).toBeVisible()
      console.log("[info_sucesso] edição:", await page.locator("apls-toast").innerText())
    })

    test("15 - Excluir com edição em andamento emite [edicao_andamento] e não exclui", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
      await modal.botaoDaLinha(0, "Editar").click()
      await modal.botaoDaLinha(0, "Excluir").click()
      await expect(page.locator("apls-toast")).toBeVisible()
      console.log("[edicao_andamento] excluir:", await page.locator("apls-toast").innerText())
      await expect(modal.linhas).toHaveCount(1)
    })

    test("16 - Salvar da modal com edição em andamento emite [edicao_andamento] e mantém a modal", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
      await modal.botaoDaLinha(0, "Editar").click()
      await modal.botaoSalvar.click()
      await expect(page.locator("apls-toast")).toBeVisible()
      console.log("[edicao_andamento] salvar modal:", await page.locator("apls-toast").innerText())
      await expect(modal.titulo).toBeVisible()
    })
  })

  test.describe("Exclusão de linha não salva", () => {
    test.beforeEach(async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.preencher(revisao("1"))
      await modal.botaoIncluirNaTabela.click()
      await expect(modal.linhas).toHaveCount(1)
    })

    test("17 - Excluir abre confirmação com Fechar/Excluir; Fechar mantém o item", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.botaoDaLinha(0, "Excluir").click()
      const confirmacao = modal.confirmacao("Deseja realmente excluir este item?")
      await expect(confirmacao).toBeVisible()
      await expect(confirmacao.getByRole("button", { name: "Fechar" })).toBeVisible()
      await confirmacao.getByRole("button", { name: "Fechar" }).click()
      await expect(modal.linhas).toHaveCount(1)
      await expect(modal.titulo).toBeVisible()
    })

    test("18 - confirmar exclusão remove o item e exibe [info_sucesso]", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
      await modal.botaoDaLinha(0, "Excluir").click()
      await modal.confirmacao("Deseja realmente excluir este item?").getByRole("button", { name: "Excluir" }).click()
      await expect(modal.linhas).toHaveCount(0)
      await expect(page.locator("apls-toast")).toBeVisible()
      console.log("[info_sucesso] excluir:", await page.locator("apls-toast").innerText())
    })
  })

  test.describe("Botões da modal", () => {
    test("19 - Fechar sem alterações fecha direto", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.botaoFechar.click()
      await expect(modal.titulo).toBeHidden()
    })

    test("20 - Fechar com alterações pede confirmação; 'Sair sem Salvar' descarta", async ({ ltcatHistoricoRevisoesModal: modal }) => {
      await modal.preencher(revisao("1"))
      await modal.botaoIncluirNaTabela.click()
      await expect(modal.linhas).toHaveCount(1)
      await modal.botaoFechar.click()
      const confirmacao = modal.confirmacao("Existem informações que não foram salvas. Deseja salvá-las antes de sair?")
      await expect(confirmacao).toBeVisible()
      await expect(confirmacao.getByRole("button", { name: "Salvar e Sair" })).toBeVisible()
      await confirmacao.getByRole("button", { name: "Sair sem Salvar" }).click()
      await expect(modal.titulo).toBeHidden()
      await modal.abrir()
      await expect(modal.linhas).toHaveCount(0)
    })

    test("21 - Salvar fecha a modal, exibe [info_sucesso] e mantém a linha ao reabrir", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await modal.preencher(revisao("1"))
      await modal.botaoIncluirNaTabela.click()
      await expect(modal.linhas).toHaveCount(1)
      await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
      await modal.botaoSalvar.click()
      await expect(modal.titulo).toBeHidden()
      await expect(page.locator("apls-toast")).toBeVisible()
      console.log("[info_sucesso] salvar modal:", await page.locator("apls-toast").innerText())
      await modal.abrir()
      await expect(modal.linhas).toHaveCount(1)
    })
  })
})

test.describe("LTCAT - Modal Histórico de revisões (LTCAT já salvo)", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage: cadastro, ltcatHistoricoRevisoesModal: modal, page }) => {
    await login.entrar()
    await page.goto(LTCAT_SALVO)
    await cadastro.titulo.waitFor({ state: "visible" })
    await modal.abrir()
  })

  // BUG (2026-10-16): a lixeira aparece em todas as linhas já salvas do LTCAT 154; a EF só permite em itens ainda não salvos
  test("22 - Excluir não aparece para linhas já salvas no LTCAT", async ({ ltcatHistoricoRevisoesModal: modal }) => {
    await expect(modal.linhas.first()).toBeVisible()
    await expect(modal.botaoDaLinha(0, "Excluir")).toBeHidden()
  })

  test("23 - tooltip do Revisor: matrícula + nome e data dd/mm/aaaa hh:mm:ss", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
    await modal.linha(0).getByRole("button").filter({ has: page.locator("mat-icon", { hasText: "info_outline" }) }).hover()
    const tooltip = page.locator(".mat-tooltip").last()
    await expect(tooltip).toBeVisible()
    const texto = await tooltip.innerText()
    console.log("tooltip revisor:", JSON.stringify(texto))
    expect(texto).toMatch(/\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}:\d{2}/)
  })

  test("24 - badge do botão Revisões mostra a quantidade de linhas", async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
    const total = await modal.linhas.count()
    await modal.botaoFechar.click()
    await expect(modal.botaoRevisoes.locator(".mat-badge-content")).toHaveText(String(total))
  })
})
