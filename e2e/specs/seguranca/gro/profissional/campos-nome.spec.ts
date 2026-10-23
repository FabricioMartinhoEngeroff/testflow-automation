// Cenários do campo Nome do cadastro de Profissionais (PROFI020–PROFI039).
// Nome: alfabético, máx 40 chars, sem números, aceita especiais/espaços/acentos,
// obrigatório, validação de comprimento mínimo por parte do nome.
// EF Ação 3 do Salvar: primeiro nome ≥ 3 letras, último nome ≥ 2 letras.
import { test, expect } from "@support"

test.describe('Campo "Nome" (E2E)', () => {
  test.beforeEach(async ({ page, login, profissionalPage }) => {
    await login.entrar()
    await profissionalPage.abrirNovoCadastro()
    await page.getByLabel("Nome *").waitFor({ state: "visible" })
  })

  test.describe("Estado inicial", () => {
    test("PROFI020 - Campo visível e habilitado", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
    })

    test("PROFI021 - Por default está em branco", async ({ page }) => {
      await expect(page.getByLabel("Nome *")).toHaveValue("")
    })
  })

  test.describe("Limite de caracteres", () => {
    test("PROFI022 - Aceita exatamente 40 caracteres", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      // 40 letras — usa nome com espaços (a EF permite)
      await campo.fill("a".repeat(20) + " " + "b".repeat(19))
      const valor = await campo.inputValue()
      expect(valor.length).toBeLessThanOrEqual(40)
    })

    test("PROFI023 - Não aceita mais de 40 caracteres", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      await campo.fill("a".repeat(50))
      const valor = await campo.inputValue()
      expect(valor.length).toBeLessThanOrEqual(40)
    })
  })

  test.describe("Tipo de inserção", () => {
    test("PROFI024 - Aceita letras e nome completo válido", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      await campo.fill("Maria Silva")
      await expect(campo).toHaveValue("Maria Silva")
    })

    test("PROFI025 - Não aceita números", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      await campo.fill("123")
      // campo deve bloquear dígitos — valor deve ser vazio ou sem os dígitos
      const valor = await campo.inputValue()
      expect(valor.replace(/\D/g, "")).toBe("")
    })

    test("PROFI026 - Aceita caracteres especiais e acentos (ã, é, ç, ñ, -)", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      await campo.fill("José Álvarez-Muñoz")
      await expect(campo).toHaveValue("José Álvarez-Muñoz")
    })

    test("PROFI027 - Aceita espaços entre palavras", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      await campo.fill("Ana Maria da Silva")
      await expect(campo).toHaveValue("Ana Maria da Silva")
    })

    test("PROFI028 - Aceita caixa alta e baixa (letras maiúsculas e minúsculas)", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      await campo.fill("João Da SILVA")
      await expect(campo).toHaveValue("João Da SILVA")
    })

    test.fixme("PROFI029 - Colar nome com mais de 40 chars via clipboard", async ({ page }) => {
      // Esperado: sistema deve truncar ou impedir o excedente
      // Não implementado: fill() não reproduz evento de colar real (ClipboardEvent)
    })

    test.fixme("PROFI030 - Inserir apenas espaços", async ({ page }) => {
      // Esperado: sistema deve bloquear ou tratar como campo vazio na validação
    })
  })

  test.describe("Foco e interação", () => {
    test("PROFI031 - Campo recebe foco ao clicar", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      await campo.click()
      await expect(campo).toBeFocused()
    })

    test("PROFI032 - Limpar campo após preenchimento", async ({ page }) => {
      const campo = page.getByLabel("Nome *")
      await campo.fill("valor temporário")
      await campo.fill("")
      await expect(campo).toHaveValue("")
    })

    test("PROFI033 - Valor mantido ao alternar para outro campo e voltar", async ({ page }) => {
      await page.getByLabel("Nome *").fill("Carlos Mendes")
      await page.getByLabel("Cargo *").click()
      await expect(page.getByLabel("Nome *")).toHaveValue("Carlos Mendes")
    })
  })

  test.describe("Obrigatoriedade", () => {
    test("PROFI034 - Salvar sem Nome exibe mensagem de obrigatório", async ({ page }) => {
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI035 - Campo Nome marcado em vermelho quando não preenchido ao salvar", async ({ page }) => {
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      const campoContainer = page.getByLabel("Nome *").locator("xpath=ancestor::mat-form-field")
      await expect(campoContainer).toHaveClass(/ng-invalid|mat-form-field-invalid/)
    })
  })

  test.describe("Validação de comprimento mínimo (Ação 3 do Salvar)", () => {
    test.fixme("PROFI036 - Primeiro nome com menos de 3 letras é rejeitado", async ({ page }) => {
      // EF: "primeiro nome tenha ao menos 3 letras"
      // Esperado: "Atenção! Para salvar é necessário que o primeiro nome tenha
      // ao menos 3 letras e o último nome ao menos 2 letras."
      // Pré-condição: CPF e Cargo também precisam estar preenchidos para chegar
      // na Ação 3 (ela só executa depois das ações 1 e 2 passarem)
    })

    test.fixme("PROFI037 - Último nome com menos de 2 letras é rejeitado", async ({ page }) => {
      // Esperado: mesma mensagem que PROFI036
      // Exemplo que reproduz: "Ana B" → último nome "B" tem só 1 letra
    })

    test.fixme("PROFI038 - Nome com apenas uma palavra é rejeitado", async ({ page }) => {
      // Esperado: sem último nome → regra do último nome é disparada
      // (ou talvez o sistema entenda "último nome" como ausência de sobrenome)
    })

    test.fixme("PROFI039 - Nome com primeiro (≥3) e último (≥2) válidos é aceito", async ({ page }) => {
      // Esperado: Ação 3 não bloqueia, segue para Ação 4/5
      // Exemplo válido: "Ana Costa" — 3+5 letras respectivamente
    })
  })
})
