import type { Page } from "@playwright/test"

// modal "Histórico de revisões" (botão "Revisões" do cabeçalho do cadastro)
export class LtcatHistoricoRevisoesModal {
  constructor(private readonly page: Page) {}

  private get modal() {
    return this.page.getByRole("dialog")
  }

  get botaoRevisoes() {
    return this.page.getByRole("button", { name: /Revisões/ })
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Histórico de revisões" })
  }

  get orientacao() {
    return this.modal.getByText("Utilize estes campos para gerenciar e guardar as versões deste documento.")
  }

  get versao() {
    return this.modal.getByRole("textbox", { name: "Versão", exact: true })
  }

  get responsavelTecnico() {
    return this.modal.getByRole("combobox", { name: "Responsável técnico *" })
  }

  get dataRevisao() {
    return this.modal.getByRole("textbox", { name: "Data da revisão" })
  }

  get dataBase() {
    return this.modal.getByRole("textbox", { name: "Data base" })
  }

  get motivo() {
    return this.modal.getByRole("textbox", { name: "Motivo da revisão" })
  }

  get areaDeArquivo() {
    return this.modal.getByText("Arraste e solte o arquivo aqui ou clique para pesquisar")
  }

  get tabela() {
    return this.modal.getByRole("table")
  }

  get linhas() {
    return this.tabela.locator("tbody tr")
  }

  get semRegistros() {
    return this.modal.getByText("Sem registros para listar.")
  }

  // botão verde "+" ao lado da área de arquivo: joga a versão preenchida na tabela
  get botaoIncluirNaTabela() {
    return this.modal.locator("button").filter({ hasText: /^\s*add\s*$/ }).first()
  }

  // Descoberta: estes campos de data têm máscara; fill("01/01/2020") vira "01/12/0206".
  // Digitar só os dígitos funciona.
  async digitarData(campo: ReturnType<Page["getByRole"]>, ddmmaaaa: string) {
    await campo.click()
    await campo.pressSequentially(ddmmaaaa.replace(/\D/g, ""))
  }

  get botaoFechar() {
    return this.modal.getByRole("button", { name: "Fechar" })
  }

  get botaoSalvar() {
    return this.modal.getByRole("button", { name: "Salvar", exact: true })
  }

  async abrir() {
    await this.botaoRevisoes.click()
    await this.titulo.waitFor({ state: "visible" })
  }
}
