import type { Locator, Page } from "@playwright/test"

const escapar = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")

// o <input> real do mat-checkbox/mat-radio fica escondido atrás da camada
// visual, então o clique e as asserções vão no componente. Alguns labels
// terminam com o ícone "help_outline", por isso ele é aceito no fim do texto.
function porTexto(page: Page, seletor: string, texto: string): Locator {
  return page.locator(seletor, { hasText: new RegExp(`^\\s*${escapar(texto)}\\s*(help_outline)?\\s*$`, "i") })
}

export const matCheckbox = (page: Page, texto: string) => porTexto(page, "mat-checkbox", texto)
export const matRadio = (page: Page, texto: string) => porTexto(page, "mat-radio-button", texto)

// o texto do mat-tooltip fica num elemento à parte, ligado ao gatilho pelo aria-describedby
export const tooltipDe = async (gatilho: Locator) => gatilho.page().locator(`#${await gatilho.getAttribute("aria-describedby")}`)
