import type { Locator, Page } from "@playwright/test"

// modal "Histórico de revisões" (botão "Revisões" do cabeçalho do cadastro)
export class LtcatHistoricoRevisoesModal {
  constructor(private readonly page: Page) {}

  private get modal() {
    return this.page.getByRole("dialog").filter({ hasText: "Histórico de revisões" })
  }

  // popup "Atenção" de confirmação: abre num overlay próprio, fora do role=dialog da modal
  confirmacao(texto: string | RegExp) {
    return this.page.locator(".cdk-overlay-pane").filter({ hasText: texto }).last()
  }

  get botaoRevisoes() {
    return this.page.getByRole("button", { name: /Revisões/ })
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Histórico de revisões" })
  }

  get orientacao() {
    return this.modal.getByText("Utilize estes campos para gerenciar e guardar as versões deste documento.")
  }

  get versao() {
    return this.modal.getByRole("textbox", { name: "Versão", exact: true })
  }

  get responsavelTecnico() {
    return this.modal.getByRole("combobox", { name: "Responsável técnico *" })
  }

  get campoResponsavelTecnico() {
    return this.modal.locator("apls-autocomplete[formcontrolname=responsavelTecnico] mat-form-field")
  }

  // mesmo componente da aba Referências: o X só existe com o campo focado
  get botaoLimparResponsavel() {
    return this.campoResponsavelTecnico.locator("button", { hasText: "close" })
  }

  get opcoesResponsavel() {
    return this.page.getByRole("option")
  }

  async pesquisarResponsavel(termo: string) {
    await this.responsavelTecnico.click()
    await this.responsavelTecnico.fill("")
    await this.responsavelTecnico.pressSequentially(termo)
  }

  async limparResponsavel() {
    await this.responsavelTecnico.click()
    await this.botaoLimparResponsavel.click()
  }

  get dataRevisao() {
    return this.modal.getByRole("textbox", { name: "Data da revisão" })
  }

  get dataBase() {
    return this.modal.getByRole("textbox", { name: "Data base" })
  }

  get motivo() {
    return this.modal.getByRole("textbox", { name: "Motivo da revisão" })
  }

  get areaDeArquivo() {
    return this.modal.getByText("Arraste e solte o arquivo aqui ou clique para pesquisar")
  }

  get tabela() {
    return this.modal.getByRole("table")
  }

  get linhas() {
    return this.tabela.locator("tbody tr:not(.mat-no-data-row)")
  }

  get semRegistros() {
    return this.modal.getByText("Sem registros para listar.")
  }

  // botão verde "+" ao lado da área de arquivo: joga a versão preenchida na tabela
  get botaoIncluirNaTabela() {
    return this.modal.locator("button").filter({ hasText: /^\s*add\s*$/ }).first()
  }

  // durante a edição de uma linha o "+" some e aparecem "Salvar" (save) e "Cancelar" (close)
  get botaoSalvarEdicao() {
    return this.modal.locator("form button").filter({ hasText: /^\s*save\s*$/ }).first()
  }

  get botaoCancelarEdicao() {
    return this.modal.locator("form button").filter({ hasText: /^\s*(close|clear)\s*$/ }).first()
  }

  // Descoberta: estes campos de data têm máscara; fill("01/01/2020") vira "01/12/0206".
  // Digitar só os dígitos funciona.
  async digitarData(campo: Locator, ddmmaaaa: string) {
    await campo.click()
    await campo.pressSequentially(ddmmaaaa.replace(/\D/g, ""))
  }

  // "Data da revisão" já vem com hoje; digitar por cima sem limpar embaralha a máscara
  async substituirData(campo: Locator, ddmmaaaa: string) {
    await campo.click()
    await campo.press("Control+A")
    await campo.press("Backspace")
    await campo.pressSequentially(ddmmaaaa.replace(/\D/g, ""))
    await campo.press("Tab")
  }

  async escolherResponsavel(trecho: string | RegExp = /211\.576\.325-48/) {
    await this.responsavelTecnico.click()
    await this.page.getByRole("option", { name: trecho }).first().click()
  }

  async preencher(dados: { versao: string; data?: string; dataBase?: string; motivo: string; responsavel?: string | RegExp }) {
    await this.versao.fill(dados.versao)
    await this.escolherResponsavel(dados.responsavel)
    if (dados.data) await this.substituirData(this.dataRevisao, dados.data)
    if (dados.dataBase) await this.substituirData(this.dataBase, dados.dataBase)
    await this.motivo.fill(dados.motivo)
  }

  get inputArquivo() {
    return this.modal.locator("input[type=file]")
  }

  linha(n: number) {
    return this.linhas.nth(n)
  }

  botaoDaLinha(n: number, acao: "Editar" | "Excluir") {
    return this.linha(n).getByRole("button").filter({ has: this.page.locator("mat-icon", { hasText: acao === "Editar" ? "edit" : "delete_outline" }) })
  }

  get botaoFechar() {
    return this.modal.getByRole("button", { name: "Fechar" })
  }

  get botaoSalvar() {
    return this.modal.getByRole("button", { name: "Salvar", exact: true })
  }

  async abrir() {
    await this.botaoRevisoes.click()
    await this.titulo.waitFor({ state: "visible" })
  }
}
