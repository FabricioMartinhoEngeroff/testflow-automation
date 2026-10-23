import { test, expect } from "@support"

test.describe("LTCAT - Tela de cadastro (E2E)", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  test("deve acessar a tela de cadastro com os campos obrigatórios", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: referencias }) => {
    await expect(cadastro.titulo).toBeVisible()
    await expect(cadastro.regiao).toBeVisible()
    await expect(cadastro.dataBase).toBeVisible()
    await expect(referencias.responsavelTecnico).toBeVisible()
    await expect(referencias.modeloDocumento).toBeVisible()
    await expect(referencias.vigenciaInicio).toBeVisible()
    await expect(referencias.vigenciaFim).toBeVisible()
  })
})

test.describe("LTCAT - Cadastro com campos obrigatórios (E2E)", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  // cada execução cria 1 LTCAT novo no ambiente de homologação (sem rollback)
  for (const fator of ["q3", "q5"] as const) {
    test(`deve salvar preenchendo os obrigatórios com fator de troca ${fator}`, async ({ ltcatCadastroPage: cadastro, page }) => {
      await cadastro.preencherObrigatorios()
      await cadastro.preencherConfiguracoesObrigatorias(fator)
      await cadastro.salvar()
      await expect(cadastro.mensagemSalvoComSucesso).toBeVisible()
      await expect(page).toHaveURL(/idkey=\d+/)
    })
  }
})
