import { expect, type Page } from "@playwright/test"
import type { MenuLateral } from "../../../MenuLateral"

export type ExibicaoAtividadesRiscos = "Visível" | "Oculta"

// tela "Cadastro de Configuração" (Segurança > GRO > Configurações > Configurações - GHE), aba "Gerais".
// Valem para todo o ambiente: quem mexe aqui precisa devolver o valor original.
export class ConfigGheAbaGeraisPage {
  constructor(private readonly page: Page, private readonly menu: MenuLateral) {}

  async abrir() {
    await this.menu.abrirModulo("seguranca")
    const item = this.menu.item(/Configurações - GHE/).locator("visible=true")
    if (!(await item.isVisible())) {
      const configuracoes = this.menu.grupo("Configurações")
      if (!(await configuracoes.isVisible())) await this.menu.grupo("GRO - Gerenciamento de Riscos Ocupacionais").click()
      await configuracoes.click()
    }
    await item.click()
    // vindo de um cadastro com alterações (ex.: LTCAT novo), o Apollus pergunta antes de sair
    const sair = this.page.getByRole("button", { name: "Sair sem salvar" })
    await this.abaGerais.or(sair).first().waitFor()
    if (await sair.isVisible()) await sair.click()
    // a tela abre na aba EPC/EPI, que também tem um radio Visível/Oculta (o do "Enviar eSocial" dos EPIs)
    await this.abaGerais.click()
    await this.exibicao("Visível").waitFor()
  }

  get abaGerais() {
    return this.page.getByRole("tab", { name: "Gerais", exact: true })
  }

  // "Por padrão, a aba 'Atividades x Fatores de risco' deverá estar:"
  exibicao(valor: ExibicaoAtividadesRiscos) {
    return this.page.locator('mat-radio-group[formcontrolname="exibicaoAtividadesRiscos"]').locator("mat-radio-button", { hasText: valor })
  }

  async lerExibicao(): Promise<ExibicaoAtividadesRiscos> {
    return (await this.exibicao("Oculta").locator("input").isChecked()) ? "Oculta" : "Visível"
  }

  async definirExibicao(valor: ExibicaoAtividadesRiscos) {
    if ((await this.lerExibicao()) !== valor) await this.exibicao(valor).locator("label").click()
  }

  get botaoSalvar() {
    return this.page.getByRole("button", { name: "Salvar", exact: true })
  }

  async salvar() {
    await this.botaoSalvar.click()
    await expect(this.page.locator("apls-toast").first()).toBeVisible()
  }
}
