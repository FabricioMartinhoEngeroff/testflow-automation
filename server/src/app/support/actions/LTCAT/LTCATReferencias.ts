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

  get botaoAdicionarEquipe() {
    return this.aba.getByRole("button", { name: "Adicionar" })
  }

  get tabelaEquipe() {
    return this.aba.getByRole("table")
  }

  get art() {
    return this.aba.getByRole("textbox", { name: "ART" })
  }

  get avaliacaoRealizadaEm() {
    return this.aba.getByRole("textbox", { name: /Avaliação das condições ambientais/ })
  }

  get condicoesOperacionais() {
    return this.aba.getByRole("textbox", { name: /Condições operacionais/ })
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
