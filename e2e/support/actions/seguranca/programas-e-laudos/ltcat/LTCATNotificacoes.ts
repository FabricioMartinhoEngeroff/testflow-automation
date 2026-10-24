import type { Page } from "@playwright/test"

export type DiasAntes = "15" | "30" | "60" | "90" | "120" | "150" | "180"
export const DIAS_ANTES: DiasAntes[] = ["15", "30", "60", "90", "120", "150", "180"]

// modal "Notificações" (botão "Notificações" do cabeçalho do cadastro)
export class LtcatNotificacoesModal {
  constructor(private readonly page: Page) {}

  private get modal() {
    return this.page.getByRole("dialog")
  }

  get botaoNotificacoes() {
    return this.page.getByRole("button", { name: /Notificações/ })
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Notificações" })
  }

  diasAntes(dias: DiasAntes) {
    return this.modal.getByRole("checkbox", { name: `${dias} dias` })
  }

  private rotuloDiasAntes(dias: DiasAntes) {
    return this.modal.getByText(`${dias} dias`, { exact: true })
  }

  get avisoSemOpcao() {
    return this.modal.getByText(/Caso nenhuma opção seja selecionada, não haverá notificação por e-mail/)
  }

  get dataSeguinte() {
    return this.modal.getByRole("radio", { name: "A seguinte data:" })
  }

  get dataFimVigencia() {
    return this.modal.getByRole("radio", { name: "A data fim da vigência do laudo" })
  }

  // só existe com "A seguinte data:" marcada
  get dataEspecifica() {
    return this.modal.locator("input[formcontrolname=dataVencimentoConsiderar]")
  }

  // multisseleção: a lista fica aberta entre as escolhas e o campo só mostra os grupos ("A, B") depois de fechada
  get gruposDeEmail() {
    return this.modal.getByRole("combobox", { name: "Grupos de e-mail *" })
  }

  get opcoesGrupos() {
    return this.page.getByRole("option")
  }

  get botaoFechar() {
    return this.modal.getByRole("button", { name: "Fechar" })
  }

  get botaoSalvar() {
    return this.modal.getByRole("button", { name: "Salvar", exact: true })
  }

  // Fechar com alteração: abre num overlay próprio, fora do role=dialog da modal
  get confirmacaoSaida() {
    return this.page.locator("apls-popup").filter({ hasText: "Deseja salvá-las antes de sair?" })
  }

  botaoConfirmacaoSaida(nome: "Sair sem salvar" | "Salvar e sair") {
    return this.confirmacaoSaida.getByRole("button", { name: nome, exact: true })
  }

  // o título aparece antes do conteúdo: espera os checkboxes carregarem
  async abrir() {
    await this.botaoNotificacoes.click()
    await this.rotuloDiasAntes("15").waitFor({ state: "visible" })
  }

  // o checkbox real fica escondido atrás do componente, então o clique vai no rótulo
  async marcarDiasAntes(dias: DiasAntes) {
    await this.rotuloDiasAntes(dias).click()
  }

  async desmarcarDiasAntes(dias: DiasAntes) {
    await this.rotuloDiasAntes(dias).click()
  }

  async escolherGrupos(...grupos: string[]) {
    await this.gruposDeEmail.click()
    for (const grupo of grupos) await this.opcoesGrupos.filter({ hasText: grupo }).click()
    await this.page.keyboard.press("Escape")
  }

  // o campo tem máscara: digita só os números, como na modal de Revisões
  async digitarData(ddmmaaaa: string) {
    await this.dataEspecifica.click()
    await this.dataEspecifica.press("Control+A")
    await this.dataEspecifica.press("Backspace")
    await this.dataEspecifica.pressSequentially(ddmmaaaa.replace(/\D/g, ""))
    await this.dataEspecifica.press("Tab")
  }
}
