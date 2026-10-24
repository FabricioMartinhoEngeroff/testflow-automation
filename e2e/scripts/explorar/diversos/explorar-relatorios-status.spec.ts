// Exploração temporária: confere o RelatoriosPage.status() contra as linhas verdes e vermelhas do painel.
import { test } from "@support"

test("explorar status dos relatórios", async ({ login, relatorios, page }) => {
  await login.entrar()
  await relatorios.abrir()
  const linhas = await relatorios.linhas.all()
  for (const linha of linhas.slice(0, 8)) {
    const nome = await linha.locator("td.mat-column-relatorio").innerText()
    console.log(await relatorios.status(linha), "| ícone download:", await linha.locator("td.mat-column-download mat-icon").count(), "|", nome)
  }
  await relatorios.fechar()
  console.log("painel fechado:", !(await relatorios.painel.isVisible()), page.url())
})
