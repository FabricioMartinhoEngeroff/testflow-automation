import type { Page } from "@playwright/test"

// aba "Anexos" do cadastro de LTCAT (a modal de inclusão está em LTCATAnexoModal.ts)
export class LtcatAnexosPage {
  constructor(private readonly page: Page) {}

  private get aba() {
    return this.page.getByRole("tabpanel", { name: "Anexos" })
  }

  get orientacao() {
    return this.aba.getByText(/Adicione, na tabela abaixo, os anexos/)
  }

  get botaoAdicionarAnexo() {
    return this.aba.getByRole("button", { name: /Adicionar anexo/ })
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
    await this.botaoAdicionarAnexo.click()
  }
}
