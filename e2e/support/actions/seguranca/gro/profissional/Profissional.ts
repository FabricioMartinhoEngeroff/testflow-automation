import type { Page } from "@playwright/test"
import { URLS } from "../../../../urls"

// TODO: confirmar URL real da lista de Profissionais (estimada pelo padrão Apollus)

export class ProfissionalPage {
  constructor(private readonly page: Page) {}

  get cpf() {
    return this.page.getByLabel("CPF *")
  }

  get nome() {
    return this.page.getByLabel("Nome *")
  }

  get cargo() {
    return this.page.getByLabel("Cargo *")
  }

  get nis() {
    return this.page.getByLabel("NIS")
  }

  get botaoSalvar() {
    return this.page.getByRole("button", { name: "Salvar", exact: true })
  }

  get mensagemSalvoComSucesso() {
    return this.page.getByText("Profissional salvo com sucesso")
  }

  // wrapper do mat-form-field que carrega as classes de validação
  containerDe(campo: ReturnType<Page["getByLabel"]>) {
    return campo.locator("xpath=ancestor::mat-form-field")
  }

  async irParaLista() {
    await this.page.goto(URLS.profissional)
  }

  async abrirNovoCadastro() {
    await this.irParaLista()
    await this.page.getByRole("button", { name: "Novo" }).click()
  }

  // CPF exige máscara aplicada ao digitar, por isso pressSequentially
  async preencherObrigatorios(cpf: string) {
    await this.cpf.pressSequentially(cpf.replace(/\D/g, ""))
    await this.nome.fill("Ana Costa")
    await this.cargo.fill("Médico do Trabalho")
  }

  // Após salvar, o sistema abre a modal "Deseja realizar um novo cadastro?" —
  // a mensagem de sucesso é o sinal de que salvou.
  async salvarValido(cpf: string) {
    await this.preencherObrigatorios(cpf)
    await this.botaoSalvar.click()
    await this.mensagemSalvoComSucesso.waitFor({ state: "visible" })
  }

  // Cria um profissional via UI e reabre o cadastro em modo de edição.
  // Após o salvar bem-sucedido, a URL já contém o ID do registro — capturamos
  // antes de clicar "Não" (que redireciona para a lista) e depois voltamos.
  async criarEAbrirParaEdicao(cpf: string) {
    await this.abrirNovoCadastro()
    await this.salvarValido(cpf)
    const urlEdicao = this.page.url()
    await this.page.getByRole("button", { name: "Não" }).click()
    await this.page.goto(urlEdicao)
    await this.cpf.waitFor({ state: "visible" })
  }
}
