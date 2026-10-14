// Cenários de edição de Profissional já cadastrado (PROFI138–PROFI185).
// "Editar" está no escopo da EF seção 1.1. A lógica do Salvar (Ações 1–3 e 5)
// se aplica igual tanto na criação quanto na edição — esses cenários validam
// o comportamento específico do modo de edição.
//
// Estratégia: cria um profissional via UI no beforeEach (com CPF único),
// captura a URL do cadastro salvo e reabre para edição usando criarEAbrirParaEdicao.
import { test, expect } from "../../../support"
import { cpfUnico } from "../../../support/utils/cpf"

test.describe("Edição de Profissional (E2E)", () => {
  let cpfBase: string

  test.beforeEach(async ({ page, login, profissionalPage }) => {
    cpfBase = cpfUnico()
    await login.entrar()
    await profissionalPage.criarEAbrirParaEdicao(cpfBase)
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Estado inicial do formulário em edição", () => {
    test("PROFI138 - Campos carregam com os valores salvos", async ({ page }) => {
      // CPF salvo deve aparecer no campo ao abrir para edição
      const valorCpf = await page.getByLabel("CPF *").inputValue()
      expect(valorCpf.replace(/\D/g, "")).toBe(cpfBase.replace(/\D/g, ""))
    })

    test("PROFI139 - Campo Nome carregado com valor salvo", async ({ page }) => {
      await expect(page.getByLabel("Nome *")).toHaveValue("Ana Costa")
    })

    test("PROFI140 - Campo Cargo carregado com valor salvo", async ({ page }) => {
      await expect(page.getByLabel("Cargo *")).toHaveValue("Médico do Trabalho")
    })

    test("PROFI141 - Campo NIS em branco quando não foi preenchido no cadastro original", async ({ page }) => {
      // não preenchemos NIS em criarEAbrirParaEdicao
      await expect(page.getByLabel("NIS")).toHaveValue("")
    })

    test("PROFI142 - Flag Responsável Técnico desmarcada quando não foi marcada", async ({ page }) => {
      await expect(
        page.getByRole("checkbox", { name: /Responsável Técnico/ })
      ).not.toBeChecked()
    })

    test("PROFI143 - Campo CPF habilitado em modo de edição", async ({ page }) => {
      await expect(page.getByLabel("CPF *")).toBeEnabled()
    })

    test("PROFI144 - Campo Nome habilitado em modo de edição", async ({ page }) => {
      await expect(page.getByLabel("Nome *")).toBeEnabled()
    })

    test("PROFI145 - Campo NIS habilitado em modo de edição", async ({ page }) => {
      await expect(page.getByLabel("NIS")).toBeEnabled()
    })

    test("PROFI146 - Campo Cargo habilitado em modo de edição", async ({ page }) => {
      await expect(page.getByLabel("Cargo *")).toBeEnabled()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Alterar campos e salvar", () => {
    test("PROFI147 - Alterar Nome e salvar persiste o novo valor", async ({ page }) => {
      const urlEdicao = page.url()
      await page.getByLabel("Nome *").fill("Maria Souza")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)
      await expect(page.getByLabel("Nome *")).toHaveValue("Maria Souza")
    })

    test("PROFI148 - Alterar Cargo e salvar persiste o novo valor", async ({ page }) => {
      const urlEdicao = page.url()
      await page.getByLabel("Cargo *").fill("Enfermeiro do Trabalho")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)
      await expect(page.getByLabel("Cargo *")).toHaveValue("Enfermeiro do Trabalho")
    })

    test("PROFI149 - Preencher NIS (que estava vazio) e salvar persiste o valor", async ({ page }) => {
      const urlEdicao = page.url()
      await page.getByLabel("NIS").pressSequentially("12345678900")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)
      const valorNis = await page.getByLabel("NIS").inputValue()
      expect(valorNis.replace(/\D/g, "")).toBe("12345678900")
    })

    test("PROFI150 - Marcar flag Responsável Técnico e salvar persiste marcação", async ({ page }) => {
      const urlEdicao = page.url()
      await page.getByText("Responsável Técnico", { exact: true }).click()
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)
      await expect(
        page.getByRole("checkbox", { name: /Responsável Técnico/ })
      ).toBeChecked()
    })

    test("PROFI151 - Alterar CPF para outro válido e salvar persiste o novo CPF", async ({ page }) => {
      const cpfNovo = cpfUnico()
      const urlEdicao = page.url()
      await page.getByLabel("CPF *").fill("")
      await page.getByLabel("CPF *").pressSequentially(cpfNovo.replace(/\D/g, ""))
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)
      const valorCpf = await page.getByLabel("CPF *").inputValue()
      expect(valorCpf.replace(/\D/g, "")).toBe(cpfNovo.replace(/\D/g, ""))
    })

    test("PROFI152 - Limpar NIS (que estava preenchido) e salvar persiste o campo vazio", async ({ page }) => {
      // primeiro preenche NIS e salva
      await page.getByLabel("NIS").pressSequentially("12345678900")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      // clica Não → lista; reobre
      const urlEdicao = page.url()
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)
      // agora limpa o NIS e salva novamente
      await page.getByLabel("NIS").fill("")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)
      await expect(page.getByLabel("NIS")).toHaveValue("")
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Validações de Salvar aplicadas igualmente na edição", () => {
    test("PROFI153 - Limpar campo obrigatório Nome e salvar bloqueia com mensagem", async ({ page }) => {
      await page.getByLabel("Nome *").fill("")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI154 - Limpar campo obrigatório Cargo e salvar bloqueia com mensagem", async ({ page }) => {
      await page.getByLabel("Cargo *").fill("")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI155 - Limpar CPF e salvar bloqueia com mensagem de obrigatório", async ({ page }) => {
      await page.getByLabel("CPF *").fill("")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test.fixme("PROFI156 - Alterar CPF para um já existente bloqueia com mensagem de duplicidade", async ({ page }) => {
      // Pré-condição: existir outro profissional com CPF conhecido no sistema
    })

    test.fixme("PROFI157 - Editar Nome para menos de 3 letras no primeiro nome bloqueia (Ação 3)", async ({ page }) => {
      // Esperado: mesma mensagem da Ação 3 aplicada na edição
    })

    test("PROFI158 - Dados editados permanecem na tela após falha de validação", async ({ page }) => {
      await page.getByLabel("Nome *").fill("XX") // nome inválido
      await page.getByLabel("Cargo *").fill("Novo Cargo")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // o cargo alterado deve continuar visível mesmo após erro
      await expect(page.getByLabel("Cargo *")).toHaveValue("Novo Cargo")
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe('Botão "Voltar" durante edição', () => {
    test("PROFI159 - Voltar sem alterar nada redireciona para lista", async ({ page }) => {
      await page.getByRole("button", { name: "Voltar" }).click()
      await expect(page).not.toHaveURL(/cadastro|editar|novo/)
    })

    test("PROFI160 - Voltar após alterar um campo exibe modal de confirmação", async ({ page }) => {
      await page.getByLabel("Nome *").fill("Nome Alterado")
      await page.getByRole("button", { name: "Voltar" }).click()
      await expect(
        page.getByText(/deseja salvar as alterações/i)
      ).toBeVisible()
    })

    test('PROFI161 - Clicar "Não" na modal descarta alterações e vai para lista', async ({ page }) => {
      await page.getByLabel("Nome *").fill("Nome que não deve persistir")
      await page.getByRole("button", { name: "Voltar" }).click()
      await page.getByRole("button", { name: "Não" }).click()
      await expect(page).not.toHaveURL(/cadastro|editar|novo/)
    })

    test.fixme('PROFI162 - Clicar "Sim" na modal salva alterações e vai para lista', async ({ page }) => {
      // Esperado: salva com as alterações + redireciona para lista
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Mensagens de sucesso na edição", () => {
    test.fixme("PROFI163 - Salvar edição com sucesso exibe modal de confirmação", async ({ page }) => {
      // Esperado: modal "Profissional salvo com sucesso. Deseja realizar um novo cadastro?"
    })

    test.fixme('PROFI164 - Clicar "Não" na modal de sucesso da edição vai para lista em branco', async ({ page }) => {
      // EF: lista aparece em branco porque o usuário já havia salvo
    })

    test.fixme('PROFI165 - Clicar "Sim" na modal de sucesso da edição abre formulário em branco', async ({ page }) => {
      // Esperado: formulário limpo para novo cadastro
    })
  })
})
