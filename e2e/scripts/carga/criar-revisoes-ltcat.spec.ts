// Script de carga: inclui várias revisões no "Histórico de revisões" de um LTCAT.
// Sem LTCAT_URL cria um LTCAT novo; com LTCAT_URL usa o LTCAT já existente dessa URL.
// Quantidade: REVISOES_QTD (padrão 50). Versão inicial: REVISOES_INICIO (padrão: maior versão numérica existente + 1).
// Ex.: REVISOES_QTD=50 npm run test:e2e:scripts -- criar-revisoes-ltcat
import type { Locator } from "@playwright/test"
import { test, expect } from "@support"
import { ltcatValido } from "@support/data/ltcat"

const QTD = Number(process.env.REVISOES_QTD ?? 50)
const LTCAT_URL = process.env.LTCAT_URL

const dd = (n: number) => String(n).padStart(2, "0")
const formatar = (d: Date) => `${dd(d.getDate())}/${dd(d.getMonth() + 1)}/${d.getFullYear()}`

// "Data da revisão" não aceita data futura: a última revisão fica em hoje e as anteriores um dia antes cada
function dataDaRevisao(i: number) {
  const d = new Date()
  d.setDate(d.getDate() - (QTD - 1 - i))
  return formatar(d)
}

// "Data da revisão" já vem com a data de hoje; digitar por cima embaralha a máscara
async function limparEDigitar(campo: Locator, ddmmaaaa: string) {
  await campo.click()
  await campo.press("Control+A")
  await campo.press("Backspace")
  await campo.pressSequentially(ddmmaaaa.replace(/\D/g, ""))
  await campo.press("Tab")
}

test(`criar ${QTD} revisões no LTCAT`, async ({ login, ltcatCadastroPage: cadastro, ltcatHistoricoRevisoesModal: revisoes, page }) => {
  test.setTimeout(QTD * 15000 + 60000)

  await login.entrar()
  if (LTCAT_URL) {
    await page.goto(LTCAT_URL)
    await cadastro.titulo.waitFor({ state: "visible" })
  } else {
    await cadastro.abrir()
    await cadastro.preencherObrigatorios({
      ...ltcatValido,
      avaliacaoRealizadaEm: `Carga ${QTD} revisões`,
      condicoesOperacionais: `LTCAT criado para carga de ${QTD} revisões`,
    })
    await cadastro.preencherConfiguracoesObrigatorias()
  }

  await revisoes.abrir()
  const existentes = await revisoes.linhas.count()
  const versoesExistentes = (await revisoes.linhas.locator("td:first-child").allInnerTexts()).map(Number).filter(Number.isFinite)
  const INICIO = Number(process.env.REVISOES_INICIO ?? Math.max(0, ...versoesExistentes) + 1)
  console.log(`${existentes} revisões já existentes; começando na versão ${INICIO}`)

  for (let i = 0; i < QTD; i++) {
    const versao = INICIO + i
    const data = dataDaRevisao(i)
    await revisoes.versao.fill(String(versao))
    await revisoes.responsavelTecnico.click()
    await page.getByRole("option", { name: /031\.044\.320-23/ }).first().click()
    await limparEDigitar(revisoes.dataRevisao, data)
    await limparEDigitar(revisoes.dataBase, data)
    await revisoes.motivo.fill(`Revisão de carga ${versao}`)
    // às vezes o clique no "+" é ignorado (aplspreventdoubleclick?), então repete até a linha entrar
    await expect(async () => {
      await revisoes.botaoIncluirNaTabela.click()
      await expect(revisoes.linhas).toHaveCount(existentes + i + 1, { timeout: 2000 })
    }).toPass({ timeout: 20000 })
    console.log(`revisão ${i + 1}/${QTD} (versão ${versao}, ${data}) incluída`)
  }

  await revisoes.botaoSalvar.click()
  await cadastro.salvar()
  await expect(cadastro.mensagemSalvoComSucesso).toBeVisible()
  console.log("LTCAT salvo:", page.url())
})
