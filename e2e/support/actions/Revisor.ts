import { expect, type Locator, type Page } from "@playwright/test"
import type { CodigoIdioma, IdiomaPage } from "./Idioma"

// Revisor global (EF "Revisor"): serve a qualquer tela com auditoria.
//  - tooltip do ícone "i" da linha do grid / tela de pesquisa
//  - aba retrátil "Informações" (ícone "i" no canto superior direito do cadastro SALVO), com blocos
//    Criação / Revisão (e Registro / Cancelamento nos registros que têm esses dados)
// Vale nos 3 idiomas da conta (pt, en, es): rótulos traduzidos e data no padrão do idioma
// (pt/es dd/mm/aaaa; en mm/dd/aaaa), sempre seguida de ", hh:mm:ss".

export type CampoRevisor =
  | "criadoPor"
  | "dataCriacao"
  | "revisadoPor"
  | "dataRevisao"
  | "registradoPor"
  | "numeroRegistro"
  | "canceladoPor"
  | "dataCancelamento"
  | "justificativa"
export type SecaoRevisor = "criacao" | "revisao" | "registro" | "cancelamento"
export type CamposRevisor = Partial<Record<CampoRevisor, string>>

type TextosIdioma = {
  tituloDrawer: string
  secoes: Record<SecaoRevisor, string>
  rotulos: Partial<Record<CampoRevisor, string>>
}

// Só entram rótulos já vistos na tela. Registro/Cancelamento só estão confirmados em pt
// (acrescentar en/es quando aparecerem num registro que tenha esses blocos).
export const TEXTOS: Record<CodigoIdioma, TextosIdioma> = {
  pt: {
    tituloDrawer: "Informações",
    secoes: { criacao: "Criação", revisao: "Revisão", registro: "Registro", cancelamento: "Cancelamento" },
    rotulos: {
      criadoPor: "Criado por",
      dataCriacao: "Data da criação",
      revisadoPor: "Revisado por",
      dataRevisao: "Data da revisão",
      registradoPor: "Registrado por",
      numeroRegistro: "Número do registro",
      canceladoPor: "Cancelado por",
      dataCancelamento: "Data de cancelamento",
      justificativa: "Justificativa",
    },
  },
  en: {
    // plural paralelo ao pt/es, decisão do time: manter
    tituloDrawer: "Informations",
    secoes: { criacao: "Creation", revisao: "Revision", registro: "Registration", cancelamento: "Cancellation" },
    rotulos: {
      criadoPor: "Created by",
      dataCriacao: "Creation date",
      revisadoPor: "Reviewed by",
      dataRevisao: "Revision date",
    },
  },
  es: {
    // grafia assim em todas as telas (decisão do time: manter). Se corrigirem para "Informaciones", trocar aqui.
    tituloDrawer: "Informaciónes",
    secoes: { criacao: "Creación", revisao: "Revisión", registro: "Registro", cancelamento: "Cancelación" },
    rotulos: {
      criadoPor: "Creado por",
      dataCriacao: "Fecha de creación",
      revisadoPor: "Revisado por",
      dataRevisao: "Fecha de revisión",
    },
  },
}

export const IDIOMAS: CodigoIdioma[] = ["pt", "en", "es"]

const DIA = String.raw`(0[1-9]|[12]\d|3[01])`
const MES = String.raw`(0[1-9]|1[0-2])`
const HORA = String.raw`([01]\d|2[0-3]):[0-5]\d:[0-5]\d`

// dd/mm/aaaa, hh:mm:ss em pt e es; mm/dd/aaaa, hh:mm:ss em en (a EF escreve "hh/mm/ss", a tela usa dois-pontos)
export const DATA_HORA: Record<CodigoIdioma, RegExp> = {
  pt: new RegExp(`^${DIA}/${MES}/\\d{4}, ${HORA}$`),
  es: new RegExp(`^${DIA}/${MES}/\\d{4}, ${HORA}$`),
  en: new RegExp(`^${MES}/${DIA}/\\d{4}, ${HORA}$`),
}
// "<matrícula> - <nome>"; sem matrícula só o nome
export const USUARIO = /^\S.*$/
export const SEM_DADO = "-"

