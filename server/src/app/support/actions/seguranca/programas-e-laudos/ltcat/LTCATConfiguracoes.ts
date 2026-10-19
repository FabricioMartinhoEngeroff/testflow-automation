import type { Page } from "@playwright/test"
import { matCheckbox, matRadio } from "../../../material"

export type OrdenacaoGhes =
  | "Código do GHE"
  | "Código da área a que pertence"
  | "Descrição do GHE"
  | "Descrição da área a que pertence"

export type OpcaoConfiguracoes =
  | "Cargo"
  | "GHE"
  | "Incluir fotos dos GHEs"
  | "Incluir GHEs sem integrantes"
  | "Incluir GHEs sem riscos"
  | "Mecânico/Acidente"
  | "Ergonômico/Psicossocial"
  | "Incluir código eSocial"
  | "Incluir CAS number"
  | "Incluir riscos associados às atividades do GHE"
  | "Incluir somente riscos com possível enquadramento previdenciário"
  | "Incluir tipo de avaliação"
  | "Incluir registro de medições"
  | "Incluir equipamentos de medição"
  | "Incluir certificado de calibração dos equipamentos de medição"
  | "Incluir técnica de medição"
  | "Incluir dados quantitativos de critério técnico"
  | "Considerar frequência para conclusão (habitual / eventual)"
  | "Incluir fichas de campo"
  | "Incluir laudo da amostra"
  | "Sinalizar EPIs com CA vencido"
  | "EPIs"
  | "EPCs"

export type FatorTroca = "q3" | "q5"

// aba "Configurações" do cadastro de LTCAT
export class LtcatConfiguracoesPage {
  constructor(private readonly page: Page) {}

  opcao(texto: OpcaoConfiguracoes) {
    return matCheckbox(this.page, texto)
  }

  // Descoberta: vários checkboxes ocupam a linha toda (col-12) e o clique no centro
  // do componente cai fora do rótulo e não marca. Clicar na caixinha sempre marca.
  async marcar(texto: OpcaoConfiguracoes) {
    await this.opcao(texto).locator(".mat-checkbox-inner-container").click()
    await this.recusarAtualizarTotalSeAparecer()
  }

  // Descoberta: algumas opções (ex.: "Incluir GHEs sem integrantes") abrem o aviso
  // "Deseja atualizar a informação de \"Total de expostos\"?" e bloqueiam a tela.
  async recusarAtualizarTotalSeAparecer() {
    const aviso = this.page.getByRole("dialog").filter({ hasText: /Deseja atualizar a informação/ })
    try {
      await aviso.waitFor({ state: "visible", timeout: 1500 })
      await aviso.getByRole("button", { name: "Não" }).click()
      await aviso.waitFor({ state: "hidden" })
    } catch {
      // sem aviso: segue
    }
  }

  ordenacao(texto: OrdenacaoGhes) {
    return matRadio(this.page, texto)
  }

  fatorDeTroca(fator: FatorTroca) {
    return matRadio(this.page, fator)
  }

  get descritivoGhesSemRiscos() {
    // o nome acessível some quando o campo habilita; o formcontrolname é estável
    return this.page.locator('apls-input[formcontrolname="incluirGhesSemRiscosDescritivo"] textarea')
  }

  get botaoRestaurarTextoPadrao() {
    return this.page.getByRole("button", { name: "Restaurar texto padrão" })
  }

  // Descoberta (2026-10-13): num cadastro novo nem Cargo nem GHE vêm marcados
  // e o fator de troca não vem escolhido. Sem os dois o Salvar é barrado com
  // "ao menos uma opção de descrição das atividades" / "campos obrigatórios".
  // O fator NÃO tem * na tela.
  async preencherObrigatorios(fator: FatorTroca = "q5") {
    await this.opcao("GHE").click()
    await this.fatorDeTroca(fator).click()
  }
}
