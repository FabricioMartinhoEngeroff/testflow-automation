import type { Page } from "@playwright/test"
import { URLS } from "../../urls"


export class LtcatPage {
  constructor(private readonly page: Page) {}

  get titulo() {
    return this.page.getByRole("heading", { name: "Lista de LTCATs" })
  }

  get regiao() {
    return this.page.getByRole("combobox", { name: "Região *" })
  }

  get unidade() {
    return this.page.getByRole("combobox", { name: "Unidade" })
  }

  get setor() {
    return this.page.getByRole("combobox", { name: "Setor" })
  }

  get ano() {
    return this.page.getByRole("combobox", { name: "Ano" })
  }

  get botaoNovo() {
    return this.page.getByRole("button", { name: "Novo" })
  }

  get botaoPesquisar() {
    return this.page.locator("#btn-search")
  }

  get grade() {
    return this.page.getByRole("table")
  }

  get linhas() {
    return this.grade.locator("tbody tr")
  }

  async abrir() {
    await this.page.goto(URLS.ltcat)
    await this.botaoNovo.waitFor({ state: "visible" })
  }
}
