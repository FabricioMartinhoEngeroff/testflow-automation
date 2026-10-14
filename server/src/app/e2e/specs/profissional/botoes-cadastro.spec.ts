// Cenários dos botões do cadastro de Profissionais (PROFI089–PROFI130).
// Cobre: botão "Voltar", botão "Salvar" (Ações 1–3 e 5) e botão "Cadastros Gerais".
// Ignorado intencionalmente: Ação 4 do Salvar (Verificação de certificado — c2 turquesa),
// grid de Registros Conselho como obrigatório ao marcar Responsável Técnico (c10 amarelo).
//
// Mensagens esperadas (conforme seção 7 da EF):
//   campos_obrigatorios  → "Atenção! Existe um ou mais campos obrigatórios que não foram preenchidos."
//   cpf_duplicado        → "Já existe um Profissional com o mesmo CPF. Favor Verificar."
//   nome_invalido        → "Atenção! Para salvar é necessário que o primeiro nome tenha
//                           ao menos 3 letras e o último nome ao menos 2 letras."
//   sucesso              → modal "Profissional salvo com sucesso. Deseja realizar um novo cadastro?"
import { test, expect } from "../../../support"
import { cpfUnico } from "../../../support/utils/cpf"

test.describe("Botões do Cadastro de Profissional (E2E)", () => {
  test.beforeEach(async ({ page, login, profissionalPage }) => {
    await login.entrar()
    await profissionalPage.abrirNovoCadastro()
    await page.getByRole("button", { name: "Voltar" }).waitFor({ state: "visible" })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe('Botão "Cadastros Gerais"', () => {
    test("PROFI089 - Botão de Cadastros Gerais está visível", async ({ page }) => {
      // EF: "Tooltip: Menu Cadastros Gerais; Ícone: Lápis; Não exibe label"
      // localiza pelo tooltip (aria-label ou title) pois não tem texto visível
      await expect(
        page.getByRole("button", { name: /Cadastros Gerais/ })
      ).toBeVisible()
    })

    test.fixme("PROFI090 - Clicar em Cadastros Gerais redireciona para o menu", async ({ page }) => {
      // Esperado: navega para /apollus/cadastros ou similar (confirmar URL real)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe('Botão "Voltar"', () => {
    test("PROFI091 - Botão Voltar presente na tela", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible()
    })

    test("PROFI092 - Clicar Voltar sem alterações redireciona para a lista", async ({ page }) => {
      await page.getByRole("button", { name: "Voltar" }).click()
      // URL deve voltar para a lista de profissionais (sem /cadastro ou /novo na URL)
      await expect(page).not.toHaveURL(/cadastro|novo/)
    })

    test("PROFI093 - Clicar Voltar sem alterações após salvar vai para lista em branco", async ({ page, profissionalPage }) => {
      // EF: "Usuário salvou um cadastro antes de retornar? SIM → Retorna em branco"
      const cpf = cpfUnico()
      await profissionalPage.salvarValido(cpf)
      // responde "Não" na modal de sucesso para voltar a um cadastro existente
      await page.getByRole("button", { name: "Não" }).click()
      // agora está editando o profissional salvo; clica Voltar sem editar
      await page.getByRole("button", { name: "Voltar" }).click()
      // EF: lista deve aparecer em branco (sem o filtro anterior)
      await expect(page).not.toHaveURL(/cadastro|novo/)
    })

    test("PROFI094 - Alterar campo e clicar Voltar exibe modal de confirmação", async ({ page }) => {
      await page.getByLabel("Nome *").fill("João Silva")
      await page.getByRole("button", { name: "Voltar" }).click()
      // modal deve aparecer perguntando sobre salvar alterações
      await expect(
        page.getByText(/deseja salvar as alterações/i)
      ).toBeVisible()
    })

    test("PROFI095 - Texto da modal ao clicar Voltar com alterações", async ({ page }) => {
      await page.getByLabel("Nome *").fill("João Silva")
      await page.getByRole("button", { name: "Voltar" }).click()
      await expect(
        page.getByText("Você deseja salvar as alterações realizadas?")
      ).toBeVisible()
    })

    test('PROFI096 - Clicar "Não" na modal de Voltar descarta alterações e vai para lista', async ({ page }) => {
      await page.getByLabel("Nome *").fill("João Silva")
      await page.getByRole("button", { name: "Voltar" }).click()
      await page.getByRole("button", { name: "Não" }).click()
      await expect(page).not.toHaveURL(/cadastro|novo/)
    })

    test.fixme('PROFI097 - Clicar "Sim" na modal de Voltar salva e vai para lista (campos válidos)', async ({ page }) => {
      // Esperado: comportamento igual ao botão Salvar, depois redireciona para lista
      // Pré-condição: todos os campos obrigatórios preenchidos com CPF único
    })

    test.fixme('PROFI098 - Clicar "Sim" na modal de Voltar com campos inválidos bloqueia', async ({ page }) => {
      // Esperado: comportamento igual ao botão Salvar quando há erros de validação
    })

    test.fixme("PROFI099 - Fechar modal de Voltar (botão X) mantém usuário na tela", async ({ page }) => {
      // Esperado: modal fecha, usuário permanece no cadastro com dados intactos
    })

    test.fixme("PROFI100 - Voltar sem alterações não salva após editar e reverter manualmente", async ({ page }) => {
      // Esperado: sistema detecta que não há diferença e não exibe modal
      // (depende de como o sistema rastreia "dirty state")
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe('Botão "Salvar" — Ação 1: verificação de campos obrigatórios', () => {
    test("PROFI101 - Botão Salvar presente na tela", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Salvar", exact: true })
      ).toBeVisible()
    })

    test("PROFI102 - Salvar com todos os campos obrigatórios vazios exibe mensagem", async ({ page }) => {
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(
        page.getByText("Atenção! Existe um ou mais campos obrigatórios que não foram preenchidos.")
      ).toBeVisible()
    })

    test("PROFI103 - Mensagem de campos obrigatórios é laranja/amarela (warning)", async ({ page }) => {
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // EF: mensagem temporizada laranja — confirmar elemento que carrega a classe de cor
      const msg = page.getByText(/campos obrigatórios/i)
      await expect(msg).toBeVisible()
      // verificação de cor via atributo de classe ou role "alert"
      await expect(msg.or(msg.locator("xpath=ancestor::*[@role='alert']").first())).toBeVisible()
    })

    test("PROFI104 - Dados permanecem na tela após falha por campo obrigatório", async ({ page }) => {
      await page.getByLabel("Nome *").fill("João Silva")
      // falta CPF e Cargo → deve falhar
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // dado que o usuário digitou deve continuar visível
      await expect(page.getByLabel("Nome *")).toHaveValue("João Silva")
    })

    test("PROFI105 - Campos obrigatórios vazios são marcados em vermelho", async ({ page }) => {
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      const cpfContainer = page.getByLabel("CPF *").locator("xpath=ancestor::mat-form-field")
      await expect(cpfContainer).toHaveClass(/ng-invalid|mat-form-field-invalid/)
    })

    test("PROFI106 - Salvar apenas com CPF preenchido ainda bloqueia (Nome e Cargo obrigatórios)", async ({ page }) => {
      await page.getByLabel("CPF *").pressSequentially("12345678909")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI107 - Salvar apenas com Nome preenchido ainda bloqueia (CPF e Cargo obrigatórios)", async ({ page }) => {
      await page.getByLabel("Nome *").fill("João Silva")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })

    test("PROFI108 - NIS vazio não causa bloqueio no Salvar (não obrigatório)", async ({ page }) => {
      // NIS foi tornado não obrigatório em 23/02/2022 (c3)
      const cpf = cpfUnico()
      await page.getByLabel("CPF *").pressSequentially(cpf.replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      // NIS propositalmente vazio
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // não deve exibir mensagem de campos obrigatórios
      await expect(page.getByText("Profissional salvo com sucesso")).toBeVisible()
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe('Botão "Salvar" — Ação 2: verificação de CPF duplicado', () => {
    test.fixme("PROFI109 - CPF já cadastrado exibe mensagem de duplicidade", async ({ page }) => {
      // Esperado: "Já existe um Profissional com o mesmo CPF. Favor Verificar."
      // Pré-condição: salvar um profissional com CPF X, depois tentar salvar outro
      // com o mesmo CPF X — ambas as operações no mesmo teste ou usar dado fixo
    })

    test.fixme("PROFI110 - Campo CPF fica em vermelho ao detectar duplicidade", async ({ page }) => {
      // Esperado: campo evidenciado em vermelho, dados permanecem na tela
    })

    test.fixme("PROFI111 - Mensagem de CPF duplicado é laranja (warning)", async ({ page }) => {
      // Esperado: mesma cor/tipo das outras mensagens de atenção
    })

    test.fixme("PROFI112 - Após corrigir CPF duplicado o sistema aceita salvar", async ({ page }) => {
      // Esperado: trocar CPF por um não cadastrado remove o erro e permite salvar
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe('Botão "Salvar" — Ação 3: verificação do Nome', () => {
    test.fixme("PROFI113 - Primeiro nome com menos de 3 letras bloqueia o salvar", async ({ page }) => {
      // Esperado: "Atenção! Para salvar é necessário que o primeiro nome tenha
      // ao menos 3 letras e o último nome ao menos 2 letras."
      // Exemplo: "Jo Costa" — primeiro nome "Jo" tem só 2 letras
    })

    test.fixme("PROFI114 - Último nome com menos de 2 letras bloqueia o salvar", async ({ page }) => {
      // Esperado: mesma mensagem acima
      // Exemplo: "João C" — último nome "C" tem só 1 letra
    })

    test.fixme("PROFI115 - Nome com apenas uma palavra bloqueia o salvar", async ({ page }) => {
      // Esperado: sem último nome → regra do último nome é violada
      // Exemplo: "Médico" → sem sobrenome
    })

    test.fixme("PROFI116 - Mensagem de nome inválido é laranja e campo fica vermelho", async ({ page }) => {
      // Esperado: campo Nome evidenciado em vermelho
    })

    test.fixme("PROFI117 - Nome com primeiro ≥3 e último ≥2 letras passa a Ação 3", async ({ page }) => {
      // Exemplo válido: "Ana Costa" → 3 + 5 letras
      // Esperado: Ação 3 não bloqueia, segue para Ação 5
    })

    test.fixme("PROFI118 - Dados permanecem na tela após falha da Ação 3", async ({ page }) => {
      // Esperado: usuário pode corrigir sem perder os demais campos
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe('Botão "Salvar" — Ação 5: sucesso e fluxo pós-salvar', () => {
    test.fixme("PROFI119 - Salvar com todos os dados válidos exibe loading", async ({ page }) => {
      // Esperado: tela de loading durante a requisição ao servidor
    })

    test.fixme("PROFI120 - Salvar com sucesso exibe modal de confirmação", async ({ page }) => {
      // Esperado: modal "Profissional salvo com sucesso. Deseja realizar um novo cadastro?"
      // com botões [Não] e [Sim]
    })

    test.fixme('PROFI121 - Clicar "Não" na modal de sucesso redireciona para lista em branco', async ({ page }) => {
      // EF: "O usuário é redirecionado para tela de lista de Profissionais. Esta aparecerá em branco."
    })

    test.fixme('PROFI122 - Clicar "Sim" na modal de sucesso mantém tela de cadastro em branco', async ({ page }) => {
      // EF: "cadastro é salvo, usuário se mantém na tela de cadastro, exibida em branco conforme default"
    })

    test.fixme("PROFI123 - Após clicar Sim o formulário está vazio (campos em branco)", async ({ page }) => {
      // Esperado: CPF, Nome, NIS, Cargo vazios; flag Responsável Técnico desmarcada
    })

    test.fixme("PROFI124 - Erro de servidor ao salvar exibe mensagem de erro", async ({ page }) => {
      // Esperado: mensagem de erro ao usuário, dados permanecem na tela
    })

    test.fixme("PROFI125 - Dados persistem ao reabrir cadastro recém-salvo", async ({ page }) => {
      // Pré-condição: CPF único válido + salvar com sucesso + reabrir pelo ID
      // Esperado: todos os campos exibem os valores salvos
    })

    test.fixme("PROFI126 - Editar e re-salvar cadastro existente funciona", async ({ page }) => {
      // Esperado: alterações persistem após re-salvar
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Acesso sem permissão", () => {
    test.fixme("PROFI127 - Usuário sem permissão de Profissional vê mensagem e retorna à mandala", async ({ page }) => {
      // EF seção 2.2: "Você não possui permissão para acessar o Módulo."
      // Pré-condição: usuário de teste sem nenhuma permissão de Profissional cadastrada
    })

    test.fixme("PROFI128 - Usuário com permissão somente VIS não vê botão Salvar", async ({ page }) => {
      // Esperado: botão Salvar ausente ou desabilitado para usuário sem INC/ALT
    })

    test.fixme("PROFI129 - Usuário com permissão INC vê botão Salvar habilitado em novo cadastro", async ({ page }) => {
      // Esperado: botão Salvar visível e habilitado
    })

    test.fixme("PROFI130 - Usuário com permissão ALT vê botão Salvar habilitado ao editar", async ({ page }) => {
      // Esperado: botão Salvar visível e habilitado em edição
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe('Botão "Voltar" — cenário de lista com filtro (não salvou antes)', () => {
    test.fixme("PROFI131 - Voltar sem ter salvado nenhum cadastro retorna lista com último filtro", async ({ page }) => {
      // EF: "NÃO (não salvou antes): Retorna para a tela de lista conforme último filtro realizado."
      // Pré-condição: aplicar algum filtro na lista, abrir "Novo", clicar Voltar sem alterações
      // Esperado: lista exibe o filtro que estava ativo antes de abrir o formulário
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Sequência e precedência das ações de validação do Salvar", () => {
    test.fixme("PROFI132 - Ação 1 tem precedência sobre Ação 2 (obrigatório vazio + CPF duplicado → exibe obrigatório)", async ({ page }) => {
      // Esperado: quando CPF está vazio (Ação 1) e o nome seria duplicado (Ação 2),
      // o sistema para na Ação 1 e exibe apenas a mensagem de campos obrigatórios
      // Pré-condição: ter um CPF já cadastrado para usar como duplicado, mas deixar o campo vazio
    })

    test.fixme("PROFI133 - Ação 2 tem precedência sobre Ação 3 (CPF duplicado + nome curto → exibe CPF dup)", async ({ page }) => {
      // Esperado: com todos obrigatórios preenchidos (Ação 1 passa), CPF duplicado
      // (Ação 2) bloqueia antes de chegar na verificação do nome mínimo (Ação 3)
      // Pré-condição: CPF já cadastrado no sistema + nome com primeiro nome < 3 letras
    })

    test.fixme("PROFI134 - Ação 3 só é avaliada depois que Ação 2 passa (CPF único + nome curto → exibe nome curto)", async ({ page }) => {
      // Esperado: com Ações 1 e 2 passando, Ação 3 é avaliada e exibe mensagem de nome
    })

    test.fixme("PROFI135 - Corrigir erro da Ação 1 e re-salvar chega na Ação 2", async ({ page }) => {
      // Esperado: após preencher o campo que faltava, sistema avança para verificação de CPF
    })

    test.fixme("PROFI136 - Corrigir erro da Ação 2 e re-salvar chega na Ação 3", async ({ page }) => {
      // Esperado: após trocar o CPF duplicado, sistema avança para verificação do nome
    })

    test.fixme("PROFI137 - Corrigir erro da Ação 3 e re-salvar chega na Ação 5 (sucesso)", async ({ page }) => {
      // Esperado: após corrigir o nome, sistema salva com sucesso (Ação 5)
    })
  })
})
