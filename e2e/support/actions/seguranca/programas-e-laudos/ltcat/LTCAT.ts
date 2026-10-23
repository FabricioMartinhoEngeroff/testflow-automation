import { expect, type Locator, type Page } from "@playwright/test"
import { URLS } from "../../../../urls"

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
    // exato: com o menu lateral aberto também existe "Gestão de Ocorrências - Novo"
    return this.page.getByRole("button", { name: "Novo", exact: true })
  }

  // o id #btn-search aparece duplicado no DOM (um fica oculto), por isso o :visible
  get botaoPesquisar() {
    return this.page.locator("#btn-search:visible")
  }

  get botaoLimpar() {
    return this.page.locator("button:visible", { hasText: "clear" })
  }

  // mesmo botão: expand_less recolhe, expand_more expande (conferido em 2026-10-20; a EF fala em
  // keyboard_arrow_up/down); tem cópia oculta no DOM
  get botaoRecolherFiltros() {
    return this.page.locator("button:visible", { hasText: "expand_less" })
  }

  get botaoExpandirFiltros() {
    return this.page.locator("button:visible", { hasText: "expand_more" })
  }

  // limpa os filtros que o app lembrou e garante a Região; funciona tanto se a tela abrir vazia
  // quanto já com a Região preenchida (usuário com permissão numa unidade só)
  async filtrarPorRegiao(regiao: string) {
    if (await this.botaoLimpar.isVisible()) await this.botaoLimpar.click()
    if ((await this.regiao.inputValue()) !== regiao) await this.selecionarOpcao(this.regiao, regiao)
    await expect(this.regiao).toHaveValue(regiao)
  }

  // Região/Unidade/Setor viram multiselect quando o usuário tem mais de uma opção: o painel tem
  // "Todos", o contador "n/total", o X (desmarca tudo) e o ✓ "Confirmar" (leva a seleção pro campo)
  get painelMultiplo() {
    return this.page.locator(".multiple-panel")
  }

  get marcarTodos() {
    return this.painelMultiplo.locator(".apls-checkbox-todos")
  }

  get contadorSelecao() {
    return this.painelMultiplo.locator("mat-label")
  }

  get botaoDesmarcarTodos() {
    return this.painelMultiplo.locator("button", { hasText: /^\s*close\s*$/ })
  }

  // ícone "done" (em 2026-10-21); antes era "check"
  get botaoConfirmarSelecao() {
    return this.painelMultiplo.locator("button", { hasText: /^\s*(check|done)\s*$/ })
  }

  opcao(texto: string | RegExp) {
    return this.page.locator("mat-option", { hasText: texto }).first()
  }

  get primeiraOpcao() {
    return this.page.locator("mat-option").first()
  }

  get opcoesMarcadas() {
    return this.page.locator("mat-option.apls-selected")
  }

  // marca as opções no painel e confirma no ✓
  async marcarEConfirmar(campo: Locator, ...textos: string[]) {
    await campo.click()
    for (const texto of textos) await this.opcao(texto).click()
    await this.botaoConfirmarSelecao.click()
    await expect(this.painelMultiplo).toBeHidden()
  }

  // painel do select Ano: topo com o rótulo "Ano", X (limpa a seleção) e ✓, depois a lista de anos
  get painelAno() {
    return this.page.locator(".mat-select-panel")
  }

  get rotuloPainelAno() {
    return this.painelAno.locator(".top-panel mat-label")
  }

  get botaoLimparAno() {
    return this.painelAno.locator(".top-panel button", { hasText: /^\s*close\s*$/ })
  }

  get botaoConfirmarAno() {
    return this.painelAno.locator(".top-panel button", { hasText: /^\s*check\s*$/ })
  }

  // ano mostrado no select ("" quando nada está selecionado)
  async anoSelecionado() {
    return (await this.ano.innerText()).match(/\d{4}/)?.[0] ?? ""
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

  // nome exato: "Gerar LTCAT" também é trecho de "Gerar LTCAT assinado digitalmente"
  itemDoMenu(nome: string) {
    return this.page.getByRole("menuitem", { name: nome, exact: true })
  }

  // o Ano só lista anos que têm LTCAT; false quando o ano não está entre as opções
  async selecionarAno(ano: number) {
    const opcoes = await this.opcoesDe(this.ano)
    if (!opcoes.some((o) => o.trim() === String(ano))) {
      await this.page.keyboard.press("Escape")
      return false
    }
    await this.page.locator("mat-option", { hasText: new RegExp(`^\\s*${ano}\\s*$`) }).click()
    return true
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

  get botaoPaginaAnterior() {
    return this.page.getByRole("button", { name: "Página anterior" })
  }

  get botaoPrimeiraPagina() {
    return this.page.getByRole("button", { name: "Primeira página" })
  }

  get botaoUltimaPagina() {
    return this.page.getByRole("button", { name: "Última página" })
  }

  // títulos das colunas na ordem da tela (sem a coluna vazia e a do menu)
  async titulosDasColunas() {
    const textos = await this.grade.locator("thead th").allInnerTexts()
    return textos.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean)
  }

  cabecalho(coluna: Coluna) {
    return this.page.locator("[aria-sort]", { hasText: NOMES_COLUNA[coluna] }).first()
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

  async celulasDeTodasAsPaginas(coluna: Coluna) {
    const valores = await this.celulas(coluna)
    while (await this.irParaProximaPagina()) valores.push(...(await this.celulas(coluna)))
    return valores
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

  // o app lembra a última ordenação do usuário: clica até chegar no sentido pedido (ciclo de 3)
  async ordenarAte(coluna: Coluna, sentido: "ascending" | "descending") {
    for (let i = 0; i < 3 && (await this.sentidoDaOrdenacao(coluna)) !== sentido; i++) {
      const antes = await this.sentidoDaOrdenacao(coluna)
      await this.ordenarPor(coluna)
      await expect.poll(() => this.sentidoDaOrdenacao(coluna)).not.toBe(antes)
    }
    await expect.poll(() => this.sentidoDaOrdenacao(coluna)).toBe(sentido)
  }

  async abrirMenuDaLinha(indice = 0) {
    await this.linhas.nth(indice).locator("button").last().click()
  }

  urlAtual() {
    return this.page.url()
  }

  async abrir() {
    await this.page.goto(URLS.ltcat)
    // o Novo some sem a permissão Incluir, por isso a espera é pelo título
    await this.titulo.waitFor({ state: "visible" })
  }
}
