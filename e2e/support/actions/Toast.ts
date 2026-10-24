import { expect, type Page } from "@playwright/test"

// popup "Atenção" do Apollus — equivalente ao `popup` do zombieplus
export class ToastPage {
  constructor(private readonly page: Page) {}

  get mensagem() {
    return this.page.locator("apls-toast")
  }

  // pode haver mais de um toast empilhado (ex.: um da validação do campo e outro do Salvar)
  async temTexto(texto: string | RegExp) {
    await expect(this.mensagem.filter({ hasText: texto }).first()).toBeVisible()
  }

  // espera o toast anterior sumir para o próximo não ser confundido com ele
  async aguardarSumir() {
    await this.mensagem.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
  }
}
