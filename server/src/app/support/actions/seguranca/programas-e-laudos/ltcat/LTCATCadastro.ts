import type { Page } from "@playwright/test"
import { URLS } from "../../../../urls"
import { ltcatValido, type DadosLtcat } from "../../../../data/ltcat"
import { LtcatConfiguracoesPage, type FatorTroca } from "./LTCATConfiguracoes"
import { LtcatReferenciasPage } from "./LTCATReferencias"


export type Aba = "Referências" | "Configurações" | "Anexos" | "Colaboradores" | "Conclusão"

// moldura do cadastro de LTCAT: cabeçalho, abas e rodapé. O conteúdo de cada
// aba e de cada modal fica no seu próprio arquivo (LTCATReferencias.ts etc.).
export class LtcatCadastroPage {
  private readonly referencias: LtcatReferenciasPage
  private readonly configuracoes: LtcatConfiguracoesPage

  constructor(private readonly page: Page) {
    this.referencias = new LtcatReferenciasPage(page)
    this.configuracoes = new LtcatConfiguracoesPage(page)
  }

  get titulo() {
    return this.page.getByRole("heading", { name: "Cadastro de LTCAT" })
  }

  // cabeçalho
  get regiao() {
    return this.page.getByRole("combobox", { name: "Região *" })
  }

  get unidade() {
    return this.page.getByRole("combobox", { name: "Unidade" })
  }

  get setor() {
    return this.page.getByRole("combobox", { name: "Setor" })
  }

  get ghe() {
    return this.page.getByRole("combobox", { name: "GHE" })
  }

  get dataBase() {
    return this.page.getByRole("textbox", { name: "Data base" })
  }

  get botaoRevisoes() {
    return this.page.getByRole("button", { name: /Revisões/ })
  }

  get botaoNotificacoes() {
    return this.page.getByRole("button", { name: /Notificações/ })
  }

  // rodapé
  get botaoSalvar() {
    return this.page.getByRole("button", { name: "Salvar", exact: true })
  }

  get botaoVoltar() {
    return this.page.getByRole("button", { name: "Voltar" })
  }

  get mensagemSalvoComSucesso() {
    return this.page.getByText("Registro salvo com sucesso")
  }

  aba(nome: Aba) {
    return this.page.getByRole("tab", { name: nome })
  }

  async abrir() {
    await this.page.goto(URLS.ltcatCadastro)
    await this.titulo.waitFor({ state: "visible" })
  }

  async abrirAba(nome: Aba) {
    await this.aba(nome).click()
  }

  async selecionarOpcao(campo: ReturnType<Page["getByRole"]>, opcao: string | RegExp) {
    await campo.click()
    await this.page.getByRole("option", { name: opcao }).first().click()
  }

  // Cabeçalho + campos com * da aba Referências.
  async preencherObrigatorios(dados: DadosLtcat = ltcatValido) {
    await this.selecionarOpcao(this.regiao, dados.regiao)
    if (dados.unidade) await this.selecionarOpcao(this.unidade, dados.unidade)
    await this.dataBase.fill(dados.dataBase)
    await this.referencias.preencherObrigatorios(dados)
  }

  async preencherConfiguracoesObrigatorias(fator: FatorTroca = "q5") {
    await this.abrirAba("Configurações")
    await this.configuracoes.preencherObrigatorios(fator)
    await this.abrirAba("Referências")
  }

  async salvar() {
    await this.botaoSalvar.click()
  }
}
