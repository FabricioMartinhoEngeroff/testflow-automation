// SETUP/SCAFFOLD — cenários da planilha real (TST1280-TST1331), aba Conclusão
// do cadastro de PGR. Ver aba-configuracoes.spec.ts para a explicação de por que
// usamos test.fixme() em vez de test() aqui.
//
// Doc de referência (ver ef/playwright/):
// - Campo de texto rico (rich text editor, formatação, imagens, limite de
//   caracteres/tamanho) → 09-acoes (fill/pressSequentially), 10-afirmacoes
//   (toHaveText, contagem de caracteres)
// - Campo opcional (não bloqueia salvar vazio) → 10-afirmacoes
// - Refletir no laudo/PGR gerado → depende de geração de arquivo, fora do
//   escopo de interação direta de UI — provavelmente precisa checar o
//   documento gerado via download + parsing, não só a tela
import { test, expect } from "../../../../../support"

// texto do placeholder, conferido letra por letra contra a EF (2026-07-23)
const PLACEHOLDER_CONCLUSAO = "Descreva a conclusão do PGR considerando riscos identificados, medidas de prevenção e recomendações de melhoria. Este capítulo será incluído no documento apenas se houver conteúdo preenchido neste campo."

test.describe("Aba Conclusão (E2E)", () => {
  test.beforeEach(async ({ page, login, pgr }) => {
    await login.entrar()
    await pgr.abrirNovoCadastro()
    await pgr.abrirAba("Conclusão")
  })

  test.describe("Texto + Regras + Usabilidade", () => {
    test("TST1280 - Acessar aba \"Conclusão\"", async ({ page }) => {
      // Descoberta (2026-07-23): é um CKEditor — a área editável é um
      // [contenteditable="true"], não um <textarea>/<input> comum
      const editor = page.locator('[contenteditable="true"]')
      await expect(editor).toBeVisible()
      await expect(editor).toHaveAttribute("contenteditable", "true")
    })
    test("TST1281 - Validar placeholder do campo", async ({ page }) => {
      // O placeholder do CKEditor fica no atributo data-placeholder do <p>
      // interno (renderizado via CSS ::before) — não é texto "de verdade",
      // por isso getByText não funciona aqui; lemos o atributo direto
      const paragrafo = page.locator('[contenteditable="true"] p').first()
      await expect(paragrafo).toHaveAttribute("data-placeholder", PLACEHOLDER_CONCLUSAO)
    })
    test("TST1282 - Validar campo vazio por padrão", async ({ page }) => {
      const editor = page.locator('[contenteditable="true"]')
      await expect(editor).toHaveText("")
    })
    test.fixme("TST1283 - Validar que campo não é obrigatório", async ({ page }) => {
      // Esperado: Deve permitir salvar sem preencher
    })
    test.fixme("TST1284 - Salvar PGR sem preencher conclusão", async ({ page }) => {
      // Esperado: Deve salvar normalmente
    })
    test.fixme("TST1285 - Gerar laudo sem preenchimento", async ({ page }) => {
      // Esperado: Capítulo "Conclusão" não deve aparecer
    })
    test("TST1286 - Preencher texto simples", async ({ page }) => {
      // Descoberta: page.keyboard.type() trava nesse editor (motivo não
      // identificado) — locator.pressSequentially() funciona normalmente
      const editor = page.locator('[contenteditable="true"]')
      await editor.click()
      await editor.pressSequentially("Texto de conclusão simples")
      await expect(editor).toContainText("Texto de conclusão simples")
    })
    test.fixme("TST1287 - Salvar com texto preenchido", async ({ page }) => {
      // Esperado: Deve persistir corretamente
    })
    test.fixme("TST1288 - Gerar laudo com conteúdo", async ({ page }) => {
      // Esperado: Capítulo "Conclusão" deve aparecer
    })
    test.fixme("TST1289 - Editar texto já salvo", async ({ page }) => {
      // Esperado: Deve permitir alteração
    })
    test.fixme("TST1290 - Limpar conteúdo e salvar", async ({ page }) => {
      // Esperado: Capítulo deve deixar de aparecer no laudo
    })
  })

  test.describe("Formatação e conteúdo do componente", () => {
    test("TST1291 - Aplicar formatação (negrito, itálico, etc.)", async ({ page }) => {
      const editor = page.locator('[contenteditable="true"]')
      await editor.click()
      await editor.pressSequentially("negrito nisso")
      await page.keyboard.press("Control+A")
      await page.getByRole("button", { name: /negrito|bold/i }).click()
      await expect(editor.locator("strong")).toContainText("negrito nisso")
    })
    test.fixme("TST1292 - Salvar com formatação e reabrir", async ({ page }) => {
      // Esperado: Formatação deve persistir
      // Ainda não implementado: depende do formulário inteiro válido pro
      // Salvar principal funcionar (ver descoberta em cabecalho-campo-data-base.spec.ts)
    })
    test.fixme("TST1293 - Gerar laudo com formatação", async ({ page }) => {
      // Esperado: Deve refletir corretamente
      // Depende de gerar o PGR e inspecionar o arquivo de saída — fora do
      // escopo de interação de UI pura
    })
    test("TST1294 - Inserir listas (bullet/numeração)", async ({ page }) => {
      const editor = page.locator('[contenteditable="true"]')
      await editor.click()
      await editor.pressSequentially("Item de lista")
      // "Lista com marcadores" é um split-button do CKEditor: botão de ação +
      // seta de dropdown, ambos com o mesmo texto/tooltip — .first() pega a
      // ação principal (aplicar lista), não a seta que abre variações
      await page.getByRole("button", { name: /lista com marcadores|bulleted list/i }).first().click()
      await expect(editor.locator("ul li")).toContainText("Item de lista")
    })
    test("TST1295 - Inserir quebra de linha", async ({ page }) => {
      const editor = page.locator('[contenteditable="true"]')
      await editor.click()
      await editor.pressSequentially("Primeira linha")
      await page.keyboard.press("Enter")
      await editor.pressSequentially("Segunda linha")
      // CKEditor cria um novo <p> a cada Enter
      await expect(editor.locator("p")).toHaveCount(2)
    })
    test("TST1296 - Inserir texto com múltiplos parágrafos", async ({ page }) => {
      const editor = page.locator('[contenteditable="true"]')
      await editor.click()
      await editor.pressSequentially("Paragrafo um")
      await page.keyboard.press("Enter")
      await editor.pressSequentially("Paragrafo dois")
      await page.keyboard.press("Enter")
      await editor.pressSequentially("Paragrafo tres")
      await expect(editor.locator("p")).toHaveCount(3)
    })
    test("TST1297 - Inserir texto com caracteres especiais", async ({ page }) => {
      const editor = page.locator('[contenteditable="true"]')
      await editor.click()
      await editor.pressSequentially("Especiais: & < > \" ' # @ % * ( )")
      await expect(editor).toContainText("Especiais:")
    })
    test("TST1298 - Inserir texto com acentos", async ({ page }) => {
      const editor = page.locator('[contenteditable="true"]')
      await editor.click()
      await editor.pressSequentially("Ação, coração, não, ç, é, ã")
      await expect(editor).toContainText("Ação, coração, não, ç, é, ã")
    })
    test.fixme("TST1299 - Colar texto de Word", async ({ page }) => {
      // Esperado: Deve manter formatação básica
    })
    test.fixme("TST1300 - Colar texto com formatação pesada", async ({ page }) => {
      // Esperado: Deve tratar sem quebrar layout
    })
    test.fixme("TST1301 - Colar texto com links", async ({ page }) => {
      // Esperado: Deve manter ou tratar corretamente
    })
    test("TST1302 - Inserir caracteres incomuns", async ({ page }) => {
      const editor = page.locator('[contenteditable="true"]')
      await editor.click()
      await editor.pressSequentially("Incomuns: § ± × ÷ € £ ¥ © ®")
      await expect(editor).toContainText("Incomuns:")
    })
    test.fixme("TST1303 - Inserir texto pequeno", async ({ page }) => {
      // Esperado: Deve salvar normalmente
    })
    test.fixme("TST1304 - Inserir texto médio (~5.000 caracteres)", async ({ page }) => {
      // Esperado: Deve salvar normalmente
    })
    test.fixme("TST1305 - Inserir texto próximo de 15.000 caracteres", async ({ page }) => {
      // Esperado: Deve suportar sem erro
    })
    test.fixme("TST1306 - Inserir texto acima de 15.000 caracteres", async ({ page }) => {
      // Esperado: Deve suportar (se permitido) ou degradar sem erro
    })
    test.fixme("TST1307 - Inserir conteúdo até limite de 10MB (texto + imagens)", async ({ page }) => {
      // Esperado: Deve permitir
    })
    test.fixme("TST1308 - Ultrapassar limite de 10MB", async ({ page }) => {
      // Esperado: Deve bloquear ou apresentar erro
    })
    test.fixme("TST1309 - Inserir grande volume de texto + imagens", async ({ page }) => {
      // Esperado: Deve manter performance
    })
    test.fixme("TST1310 - Validar tempo de resposta ao salvar conteúdo grande", async ({ page }) => {
      // Esperado: Deve ser aceitável
    })
    test.fixme("TST1311 - Inserir imagem no conteúdo", async ({ page }) => {
      // Esperado: Deve permitir e exibir corretamente
    })
    test.fixme("TST1312 - Gerar laudo com imagem", async ({ page }) => {
      // Esperado: Deve exibir corretamente
    })
    test.fixme("TST1313 - Inserir múltiplas imagens", async ({ page }) => {
      // Esperado: Deve suportar até limite
    })
    test.fixme("TST1314 - Inserir imagem muito grande", async ({ page }) => {
      // Esperado: Deve respeitar limite total
    })
    test.fixme("TST1315 - Remover imagem e salvar", async ({ page }) => {
      // Esperado: Deve atualizar corretamente
    })
    test.fixme("TST1316 - Preencher conteúdo e salvar", async ({ page }) => {
      // Esperado: Deve persistir corretamente
    })
    test.fixme("TST1317 - Preencher e atualizar página sem salvar", async ({ page }) => {
      // Esperado: Deve perder dados
    })
    test.fixme("TST1318 - Salvar e reabrir cadastro", async ({ page }) => {
      // Esperado: Deve manter conteúdo
    })
    test.fixme("TST1319 - Alterar conteúdo e salvar novamente", async ({ page }) => {
      // Esperado: Deve atualizar corretamente
    })
    test.fixme("TST1320 - Alterar conteúdo e não salvar", async ({ page }) => {
      // Esperado: Deve descartar alterações
    })
    test.fixme("TST1321 - Salvar várias vezes seguidas", async ({ page }) => {
      // Esperado: Não deve corromper conteúdo
    })
    test.fixme("TST1322 - Validar responsividade", async ({ page }) => {
      // Esperado: Deve se adaptar à tela
    })
    test.fixme("TST1323 - Validar consistência visual", async ({ page }) => {
      // Esperado: Deve seguir padrão do sistema
    })
    test.fixme("TST1324 - Campo vazio", async ({ page }) => {
      // Esperado: Capítulo não deve ser exibido
    })
    test.fixme("TST1325 - Campo preenchido com texto simples", async ({ page }) => {
      // Esperado: Capítulo deve ser exibido
    })
    test.fixme("TST1326 - Campo com formatação", async ({ page }) => {
      // Esperado: Deve refletir no laudo
    })
    test.fixme("TST1327 - Campo com imagem", async ({ page }) => {
      // Esperado: Deve refletir no laudo
    })
    test.fixme("TST1328 - Remover conteúdo e gerar laudo", async ({ page }) => {
      // Esperado: Capítulo deve desaparecer
    })
    test.fixme("TST1329 - Alterar conteúdo e gerar laudo", async ({ page }) => {
      // Esperado: Deve refletir atualização
    })
    test.fixme("TST1330 - Conteúdo grande no laudo", async ({ page }) => {
      // Esperado: Deve renderizar corretamente
    })
    // TST1331: validação visual contra mockup — checklist manual
    test.fixme("TST1331 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Campo, placeholder, comportamento e layout devem estar
      // 100% conforme o modelo
    })
  })
})
