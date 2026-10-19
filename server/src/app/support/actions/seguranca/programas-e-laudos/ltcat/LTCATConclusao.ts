import type { Page } from "@playwright/test"

type FerramentaEditor =
  | "Desfazer"
  | "Refazer"
  | "Negrito"
  | "Itálico"
  | "Sublinhado"
  | "Tachado"
  | "Subscrito"
  | "Sobrescrito"
  | "Alinhamento do texto"
  | "Aumentar recuo"
  | "Diminuir recuo"
  | "Lista numerada"
  | "Fonte"
  | "Tamanho da fonte"
  | "Cor da Fonte"
  | "Link"
  | "Exibir mais itens"

// aba "Conclusão" do cadastro de LTCAT — editor de texto rico (CKEditor)
export class LtcatConclusaoPage {
  constructor(private readonly page: Page) {}

  private get aba() {
    return this.page.getByRole("tabpanel", { name: "Conclusão" })
  }

  get barraDeFerramentas() {
    return this.aba.getByRole("toolbar", { name: "Ferramentas do Editor" })
  }

  ferramenta(nome: FerramentaEditor) {
    return this.barraDeFerramentas.getByRole("button", { name: nome, exact: true })
  }

  // a área editável do CKEditor é um [contenteditable], não um textarea
  get editor() {
    return this.aba.getByRole("textbox", { name: /Editor de Texto Valioso/ })
  }

  get contadorDeTamanho() {
    return this.aba.getByText(/MB de 10 MB/)
  }

  // Descoberta (SPEC PGR): page.keyboard.type() trava nesse editor,
  // locator.pressSequentially() funciona
  async digitar(texto: string) {
    await this.editor.click()
    await this.editor.pressSequentially(texto)
  }
}
