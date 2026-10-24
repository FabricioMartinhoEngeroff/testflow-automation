import type { Locator } from "@playwright/test"

type OpcoesClique = Parameters<Locator["click"]>[0]

// cenários de "vários cliques rápidos": o botão pode sumir ou desabilitar depois do 1º clique, por isso a falha é ignorada
export const cliquesRapidos = async (botao: Locator, vezes = 3, opcoes: OpcoesClique = { timeout: 1000 }) => {
  for (let i = 0; i < vezes; i++) await botao.click({ delay: 0, ...opcoes }).catch(() => {})
}

// dblclick() do Playwright dispara os dois cliques quase juntos, mais rápido que uma pessoa.
// Se o botão sumir depois do primeiro (modal fechou), o segundo clique simplesmente não acontece.
export const cliqueDuploHumano = async (botao: Locator) => {
  await botao.click()
  await botao.page().waitForTimeout(200)
  await botao.click({ timeout: 1000 }).catch(() => {})
}
