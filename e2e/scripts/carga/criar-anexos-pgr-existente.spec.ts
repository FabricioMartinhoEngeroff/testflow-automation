// Carga: adiciona N anexos (padrão 50) num PGR já existente e salva. Não é teste de verdade.
// Ex.: PGR_IDKEY=2156 ANEXOS_QTD=50 npm run test:e2e:scripts -- criar-anexos-pgr-existente
// PGR_IDKEY=novo usa um cadastro novo e NÃO salva (nada persiste), bom para experimentar.
import path from "node:path"
import { test, expect } from "@support"
import { URLS } from "@support/urls"

const IDKEY = process.env.PGR_IDKEY ?? "2156"
const QTD = Number(process.env.ANEXOS_QTD ?? 50)
const NOVO = IDKEY === "novo"
// pausa entre o upload terminar e o clique em "Salvar e adicionar outro" (padrão 2500)
const ESPERA_MS = Number(process.env.ESPERA_MS ?? 2500)
const ARQUIVO = path.join(process.cwd(), "support", "arquivos", "minimo.pdf")

test("adicionar anexos num PGR existente", async ({ login, pgr, page }) => {
  test.setTimeout(900000)
  await login.entrar()
  if (NOVO) await pgr.abrirNovoCadastro()
  else await page.goto(`${URLS.pgr}/cadastro?idkey=${IDKEY}`)
  // a aba é achada pela posição (3ª): depois de recarregar a tela do PGR já apareceu em espanhol ("Adjuntos")
  const abaAnexos = page.getByRole("tab").nth(2)
  await abaAnexos.waitFor({ state: "visible" })
  await abaAnexos.click()

  // por CSS na aba ativa: com a modal aberta o fundo fica aria-hidden e getByRole não enxerga a tabela
  const linhas = page.locator("mat-tab-body.mat-tab-body-active table tbody tr").filter({ has: page.locator("td.cdk-column-descricao") })
  const modal = page.getByRole("dialog")
  const titulo = modal.getByRole("heading", { name: "Adicionar anexo" })
  const placeholder = modal.getByText("Arraste e solte o arquivo aqui ou clique para pesquisar")
  const botaoSalvarOutro = modal.getByRole("button", { name: "Salvar e adicionar outro" })

  await expect(page.getByRole("button", { name: "Adicionar anexo" })).toBeVisible()
  const antes = await linhas.count()
  console.log(`PGR ${IDKEY}: ${antes} anexo(s) antes`)
  if (QTD === 0) return // ANEXOS_QTD=0: só conta os anexos, não altera nada

  await page.getByRole("button", { name: "Adicionar anexo" }).click()
  await expect(titulo).toBeVisible()
  let precisouRepetir = 0
  let manteveArquivo = 0
  for (let i = 1; i <= QTD; i++) {
    // se a modal mantiver o arquivo depois de "Salvar e adicionar outro", não anexa de novo
    if (await placeholder.isVisible().catch(() => false)) {
      await modal.locator('input[type="file"]').setInputFiles(ARQUIVO)
      await expect(modal.locator("mat-label", { hasText: /minimo.*\.pdf/i })).toBeVisible()
    } else if (i > 1) {
      manteveArquivo++
    }
    await modal.getByLabel(/descri/i).fill(`Anexo carga ${String(i).padStart(3, "0")}`)
    await expect(botaoSalvarOutro).toBeEnabled() // bloqueado durante o upload
    await page.waitForTimeout(ESPERA_MS)

    let tentativas = 0
    await expect(async () => {
      tentativas++
      await botaoSalvarOutro.click()
      await expect(linhas).toHaveCount(antes + i, { timeout: 4000 })
    }).toPass({ timeout: 40000, intervals: [0] })
    if (tentativas > 1) {
      precisouRepetir++
      console.log(`anexo ${i}: salvou só na tentativa ${tentativas}`)
    }
  }
  console.log(`${precisouRepetir} de ${QTD} anexos precisaram de um segundo clique; arquivo mantido na modal em ${manteveArquivo} voltas`)

  await modal.getByRole("button", { name: "Fechar" }).click()
  // o PGR pode pedir confirmação ao fechar com campos preenchidos
  const atencao = page.getByRole("heading", { name: "Atenção" })
  if (await atencao.isVisible().catch(() => false)) await page.getByRole("button", { name: "Salvar e sair" }).click()
  await expect(titulo).toHaveCount(0)
  await expect(linhas).toHaveCount(antes + QTD)

  if (NOVO) return // cadastro novo: não salva, nada fica gravado

  await page.getByRole("button", { name: "Salvar", exact: true }).click()
  await expect(page.getByText(/Registro salvo com sucesso/i)).toBeVisible({ timeout: 20000 })

  await page.reload()
  await abaAnexos.click()
  await expect(linhas).toHaveCount(antes + QTD)
  console.log(`PGR ${IDKEY}: ${antes + QTD} anexo(s) depois de salvar e recarregar`)
})
