// Carga: adiciona N colaboradores (padrão 50) num LTCAT já existente e salva. Não é teste de verdade.
// Ex.: LTCAT_IDKEY=145 COLAB_QTD=50 npm run test:e2e:scripts -- criar-colaboradores-ltcat-existente
import { test, expect } from "@support"
import { URLS } from "@support/urls"
import { colaboradoresDeCarga, incluirColaboradoresEmLote } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradoresFluxos"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"
const QTD = Number(process.env.COLAB_QTD ?? 50)

test("adicionar colaboradores num LTCAT existente", async ({ login, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m, page }) => {
  test.setTimeout(900000)
  await login.entrar()
  await page.goto(`${URLS.ltcatCadastro}?idkey=${IDKEY}`)
  await c.titulo.waitFor({ state: "visible" })
  await c.abrirAba("Colaboradores")
  await expect(a.botaoAdicionar).toBeVisible()
  const antes = await a.linhasColaborador.count()
  console.log(`LTCAT ${IDKEY}: ${antes} colaborador(es) antes`)

  await incluirColaboradoresEmLote(a, m, colaboradoresDeCarga(QTD))
  await c.salvar()
  await expect(c.mensagemSalvoComSucesso).toBeVisible({ timeout: 20000 })

  await page.reload()
  await c.abrirAba("Colaboradores")
  await expect(a.linhasColaborador).toHaveCount(antes + QTD)
  console.log(`LTCAT ${IDKEY}: ${antes + QTD} colaborador(es) depois de salvar e recarregar`)
})
