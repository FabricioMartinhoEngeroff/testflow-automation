// Exploração temporária: modal "Dados da assinatura digital" e o Download (fila de Relatórios).
// Ex.: LTCAT_ASSINADO_IDKEY=145 npm run test:e2e:scripts -- explorar-assinatura-digital
import { test, expect } from "@support"

const IDKEY = process.env.LTCAT_ASSINADO_IDKEY ?? "145"

test("explorar assinatura digital", async ({ login, ltcatCadastroPage: c, relatorios, page }) => {
  test.setTimeout(400000)
  await login.entrar()
  await page.goto(`/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=${IDKEY}`)
  await c.titulo.waitFor()
  await expect(c.botaoDadosAssinatura.or(c.botaoAssinarDigitalmente)).toBeVisible()
  console.log("assinado?", await c.botaoDadosAssinatura.isVisible())
  if (!(await c.botaoDadosAssinatura.isVisible())) return

  await c.botaoDadosAssinatura.click()
  const modal = page.locator("apollus-ngx-ivy-dados-assinatura")
  await modal.waitFor()
  const download = page.waitForEvent("download", { timeout: 20000 }).catch(() => null)
  await modal.getByRole("button", { name: "Download" }).click()
  await page.waitForTimeout(4000)
  console.log("toasts:", await page.locator("apls-toast").allInnerTexts(), "| modal aberta:", await modal.isVisible())
  console.log("download direto:", (await download)?.suggestedFilename() ?? "nenhum")
  if (await modal.isVisible()) await modal.locator(".apls-modal-close-button").click()
  await modal.waitFor({ state: "hidden" })

  await relatorios.abrir()
  const primeira = relatorios.linhas.first()
  console.log("primeira linha:", await primeira.locator("td.mat-column-relatorio").innerText(), await primeira.locator("td.mat-column-dataGeracao").innerText())
  const cor = () => primeira.locator("td.mat-column-status").evaluate((td) => getComputedStyle(td).color)
  console.log("cor inicial:", await cor())
  for (let i = 0; i < 12 && !["rgb(0, 128, 0)", "rgb(176, 23, 23)"].includes(await cor()); i++) {
    await page.waitForTimeout(10000)
    await relatorios.botaoAtualizar.click()
  }
  console.log("cor final:", await cor(), "| ícone download:", await primeira.locator("td.mat-column-download mat-icon").count())
})
