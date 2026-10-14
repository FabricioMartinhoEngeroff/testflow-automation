import { test, expect } from "../../../support"

test.describe("LTCAT - Tela de pesquisa (E2E)", () => {
  test.beforeEach(async ({ login, ltcatPage }) => {
    await login.entrar()
    await ltcatPage.abrir()
  })

  test("deve acessar a tela Lista de LTCATs", async ({ ltcatPage }) => {
    await expect(ltcatPage.titulo).toBeVisible()
    await expect(ltcatPage.botaoNovo).toBeVisible()
  })
})
