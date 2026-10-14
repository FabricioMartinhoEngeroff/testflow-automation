import type { Page } from "@playwright/test"

// modal "Adicionar anexo" (aba Anexos)
export class LtcatAnexoModal {
  constructor(private readonly page: Page) {}

  private get modal() {
    return this.page.getByRole("dialog")
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Adicionar anexo" })
  }

  get areaDeArquivo() {
    return this.modal.getByText("Arraste e solte o arquivo aqui ou clique para pesquisar")
  }

  // input type=file escondido atrás da área de arraste
  get inputArquivo() {
    return this.modal.locator('input[type="file"]')
  }

  get descricao() {
    return this.modal.getByRole("textbox", { name: "Descrição/título" })
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

  async anexar(caminhoArquivo: string) {
    await this.inputArquivo.setInputFiles(caminhoArquivo)
  }
}
