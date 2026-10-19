import type { Locator, Page } from "@playwright/test"

export type CodigoIdioma = "pt" | "es" | "en"

// Idioma do Apollus (avatar > "Configurações de Usuário"). É preferência da CONTA, não do
// navegador: o `locale` do Playwright não muda nada, e se a conta ficar em espanhol até o
// login dos próximos testes quebra. A fixture `idioma` volta para "pt" sozinha no fim do teste.
export class Idioma {
  private atual: CodigoIdioma = "pt"

  constructor(private readonly page: Page) {}

  // precisa estar logado, em qualquer tela com a barra superior
  async trocar(idioma: CodigoIdioma) {
    await this.page.locator("apls-navegador-superior .photo-container").click()
    await this.page.locator("apls-dados-usuario mat-select").click()
    await this.page.locator(`mat-option[value="${idioma}"]`).click()
    await this.page.keyboard.press("Escape")
    await this.page.reload()
    this.atual = idioma
  }

  async restaurar() {
    if (this.atual !== "pt") await this.trocar("pt")
  }

  // texto do tooltip de um ícone de help (ligado pelo aria-describedby); serve pra qualquer tela
  async textoDoHelp(icone: Locator) {
    await icone.waitFor()
    const id = await icone.getAttribute("aria-describedby")
    return this.page.locator(`#${id}`)
  }
}
