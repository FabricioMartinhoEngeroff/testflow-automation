import { expect, type Page } from "@playwright/test"

// popup "Atenção" do Apollus — equivalente ao `popup` do zombieplus
export class ToastPage {
  constructor(private readonly page: Page) {}

  private get locator() {
    return this.page.locator("apls-toast")
  }

  async temTexto(texto: string | RegExp) {
    await expect(this.locator).toContainText(texto)
  }
}
