// Cenários da sequência e precedência das ações de validação do Salvar (PROFI183–PROFI205).
// A EF define uma ordem fixa de verificações ao clicar Salvar:
//   Ação 1 → Verificação de campos obrigatórios (CPF, Nome, Cargo)
//   Ação 2 → Verificação de CPF duplicado
//   Ação 3 → Verificação do comprimento mínimo do nome
//   Ação 4 → Certificado digital (c2 turquesa — fora do escopo)
//   Ação 5 → Salva o cadastro
//
// Cada ação só é executada se a anterior passou. Esses testes validam
// que o sistema respeita essa precedência e não "pula" etapas.
import { test, expect } from "@support"
import { cpfUnico } from "@support/utils/cpf"

test.describe("Sequência e Precedência das Ações de Validação do Salvar (E2E)", () => {
  test.beforeEach(async ({ page, login, profissionalPage }) => {
    await login.entrar()
    await profissionalPage.abrirNovoCadastro()
    await page.getByLabel("CPF *").waitFor({ state: "visible" })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Ação 1: campos obrigatórios", () => {
    test("PROFI183 - Ação 1 bloqueia quando CPF vazio, independente dos outros campos", async ({ page }) => {
      // Nome e Cargo preenchidos, CPF vazio → Ação 1 dispara
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI184 - Ação 1 bloqueia quando Nome vazio, independente dos outros campos", async ({ page }) => {
      await page.getByLabel("CPF *").pressSequentially(cpfUnico().replace(/\D/g, ""))
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI185 - Ação 1 bloqueia quando Cargo vazio, independente dos outros campos", async ({ page }) => {
      await page.getByLabel("CPF *").pressSequentially(cpfUnico().replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI186 - Ação 1 bloqueia com múltiplos campos obrigatórios vazios ao mesmo tempo", async ({ page }) => {
      // todos os três obrigatórios vazios → ainda é a Ação 1 e exibe campos_obrigatorios
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
      // NÃO deve exibir mensagem de CPF duplicado nem de nome curto neste momento
      await expect(page.getByText(/mesmo CPF/i)).not.toBeVisible()
      await expect(page.getByText(/primeiro nome/i)).not.toBeVisible()
    })

    test("PROFI187 - NIS vazio não ativa Ação 1 (não é obrigatório)", async ({ page }) => {
      // preenche apenas os obrigatórios (sem NIS) — Ação 1 deve passar
      await page.getByLabel("CPF *").pressSequentially(cpfUnico().replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // NIS vazio não causa campos_obrigatorios — sistema avança para Ação 2+
      await expect(page.getByText(/campos obrigatórios/i)).not.toBeVisible()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Ação 2: CPF duplicado (só avaliada após Ação 1 passar)", () => {
    test.fixme("PROFI188 - Ação 1 tem precedência: campo vazio + CPF dup → exibe só obrigatório", async ({ page }) => {
      // Cenário: CPF está vazio (viola Ação 1) e ao mesmo tempo seria duplicado (Ação 2)
      // Esperado: sistema para na Ação 1 e exibe só "campos obrigatórios", sem exibir
      // a mensagem de CPF duplicado
      // Pré-condição: ter um CPF cadastrado no sistema para usar como duplicado
    })

    test.fixme("PROFI189 - Ação 2 é avaliada depois que Ação 1 passa: CPF dup exibe mensagem própria", async ({ page }) => {
      // Esperado: com todos obrigatórios preenchidos, CPF duplicado gera mensagem específica
      // "Já existe um Profissional com o mesmo CPF. Favor Verificar."
    })

    test.fixme("PROFI190 - Ação 2 tem precedência sobre Ação 3: CPF dup + nome curto → exibe CPF dup", async ({ page }) => {
      // Cenário: CPF duplicado E primeiro nome com < 3 letras
      // Esperado: sistema para na Ação 2 (CPF dup) sem chegar na Ação 3 (nome curto)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Ação 3: comprimento mínimo do nome (só após Ações 1 e 2 passarem)", () => {
    test.fixme("PROFI191 - Ação 3 é avaliada com CPF único: nome curto exibe mensagem específica", async ({ page }) => {
      // Esperado: "Atenção! Para salvar é necessário que o primeiro nome tenha
      // ao menos 3 letras e o último nome ao menos 2 letras."
      // Campo Nome evidenciado em vermelho
    })

    test.fixme("PROFI192 - Ação 3 NÃO é avaliada quando Ação 2 falhou (CPF dup)", async ({ page }) => {
      // Esperado: mensagem do CPF dup aparece mas NÃO a mensagem de nome curto
    })

    test.fixme("PROFI193 - Nome com apenas uma palavra dispara Ação 3", async ({ page }) => {
      // Esperado: sem sobrenome → violação de último nome
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Corrigir erro e avançar para próxima ação", () => {
    test("PROFI194 - Corrigir campo vazio e salvar novamente não exibe mais campos_obrigatorios", async ({ page }) => {
      // primeiro dispara Ação 1
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
      // corrige tudo
      await page.getByLabel("CPF *").pressSequentially(cpfUnico().replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // Ação 1 passou — mensagem de obrigatório não deve mais estar visível
      await expect(page.getByText(/campos obrigatórios/i)).not.toBeVisible()
    })

    test.fixme("PROFI195 - Corrigir CPF duplicado e salvar novamente avança para Ação 3", async ({ page }) => {
      // Pré-condição: reproduzir CPF dup, trocar por CPF único, re-salvar
      // Esperado: mensagem de CPF dup some; se nome for curto, Ação 3 dispara
    })

    test.fixme("PROFI196 - Corrigir nome curto e salvar novamente vai para Ação 5 (sucesso)", async ({ page }) => {
      // Esperado: após corrigir o nome, sistema salva com sucesso
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Múltiplos erros simultâneos vs. precedência", () => {
    test("PROFI197 - Com Ação 1 falhando, somente mensagem de obrigatório aparece", async ({ page }) => {
      // mesmo com nome de 1 letra (Ação 3) e potencial CPF dup (Ação 2),
      // se a Ação 1 falhar só deve aparecer a mensagem de obrigatório
      await page.getByLabel("Nome *").fill("A") // nome muito curto
      // não preenche CPF nem Cargo → Ação 1 falha
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
      await expect(page.getByText(/primeiro nome/i)).not.toBeVisible()
    })

    test.fixme("PROFI198 - Campos afetados pela Ação 1 ficam vermelhos enquanto os da Ação 3 não ficam", async ({ page }) => {
      // Esperado: só os campos obrigatórios vazios ficam vermelhos; o campo
      // Nome (que tem conteúdo, mesmo que curto) não fica vermelho no momento da Ação 1
    })

    test.fixme("PROFI199 - Ao corrigir Ação 1 e re-salvar, Ação 3 pode então detectar nome curto", async ({ page }) => {
      // Esperado: fluxo correto de cascata das ações
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Ação 5: salvar com sucesso (todas as ações anteriores passaram)", () => {
    test("PROFI200 - Com todas as ações passando, sistema salva e exibe modal de sucesso", async ({ page }) => {
      await page.getByLabel("CPF *").pressSequentially(cpfUnico().replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText("Profissional salvo com sucesso")).toBeVisible()
    })

    test.fixme("PROFI201 - Modal de sucesso exibe texto completo conforme EF", async ({ page }) => {
      // Esperado: "Profissional salvo com sucesso. Deseja realizar um novo cadastro?"
    })

    test.fixme("PROFI202 - Modal de sucesso possui botões [Não] e [Sim]", async ({ page }) => {
      // Esperado: dois botões na modal de sucesso
    })

    test.fixme("PROFI203 - [Não] na modal redireciona para lista em branco", async ({ page }) => {
      // EF: "O usuário é redirecionado para tela de lista de Profissionais. Esta aparecerá em branco."
    })

    test.fixme("PROFI204 - [Sim] na modal mantém tela de cadastro com campos em branco", async ({ page }) => {
      // EF: "cadastro é salvo, usuário se mantém na tela de cadastro, exibida em branco conforme default"
    })

    test.fixme("PROFI205 - Após [Sim], todos os campos estão no estado default (branco/desmarcado)", async ({ page }) => {
      // Esperado: CPF="", Nome="", NIS="", Cargo="", flag desmarcada
    })
  })
})
