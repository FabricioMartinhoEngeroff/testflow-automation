// SETUP/SCAFFOLD — cenários da planilha real (TST1014-TST1063), aba Configurações
// do cadastro de PGR. Usamos test.fixme() em vez de test() normal: declara o teste
// (aparece no relatório, agrupado, com o ID rastreável até a planilha), mas NÃO
// executa nada ainda. Isso evita inventar 50 seletores sem nunca ter visto a tela
// real — o que daria falso-positivo (teste "passando" sem checar nada de verdade).
// Pra implementar um teste de verdade: troca `test.fixme` por `test`, apaga o
// comentário "Esperado" (vira a asserção final) e escreve ação + expect reais.
//
// Doc de referência (ver ef/playwright/):
// - Checkboxes (Sugerir, Bloquear, campo 02, 03, 04, 05, 08-21) → 09-acoes (check/uncheck),
//   10-afirmacoes (toBeChecked)
// - Textarea (campo 06) → 09-acoes (fill/clear)
// - Botão "Restaurar Texto Padrão" → 09-acoes (click) + 10-afirmacoes (toHaveValue)
// - Campos habilitando/desabilitando conforme outro campo → 12-espera-automatica
//   (o Playwright já espera o estado "habilitado" mudar sozinho, sem wait manual)
import { test, expect } from "../../../support"
import { URLS } from "../../../support/urls"