// rótulo (em qualquer idioma) -> campo
const CAMPO_DO_ROTULO = new Map<string, CampoRevisor>()
for (const { rotulos } of Object.values(TEXTOS)) {
  for (const [campo, rotulo] of Object.entries(rotulos)) CAMPO_DO_ROTULO.set(rotulo, campo as CampoRevisor)
}
const REGEX_ROTULO = new RegExp(
  `(${[...CAMPO_DO_ROTULO.keys()].sort((a, b) => b.length - a.length).join("|")}):`,
  "g",
)

// transforma o texto do tooltip ou de um bloco do drawer em { campo: valor }.
// No tooltip rótulo e valor ficam na mesma linha, no drawer em linhas diferentes: por isso normaliza os espaços.
export function lerCampos(texto: string): CamposRevisor {
  const plano = texto.replace(/\s+/g, " ").trim()
  const achados = [...plano.matchAll(REGEX_ROTULO)]
  const campos: CamposRevisor = {}
  achados.forEach((m, i) => {
    const fim = achados[i + 1]?.index ?? plano.length
    campos[CAMPO_DO_ROTULO.get(m[1])!] = plano.slice(m.index + m[0].length, fim).trim()
  })
  return campos
}

// data do revisor como Date (horário da máquina), respeitando a ordem dia/mês do idioma; null se não casar
export function lerData(texto: string, idioma: CodigoIdioma): Date | null {
  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})$/)
  if (!m || !DATA_HORA[idioma].test(texto)) return null
  const [, a, b, ano, h, min, s] = m.map(Number)
  const [dia, mes] = idioma === "en" ? [b, a] : [a, b]
  return new Date(ano, mes - 1, dia, h, min, s)
}

// Pelo formato sozinho "05/06/2026" passa em qualquer idioma: este confere o INSTANTE (ex.: logo depois de salvar).
export function esperarDataRecente(texto: string | undefined, idioma: CodigoIdioma, minutos = 5) {
  const data = lerData(texto ?? "", idioma)
  expect(data, `data "${texto}" no padrão de ${idioma}`).not.toBeNull()
  const dif = Date.now() - data!.getTime()
  expect(dif, `"${texto}" deveria ser de agora (${idioma})`).toBeGreaterThan(-60_000)
  expect(dif, `"${texto}" deveria ser de agora (${idioma})`).toBeLessThan(minutos * 60_000)
}

// os rótulos do texto estão todos no idioma da conta (e nenhum de outro idioma)
export function esperarRotulos(texto: string, idioma: CodigoIdioma, campos: CampoRevisor[]) {
  const proprios = TEXTOS[idioma].rotulos
  for (const campo of campos) expect(texto, `rótulo de ${campo} em ${idioma}`).toContain(`${proprios[campo]}:`)
  const alheios = IDIOMAS.filter((i) => i !== idioma).flatMap((i) => Object.values(TEXTOS[i].rotulos))
  for (const rotulo of alheios) {
    if (Object.values(proprios).includes(rotulo)) continue // "Revisado por" é igual em pt e es
    expect(texto, `rótulo "${rotulo}" de outro idioma em ${idioma}`).not.toContain(`${rotulo}:`)
  }
}

// Regra de criação: usuário e data sempre preenchidos num cadastro salvo pela tela.
export function esperarCriacao(campos: CamposRevisor, idioma: CodigoIdioma = "pt") {
  expect(campos.criadoPor, "Criado por").toMatch(USUARIO)
  expect(campos.criadoPor).not.toBe(SEM_DADO)
  expect(campos.dataCriacao, "Data da criação").toMatch(DATA_HORA[idioma])
}

// Regra de revisão: registro só criado mostra "-" nos dois campos; depois de editado, usuário e data.
export function esperarRevisao(campos: CamposRevisor, { editado, idioma = "pt" }: { editado: boolean; idioma?: CodigoIdioma }) {
  if (!editado) {
    expect(campos.revisadoPor, "Revisado por").toBe(SEM_DADO)
    expect(campos.dataRevisao, "Data da revisão").toBe(SEM_DADO)
    return
  }
  expect(campos.revisadoPor, "Revisado por").toMatch(USUARIO)
  expect(campos.revisadoPor).not.toBe(SEM_DADO)
  expect(campos.dataRevisao, "Data da revisão").toMatch(DATA_HORA[idioma])
}

