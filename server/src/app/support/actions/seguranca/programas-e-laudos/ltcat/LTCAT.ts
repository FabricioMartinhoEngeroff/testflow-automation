import { expect, type Locator, type Page } from "@playwright/test"
import { URLS } from "../../urls"

const COLUNAS = { regiao: 1, unidade: 2, setor: 3, responsavel: 4, dataInicio: 5, dataFim: 6, dataBase: 7, revisao: 8 } as const
const NOMES_COLUNA = { regiao: "Região", unidade: "Unidade", setor: "Setor", responsavel: "Responsável", dataInicio: "Data início", dataFim: "Data fim", dataBase: "Data base", revisao: "Revisão" } as const
export type Coluna = keyof typeof COLUNAS

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

  // o id #btn-search aparece duplicado no DOM (um fica oculto), por isso o :visible
  get botaoPesquisar() {
    return this.page.locator("#btn-search:visible")
  }

  get botaoLimpar() {
    return this.page.locator("button:visible", { hasText: "clear" })
  }

  get paginador() {
    return this.page.locator("mat-paginator")
  }

  get itensPorPagina() {
    return this.page.getByRole("combobox", { name: "Itens por página:" })
  }

  get mensagemSemRegistros() {
    return this.page.getByText("Sem registros para listar.")
  }

  get modalExclusao() {
    return this.page.locator(".cdk-overlay-container").filter({ hasText: "Deseja realmente excluir este item?" })
  }

  get menuDaLinha() {
    return this.page.locator(".mat-menu-item")
  }

  get grade() {
    return this.page.getByRole("table")
  }

  // com grid vazia o tbody traz 1 linha de aviso — use mensagemSemRegistros para esse caso
  get linhas() {
    return this.grade.locator("tbody tr")
  }

  async celulas(coluna: Coluna) {
    return this.grade.locator(`tbody tr td:nth-child(${COLUNAS[coluna]})`).allInnerTexts()
  }

  async selecionarOpcao(campo: Locator, texto: string | RegExp) {
    await campo.click()
    await this.page.locator("mat-option", { hasText: texto }).first().click()
  }

  async opcoesDe(campo: Locator) {
    await campo.click()
    return this.page.locator("mat-option").allInnerTexts()
  }

  // o app lembra o último filtro: a tela abre ora preenchida, ora vazia (sem botão Limpar)
  async limpar() {
    if (await this.regiao.inputValue()) await this.botaoLimpar.click()
    await expect(this.regiao).toHaveValue("")
  }

  get botaoProximaPagina() {
    return this.page.getByRole("button", { name: "Próxima página" })
  }

  async definirItensPorPagina(quantidade: number) {
    await this.selecionarOpcao(this.itensPorPagina, new RegExp(`^\\s*${quantidade}\\s*$`))
    await expect(this.itensPorPagina).toHaveText(String(quantidade))
    // a grid recarrega: espera ela mostrar o que cabe na nova página, e não a lista anterior
    await expect(this.linhas).toHaveCount(Math.min(quantidade, await this.totalDeRegistros()))
  }

  // "1 - 5 de 24" -> 24
  async totalDeRegistros() {
    const texto = await this.paginador.innerText()
    return Number(texto.match(/de (\d+)/)?.[1])
  }

  async textoDasLinhas() {
    return this.linhas.evaluateAll((linhas) => linhas.map((l) => (l.textContent ?? "").replace(/\s+/g, " ").trim()))
  }

  // false quando já está na última página
  async irParaProximaPagina() {
    if (await this.botaoProximaPagina.isDisabled()) return false
    const antes = await this.paginador.innerText()
    await this.botaoProximaPagina.click()
    await expect.poll(() => this.paginador.innerText()).not.toBe(antes)
    return true
  }

  async pesquisar() {
    await this.botaoPesquisar.click()
    await this.linhas.first().waitFor({ state: "visible" })
  }

  async ordenarPor(coluna: Coluna) {
    await this.page.getByRole("button", { name: NOMES_COLUNA[coluna], exact: true }).click()
  }

  async sentidoDaOrdenacao(coluna: Coluna) {
    return this.page.locator("[aria-sort]", { hasText: NOMES_COLUNA[coluna] }).first().getAttribute("aria-sort")
  }

  async abrirMenuDaLinha(indice = 0) {
    await this.linhas.nth(indice).locator("button").last().click()
  }

  async abrir() {
    await this.page.goto(URLS.ltcat)
    // o Novo some sem a permissão Incluir, por isso a espera é pelo título
    await this.titulo.waitFor({ state: "visible" })
  }
}
