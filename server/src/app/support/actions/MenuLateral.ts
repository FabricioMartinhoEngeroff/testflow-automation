import type { Page } from "@playwright/test"

// menu lateral do Apollus: ícone do módulo (apls-nav-item) abre o painel com os itens (apls-sub-nav-item)
export class MenuLateral {
  constructor(private readonly page: Page) {}

  modulo(path: string) {
    return this.page.locator(`apls-nav-item[path="${path}"]`)
  }

  // só o item final: o grupo (ex.: "Programas e Laudos") também é um apls-sub-nav-item e contém os filhos
  item(texto: string | RegExp) {
    return this.page.locator("apls-sub-nav-item", { hasText: texto, hasNot: this.page.locator("apls-sub-nav-item") })
  }

  itemDentroDoGrupo(grupo: string, texto: string | RegExp) {
    return this.page
      .locator("apls-sub-nav-item", { has: this.page.getByRole("button", { name: grupo }) })
      .locator("apls-sub-nav-item", { hasText: texto, hasNot: this.page.locator("apls-sub-nav-item") })
  }

  // cabeçalho expansível do grupo (o texto também existe no tooltip oculto, por isso o role)
  grupo(texto: string) {
    return this.page.getByRole("button", { name: texto, exact: true })
  }

  async abrirModulo(path: string) {
    await this.modulo(path).click()
  }
}