export class RevisorPage {
  // idioma da conta no momento; `emCadaIdioma` mantém sincronizado, ou ajuste à mão depois de `idioma.trocar`
  idioma: CodigoIdioma = "pt"

  constructor(private readonly page: Page) {}

  // Roda `verificar` em pt, en e es (troca o idioma da conta e recarrega a página a cada um; pt por último).
  // `verificar` deve reabrir a tela que quer conferir. A fixture `idioma` devolve a conta para pt no fim do teste.
  async emCadaIdioma(idioma: IdiomaPage, verificar: (codigo: CodigoIdioma) => Promise<void>) {
    for (const codigo of ["en", "es", "pt"] as const) {
      await idioma.trocar(codigo)
      this.idioma = codigo
      await verificar(codigo)
    }
  }

  // ---------- tooltip do ícone "i" (grid / pesquisa) ----------

  // o ícone "i" de uma linha: passe a linha (ou qualquer escopo) e devolve o ícone de informação dela
  iconeDaLinha(linha: Locator) {
    return linha.locator("mat-icon", { hasText: "info_outline" })
  }

  // texto do tooltip sem depender do hover: o Material mantém o conteúdo num elemento ligado por aria-describedby
  async textoDoTooltip(icone: Locator) {
    const id = await icone.getAttribute("aria-describedby")
    return (await this.page.locator(`#${id}`).textContent())?.trim() ?? ""
  }

  async camposDoTooltip(icone: Locator) {
    return lerCampos(await this.textoDoTooltip(icone))
  }

  // hover de verdade: o que a pessoa vê. Devolve o tooltip aberto.
  async abrirTooltip(icone: Locator) {
    await icone.hover()
    const tooltip = this.page.locator(".mat-tooltip").filter({ hasText: `${TEXTOS[this.idioma].rotulos.criadoPor}:` })
    await expect(tooltip).toBeVisible()
    return tooltip
  }

  // ---------- aba retrátil "Informações" (cadastro salvo) ----------

  // "i" do cabeçalho do cadastro; os "i" das linhas de grid ficam dentro de td e são ignorados
  get botaoInformacoes() {
    return this.page.locator(
      '//button[.//mat-icon[normalize-space()="info_outline"] and not(ancestor::td) and not(ancestor::apls-informacoes)]',
    )
  }

  get drawer() {
    return this.page.locator("apls-informacoes")
  }

  get tituloDrawer() {
    return this.drawer.getByText(TEXTOS[this.idioma].tituloDrawer, { exact: true })
  }

  get botaoFecharDrawer() {
    return this.drawer.locator("mat-icon", { hasText: "close" })
  }

  private nomeDaSecao(secao: SecaoRevisor) {
    return TEXTOS[this.idioma].secoes[secao]
  }

  private cabecalho(secao: SecaoRevisor) {
    return this.drawer.locator("mat-expansion-panel-header", { hasText: this.nomeDaSecao(secao) })
  }

  async abrirInformacoes() {
    if (!(await this.cabecalho("criacao").isVisible())) await this.botaoInformacoes.click()
    await expect(this.cabecalho("criacao")).toBeVisible()
  }

  async fecharInformacoes() {
    await this.botaoFecharDrawer.click()
    await expect(this.cabecalho("criacao")).toBeHidden()
  }

  // blocos existentes no drawer, na ordem em que aparecem
  async secoes() {
    const titulos = await this.drawer.locator("mat-expansion-panel-header").allInnerTexts()
    return titulos.map((t) => t.trim())
  }

  // expande o bloco se estiver fechado (Criação já abre expandido) e devolve texto e campos dele
  async lerSecao(secao: SecaoRevisor) {
    await this.abrirInformacoes()
    const cab = this.cabecalho(secao)
    if ((await cab.getAttribute("aria-expanded")) !== "true") await cab.click()
    await expect(cab).toHaveAttribute("aria-expanded", "true")
    const painel = this.drawer
      .locator("mat-expansion-panel")
      .filter({ has: this.page.locator("mat-expansion-panel-header", { hasText: this.nomeDaSecao(secao) }) })
    // a animação do painel termina antes de o conteúdo ficar legível
    await expect.poll(async () => Object.keys(lerCampos(await painel.innerText())).length).toBeGreaterThan(0)
    const texto = await painel.innerText()
    return { texto, campos: lerCampos(texto) }
  }
}
