// diferente do Vitest (que a gente usava describe/test direto sem importar),
// aqui é outro test runner — o do próprio Playwright — por isso o import
import { test, expect } from "@playwright/test"
import { login } from "../support/login"

// um arquivo por FUNCIONALIDADE (não por cenário) — igual a aula fez com
// "Criação" agrupando vários testes de todo. Assim, quando formos cobrindo
// mais cenários da planilha real, cada campo/tela vira 1 arquivo com N testes
// dentro, em vez de 650 arquivos de 1 teste cada
test.describe("Cabeçalho (E2E)", () => {
  // beforeEach roda antes de CADA teste deste describe — evita repetir o
  // login em todo "test(...)" que a gente for adicionando aqui dentro
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.describe("Campo Data Base", () => {
    test("TST244 - Tentar salvar sem preencher a Data Base", async ({ page }) => {
      // AÇÃO: cenário pede pra tentar salvar sem preencher a Data Base —
      // ou seja, propositalmente NÃO preenchemos esse campo aqui
      // TODO: ajustar para o nome real do botão de salvar do cabeçalho do PGR
      await page.getByRole("button", { name: "Salvar" }).click()

      // ASSERÇÃO: resultado esperado da planilha é "bloquear e exibir
      // mensagem de obrigatoriedade clara" — usamos um regex (/i = ignora
      // maiúscula/minúscula) em vez do texto exato, porque não sabemos ainda
      // a redação exata da mensagem no sistema real
      // TODO: ajustar o texto/regex depois de ver a mensagem real do PGR
      await expect(page.getByText(/obrigatoriedade/i)).toBeVisible()
    })

    test("TST245 - Inserir uma data válida manualmente", async ({ page }) => {
      // AÇÃO: preenche o campo com uma data válida e tenta salvar
      // TODO: ajustar label do campo Data Base e nome do botão Salvar
      await page.getByLabel("Data Base").fill("15/04/2026")
      await page.getByRole("button", { name: "Salvar" }).click()

      // ASSERÇÃO: resultado esperado é "aceitar sem erro" — ou seja, a
      // mensagem de obrigatoriedade do TST244 NÃO deve aparecer aqui
      await expect(page.getByText(/obrigatoriedade/i)).not.toBeVisible()
    })

    test("TST248 - Inserir texto não numérico no campo", async ({ page }) => {
      // AÇÃO: cenário pede um valor claramente inválido (texto em vez de data)
      // TODO: ajustar seletor conforme o campo real (pode ser mascarado e
      // simplesmente recusar o "abc", ou aceitar e mostrar erro ao salvar —
      // ajustar essa asserção depois de ver o comportamento real)
      await page.getByLabel("Data Base").fill("abc")
      await page.getByRole("button", { name: "Salvar" }).click()

      // ASSERÇÃO: resultado esperado é "bloquear entrada inválida"
      await expect(page.getByText(/inválid/i)).toBeVisible()
    })
  })
})
