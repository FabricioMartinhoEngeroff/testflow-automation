import { expect, type Page } from "@playwright/test"
import type { MenuLateral } from "../../../MenuLateral"
import { matRadio } from "../../../material"

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
    await this.exibicao("Visível").waitFor()
  }

  // "Por padrão, a aba 'Atividades x Fatores de risco' deverá estar:"
  exibicao(valor: ExibicaoAtividadesRiscos) {
    return matRadio(this.page, valor)
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
