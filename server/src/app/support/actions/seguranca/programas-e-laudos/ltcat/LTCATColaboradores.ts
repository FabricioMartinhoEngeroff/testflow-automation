import type { Page } from "@playwright/test"

// aba "Colaboradores" do cadastro de LTCAT (a modal de inclusão está em LTCATColaboradorModal.ts)
export class LtcatColaboradoresPage {
  constructor(private readonly page: Page) {}

  private get aba() {
    return this.page.getByRole("tabpanel", { name: "Colaboradores" })
  }

  get orientacao() {
    return this.aba.getByText(/Informe abaixo os representantes da organização/)
  }

  get campoPesquisa() {
    return this.aba.getByRole("textbox", { name: "Pesquisar por..." })
  }

  get botaoAdicionar() {
    return this.aba.getByRole("button", { name: "Adicionar" })
  }

  get tabela() {
    return this.aba.getByRole("table")
  }

  get linhas() {
    return this.tabela.locator("tbody tr")
  }

  get semRegistros() {
    return this.aba.getByText("Sem registros para listar.")
  }

  async abrirModalAdicionar() {
    await this.botaoAdicionar.click()
  }
}
