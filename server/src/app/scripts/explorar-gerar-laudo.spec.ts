// Exploração (temporária): o que o "Gerar laudo" do cadastro devolve (download? formato?).
import { test } from "../support"

test("explorar gerar laudo", async ({ login, ltcatCadastroPage: cadastro, page }) => {
  test.setTimeout(300000)
  await login.entrar()
  await page.goto("/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=174")
  await cadastro.titulo.waitFor()
  const botao = page.getByRole("button", { name: /Gerar laudo/ })
  console.log("BOTAO", await botao.count(), await botao.isEnabled())
  const downloadPromise = page.waitForEvent("download", { timeout: 240000 }).catch((e) => e)
  await botao.click()
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(5000)
    console.log("T", i, await page.locator("apls-toast, apls-popup, mat-dialog-container").allInnerTexts())
  }
  const d = await downloadPromise
  if (d instanceof Error) console.log("SEM DOWNLOAD", d.message.slice(0, 100))
  else {
    console.log("DOWNLOAD", d.suggestedFilename())
    await d.saveAs("test-results/laudo-explorado" + d.suggestedFilename().replace(/^.*(\.\w+)$/, "$1"))
  }
})
