import type { Download, Page } from "@playwright/test"

// Painel "Relatórios" (ícone de download da barra superior): fila dos arquivos gerados pelo sistema,
// como o "Gerar laudo" do LTCAT. A geração é assíncrona: a linha aparece e o download fica
// disponível quando o status fica verde (vermelho = falhou).
export class RelatoriosPage {
  constructor(private readonly page: Page) {}

  get painel() {
    return this.page.locator(".cdk-overlay-pane").filter({ hasText: "Relatórios" }).last()
  }

  get linhas() {
    return this.painel.locator("tbody tr")
  }

  linha(arquivo: string | RegExp) {
    return this.linhas.filter({ has: this.page.locator("td.mat-column-relatorio", { hasText: arquivo }) })
  }

  async abrir() {
    await this.page.locator("apls-navegador-superior apls-icon[icon='fa-solid fa-download']").click()
    await this.linhas.first().waitFor()
  }

  get botaoAtualizar() {
    return this.painel.getByRole("button", { name: "Atualizar" })
  }

  async baixar(arquivo: string | RegExp): Promise<Download> {
    const download = this.page.waitForEvent("download")
    await this.linha(arquivo).locator("td.mat-column-download mat-icon").click()
    return download
  }
}
