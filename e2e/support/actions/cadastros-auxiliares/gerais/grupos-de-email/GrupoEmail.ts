import { expect, type Page } from "@playwright/test"
import { URLS } from "../../../../urls"

export type GrupoEmail = { codigo: string; descricao: string; ativo: boolean }

// Cadastros Auxiliares > Gerais > Grupos de E-mail (lista). Global: os grupos são usados em todo o sistema,
// como no catálogo "Grupos de e-mail" da modal Notificações do LTCAT ("<código> - <descrição>")
export class GrupoEmailPage {
  constructor(private readonly page: Page) {}

  get linhas() {
    return this.page.locator("tbody tr")
  }

  get paginador() {
    return this.page.locator("mat-paginator")
  }

  get botaoProximaPagina() {
    return this.page.getByRole("button", { name: "Próxima página" })
  }

  get descricaoPesquisa() {
    return this.page.getByRole("textbox", { name: "Descrição" })
  }

  // botão só com o ícone "search", sem nome acessível
  get botaoPesquisar() {
    return this.page.locator("button", { hasText: /^\s*search\s*$/ }).first()
  }

  // a lista abre com o filtro salvo do usuário (chip "Descrição : ..."): pesquisar em branco traz todos.
  // O chip some antes da lista recarregar, por isso a espera é pelo paginador
  async abrir() {
    await this.page.goto(URLS.grupoEmail)
    await this.linhas.first().waitFor()
    if (!(await this.page.getByText(/^\s*Descrição :/).count())) return
    const antes = await this.paginador.innerText()
    await this.descricaoPesquisa.fill("")
    await this.botaoPesquisar.click()
    await expect(this.paginador).not.toHaveText(antes)
  }

  // o status é só uma bolinha, sem texto: div-green = ativo, div-red = inativo
  private async gruposDaPagina(): Promise<GrupoEmail[]> {
    return this.linhas.evaluateAll((trs) => trs.map((tr) => ({
      codigo: tr.querySelector("td.mat-column-codigo")?.textContent?.trim() ?? "",
      descricao: tr.querySelector("td.mat-column-descricao")?.textContent?.trim() ?? "",
      ativo: !!tr.querySelector("td.mat-column-status .div-green"),
    })))
  }

  private async irParaProximaPagina() {
    if (await this.botaoProximaPagina.isDisabled()) return false
    const antes = await this.paginador.innerText()
    await this.botaoProximaPagina.click()
    await expect.poll(() => this.paginador.innerText()).not.toBe(antes)
    return true
  }

  async todosOsGrupos() {
    await this.abrir()
    const grupos = await this.gruposDaPagina()
    while (await this.irParaProximaPagina()) grupos.push(...(await this.gruposDaPagina()))
    return grupos
  }
}
