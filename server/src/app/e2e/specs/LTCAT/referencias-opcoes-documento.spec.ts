// EF LTCAT > 5.1 Referências > checkboxes do documento (logotipos, anexo de ART, histórico de revisões,
// data de realização na capa). O efeito de cada um no laudo gerado não é conferido aqui.
import { test, expect } from "../../../support"
import type { OpcaoReferencias } from "../../../support/actions/LTCAT/LTCATReferencias"
import { ltcatValido } from "../../../support/data/ltcat"

const HELP_HISTORICO = "Para selecionar essa opção é necessário possuir ao menos um histórico de revisão na janela de histórico de revisões. Caso esta opção seja marcada, o histórico de revisões será exibido no documento."

const SEMPRE_HABILITADAS: OpcaoReferencias[] = [
  "Incluir logotipo na capa",
  "Incluir logotipo no cabeçalho de todas as páginas",
  "Incluir anexo de Anotação de Responsabilidade Técnica (ART)",
  "Incluir data de realização na capa do laudo",
]
const HISTORICO: OpcaoReferencias = "Incluir histórico de revisões"

test.describe("LTCAT - Referências - Opções do documento", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  test.describe("Estado inicial", () => {
    for (const opcao of SEMPRE_HABILITADAS) {
      test(`desmarcado e habilitado: ${opcao}`, async ({ ltcatReferenciasPage: r }) => {
        await expect(r.opcao(opcao).locator("input")).not.toBeChecked()
        await expect(r.opcao(opcao).locator("input")).toBeEnabled()
      })
    }

    test("histórico de revisões vem desmarcado e bloqueado sem revisão, com help", async ({ ltcatReferenciasPage: r, page }) => {
      await expect(r.opcao(HISTORICO).locator("input")).not.toBeChecked()
      await expect(r.opcao(HISTORICO).locator("input")).toBeDisabled()
      const helpId = await r.opcao(HISTORICO).locator("apls-icon").getAttribute("aria-describedby")
      await expect(page.locator(`#${helpId}`)).toHaveText(HELP_HISTORICO)
    })
  })

  test.describe("Marcar e desmarcar", () => {
    for (const opcao of SEMPRE_HABILITADAS) {
      test(`marca e desmarca: ${opcao}`, async ({ ltcatReferenciasPage: r }) => {
        const input = r.opcao(opcao).locator("input")
        await r.alternarOpcao(opcao)
        await expect(input).toBeChecked()
        await r.alternarOpcao(opcao)
        await expect(input).not.toBeChecked()
      })
    }

    // EF: o checkbox não depende do campo ART, só gera o título do anexo no laudo
    test("anexo de ART marcado não torna o campo ART obrigatório", async ({ ltcatReferenciasPage: r }) => {
      await r.alternarOpcao("Incluir anexo de Anotação de Responsabilidade Técnica (ART)")
      await expect(r.art).toHaveAttribute("aria-required", "false")
      await expect(r.art).toHaveValue("")
    })
  })

  test.describe("Histórico de revisões", () => {
    test.beforeEach(async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
      await modal.abrir()
      await modal.preencher({ versao: "1", motivo: "Motivo 1", responsavel: /211\.576\.325-48/ })
      await modal.botaoIncluirNaTabela.click()
      await expect(modal.linhas).toHaveCount(1)
      await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
      await modal.botaoSalvar.click()
      await expect(modal.titulo).toBeHidden()
    })

    test("com uma revisão incluída, a opção habilita e pode ser marcada", async ({ ltcatReferenciasPage: r }) => {
      const input = r.opcao(HISTORICO).locator("input")
      await expect(input).toBeEnabled()
      await r.alternarOpcao(HISTORICO)
      await expect(input).toBeChecked()
    })

    test("marcada, ao remover todas as revisões e salvar a modal, volta desmarcada e bloqueada", async ({ ltcatReferenciasPage: r, ltcatHistoricoRevisoesModal: modal, page }) => {
      const input = r.opcao(HISTORICO).locator("input")
      await r.alternarOpcao(HISTORICO)
      await expect(input).toBeChecked()

      await modal.abrir()
      await modal.botaoDaLinha(0, "Excluir").click()
      await modal.confirmacao("Deseja realmente excluir este item?").getByRole("button", { name: "Excluir" }).click()
      await expect(modal.linhas).toHaveCount(0)
      await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
      await modal.botaoSalvar.click()
      await expect(modal.titulo).toBeHidden()

      await expect(input).not.toBeChecked()
      await expect(input).toBeDisabled()
    })
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("opções marcadas persistem após salvar e recarregar", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    test.setTimeout(120000)
    await cadastro.preencherObrigatorios(ltcatValido)
    await cadastro.preencherConfiguracoesObrigatorias()
    for (const opcao of SEMPRE_HABILITADAS) await r.alternarOpcao(opcao)
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)

    await page.reload()
    await cadastro.titulo.waitFor()
    for (const opcao of SEMPRE_HABILITADAS) await expect(r.opcao(opcao).locator("input")).toBeChecked()
    await expect(r.opcao(HISTORICO).locator("input")).not.toBeChecked()
  })
})
