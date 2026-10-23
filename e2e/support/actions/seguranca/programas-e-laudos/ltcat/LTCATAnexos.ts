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

  // o ícone do botão é FontAwesome (apls-icon), não mat-icon
  get iconeBotaoAdicionarAnexo() {
    return this.botaoAdicionarAnexo.locator("i.fa-paperclip")
  }

  // "Anexo" é o cabeçalho da coluna do grid, não existe subtítulo avulso
  get subtituloAnexo() {
    return this.aba.getByRole("columnheader", { name: "Anexo", exact: true })
  }

  // "linhas" inclui a linha da mensagem "Sem registros para listar."; esta só conta anexos de verdade
  get linhasAnexo() {
    return this.tabela.locator("tbody tr").filter({ has: this.page.locator("td.cdk-column-descricao") })
  }

  async descricoes() {
    return (await this.linhasAnexo.locator("td.cdk-column-descricao").allInnerTexts()).map((t) => t.trim())
  }

  // ícone de editar da linha (abre a modal "Visualizar anexo")
  botaoEditar(linha: number) {
    return this.linhasAnexo.nth(linha).locator("mat-icon", { hasText: "edit_outline" })
  }

  botaoExcluir(linha: number) {
    return this.linhasAnexo.nth(linha).locator("mat-icon", { hasText: "delete_outline" })
  }

  get popupExclusao() {
    // o texto não fica dentro de um dialog com role: sobe até o ancestral mais próximo que tem o botão Excluir
    return this.page
      .getByText("Deseja realmente excluir este item?")
      .locator("xpath=ancestor::*[.//button[normalize-space()=\"Excluir\"]][1]")
  }

  // por CSS: com uma modal aberta o fundo fica aria-hidden e getByRole não enxerga a tabela
  get tabela() {
    return this.page.locator("apollus-ngx-ivy-ltcat-aba-anexos table")
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