test.describe("Aba Configurações (E2E)", () => {
  test.beforeEach(async ({ page, login, pgr }) => {
    await login.entrar()
    await pgr.abrirNovoCadastro()
    await pgr.abrirAba("Configurações")
  })

  test.describe("Usabilidade + Regras + Dependências das configurações", () => {
    test("TST1014 - Acessar aba Configurações com dados padrão", async ({ page }) => {
      // valores default já mapeados nos outros grupos deste arquivo — aqui
      // confirmamos o conjunto junto, como "foto" do estado inicial da aba
      await expect(page.getByRole("checkbox", { name: "Cargo" })).toBeChecked()
      await expect(page.getByRole("checkbox", { name: "GHE", exact: true })).toBeChecked()
      await expect(page.getByRole("checkbox", { name: "Incluir riscos associados às atividades do GHE" })).toBeChecked()
      await expect(page.getByRole("checkbox", { name: /Incluir GHEs sem riscos/ })).toBeChecked()
      await expect(page.getByRole("textbox", { name: /Incluir GHEs sem riscos - Descritivo/ })).toBeEnabled()
    })
    test.fixme("TST1015 - Validar comportamento geral com \"Sugerir\" desmarcado", async ({ page }) => {
      // Esperado: Todos os campos devem assumir valores padrão definidos
      // Ainda não implementado: "Sugerir"/"Bloquear" pertencem a uma tela
      // separada ("Configuração Geral", visível no menu lateral), não à
      // própria aba Configurações do cadastro do PGR — não exploramos essa
      // tela ainda
    })
    test.fixme("TST1016 - Validar comportamento geral com \"Sugerir\" marcado", async ({ page }) => {
      // Mesmo motivo do TST1015
    })
    test.fixme("TST1017 - Validar comportamento com \"Bloquear\" marcado", async ({ page }) => {
      // Mesmo motivo do TST1015
    })
    test.fixme("TST1018 - Validar comportamento com \"Bloquear\" desmarcado", async ({ page }) => {
      // Mesmo motivo do TST1015
    })
    test.fixme("TST1019 - Validar combinação \"Sugerir + Bloquear\"", async ({ page }) => {
      // Mesmo motivo do TST1015
    })
    test("TST1020 - Alterar múltiplas configurações e salvar", async ({ page, pgr }) => {
      // não assume qual é o padrão de cada checkbox (varia por campo) —
      // captura o estado inicial de verdade e espera o oposto depois de salvar
      const alvos = ["Incluir fotos dos GHEs", "Incluir GHEs sem integrantes", "Mecânico/Acidente"]
      const estadosIniciais: boolean[] = []
      for (const label of alvos) {
        estadosIniciais.push(await page.getByRole("checkbox", { name: label }).isChecked())
        await pgr.clicarCheckboxMaterial(label)
      }
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Configurações")
      for (const [i, label] of alvos.entries()) {
        await expect(page.getByRole("checkbox", { name: label })).toBeChecked({ checked: !estadosIniciais[i] })
      }
    })
    test("TST1021 - Alterar e atualizar página sem salvar", async ({ page, pgr }) => {
      // salva um estado base primeiro (senão recarregar uma página nunca
      // salva simplesmente perde o rascunho inteiro, não testa "descartar
      // uma alteração específica")
      await pgr.preencherCadastroValidoESalvar()
      await pgr.abrirAba("Configurações")
      await pgr.clicarCheckboxMaterial("Incluir fotos dos GHEs")
      await expect(page.getByRole("checkbox", { name: "Incluir fotos dos GHEs" })).not.toBeChecked()
      await page.reload()
      await pgr.abrirAba("Configurações")
      // não foi salvo -> volta pro estado marcado (default) que tínhamos
      // persistido no preencherCadastroValidoESalvar
      await expect(page.getByRole("checkbox", { name: "Incluir fotos dos GHEs" })).toBeChecked()
    })
    test("TST1022 - Salvar e reabrir tela", async ({ page, pgr }) => {
      await pgr.clicarCheckboxMaterial("Incluir fotos dos GHEs")
      await pgr.preencherCadastroValidoESalvar()
      const urlComIdkey = page.url()
      // "reabrir" de verdade: navega pra fora e volta pela mesma URL com
      // idkey, em vez de só dar reload na mesma página
      await page.goto(URLS.pgr)
      await page.goto(urlComIdkey)
      await pgr.abrirAba("Configurações")
      await expect(page.getByRole("checkbox", { name: "Incluir fotos dos GHEs" })).not.toBeChecked()
    })
    test.fixme("TST1023 - Validar layout geral", async ({ page }) => {
      // Esperado: Campos devem estar alinhados e organizados
    })
    test.fixme("TST1024 - Validar labels e textos", async ({ page }) => {
      // Esperado: Devem estar corretos e sem erro
    })
    test.fixme("TST1025 - Validar scroll da tela", async ({ page }) => {
      // Esperado: Deve permitir navegação completa
    })
    // TST1026: "performance da tela" não é um bom candidato a E2E funcional do
    // Playwright (não é asserção de comportamento, é medição de performance) —
    // mantido como fixme só pra rastreabilidade com a planilha, mas provavelmente
    // fica de fora do escopo de automação (ver "cenários fáceis vs difíceis" no
    // projeto)
    test.fixme("TST1026 - Validar performance da tela", async ({ page }) => {
      // Esperado: Deve responder sem travamentos
    })
  })

  test.describe("Campo 02 → Campo 11", () => {
    // Confirmado com a EF (2026-07-23): campo 02 = "Exibir a descrição das
    // atividades por: Cargo/GHE"; campo 11 = "Incluir riscos associados às
    // atividades do GHE". Num cadastro novo os dois checkboxes do campo 02
    // já vêm marcados por padrão (e campo 11 já habilitado)
    const LABEL_CAMPO11 = "Incluir riscos associados às atividades do GHE"

    function checkboxConfiguracoes(page: import("@playwright/test").Page, nome: string) {
      return page.getByRole("tabpanel", { name: "Configurações" }).getByText(nome, { exact: true })
    }

    test("TST1027 - Marcar \"GHE\" no campo 02", async ({ page }) => {
      const campo11 = page.getByRole("checkbox", { name: LABEL_CAMPO11 })
      // parte do estado desmarcado pra testar a ação de "marcar" de verdade
      await checkboxConfiguracoes(page, "GHE").click()
      await expect(campo11).toBeDisabled()
      await checkboxConfiguracoes(page, "GHE").click()
      await expect(campo11).toBeEnabled()
      await expect(campo11).toBeChecked()
    })
    test("TST1028 - Desmarcar \"GHE\" no campo 02", async ({ page }) => {
      const campo11 = page.getByRole("checkbox", { name: LABEL_CAMPO11 })
      await checkboxConfiguracoes(page, "GHE").click()
      await expect(campo11).toBeDisabled()
      await expect(campo11).not.toBeChecked()
    })
    test("TST1029 - Marcar apenas \"Cargo\"", async ({ page }) => {
      // "Cargo" já vem marcado por padrão — só precisa desmarcar GHE
      const campo11 = page.getByRole("checkbox", { name: LABEL_CAMPO11 })
      await checkboxConfiguracoes(page, "GHE").click()
      await expect(page.getByRole("checkbox", { name: "Cargo" })).toBeChecked()
      await expect(campo11).toBeDisabled()
    })
    test.fixme("TST1030 - Desmarcar ambas opções do campo 02", async ({ page }) => {
      // Esperado: Sistema deve impedir (obrigatório ao menos um)
      // Descoberta (2026-07-23): desmarcar as duas NÃO é bloqueado no clique
      // em si — os dois checkboxes ficam desmarcados normalmente. A regra
      // "obrigatório ao menos um" provavelmente só é validada ao clicar em
      // "Salvar" (formulário inteiro), não implementado ainda por depender
      // dos outros campos obrigatórios também estarem preenchidos
    })
    test("TST1031 - Marcar ambas opções", async ({ page }) => {
      // já é o estado padrão — confirma que não há bloqueio/erro com as
      // duas marcadas ao mesmo tempo
      await expect(page.getByRole("checkbox", { name: "Cargo" })).toBeChecked()
      await expect(page.getByRole("checkbox", { name: "GHE", exact: true })).toBeChecked()
    })
    test.fixme("TST1032 - Validar regra quando aba \"Atividades x Fatores de Risco\" está oculta", async ({ page }) => {
      // Esperado: Campo 11 não deve aparecer e regra não deve ser aplicada
      // Ainda não implementado: depende de uma configuração externa ao PGR
      // (módulo GRO - Gerenciamento de Riscos Ocupacionais) que não mapeamos ainda
    })
  })

  test.describe("Campo 05 → Campo 06 + Botão 07", () => {
    // Descoberta rodando contra o ambiente real (2026-07-23): num cadastro
    // novo, "Incluir GHEs sem riscos" já vem MARCADO por padrão (e o campo
    // 06 já habilitado com o texto padrão). Por isso os testes abaixo
    // desmarcam primeiro quando precisam partir do estado "desmarcado".
    const LABEL_CHECKBOX = "Incluir GHEs sem riscos"
    const LABEL_TEXTAREA = /Incluir GHEs sem riscos - Descritivo/
    const LABEL_BOTAO_RESTAURAR = "Restaurar texto padrão"

    test("TST1033 - Marcar \"Incluir GHEs sem riscos\"", async ({ page, pgr }) => {
      const checkbox = page.getByRole("checkbox", { name: LABEL_CHECKBOX })
      const textarea = page.getByRole("textbox", { name: LABEL_TEXTAREA })
      const textoPadrao = await textarea.inputValue()

      // parte do estado desmarcado pra testar a ação de "marcar" de verdade
      await pgr.clicarCheckboxMaterial(LABEL_CHECKBOX)
      await expect(checkbox).not.toBeChecked()

      await pgr.clicarCheckboxMaterial(LABEL_CHECKBOX)
      await expect(checkbox).toBeChecked()
      await expect(textarea).toBeEnabled()
      await expect(textarea).toHaveValue(textoPadrao)
    })

    test("TST1034 - Desmarcar campo 05", async ({ page, pgr }) => {
      const checkbox = page.getByRole("checkbox", { name: LABEL_CHECKBOX })
      const textarea = page.getByRole("textbox", { name: LABEL_TEXTAREA })

      await pgr.clicarCheckboxMaterial(LABEL_CHECKBOX)

      await expect(checkbox).not.toBeChecked()
      await expect(textarea).toBeDisabled()
      await expect(textarea).toHaveValue("")
    })

    test("TST1035 - Editar texto do campo 06", async ({ page }) => {
      const textarea = page.getByRole("textbox", { name: LABEL_TEXTAREA })
      // campo 06 já vem habilitado por padrão (checkbox marcado de início)
      await textarea.fill("Texto de observação customizado para este GHE.")
      await expect(textarea).toHaveValue("Texto de observação customizado para este GHE.")
    })

    test("TST1036 - Inserir texto acima de 400 caracteres", async ({ page }) => {
      const textarea = page.getByRole("textbox", { name: LABEL_TEXTAREA })
      await textarea.fill("a".repeat(450))
      // o campo bloqueia a digitação além do limite — só os 400 primeiros entram
      await expect(textarea).toHaveValue("a".repeat(400))
    })

    test("TST1037 - Deixar campo 06 vazio (quando habilitado)", async ({ page }) => {
      // preenche o resto do cadastro manualmente (sem usar
      // preencherCadastroValidoESalvar, que restaura o texto padrão desse
      // campo automaticamente — aqui queremos exatamente o oposto: ele vazio)
      await page.getByRole("tab", { name: "Referências" }).click()
      await page.getByLabel("Responsável técnico *").click()
      await page.locator("mat-option").first().click()
      await page.getByLabel("Modelo de documento *").click()
      await page.locator("mat-option").first().click()
      await page.getByPlaceholder("Início").fill("01/01/2026")
      await page.keyboard.press("Tab")
      await page.keyboard.type("31/12/2026")
      await page.getByLabel("Data Base").fill("01/01/2026")

      await page.getByRole("tab", { name: "Configurações" }).click()
      const textarea = page.getByRole("textbox", { name: LABEL_TEXTAREA })
      await textarea.fill("")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()

      // toast de campos obrigatórios é temporizado e pode já ter sumido —
      // a marca visual do campo (borda vermelha via classe Angular) é mais confiável
      await expect(textarea).toHaveClass(/ng-invalid/)
    })

    test.fixme("TST1038 - Clicar no botão \"Restaurar Texto Padrão\"", async ({ page }) => {
      // Esperado: Deve limpar e restaurar texto padrão
      // Desativado (2026-07-24): o valor "sugerido" desse campo na tela
      // Configuração Geral foi alterado manualmente pra uma nota de bug
      // (diferente do texto oficial que "Restaurar Texto Padrão" produz) —
      // o teste assume que os dois são iguais, o que não é mais verdade
      // enquanto essa config estiver assim
    })

    test("TST1039 - Clicar no botão com campo desabilitado", async ({ page, pgr }) => {
      const botaoRestaurar = page.getByRole("button", { name: LABEL_BOTAO_RESTAURAR })

      // desmarca o checkbox pra desabilitar o campo 06 (e, com ele, o botão)
      await pgr.clicarCheckboxMaterial(LABEL_CHECKBOX)

      // igual ao TST244 do cabeçalho: o botão simplesmente não é clicável
      // nesse estado, então a "ação não executada" é o próprio botão desabilitado
      await expect(botaoRestaurar).toBeDisabled()
    })

    test("TST1040 - Alterar texto e salvar", async ({ page, pgr }) => {
      const textarea = page.getByRole("textbox", { name: LABEL_TEXTAREA })
      await textarea.fill("texto customizado pra testar persistencia")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Configurações")
      await expect(page.getByRole("textbox", { name: LABEL_TEXTAREA })).toHaveValue("texto customizado pra testar persistencia")
    })
    test.fixme("TST1041 - Restaurar texto e salvar", async ({ page }) => {
      // Esperado: Deve manter texto padrão
      // Desativado (2026-07-24): mesmo motivo do TST1038 — valor "sugerido"
      // e valor de "Restaurar Texto Padrão" divergem por config alterada manualmente
    })
  })

  test.describe("Checkboxes independentes (03, 04, 08, 09...21)", () => {
    // labels reais conferidos na tela (2026-07-23) — os dois primeiros ficam
    // na coluna esquerda, os demais na coluna direita ("Incluir riscos das
    // categorias"). Não incluem "Cargo"/"GHE" nem "Incluir GHEs sem riscos"
    // porque esses têm lógica de habilita/desabilita testada em outro grupo
    const LABELS_CHECKBOXES_INDEPENDENTES = [
      "Incluir fotos dos GHEs",
      "Incluir GHEs sem integrantes",
      "Mecânico/Acidente",
      "Ergonômico/Psicossocial",
      "Incluir código eSocial",
      "Incluir CAS number",
      "Incluir riscos associados às atividades do GHE",
      "Retirar nível de risco da avaliação qualitativa",
      "Incluir tipo de avaliação",
      "Incluir registro de medições",
      "Incluir equipamentos de medição",
      "Incluir certificado de calibração dos equipamentos de medição",
      "Incluir técnica de medição",
      "Incluir variáveis do cálculo IREQ",
      "Ocultar resultados de ruído com o fator de troca q3",
      "Incluir fichas de campo",
      "Incluir laudo da amostra",
      "Sinalizar EPI com CA vencido",
    ]

    test("TST1042 - Marcar e desmarcar qualquer checkbox", async ({ page, pgr }) => {
      const checkbox = page.getByRole("checkbox", { name: "Mecânico/Acidente" })
      const estadoInicial = await checkbox.isChecked()

      await pgr.clicarCheckboxMaterial("Mecânico/Acidente")
      await expect(checkbox).toBeChecked({ checked: !estadoInicial })

      await pgr.clicarCheckboxMaterial("Mecânico/Acidente")
      await expect(checkbox).toBeChecked({ checked: estadoInicial })
    })

    test("TST1043 - Marcar múltiplos checkboxes", async ({ page, pgr }) => {
      const alvo1 = page.getByRole("checkbox", { name: "Incluir fotos dos GHEs" })
      const alvo2 = page.getByRole("checkbox", { name: "Incluir código eSocial" })
      const estado1 = await alvo1.isChecked()
      const estado2 = await alvo2.isChecked()

      await pgr.clicarCheckboxMaterial("Incluir fotos dos GHEs")
      await pgr.clicarCheckboxMaterial("Incluir código eSocial")

      // cada um muda pro estado oposto do seu próprio inicial, de forma
      // independente — clicar em um não deve afetar o outro
      await expect(alvo1).toBeChecked({ checked: !estado1 })
      await expect(alvo2).toBeChecked({ checked: !estado2 })
    })

    test.fixme("TST1044 - Validar valores padrão (ex: alguns marcados, outros não)", async ({ page }) => {
      // Esperado: Devem seguir documentação
      // Tentativa real (2026-07-24): os valores padrão documentados na EF
      // (ex: "Mecânico/Acidente" e "Ergonômico/Psicossocial" desmarcados por
      // script) NÃO batem com o ambiente real — hoje TODOS os checkboxes
      // desta lista nascem marcados. Como o default de cada campo é
      // controlado pela tela "Configuração Geral" (toggle "Sugerir", ver
      // aviso no fim do arquivo), esse valor pode ter sido alterado por
      // qualquer usuário do ambiente compartilhado a qualquer momento — não
      // dá pra tratar a EF como fonte confiável do estado atual aqui
    })
    test("TST1045 - Validar persistência após salvar e reabrir", async ({ page, pgr }) => {
      const checkbox = page.getByRole("checkbox", { name: "Ergonômico/Psicossocial" })
      const estadoInicial = await checkbox.isChecked()
      await pgr.clicarCheckboxMaterial("Ergonômico/Psicossocial")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Configurações")
      await expect(page.getByRole("checkbox", { name: "Ergonômico/Psicossocial" })).toBeChecked({ checked: !estadoInicial })
    })
    test.fixme("TST1046 - Validar impacto no documento gerado", async ({ page }) => {
      // Esperado: Deve refletir corretamente cada opção
      // Depende de gerar o PGR e inspecionar o arquivo de saída — fora do
      // escopo de interação de UI pura
    })

    test("TST1047 - Validar combinação de vários checkboxes", async ({ page, pgr }) => {
      // marca um subconjunto e confirma que só esses ficam marcados, sem
      // "vazar" estado pros outros (não é um grupo exclusivo tipo radio)
      const alvos = ["Mecânico/Acidente", "Incluir tipo de avaliação", "Incluir fichas de campo"]
      for (const label of alvos) {
        const checkbox = page.getByRole("checkbox", { name: label })
        if (await checkbox.isChecked()) await pgr.clicarCheckboxMaterial(label)
        await pgr.clicarCheckboxMaterial(label)
        await expect(checkbox).toBeChecked()
      }
      for (const label of alvos) {
        await expect(page.getByRole("checkbox", { name: label })).toBeChecked()
      }
    })

    test("TST1048 - Validar comportamento com todos desmarcados", async ({ page, pgr }) => {
      for (const label of LABELS_CHECKBOXES_INDEPENDENTES) {
        const checkbox = page.getByRole("checkbox", { name: label })
        if (await checkbox.isChecked()) await pgr.clicarCheckboxMaterial(label)
      }
      for (const label of LABELS_CHECKBOXES_INDEPENDENTES) {
        await expect(page.getByRole("checkbox", { name: label })).not.toBeChecked()
      }
      // a tela continua utilizável (não trava/quebra) com tudo desmarcado
      await expect(page.getByRole("tab", { name: "Configurações" })).toBeVisible()
    })

    test("TST1049 - Validar comportamento com todos marcados", async ({ page, pgr }) => {
      for (const label of LABELS_CHECKBOXES_INDEPENDENTES) {
        const checkbox = page.getByRole("checkbox", { name: label })
        if (!(await checkbox.isChecked())) await pgr.clicarCheckboxMaterial(label)
      }
      for (const label of LABELS_CHECKBOXES_INDEPENDENTES) {
        await expect(page.getByRole("checkbox", { name: label })).toBeChecked()
      }
      await expect(page.getByRole("tab", { name: "Configurações" })).toBeVisible()
    })
  })

  test.describe("Cenários gerais", () => {
    test("TST1050 - Marcar/desmarcar rapidamente campo 05 várias vezes", async ({ page, pgr }) => {
      const textarea = page.getByRole("textbox", { name: /Incluir GHEs sem riscos - Descritivo/ })
      const textoPadrao = await textarea.inputValue()
      // clica 6x seguidas sem esperar entre cliques (desmarca-marca-desmarca...)
      for (let i = 0; i < 6; i++) {
        await pgr.clicarCheckboxMaterial("Incluir GHEs sem riscos")
      }
      // 6 cliques a partir de "marcado" termina desmarcado (par -> volta ao
      // estado original marcado; ajustamos a expectativa pelo nº de cliques)
      const checkbox = page.getByRole("checkbox", { name: /Incluir GHEs sem riscos/ })
      const marcadoNoFinal = await checkbox.isChecked()
      if (marcadoNoFinal) {
        await expect(textarea).toHaveValue(textoPadrao)
      } else {
        await expect(textarea).toHaveValue("")
      }
    })
    test("TST1051 - Alterar campo 02 rapidamente e conferir campo 11", async ({ page }) => {
      const campo11 = page.getByRole("checkbox", { name: "Incluir riscos associados às atividades do GHE" })
      for (let i = 0; i < 4; i++) {
        await page.getByRole("tabpanel", { name: "Configurações" }).getByText("GHE", { exact: true }).click()
      }
      const gheMarcadoNoFinal = await page.getByRole("checkbox", { name: "GHE", exact: true }).isChecked()
      if (gheMarcadoNoFinal) {
        await expect(campo11).toBeEnabled()
      } else {
        await expect(campo11).toBeDisabled()
      }
    })
    test("TST1052 - Salvar com campo 11 habilitado e depois desabilitar GHE", async ({ page, pgr }) => {
      // campo 11 já vem habilitado+marcado por padrão (GHE marcado) — salva
      // assim, depois desmarca GHE e confirma que campo 11 não fica "preso" ativo
      await pgr.preencherCadastroValidoESalvar()
      await pgr.abrirAba("Configurações")
      await page.getByRole("tabpanel", { name: "Configurações" }).getByText("GHE", { exact: true }).click()
      const campo11 = page.getByRole("checkbox", { name: "Incluir riscos associados às atividades do GHE" })
      await expect(campo11).toBeDisabled()
      await expect(campo11).not.toBeChecked()
    })
    test("TST1053 - Alterar configurações e trocar de aba sem salvar", async ({ page, pgr }) => {
      // desmarca um checkbox independente, troca de aba e volta — o valor
      // deve continuar desmarcado (o formulário mantém estado em memória,
      // não recarrega do zero ao trocar de aba)
      await pgr.clicarCheckboxMaterial("Incluir fotos dos GHEs")
      await expect(page.getByRole("checkbox", { name: "Incluir fotos dos GHEs" })).not.toBeChecked()
      await page.getByRole("tab", { name: "Anexos" }).click()
      await page.getByRole("tab", { name: "Configurações" }).click()
      await expect(page.getByRole("checkbox", { name: "Incluir fotos dos GHEs" })).not.toBeChecked()
    })
    test("TST1054 - Alterar configurações em múltiplas abas", async ({ page, pgr }) => {
      // altera um campo em Configurações, depois um campo em Referências
      // (ART), e confirma que as duas alterações continuam presentes ao
      // navegar entre as abas
      await pgr.clicarCheckboxMaterial("Incluir fotos dos GHEs")
      await page.getByRole("tab", { name: "Referências" }).click()
      await page.getByLabel("ART").fill("teste-multi-aba")
      await page.getByRole("tab", { name: "Configurações" }).click()
      await expect(page.getByRole("checkbox", { name: "Incluir fotos dos GHEs" })).not.toBeChecked()
      await page.getByRole("tab", { name: "Referências" }).click()
      await expect(page.getByLabel("ART")).toHaveValue("teste-multi-aba")
    })
    test.fixme("TST1055 - Usuário alterar campo bloqueado via inspeção", async ({ page }) => {
      // Esperado: Backend deve impedir
      // Nota: teste de segurança/validação server-side — provavelmente via
      // page.request (API) em vez de interação de UI, ver 06-parametrizar-testes
    })
    test.fixme("TST1056 - Dados antigos com regras novas (ex: campo 11 marcado sem GHE)", async ({ page }) => {
      // Esperado: Sistema deve corrigir ou tratar
    })
    test.fixme("TST1057 - Remover dependência (ex: ocultar aba externa)", async ({ page }) => {
      // Esperado: Campo 11 deve desaparecer corretamente
    })
    test.fixme("TST1058 - Salvar configurações e gerar PGR", async ({ page }) => {
      // Esperado: Documento deve refletir configurações
    })
    test.fixme("TST1059 - Alterar configuração e gerar novo PGR", async ({ page }) => {
      // Esperado: Deve refletir nova configuração
    })
    test("TST1060 - Salvar várias vezes seguidas", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      const idkeyInicial = page.url()
      // "suja" o formulário de novo e salva mais 2x seguidas
      for (let i = 0; i < 2; i++) {
        await page.getByLabel("ART").fill(`teste-multi-save-${i}`)
        await page.getByRole("button", { name: "Salvar", exact: true }).click()
        await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
        // o clique em "Salvar" abre um overlay "screen-locker" enquanto salva —
        // se a próxima iteração clicar de novo antes dele sumir, o clique é
        // interceptado (ou o botão ainda está disabled). Espera sumir antes de seguir
        await page.locator(".screen-locker").waitFor({ state: "hidden" })
      }
      // continua sendo o MESMO registro (mesma URL/idkey) — não duplicou
      await expect(page).toHaveURL(idkeyInicial)
    })
    test("TST1061 - Atualizar página após salvar", async ({ page, pgr }) => {
      const checkbox = page.getByRole("checkbox", { name: "Incluir CAS number" })
      const estadoInicial = await checkbox.isChecked()
      await pgr.clicarCheckboxMaterial("Incluir CAS number")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Configurações")
      await expect(page.getByRole("checkbox", { name: "Incluir CAS number" })).toBeChecked({ checked: !estadoInicial })
    })
    test("TST1062 - Limpar cache e acessar novamente", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      const urlComIdkey = page.url()
      // fecha o contexto de armazenamento local navegando pra uma página
      // neutra antes de voltar, como aproximação de "limpar cache"
      await page.goto(URLS.pgr)
      await page.goto(urlComIdkey)
      await expect(page.getByRole("tab", { name: "Referências" })).toBeVisible()
      await expect(page.getByLabel("Responsável técnico *")).toHaveValue(/Administrador Apollus/)
    })
    // TST1063: validação visual contra mockup anexado no chamado — não dá pra
    // automatizar sem o mockup em mãos; fica como checklist manual/fixme
    test.fixme("TST1063 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Tela deve estar 100% conforme layout, labels, estados,
      // dependências e comportamentos definidos
    })
  })
})

// PERIGO: a tela "Configuração Geral" (menu lateral, dentro de "Programas e
// Laudos") define, por campo da aba Configurações, os toggles "Bloquear"
// (ícone lock) e "Sugerir" (ícone lightbulb) — mas é uma configuração
// GLOBAL, compartilhada por todos os usuários do ambiente, não por registro.
// Tentativa real (2026-07-24): marcar "Bloquear" funcionou, mas desmarcar
// de volta não teve efeito nenhum (parece exigir permissão "Corporativo"
// que o usuário de teste não tem) — ficou preso travado no ambiente
// compartilhado. NÃO reimplementar TST1015-1019 mexendo nos toggles dessa
// tela sem um usuário Corporativo disponível pra garantir reverter.
test.describe.skip("Tela Configuração Geral (Sugerir/Bloquear) — NÃO RODAR", () => {
  test.fixme("TST1015-1019 - toggles Sugerir/Bloquear", async ({ page }) => {
    // Ver aviso acima — bloqueado até termos um usuário Corporativo pra testar com segurança
  })
})
