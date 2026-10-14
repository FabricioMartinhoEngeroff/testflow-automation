import type { Page } from "@playwright/test"

export type DiasAntes = "15" | "30" | "60" | "90" | "120" | "150" | "180"

// modal "Notificações" (botão "Notificações" do cabeçalho do cadastro)
export class LtcatNotificacoesModal {
  constructor(private readonly page: Page) {}

  private get modal() {
    return this.page.getByRole("dialog")
  }

  get botaoNotificacoes() {
    return this.page.getByRole("button", { name: /Notificações/ })
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Notificações" })
  }

  diasAntes(dias: DiasAntes) {
    return this.modal.getByRole("checkbox", { name: `${dias} dias` })
  }

  get avisoSemOpcao() {
    return this.modal.getByText(/Caso nenhuma opção seja selecionada, não haverá notificação por e-mail/)
  }

  get dataSeguinte() {
    return this.modal.getByRole("radio", { name: "A seguinte data:" })
  }

  get dataFimVigencia() {
    return this.modal.getByRole("radio", { name: "A data fim da vigência do laudo" })
  }

  get gruposDeEmail() {
    return this.modal.getByRole("combobox", { name: "Grupos de e-mail *" })
  }

  get botaoFechar() {
    return this.modal.getByRole("button", { name: "Fechar" })
  }

  get botaoSalvar() {
    return this.modal.getByRole("button", { name: "Salvar", exact: true })
  }

  async abrir() {
    await this.botaoNotificacoes.click()
    await this.titulo.waitFor({ state: "visible" })
  }

  // o checkbox real fica escondido atrás do componente, então o clique vai no rótulo
  async marcarDiasAntes(dias: DiasAntes) {
    await this.modal.getByText(`${dias} dias`, { exact: true }).click()
  }
}
