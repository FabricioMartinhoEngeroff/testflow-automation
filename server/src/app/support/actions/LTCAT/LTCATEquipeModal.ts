import type { Page } from "@playwright/test"

// modal "Adicionar equipe" (botão Adicionar da seção Equipe, aba Referências)
export class LtcatEquipeModal {
  constructor(private readonly page: Page) {}

  get modal() {
    return this.page.getByRole("dialog").filter({ hasText: "Adicionar equipe" })
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Adicionar equipe" })
  }

  get campoMembros() {
    return this.modal.locator("apls-autocomplete[formcontrolname=membros] mat-form-field")
  }

  get membros() {
    return this.modal.getByRole("combobox", { name: "Membro da equipe *" })
  }

  get opcoes() {
    return this.page.getByRole("option")
  }

  // "Todos" e o contador "n/total" ficam no topo do painel do multiselect
  get marcarTodos() {
    return this.page.locator(".multiple-panel .apls-checkbox-todos")
  }

  get contador() {
    return this.page.locator(".multiple-panel mat-label")
  }

  get botaoFecharX() {
    return this.modal.locator(".apls-modal-close-button")
  }

  get botaoFechar() {
    return this.modal.getByRole("button", { name: "Fechar" })
  }

  get botaoSalvarEAdicionarOutro() {
    return this.modal.getByRole("button", { name: "Salvar e adicionar outro" })
  }

  get botaoSalvar() {
    return this.modal.getByRole("button", { name: "Salvar", exact: true })
  }

  // o botão tem aplspreventdoubleclick: um segundo "Salvar e adicionar outro" ~1s depois do
  // anterior é descartado sem aviso. A pausa simula o tempo de uma pessoa entre inclusões.
  async salvarEAdicionarOutro() {
    await this.botaoSalvarEAdicionarOutro.click()
    await this.page.waitForTimeout(1500)
  }

  async pesquisar(termo: string) {
    await this.membros.click()
    await this.membros.fill("")
    await this.membros.pressSequentially(termo)
  }

  // multiselect: o painel continua aberto depois de cada clique, por isso o Escape no fim
  async selecionar(...trechos: string[]) {
    for (const trecho of trechos) {
      await this.pesquisar(trecho)
      await this.opcoes.filter({ hasText: trecho }).first().click()
    }
    await this.page.keyboard.press("Escape")
  }
}
