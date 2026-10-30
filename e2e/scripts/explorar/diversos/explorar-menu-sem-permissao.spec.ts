// Exploração: o que existe dentro de Segurança para o QAutomatizador_sem_permissao (TST001 espera Gestão de Ocorrências e não acha).
import { test } from "@support"
import { sessao } from "@support/usuarios"

test.use({ storageState: sessao("QAutomatizador_sem_permissao") })

test("explorar Segurança do sem_permissao", async ({ page, menuLateral }) => {
  await page.goto("/apollus/")
  await menuLateral.abrirModulo("seguranca")
  await page.waitForTimeout(2000)
  await page.getByText("Programas e Laudos").first().click()
  await page.waitForTimeout(2000)
  console.log("Segurança ->", (await page.locator("apls-sub-nav-item").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()))
})
