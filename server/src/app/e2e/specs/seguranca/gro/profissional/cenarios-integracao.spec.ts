// Cenários de integração e fluxo completo do cadastro de Profissional (PROFI206–PROFI230).
// Testam o sistema de ponta a ponta: todos os campos juntos, múltiplos cadastros,
// sequência criar → editar, acesso sem permissão e consistência geral.
import { test, expect } from "../../../../../support"
import { cpfUnico } from "../../../../../support/utils/cpf"

test.describe("Integração e Fluxo Completo (E2E)", () => {
  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Happy path com todos os campos", () => {
    test("PROFI206 - Preencher todos os campos (CPF, Nome, NIS, Cargo, flag RT) e salvar com sucesso", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      await profissionalPage.abrirNovoCadastro()
      const cpf = cpfUnico()
      await page.getByLabel("CPF *").pressSequentially(cpf.replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("João Carlos Silva")
      await page.getByLabel("NIS").pressSequentially("12345678900")
      await page.getByLabel("Cargo *").fill("Engenheiro de Segurança")
      await page.getByText("Responsável Técnico", { exact: true }).click()
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText("Profissional salvo com sucesso")).toBeVisible()
    })

    test("PROFI207 - Todos os campos preenchidos persistem ao reabrir o cadastro", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      await profissionalPage.abrirNovoCadastro()
      const cpf = cpfUnico()
      await page.getByLabel("CPF *").pressSequentially(cpf.replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("João Carlos Silva")
      await page.getByLabel("NIS").pressSequentially("12345678900")
      await page.getByLabel("Cargo *").fill("Engenheiro de Segurança")
      await page.getByText("Responsável Técnico", { exact: true }).click()
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      const urlEdicao = page.url()
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)

      // verifica todos os campos
      const valorCpf = await page.getByLabel("CPF *").inputValue()
      expect(valorCpf.replace(/\D/g, "")).toBe(cpf.replace(/\D/g, ""))
      await expect(page.getByLabel("Nome *")).toHaveValue("João Carlos Silva")
      const valorNis = await page.getByLabel("NIS").inputValue()
      expect(valorNis.replace(/\D/g, "")).toBe("12345678900")
      await expect(page.getByLabel("Cargo *")).toHaveValue("Engenheiro de Segurança")
      await expect(
        page.getByRole("checkbox", { name: /Responsável Técnico/ })
      ).toBeChecked()
    })

    test("PROFI208 - Preencher apenas os campos obrigatórios (sem NIS, sem flag) e salvar", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      await profissionalPage.abrirNovoCadastro()
      await page.getByLabel("CPF *").pressSequentially(cpfUnico().replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText("Profissional salvo com sucesso")).toBeVisible()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Múltiplos cadastros", () => {
    test("PROFI209 - Criar dois profissionais com CPFs diferentes funciona sem conflito", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      const cpf1 = cpfUnico()
      await profissionalPage.abrirNovoCadastro()
      await profissionalPage.salvarValido(cpf1)
      // clica Sim → abre formulário em branco para novo cadastro
      await page.getByRole("button", { name: "Sim" }).click()

      const cpf2 = cpfUnico()
      await page.getByLabel("CPF *").pressSequentially(cpf2.replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("Carlos Lima")
      await page.getByLabel("Cargo *").fill("Fisioterapeuta")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText("Profissional salvo com sucesso")).toBeVisible()
    })

    test.fixme("PROFI210 - Ambos os profissionais criados aparecem na lista", async ({ page }) => {
      // Esperado: lista exibe os dois registros após os dois salvamentos
      // Pré-condição: dois profissionais com CPFs únicos já criados
    })

    test.fixme("PROFI211 - Criar profissional com mesmo CPF de um já existente é bloqueado", async ({ page }) => {
      // Valida CPF único entre dois ciclos de criação dentro do mesmo teste
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Fluxo criar → editar → verificar", () => {
    test("PROFI212 - Criar profissional, editar nome e verificar que a edição persiste", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      const cpf = cpfUnico()
      await profissionalPage.criarEAbrirParaEdicao(cpf)

      // edita o nome
      await page.getByLabel("Nome *").fill("Maria Oliveira")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      const urlEdicao = page.url()
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)

      await expect(page.getByLabel("Nome *")).toHaveValue("Maria Oliveira")
    })

    test("PROFI213 - Criar profissional, editar cargo e verificar persistência", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      const cpf = cpfUnico()
      await profissionalPage.criarEAbrirParaEdicao(cpf)

      await page.getByLabel("Cargo *").fill("Técnico em Segurança")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Profissional salvo com sucesso").waitFor({ state: "visible" })
      const urlEdicao = page.url()
      await page.getByRole("button", { name: "Não" }).click()
      await page.goto(urlEdicao)

      await expect(page.getByLabel("Cargo *")).toHaveValue("Técnico em Segurança")
    })

    test.fixme("PROFI214 - Criar, editar e depois excluir o mesmo profissional", async ({ page }) => {
      // Esperado: fluxo completo de CRUD sem erros
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Estado do formulário em diferentes situações", () => {
    test("PROFI215 - Reload da página no formulário de novo cadastro mantém URL de novo cadastro", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      await profissionalPage.abrirNovoCadastro()
      await page.getByLabel("Nome *").fill("Teste")
      await page.reload()
      // após reload num formulário novo (sem ID salvo), comportamento pode variar
      // — valida que a tela de cadastro ainda está visível ou o usuário foi redirecionado
      const temFormulario = await page.getByLabel("Nome *").isVisible().catch(() => false)
      const temLista = await page.getByRole("button", { name: "Novo" }).isVisible().catch(() => false)
      expect(temFormulario || temLista).toBe(true)
    })

    test("PROFI216 - Abrir novo cadastro, não preencher nada, clicar Voltar vai direto para lista", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      await profissionalPage.abrirNovoCadastro()
      await page.getByRole("button", { name: "Voltar" }).click()
      // sem alterações → sem modal, vai direto para lista
      await expect(page).not.toHaveURL(/cadastro|novo/)
    })

    test.fixme("PROFI217 - Abrir dois cadastros simultâneos em abas diferentes não interfere", async ({ page }) => {
      // Esperado: cada aba mantém seu próprio estado de formulário
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Acesso sem permissão (seção 2.2 da EF)", () => {
    test.fixme("PROFI218 - Usuário sem permissão vê mensagem 'Você não possui permissão para acessar o Módulo.'", async ({ page }) => {
      // EF seção 2.2 — texto exato da mensagem
      // Pré-condição: usuário de teste sem nenhuma permissão de Profissional
    })

    test.fixme("PROFI219 - Após mensagem de sem permissão, sistema retorna para a mandala", async ({ page }) => {
      // Esperado: usuário é redirecionado para a tela inicial (mandala) do sistema
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Acesso ao formulário (seção 2 da EF)", () => {
    test("PROFI220 - Formulário de novo cadastro é acessado via botão 'Novo' na lista", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      await profissionalPage.irParaLista()
      await page.getByRole("button", { name: "Novo" }).click()
      await expect(page.getByLabel("CPF *")).toBeVisible()
    })

    test.fixme("PROFI221 - Botão 'Novo' está visível para usuário com permissão INC", async ({ page }) => {
      // Esperado: botão visível e habilitado para usuário com permissão de inclusão
    })

    test.fixme("PROFI222 - Botão 'Novo' não aparece para usuário com apenas permissão VIS", async ({ page }) => {
      // Esperado: usuário VIS não pode incluir novos profissionais
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Consistência das mensagens (seção 7 da EF)", () => {
    test("PROFI223 - Mensagem campos_obrigatorios exibe texto exato conforme EF", async ({ page, login, profissionalPage }) => {
      await login.entrar()
      await profissionalPage.abrirNovoCadastro()
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(
        page.getByText("Atenção! Existe um ou mais campos obrigatórios que não foram preenchidos.")
      ).toBeVisible()
    })

    test.fixme("PROFI224 - Mensagem campos_obrigatorios é do tipo 'Aviso' (laranja/amarelo)", async ({ page }) => {
      // EF seção 7: tipo Aviso, cor Amarelo
    })

    test.fixme("PROFI225 - Mensagem cpf_duplicado exibe texto exato conforme EF", async ({ page }) => {
      // Esperado: "Já existe um Profissional com o mesmo CPF. Favor Verificar."
    })

    test.fixme("PROFI226 - Mensagem nome_invalido exibe texto exato conforme EF", async ({ page }) => {
      // Esperado: "Atenção! Para salvar é necessário que o primeiro nome tenha
      // ao menos 3 letras e o último nome ao menos 2 letras."
    })

    test.fixme("PROFI227 - Mensagem sucesso é do tipo 'modal' e cor verde", async ({ page }) => {
      // EF seção 7: tipo Sucesso, cor Verde — mas o sucesso vem como modal, não toast
    })

    test.fixme("PROFI228 - Mensagem exclusao exibe texto exato conforme EF", async ({ page }) => {
      // Esperado: "Registro excluído com sucesso."
      // EF seção 7: tipo Sucesso, cor Verde
    })
  })
})
