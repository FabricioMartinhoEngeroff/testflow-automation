import type { Download, Locator, Page } from "@playwright/test"

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

  // a cor fica no style da célula de Status: verde = gerou (aparece o ícone de download), vermelho = falhou
  async status(linha: Locator): Promise<"verde" | "vermelho" | "processando"> {
    const cor = await linha.locator("td.mat-column-status").evaluate((td) => getComputedStyle(td).color)
    return cor === "rgb(0, 128, 0)" ? "verde" : cor === "rgb(176, 23, 23)" ? "vermelho" : "processando"
  }

  // o Atualizar troca as linhas por um skeleton enquanto carrega
  async atualizar() {
    await this.botaoAtualizar.click()
    await this.linhas.locator("td.mat-column-relatorio").first().waitFor()
  }

  async nomesDosArquivos() {
    return (await this.linhas.locator("td.mat-column-relatorio").allInnerTexts()).map((t) => t.trim())
  }

  async fechar() {
    await this.painel.locator(".apls-modal-close-button").click()
    await this.painel.waitFor({ state: "hidden" })
  }

  async baixar(arquivo: string | RegExp): Promise<Download> {
    const download = this.page.waitForEvent("download")
    await this.linha(arquivo).locator("td.mat-column-download mat-icon").click()
    return download
  }
}
