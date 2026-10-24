// fluxos compartilhados pela aba Colaboradores do LTCAT (carga, inclusão, exclusão)
import type { Locator, Page } from "@playwright/test"
import { expect } from "@playwright/test"
import type { LtcatColaboradoresPage } from "./LTCATColaboradores"
import type { LtcatColaboradorModal } from "./LTCATColaboradorModal"

export const MSG_COLABORADORES = {
  obrigatorios: "Existem um ou mais campos obrigatórios que não foram preenchidos.",
  incluido: /Registro incluído com sucesso|Operação realizada com sucesso/,
  // visto no sistema: "Registro excluído com sucesso. Para que a alteração seja permanentemente salva, clique no botão “Salvar”."
  excluido: /Registro excluído com sucesso/,
}

export const avisoColaboradores = (page: Page, texto: string | RegExp) =>
  expect(page.locator("apls-toast").filter({ hasText: texto }).first()).toBeVisible()

// massa variada: acentos, especiais, maiúsculas/minúsculas, espaços e 60 caracteres
const BASE: [string, string][] = [
  ["Ana Beatriz Conceição", "Engenheira de Segurança"],
  ["José António da Silva", "Médico do Trabalho"],
  ["D'Ávila & Cia. Ltda.", "Coord. de Segurança #1"],
  ["Ana-Paula O'Brien", "Técnica (Nível Sênior)"],
  ["MaRiA dA sILVA cOSTA", "tÉcNiCo dE sEgUrAnÇa"],
  ["JOAO PEDRO SANTOS", "COORDENADOR GERAL SSO"],
  ["Nome  Com  Dois  Espaços", "Cargo  Com  Espaços"],
  ["Percentual 100% Silva", "Meta 99,9% Segurança"],
  ["Ítalo Ênio Ômar Ûmberto", "Àrea Ñivel Ämbiente"],
  ["A".repeat(60), "B".repeat(60)],
]

export const colaboradoresDeCarga = (qtd = 50, prefixo = "Carga") =>
  Array.from({ length: qtd }, (_, i) => {
    const [nome, cargo] = BASE[i % BASE.length]
    const n = String(i + 1).padStart(3, "0")
    // o número na frente deixa cada linha única sem passar dos 60 caracteres
    return { nome: `${prefixo} ${n} ${nome}`.slice(0, 60), cargo: `${n} ${cargo}`.slice(0, 60) }
  })

// "Salvar e adicionar outro" mantém a modal aberta e limpa os campos
export const incluirColaboradoresEmLote = async (
  a: LtcatColaboradoresPage,
  m: LtcatColaboradorModal,
  lista: { nome: string; cargo: string }[],
) => {
  const antes = await a.linhasColaborador.count()
  await a.abrirModalAdicionar()
  for (const [i, { nome, cargo }] of lista.entries()) {
    await expect(m.colaborador).toHaveValue("") // formulário limpo da volta anterior
    await m.preencher(nome, cargo)
    // logo após um salvamento o próximo clique às vezes não salva: repete até a linha entrar no grid
    await expect(async () => {
      await m.botaoSalvarEAdicionarOutro.click()
      await expect(a.linhasColaborador).toHaveCount(antes + i + 1, { timeout: 2000 })
    }).toPass({ timeout: 20000, intervals: [0] })
  }
  await m.botaoFechar.click()
  await expect(m.titulo).toHaveCount(0)
}

// dois cliques no mesmo ponto da tela com um intervalo humano (o dblclick do Playwright não tem intervalo).
// Usa o mouse e não o locator: se o 1º clique fechar a modal, o 2º cai no que estiver embaixo, como na vida real.
export const INTERVALO_CLIQUE_MS = Number(process.env.INTERVALO_CLIQUE_MS ?? 150)
export const cliqueRapidoDuplo = async (page: Page, alvo: Locator, intervaloMs = INTERVALO_CLIQUE_MS) => {
  // espera o alvo parar de se mexer (a troca de aba desliza o conteúdo) sem clicar de verdade
  await alvo.click({ trial: true })
  const caixa = (await alvo.boundingBox())!
  const x = caixa.x + caixa.width / 2
  const y = caixa.y + caixa.height / 2
  await page.mouse.click(x, y)
  await page.waitForTimeout(intervaloMs)
  await page.mouse.click(x, y)
}

// o clique no ícone às vezes só dispara o tooltip; repete até a modal abrir
export const abrirEdicaoColaborador = async (a: LtcatColaboradoresPage, m: LtcatColaboradorModal, linha = 0) => {
  await expect(async () => {
    await a.botaoEditar(linha).click()
    await expect(m.colaborador).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 20000 })
}

// a confirmação não tem role=dialog: localiza pelo texto
export const popupExclusao = (page: Page) =>
  page.locator(".cdk-overlay-pane").filter({ hasText: "Deseja realmente excluir este item?" })

// cor de destaque do tema do usuário logado (verde no escuro, vermelho no padrão), em rgb()
export const corDestaque = (page: Page) =>
  page.evaluate(() => {
    const el = document.createElement("div")
    el.style.color = getComputedStyle(document.documentElement).getPropertyValue("--apls-default-primary-color").trim()
    document.body.appendChild(el)
    const rgb = getComputedStyle(el).color
    el.remove()
    return rgb
  })

export const corDeFundo = (l: Locator) => l.evaluate((e) => getComputedStyle(e).backgroundColor)

// com o mouse em cima ou em foco, o botão fica com 80% de opacidade na mesma cor: compara só o RGB
export const semAlfa = (cor: string) => cor.replace(/^rgba?\((\d+),\s*(\d+),\s*(\d+).*$/, "rgb($1, $2, $3)")
export const corDoTexto = (l: Locator) => l.evaluate((e) => getComputedStyle(e).color)

export const excluirColaborador = async (page: Page, a: LtcatColaboradoresPage, linha = 0) => {
  // depois de salvar o grid recarrega: contar antes disso dá 0 e o clique pode cair numa lista que vai ser redesenhada
  await expect(a.linhasColaborador.first()).toBeVisible()
  const antes = await a.linhasColaborador.count()
  await a.botaoExcluir(linha).click()
  const popup = popupExclusao(page)
  await popup.getByRole("button", { name: "Excluir" }).click()
  await expect(popup).toHaveCount(0)
  await expect(a.linhasColaborador).toHaveCount(antes - 1)
}

// fechar a modal com dados preenchidos pede "Atenção"
export const fecharSemSalvar = async (page: Page, m: LtcatColaboradorModal) => {
  await m.botaoFechar.click()
  const sair = page.getByRole("button", { name: /Sair sem salvar/ })
  if (await sair.waitFor({ timeout: 2000 }).then(() => true, () => false)) await sair.click()
  await expect(m.titulo).toHaveCount(0)
}

export const incluirColaborador = async (a: LtcatColaboradoresPage, m: LtcatColaboradorModal, nome: string, cargo: string) => {
  const antes = await a.linhasColaborador.count()
  await a.abrirModalAdicionar()
  await m.preencher(nome, cargo)
  await m.botaoSalvar.click()
  await expect(m.titulo).toHaveCount(0)
  await expect(a.linhasColaborador).toHaveCount(antes + 1)
}
