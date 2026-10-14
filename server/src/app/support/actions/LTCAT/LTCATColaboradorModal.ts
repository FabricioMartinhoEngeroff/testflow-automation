import type { Page } from "@playwright/test"

// modal "Colaboradores" (aba Colaboradores)
export class LtcatColaboradorModal {
  constructor(private readonly page: Page) {}

  private get modal() {
    return this.page.getByRole("dialog")
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Colaboradores" })
  }

  get colaborador() {
    return this.modal.getByRole("textbox", { name: "Colaborador" })
  }

  get cargo() {
    return this.modal.getByRole("textbox", { name: "Cargo" })
  }

  get botaoFechar() {
    return this.modal.getByRole("button", { name: "Fechar" })
  }

  get botaoSalvarEAdicionarOutro() {
    return this.modal.getByRole("button", { name: "Salvar e adicionar outro" })
  }

  get botaoSalvar() {
    return this.modal.getByRole("button", { name: "Salvar", exact: true })
  }

  async preencher(colaborador: string, cargo: string) {
    await this.colaborador.fill(colaborador)
    await this.cargo.fill(cargo)
  }
}
