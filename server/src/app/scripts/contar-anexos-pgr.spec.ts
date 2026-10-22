// Exploração: conta os anexos de um PGR existente (padrão 2072). Só lê, não salva nada.
// Ex.: PGR_IDKEY=2072 npm run test:e2e:scripts -- contar-anexos-pgr
import { test } from "../support"
import { URLS } from "../support/urls"

const IDKEY = process.env.PGR_IDKEY ?? "2072"

test("contar anexos de um PGR", async ({ login, page }) => {
  await login.entrar()
  await page.goto(`${URLS.pgr}/cadastro?idkey=${IDKEY}`)
  await page.getByRole("tab", { name: "Anexos" }).click()
  const linhas = page.locator("apollus-ngx-ivy-pgr-anexos tbody tr.mat-row")
  await linhas.first().waitFor({ state: "visible", timeout: 30000 })
  await page.waitForTimeout(2000)
  console.log(`linhas brutas: ${await linhas.count()} | primeira: ${(await linhas.first().innerText()).slice(0, 80)}`)
  const descricoes = await linhas.locator(".mat-column-descricao").allInnerTexts()
  console.log(`PGR ${IDKEY}: ${descricoes.length} anexo(s)`)
  descricoes.forEach((d, i) => console.log(`${i + 1}. ${d.trim().slice(0, 40)}`))
})
