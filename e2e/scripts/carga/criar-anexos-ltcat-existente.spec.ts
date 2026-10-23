// Carga: adiciona N anexos (padrão 50) num LTCAT já existente e salva. Não é teste de verdade.
// Ex.: LTCAT_IDKEY=145 ANEXOS_QTD=50 npm run test:e2e:scripts -- criar-anexos-ltcat-existente
// LTCAT_IDKEY=novo usa um cadastro novo e NÃO salva (nada persiste), bom para experimentar.
// ESPERA_MS: pausa entre o upload terminar e o clique em "Salvar e adicionar outro" (padrão 2000).
import { test, expect } from "@support"
import { URLS } from "@support/urls"
import { arquivoDeTeste } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"
const QTD = Number(process.env.ANEXOS_QTD ?? 50)
const ESPERA_MS = Number(process.env.ESPERA_MS ?? 2000)
const NOVO = IDKEY === "novo"

test("adicionar anexos num LTCAT existente", async ({ login, ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
  test.setTimeout(900000)
  await login.entrar()
  await page.goto(NOVO ? URLS.ltcatCadastro : `${URLS.ltcatCadastro}?idkey=${IDKEY}`)
  await c.titulo.waitFor({ state: "visible" })
  await c.abrirAba("Anexos")
  await expect(a.botaoAdicionarAnexo).toBeVisible()
  const antes = await a.linhasAnexo.count()
  console.log(`LTCAT ${IDKEY}: ${antes} anexo(s) antes (espera de ${ESPERA_MS} ms antes de cada clique)`)

  // o "Salvar e adicionar outro" limpa arquivo e descrição: anexa de novo a cada volta
  await a.abrirModalAdicionar()
  let precisouRepetir = 0
  for (let i = 1; i <= QTD; i++) {
    await expect(m.areaDeArquivo).toBeVisible() // formulário limpo da volta anterior
    await m.anexar(arquivoDeTeste("minimo.pdf"))
    await expect(m.nomeDoArquivo).toBeVisible() // upload terminou
    await m.descricao.fill(`Anexo carga ${String(i).padStart(3, "0")}`)
    // hipótese: o botão fica bloqueado enquanto o upload é processado; espera liberar e dá um respiro
    await expect(m.botaoSalvarEAdicionarOutro).toBeEnabled()
    await page.waitForTimeout(ESPERA_MS)

    // se mesmo assim o primeiro clique não salvar, repete o clique e conta
    let tentativas = 0
    await expect(async () => {
      tentativas++
      await m.botaoSalvarEAdicionarOutro.click()
      await expect(a.linhasAnexo).toHaveCount(antes + i, { timeout: 4000 })
    }).toPass({ timeout: 40000, intervals: [0] })
    if (tentativas > 1) {
      precisouRepetir++
      console.log(`anexo ${i}: salvou só na tentativa ${tentativas}`)
    }
  }
  console.log(`${precisouRepetir} de ${QTD} anexos precisaram de um segundo clique`)
  await m.botaoFechar.click()
  await expect(m.titulo).toHaveCount(0)
  await expect(a.linhasAnexo).toHaveCount(antes + QTD)

  if (NOVO) return // cadastro novo: não salva, nada fica gravado

  await c.salvar()
  await expect(c.mensagemSalvoComSucesso).toBeVisible({ timeout: 20000 })

  await page.reload()
  await c.abrirAba("Anexos")
  await expect(a.linhasAnexo).toHaveCount(antes + QTD)
  console.log(`LTCAT ${IDKEY}: ${antes + QTD} anexo(s) depois de salvar e recarregar`)
})
