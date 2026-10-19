import { expect, type Page } from "@playwright/test"
import { URLS } from "../../../urls"

export type Permissoes = { incluir?: boolean; alterar?: boolean; visualizar?: boolean; excluir?: boolean }

// colunas da matriz de permissões (o grid usa mat-column-permissao_N)
const COLUNAS = { todos: "todos", incluir: "permissao_1", alterar: "permissao_2", visualizar: "permissao_3", excluir: "permissao_4" } as const

// a aba de cada módulo tem duas tabelas; "Configurações gerais" só tem as colunas Alterar e Visualizar
export type TabelaPermissao = "Programas e laudos" | "Configurações gerais"

// Perfis de Acesso > Gerenciar Perfis (lista e cadastro)
export class PerfilAcessoPage {
  constructor(private readonly page: Page) {}

  // lista
  get nomePesquisa() {
    return this.page.getByRole("textbox", { name: "Nome do perfil" })
  }

  // há dois #btn-search (filtro simples e avançado); só um fica visível
  get botaoPesquisar() {
    return this.page.locator("#btn-search:visible")
  }

  get linhas() {
    return this.page.locator("tbody tr")
  }

  linha(codigo: string) {
    return this.linhas.filter({ has: this.page.locator("td.mat-column-codigo", { hasText: codigo }) })
  }

  async pesquisar(nome: string) {
    await this.page.goto(URLS.perfilAcesso)
    await this.nomePesquisa.fill(nome)
    await this.botaoPesquisar.click()
  }

  // logo após pesquisar a lista ainda re-renderiza e fecha o menu recém-aberto: tenta de novo
  async acaoDaLinha(codigo: string, acao: "Revisor" | "Visualizar") {
    const item = this.page.locator(".mat-menu-panel").getByRole("menuitem", { name: acao })
    await expect(async () => {
      if (!(await item.isVisible())) await this.linha(codigo).locator("td.mat-column-menu button").click()
      await expect(item).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 20000 })
    await item.click()
  }

  // cadastro
  aba(modulo: string | RegExp) {
    return this.page.getByRole("tab", { name: modulo })
  }

  get abaProgramasELaudos() {
    return this.aba(/Programas e laudos/)
  }

  get botaoSalvar() {
    return this.page.locator(".apls-form-footer").getByRole("button", { name: "Salvar", exact: true })
  }

  private tabela(tabela: TabelaPermissao) {
    return this.page.locator("table", { has: this.page.locator("thead", { hasText: tabela }) })
  }

  checkbox(programa: string, coluna: keyof typeof COLUNAS, tabela: TabelaPermissao = "Programas e laudos") {
    return this.tabela(tabela)
      .locator("tbody tr", { hasText: programa })
      .locator(`td.mat-column-${COLUNAS[coluna]} mat-checkbox`)
  }

  async abrir(idkey: number) {
    await this.page.goto(`${URLS.perfilAcessoCadastro}?idkey=${idkey}`)
    await this.abaProgramasELaudos.click()
  }

  async estaMarcada(programa: string, coluna: keyof typeof COLUNAS, tabela?: TabelaPermissao) {
    const classes = (await this.checkbox(programa, coluna, tabela).getAttribute("class")) ?? ""
    return classes.includes("mat-checkbox-checked")
  }

  // o input real fica escondido atrás do componente: o clique vai no <label>
  // As permissões não informadas ficam desmarcadas — não há dependência entre elas
  async definir(programa: string, permissoes: Permissoes) {
    for (const coluna of ["incluir", "alterar", "visualizar", "excluir"] as const) {
      const desejada = permissoes[coluna] ?? false
      if ((await this.estaMarcada(programa, coluna)) !== desejada) {
        await this.checkbox(programa, coluna).locator("label").click()
      }
    }
  }

  // o Salvar só habilita quando algo mudou; sem mudança não há o que salvar
  async salvar() {
    if (await this.botaoSalvar.isDisabled()) return
    await this.botaoSalvar.click()
    await expect(this.page.getByText("Registro salvo com sucesso")).toBeVisible()
  }
}
