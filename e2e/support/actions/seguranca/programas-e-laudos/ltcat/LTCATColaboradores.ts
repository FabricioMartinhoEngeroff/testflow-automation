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

  // por CSS: com a modal aberta o fundo fica aria-hidden e o getByRole não enxerga a tabela
  get linhasColaborador() {
    // grid vazio tem uma linha "Sem registros para listar." com a mesma classe: só conta as que têm a coluna Colaborador
    return this.page.locator("apollus-ngx-ivy-ltcat-aba-colaboradores table tbody tr.mat-row:has(td.mat-column-colaborador)")
  }

  // texto de cada linha numa coluna, na ordem do grid
  async valoresColuna(coluna: "colaborador" | "cargo") {
    return (await this.linhasColaborador.locator(`td.mat-column-${coluna}`).allTextContents()).map((t) => t.trim())
  }

  cabecalho(coluna: "colaborador" | "cargo") {
    return this.page.locator(`apollus-ngx-ivy-ltcat-aba-colaboradores th.mat-column-${coluna}`)
  }

  celula(texto: string) {
    return this.page.locator("apollus-ngx-ivy-ltcat-aba-colaboradores td.mat-cell").filter({ hasText: texto })
  }

  botaoEditar(linha: number) {
    return this.linhasColaborador.nth(linha).locator("button", { has: this.page.locator("mat-icon", { hasText: "edit_outline" }) })
  }

  botaoExcluir(linha: number) {
    return this.linhasColaborador.nth(linha).locator("button", { has: this.page.locator("mat-icon", { hasText: "delete_outline" }) })
  }

  get semRegistros() {
    return this.aba.getByText("Sem registros para listar.")
  }

  async abrirModalAdicionar() {
    await this.botaoAdicionar.click()
  }
}
