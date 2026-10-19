import type { Page } from "@playwright/test"
import { matCheckbox } from "../material"

export type OpcaoReferencias =
  | "Incluir logotipo na capa"
  | "Incluir logotipo no cabeçalho de todas as páginas"
  | "Incluir anexo de Anotação de Responsabilidade Técnica (ART)"
  | "Incluir histórico de revisões"
  | "Incluir data de realização na capa do laudo"

// aba "Referências" do cadastro de LTCAT
export class LtcatReferenciasPage {
  constructor(private readonly page: Page) {}

  private get aba() {
    return this.page.getByRole("tabpanel", { name: "Referências" })
  }

  // Responsável técnico
  get responsavelTecnico() {
    return this.aba.getByRole("combobox", { name: "Responsável técnico *" })
  }

  get campoResponsavelTecnico() {
    return this.aba.locator("apls-autocomplete[formcontrolname=responsavelTecnico] mat-form-field")
  }

  // o X só é renderizado com o campo focado (substitui a seta arrow_drop_down)
  get botaoLimparResponsavel() {
    return this.campoResponsavelTecnico.locator("button", { hasText: "close" })
  }

  async limparResponsavel() {
    await this.responsavelTecnico.click()
    await this.botaoLimparResponsavel.click()
  }

  get opcoesResponsavel() {
    return this.page.getByRole("option")
  }

  async pesquisarResponsavel(termo: string) {
    await this.responsavelTecnico.click()
    await this.responsavelTecnico.fill("")
    await this.responsavelTecnico.pressSequentially(termo)
  }

  // Apagar pelo teclado. fill("") não serve: o input fica vazio mas o form control
  // mantém o profissional anterior e o LTCAT salva com ele.
  async apagarResponsavel() {
    await this.responsavelTecnico.click()
    await this.responsavelTecnico.press("Control+A")
    await this.responsavelTecnico.press("Backspace")
    await this.responsavelTecnico.press("Escape")
  }

  get botaoAdicionarEquipe() {
    return this.aba.getByRole("button", { name: "Adicionar" })
  }

  get tabelaEquipe() {
    return this.aba.getByRole("table")
  }

  // fora do this.aba de propósito: com modal aberta o Angular põe aria-hidden no resto da
  // página e getByRole("tabpanel") deixa de achar a aba, o que zerava o grid nos testes
  get secaoEquipe() {
    return this.page.locator("apollus-ngx-ivy-ltcat-equipe")
  }

  get helpEquipe() {
    return this.secaoEquipe.locator("mat-icon", { hasText: "info_outline" })
  }

  get linhasEquipe() {
    return this.secaoEquipe.locator("tbody tr:not(.mat-no-data-row)")
  }

  // só o "CPF - Nome": o innerText da célula também traz o "delete_outline" do ícone
  async profissionaisDaEquipe() {
    return (await this.linhasEquipe.locator("td span.mat-tooltip-trigger").allInnerTexts()).map((t) => t.trim())
  }

  botaoExcluirEquipe(linha: number) {
    return this.linhasEquipe.nth(linha).getByRole("button")
  }

  get popupExclusao() {
    return this.page.locator("apls-popup").filter({ hasText: "Deseja realmente excluir este item?" })
  }

  get art() {
    return this.aba.getByRole("textbox", { name: "ART" })
  }

  get avaliacaoRealizadaEm() {
    return this.aba.getByRole("textbox", { name: /Avaliação das condições ambientais/ })
  }

  get campoAvaliacaoRealizadaEm() {
    return this.aba.locator("apls-input[formcontrolname=avaliacaoCondicoesRealizadaEm] mat-form-field")
  }

  get labelAvaliacaoRealizadaEm() {
    return this.campoAvaliacaoRealizadaEm.locator("label")
  }

  get helpAvaliacaoRealizadaEm() {
    return this.campoAvaliacaoRealizadaEm.locator("apls-icon")
  }

  get condicoesOperacionais() {
    return this.aba.getByRole("textbox", { name: /Condições operacionais/ })
  }

  get campoCondicoesOperacionais() {
    return this.aba.locator("apls-input[formcontrolname=condicoesOperacionais] mat-form-field")
  }

  get labelCondicoesOperacionais() {
    return this.campoCondicoesOperacionais.locator("label")
  }

  // Configurações Gerais
  get modeloDocumento() {
    return this.aba.getByRole("combobox", { name: "Modelo de documento *" })
  }

  get vigenciaInicio() {
    return this.aba.getByRole("textbox", { name: "Vigência do laudo" })
  }

  get vigenciaFim() {
    return this.aba.getByRole("textbox", { name: "Fim" })
  }

  get expostosMulheres() {
    return this.aba.getByRole("textbox", { name: "Expostos - Mulheres" })
  }

  get expostosHomens() {
    return this.aba.getByRole("textbox", { name: "Expostos - Homens" })
  }

  get expostosPcds() {
    return this.aba.getByRole("textbox", { name: "Expostos - PCDs" })
  }

  get totalExpostos() {
    return this.aba.getByRole("textbox", { name: "Total de expostos" })
  }

  opcao(texto: OpcaoReferencias) {
    return matCheckbox(this.page, texto)
  }

  // o mat-checkbox ocupa a linha toda: clicar no centro dele cai fora do texto nos labels curtos
  async alternarOpcao(texto: OpcaoReferencias) {
    await this.opcao(texto).locator("label").click()
  }

  async selecionarOpcao(campo: ReturnType<Page["getByRole"]>, opcao: string | RegExp) {
    await campo.click()
    await this.page.getByRole("option", { name: opcao }).first().click()
  }

  // Só os campos com * da aba. Responsável técnico e Modelo usam a primeira
  // opção da lista: o que importa é o formulário ficar válido.
  async preencherObrigatorios(dados: {
    responsavelTecnico?: string
    vigenciaInicio: string
    vigenciaFim: string
    avaliacaoRealizadaEm: string
    condicoesOperacionais: string
  }) {
    await this.selecionarOpcao(this.responsavelTecnico, dados.responsavelTecnico ?? /./)
    await this.selecionarOpcao(this.modeloDocumento, /./)
    await this.vigenciaInicio.fill(dados.vigenciaInicio)
    await this.vigenciaFim.fill(dados.vigenciaFim)
    await this.avaliacaoRealizadaEm.fill(dados.avaliacaoRealizadaEm)
    await this.condicoesOperacionais.fill(dados.condicoesOperacionais)
  }
}
