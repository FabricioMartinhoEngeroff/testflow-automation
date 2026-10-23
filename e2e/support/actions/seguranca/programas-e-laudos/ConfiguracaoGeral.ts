import { expect, type Page } from "@playwright/test"
import type { MenuLateralPage } from "../../MenuLateral"

export type Modo = "Bloquear" | "Sugerir"

// uma linha da coluna LTCAT: valor = texto do select ou "true"/"false" do checkbox; modo = null quando a linha não tem ícones
export type LinhaConfig = { rotulo: string; valor: string; modo: Modo | null }

// tela "Configuração Geral" (Segurança > Programas e Laudos): define os padrões que as abas "Configurações" dos documentos herdam.
// Vale para todos que usam o ambiente: quem mexe aqui precisa devolver os modos originais.
export class ConfiguracaoGeralPage {
  constructor(private readonly page: Page, private readonly menu: MenuLateralPage) {}

  async abrir() {
    await this.menu.abrirModulo("seguranca")
    const item = this.menu.item(/Configuração Geral/).locator("visible=true")
    if (!(await item.isVisible())) await this.menu.grupo("Programas e Laudos").click()
    await item.click()
    await this.page.getByText("Defina as configurações padrão").waitFor()
    await this.linhas.first().waitFor()
    // o botão flutuante de ajuda cobre o ícone da última linha e intercepta o clique
    await this.page.addStyleTag({ content: "apls-menu-ajuda { display: none !important; }" })
  }

  private get linhas() {
    return this.page.locator("tr.mat-row")
  }

  get botaoSalvar() {
    return this.page.getByRole("button", { name: "Salvar", exact: true })
  }

  // Bloquear e Sugerir são exclusivos: o cabeçalho aplica o modo em todas as linhas, o clique na linha só nela
  private botaoDoCabecalho(modo: Modo) {
    return this.page.locator("th.mat-column-ltcat button").nth(modo === "Bloquear" ? 0 : 1)
  }

  private botaoDaLinha(indice: number, modo: Modo) {
    return this.linhas.nth(indice).locator("td.mat-column-ltcat button").nth(modo === "Bloquear" ? 0 : 1)
  }

  async lerLtcat(): Promise<LinhaConfig[]> {
    return this.linhas.evaluateAll((trs) =>
      trs.map((tr) => {
        const celula = tr.querySelector("td.mat-column-ltcat") as HTMLElement
        const ativo = (b?: Element) => !!b && ((b.querySelector("mat-icon") as HTMLElement).getAttribute("style") ?? "").includes("default-primary")
        const [bloquear, sugerir] = [...celula.querySelectorAll("button")]
        const selects = [...celula.querySelectorAll("mat-select .mat-select-value-text")].map((e) => (e as HTMLElement).innerText.trim())
        const checkbox = celula.querySelector("mat-checkbox")
        return {
          rotulo: (tr.querySelector("td.mat-column-configuracao") as HTMLElement).innerText.trim(),
          valor: selects.length ? selects.join(", ") : checkbox ? String(checkbox.classList.contains("mat-checkbox-checked")) : "",
          modo: ativo(bloquear) ? "Bloquear" : ativo(sugerir) ? "Sugerir" : null,
        }
      }),
    )
  }

  async aplicarModoEmTodas(modo: Modo) {
    await this.botaoDoCabecalho(modo).click()
  }

  // devolve cada linha ao modo de antes (o valor dos campos não muda com o modo)
  async restaurar(original: LinhaConfig[]) {
    const atual = await this.lerLtcat()
    for (const [i, linha] of original.entries()) {
      if (linha.modo && atual[i].modo !== linha.modo) await this.botaoDaLinha(i, linha.modo).click()
    }
  }

  async salvar() {
    await this.botaoSalvar.click()
    await expect(this.botaoSalvar).toBeDisabled()
  }
}
