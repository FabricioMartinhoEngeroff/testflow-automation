import { expect, type Page } from "@playwright/test"
import { URLS } from "../../../../urls"

export type DocumentoAplicavel = "Análise Ergonômica" | "PCMSO" | "PGR" | "LTCAT"

export type DadosModelo = {
  codigo: string
  descricao: string
  aplicaA: DocumentoAplicavel[]
  // regiões da aba Abrangência; sem nenhuma o sistema não salva ("Modelo corporativo" vem desabilitado)
  regioes: (string | RegExp)[]
}

// Cadastros Auxiliares > Gerais > Modelos de Documento (lista e cadastro)
export class ModeloDocumentoPage {
  constructor(private readonly page: Page) {}

  // lista
  get descricaoPesquisa() {
    return this.page.getByRole("textbox", { name: "Descrição" })
  }

  // botão só com o ícone "search", sem nome acessível
  get botaoPesquisar() {
    return this.page.locator("button", { hasText: /^\s*search\s*$/ }).first()
  }

  get linhas() {
    return this.page.locator("tbody tr")
  }

  linha(codigo: string) {
    return this.linhas.filter({ hasText: codigo })
  }

  // a lista abre com o filtro salvo do usuário; pesquisar pela descrição troca esse filtro
  async pesquisar(descricao: string) {
    await this.page.goto(URLS.modeloDocumento)
    await this.descricaoPesquisa.fill(descricao)
    await this.botaoPesquisar.click()
  }

  // logo após pesquisar a lista ainda re-renderiza e fecha o menu recém-aberto: tenta de novo
  async acaoDaLinha(codigo: string, acao: "Revisor" | "Visualizar" | "Excluir") {
    const item = this.page.locator(".mat-menu-panel").getByRole("menuitem", { name: acao })
    await expect(async () => {
      if (!(await item.isVisible())) await this.linha(codigo).getByRole("button").last().click()
      await expect(item).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 20000 })
    await item.click()
  }

  // só funciona para modelo sem vínculo; um modelo já usado responde "possui vínculo com outros
  // cadastros do sistema e não pode ser excluído" — aí o jeito de tirar do catálogo é inativar
  async excluir(codigo: string, descricao: string) {
    await this.pesquisar(descricao)
    await this.linha(codigo).waitFor()
    await this.acaoDaLinha(codigo, "Excluir")
    await this.page.locator("apls-popup").getByRole("button", { name: "Excluir" }).click()
  }

  // o status é um select só com bolinhas (verde/vermelha): 1ª opção Ativo, 2ª Inativo
  async inativar(codigo: string, descricao: string) {
    await this.pesquisar(descricao)
    await this.linha(codigo).waitFor()
    await this.acaoDaLinha(codigo, "Visualizar")
    await this.codigo.waitFor()
    await this.page.locator("apls-status-field mat-select").click()
    await this.page.locator("mat-option").nth(1).click()
    await this.botaoSalvar.click()
    await this.mensagemSalvoComSucesso.waitFor()
  }

  // cadastro
  get codigo() {
    return this.page.getByRole("textbox", { name: "Código" })
  }

  get descricao() {
    return this.page.getByRole("textbox", { name: "Descrição" })
  }

  aplicaA(documento: DocumentoAplicavel) {
    return this.page.locator("mat-checkbox", { hasText: new RegExp(`^\\s*${documento}\\s*$`) })
  }

  get modal() {
    return this.page.locator("mat-dialog-container")
  }

  get botaoSalvar() {
    return this.page.locator(".apls-form-footer").getByRole("button", { name: "Salvar", exact: true })
  }

  get mensagemSalvoComSucesso() {
    return this.page.getByText("Registro salvo com sucesso")
  }

  // aba Estrutura: inclui o primeiro texto padrão do catálogo (o laudo precisa de algum texto)
  async adicionarTextoPadrao() {
    await this.page.getByRole("tab", { name: "Estrutura" }).click()
    await this.page.getByRole("tabpanel", { name: "Estrutura" }).getByRole("button", { name: /Adicionar/ }).click()
    await this.modal.locator("apls-select[formcontrolname=idioma] mat-select").click()
    await this.page.locator("mat-option").first().click()
    await this.modal.getByRole("combobox", { name: /Texto padrão/ }).click()
    await this.page.getByRole("option").first().click()
    // multiselect: o painel fica aberto por cima do Salvar da modal
    await this.page.keyboard.press("Escape")
    await this.modal.getByRole("button", { name: "Salvar", exact: true }).click()
  }

  async adicionarAbrangencia(regiao: string | RegExp) {
    await this.page.getByRole("tab", { name: "Abrangência" }).click()
    await this.page.getByRole("tabpanel", { name: "Abrangência" }).getByRole("button", { name: /Adicionar/ }).click()
    await this.modal.getByRole("combobox").first().click()
    await this.page.getByRole("option", { name: regiao }).first().click()
    await this.page.keyboard.press("Escape")
    await this.modal.getByRole("button", { name: "Salvar", exact: true }).click()
  }

  // cria um modelo ativo; quem chama é responsável por inativar depois (ambiente compartilhado)
  async criar(dados: DadosModelo) {
    await this.page.goto(URLS.modeloDocumentoCadastro)
    await this.codigo.fill(dados.codigo)
    await this.descricao.fill(dados.descricao)
    for (const documento of dados.aplicaA) await this.aplicaA(documento).locator("label").click()
    await this.adicionarTextoPadrao()
    for (const regiao of dados.regioes) await this.adicionarAbrangencia(regiao)
    await this.botaoSalvar.click()
    await this.mensagemSalvoComSucesso.waitFor()
  }
}
