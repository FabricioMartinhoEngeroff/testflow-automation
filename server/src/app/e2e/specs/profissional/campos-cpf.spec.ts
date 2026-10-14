// Cenários do campo CPF do cadastro de Profissionais (PROFI001–PROFI019).
// Escopo: campo CPF conforme EF "Cadastrar Profissionais" — seção "5 Realizar Cadastros".
// Ignorado intencionalmente: c11 turquesa (campo "Documento principal" por país),
// c10 amarelo (grid de Registros conselho), c9 verde (Cargo 60 chars),
// c6 caqui (permissões IVY), c2/c7 turquesa (certificado, assinatura, módulos).
//
// CPF: descritivo, máx 11 dígitos, máscara 000.000.000-00, numérico,
// sem espaços, colar permitido, obrigatório, único no sistema.
import { test, expect } from "../../../support"

test.describe('Campo "CPF" (E2E)', () => {
  test.beforeEach(async ({ page, login, profissionalPage }) => {
    await login.entrar()
    await profissionalPage.abrirNovoCadastro()
    // garante que o formulário carregou antes de cada cenário
    await page.getByLabel("CPF *").waitFor({ state: "visible" })
  })

  test.describe("Estado inicial", () => {
    test("PROFI001 - Campo visível e habilitado", async ({ page }) => {
      const campo = page.getByLabel("CPF *")
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
    })

    test("PROFI002 - Por default está em branco", async ({ page }) => {
      await expect(page.getByLabel("CPF *")).toHaveValue("")
    })
  })

  test.describe("Tipo e inserção de dados", () => {
    test("PROFI003 - Aceita inserção de dígitos numéricos", async ({ page }) => {
      const campo = page.getByLabel("CPF *")
      await campo.pressSequentially("123")
      // deve aceitar (valor não vazio após digitar)
      const valor = await campo.inputValue()
      expect(valor).not.toBe("")
    })

    test("PROFI004 - Não aceita letras", async ({ page }) => {
      const campo = page.getByLabel("CPF *")
      await campo.pressSequentially("abc")
      await expect(campo).toHaveValue("")
    })

    test("PROFI005 - Não aceita espaços isolados", async ({ page }) => {
      const campo = page.getByLabel("CPF *")
      // tenta digitar só espaços
      await campo.pressSequentially("   ")
      await expect(campo).toHaveValue("")
    })

    test("PROFI006 - Aceita no máximo 11 dígitos", async ({ page }) => {
      const campo = page.getByLabel("CPF *")
      await campo.pressSequentially("123456789012") // 12 dígitos
      // com máscara, 11 dígitos resultam em 14 chars (xxx.xxx.xxx-xx)
      // o 12º dígito não deve ser aceito — remove máscara pra contar só dígitos
      const valor = await campo.inputValue()
      const apenasDigitos = valor.replace(/\D/g, "")
      expect(apenasDigitos.length).toBeLessThanOrEqual(11)
    })

    test("PROFI007 - Máscara 000.000.000-00 aplicada ao digitar", async ({ page }) => {
      const campo = page.getByLabel("CPF *")
      await campo.pressSequentially("12345678909")
      const valor = await campo.inputValue()
      // deve seguir o padrão com pontos e hífen
      expect(valor).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    })

    test.fixme("PROFI008 - Colar CPF formatado (com máscara) via clipboard", async ({ page }) => {
      // Esperado: campo deve aceitar o CPF colado e aplicar/preservar a máscara
      // Não implementado: fill() não dispara evento de "colar" real (ClipboardEvent)
      // — exige simulação via page.evaluate, ver 09-acoes.md do projeto
    })

    test.fixme("PROFI009 - Colar apenas os 11 dígitos sem máscara", async ({ page }) => {
      // Esperado: campo deve aceitar e aplicar a máscara automaticamente
    })
  })

  test.describe("Foco e interação", () => {
    test("PROFI010 - Campo recebe foco ao clicar", async ({ page }) => {
      const campo = page.getByLabel("CPF *")
      await campo.click()
      await expect(campo).toBeFocused()
    })

    test("PROFI011 - Limpar campo após preenchimento", async ({ page }) => {
      const campo = page.getByLabel("CPF *")
      await campo.pressSequentially("12345")
      await campo.fill("")
      await expect(campo).toHaveValue("")
    })

    test.fixme("PROFI012 - Navegação via teclado (TAB) até o campo", async ({ page }) => {
      // Esperado: campo deve ser acessível via TAB na ordem de tabulação da tela
    })
  })

  test.describe("Validação de formato e unicidade", () => {
    test.fixme("PROFI013 - CPF com dígitos verificadores inválidos não é aceito no salvar", async ({ page }) => {
      // Esperado: mensagem de erro indicando CPF inválido
      // EF: "Verificação de CPF Válido" — não especifica se valida ao sair do
      // campo (blur) ou ao salvar. Confirmar comportamento real antes de implementar.
    })

    test.fixme("PROFI014 - CPF com todos os dígitos iguais (ex: 111.111.111-11) é inválido", async ({ page }) => {
      // Esperado: sistema recusa CPF sequencial mesmo que tenha dígitos verificadores "corretos"
    })

    test.fixme("PROFI015 - CPF incompleto (menos de 11 dígitos) não é aceito no salvar", async ({ page }) => {
      // Esperado: campo marcado em vermelho ou mensagem de formato inválido
    })
  })

  test.describe("Obrigatoriedade", () => {
    test("PROFI016 - Salvar sem preencher CPF exibe mensagem de obrigatório", async ({ page }) => {
      // preenche Nome e Cargo para isolar a falta do CPF
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI017 - Campo CPF marcado em vermelho quando obrigatório não preenchido", async ({ page }) => {
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // mat-form-field com erro recebe classe ng-invalid ou aria-invalid
      const campoContainer = page.getByLabel("CPF *").locator("xpath=ancestor::mat-form-field")
      await expect(campoContainer).toHaveClass(/ng-invalid|mat-form-field-invalid/)
    })
  })

  test.describe("Unicidade de CPF", () => {
    test.fixme("PROFI018 - CPF já cadastrado gera mensagem de duplicidade", async ({ page }) => {
      // Esperado: "Já existe um Profissional com o mesmo CPF. Favor Verificar."
      // Pré-condição: CPF usado deve já existir no sistema — exige dado conhecido
      // ou salvar duas vezes com o mesmo CPF no mesmo teste
    })

    test.fixme("PROFI019 - Campo CPF evidenciado em vermelho ao detectar duplicidade", async ({ page }) => {
      // Esperado: campo fica vermelho, dados permanecem na tela para correção
    })
  })
})
