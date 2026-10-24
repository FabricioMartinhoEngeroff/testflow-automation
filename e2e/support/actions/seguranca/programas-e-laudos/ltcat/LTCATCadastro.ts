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

  // os do rodapé com ícone de ajuda têm o nome começando pelo texto
  get botaoGerarLaudo() {
    return this.page.getByRole("button", { name: /^Gerar laudo/ })
  }

  get botaoDuplicar() {
    return this.page.getByRole("button", { name: "Duplicar", exact: true })
  }

  // apls-popup > .apls-popup-header / .apls-popup-content / .apls-popup-actions (Não = secondary, Sim = primary com foco)
  get confirmacaoDuplicar() {
    return this.page.locator("apls-popup").filter({ hasText: "duplicando os dados" })
  }

  get textoConfirmacaoDuplicar() {
    return this.confirmacaoDuplicar.locator(".apls-popup-content")
  }

  botaoConfirmacaoDuplicar(nome: "Sim" | "Não") {
    return this.confirmacaoDuplicar.locator(".apls-popup-actions").getByRole("button", { name: nome, exact: true })
  }

  // Voltar com alteração pendente (Sair sem salvar = secondary, Salvar e sair = primary com foco)
  get confirmacaoSaida() {
    return this.page.locator("apls-popup").filter({ hasText: "Deseja salvá-las antes de sair?" })
  }

  botaoConfirmacaoSaida(nome: "Sair sem salvar" | "Salvar e sair") {
    return this.confirmacaoSaida.locator(".apls-popup-actions").getByRole("button", { name: nome, exact: true })
  }

  // LTCAT já assinado: ver os dados da assinatura e gerar o laudo assinado
  get botaoDadosAssinatura() {
    return this.page.getByRole("button", { name: /^Dados da assinatura digital/ })
  }

  // LTCAT ainda não assinado
  get botaoAssinarDigitalmente() {
    return this.page.getByRole("button", { name: /^Assinar digitalmente/ })
  }

  get mensagemSalvoComSucesso() {
    return this.page.getByText("Registro salvo com sucesso")
  }

  aba(nome: Aba) {
    return this.page.getByRole("tab", { name: nome })
  }

  // sem idkey abre um LTCAT novo
  async abrir(idkey?: string | number) {
    await this.page.goto(idkey ? `${URLS.ltcatCadastro}?idkey=${idkey}` : URLS.ltcatCadastro)
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
