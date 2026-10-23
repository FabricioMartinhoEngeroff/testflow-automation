// Cenários do campo Cargo do cadastro de Profissionais (PROFI053–PROFI072).
// Cargo: alfanumérico, máx 30 chars (c9 verde aumentou para 60 — IGNORADO),
// aceita especiais/espaços/caixa alta e baixa, obrigatório.
// Nota: c9 (verde, 03/02/2026) aumentou o limite para 60 chars — essa melhoria
// está fora do escopo atual e os testes validam o limite de 30 chars.
import { test, expect } from "@support"

test.describe('Campo "Cargo" (E2E)', () => {
  test.beforeEach(async ({ page, login, profissionalPage }) => {
    await login.entrar()
    await profissionalPage.abrirNovoCadastro()
    await page.getByLabel("Cargo *").waitFor({ state: "visible" })
  })

  test.describe("Estado inicial", () => {
    test("PROFI053 - Campo visível e habilitado", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
    })

    test("PROFI054 - Por default está em branco", async ({ page }) => {
      await expect(page.getByLabel("Cargo *")).toHaveValue("")
    })
  })

  test.describe("Limite de caracteres", () => {
    test("PROFI055 - Aceita exatamente 30 caracteres", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.fill("a".repeat(30))
      await expect(campo).toHaveValue("a".repeat(30))
    })

    test("PROFI056 - Não aceita mais de 30 caracteres", async ({ page }) => {
      // c9 verde aumentou para 60 — ignoramos essa melhoria e validamos 30
      const campo = page.getByLabel("Cargo *")
      await campo.fill("a".repeat(40))
      const valor = await campo.inputValue()
      expect(valor.length).toBeLessThanOrEqual(30)
    })

    test("PROFI057 - Inserir exatamente 29 caracteres é aceito", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.fill("a".repeat(29))
      await expect(campo).toHaveValue("a".repeat(29))
    })
  })

  test.describe("Tipo de inserção", () => {
    test("PROFI058 - Aceita letras (texto puro)", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.fill("Médico do Trabalho")
      await expect(campo).toHaveValue("Médico do Trabalho")
    })

    test("PROFI059 - Aceita números misturados com letras", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.fill("Técnico Nível 2")
      await expect(campo).toHaveValue("Técnico Nível 2")
    })

    test("PROFI060 - Aceita caracteres especiais", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.fill("Eng. de Segurança / Sr.")
      await expect(campo).toHaveValue("Eng. de Segurança / Sr.")
    })

    test("PROFI061 - Aceita espaços entre palavras", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.fill("Engenheiro de Segurança")
      await expect(campo).toHaveValue("Engenheiro de Segurança")
    })

    test("PROFI062 - Aceita caixa alta e baixa", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.fill("MÉDICO do Trabalho")
      await expect(campo).toHaveValue("MÉDICO do Trabalho")
    })

    test("PROFI063 - Aceita acentuação", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.fill("Técnico de Higienização")
      await expect(campo).toHaveValue("Técnico de Higienização")
    })

    test.fixme("PROFI064 - Colar texto com mais de 30 chars via clipboard", async ({ page }) => {
      // Esperado: sistema trunca ou impede excedente
      // Não implementado: fill() não reproduz ClipboardEvent
    })

    test.fixme("PROFI065 - Inserir apenas espaços", async ({ page }) => {
      // Esperado: sistema deve tratar como campo vazio na validação ou bloquear
    })
  })

  test.describe("Foco e interação", () => {
    test("PROFI066 - Campo recebe foco ao clicar", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.click()
      await expect(campo).toBeFocused()
    })

    test("PROFI067 - Limpar campo após preenchimento", async ({ page }) => {
      const campo = page.getByLabel("Cargo *")
      await campo.fill("Enfermeiro")
      await campo.fill("")
      await expect(campo).toHaveValue("")
    })

    test("PROFI068 - Valor mantido ao alternar para outro campo", async ({ page }) => {
      await page.getByLabel("Cargo *").fill("Fisioterapeuta")
      await page.getByLabel("Nome *").click()
      await expect(page.getByLabel("Cargo *")).toHaveValue("Fisioterapeuta")
    })
  })

  test.describe("Obrigatoriedade", () => {
    test("PROFI069 - Salvar sem Cargo exibe mensagem de obrigatório", async ({ page }) => {
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI070 - Campo Cargo marcado em vermelho quando não preenchido ao salvar", async ({ page }) => {
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      const campoContainer = page.getByLabel("Cargo *").locator("xpath=ancestor::mat-form-field")
      await expect(campoContainer).toHaveClass(/ng-invalid|mat-form-field-invalid/)
    })
  })

  test.describe("Persistência", () => {
    test.fixme("PROFI071 - Cargo preenchido é persistido após salvar e reabrir", async ({ page }) => {
      // Pré-condição: CPF único válido + todos obrigatórios preenchidos + salvar
      // Esperado: ao reabrir o cadastro, Cargo aparece com o valor salvo
    })

    test.fixme("PROFI072 - Cargo editado em cadastro já salvo é atualizado", async ({ page }) => {
      // Esperado: novo valor persiste após re-salvar
    })
  })
})
