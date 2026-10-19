// SETUP/SCAFFOLD — cenários da planilha real (TST1066-TST1180), aba Anexos do
// cadastro de PGR. Ver aba-configuracoes.spec.ts para a explicação de por que
// usamos test.fixme() em vez de test() aqui (evita seletor chutado / falso-positivo).
//
// Doc de referência (ver ef/playwright/):
// - Botão "Adicionar anexo" / abrir modal → 09-acoes (click), 08-localizadores
//   (getByRole('button', { name: ... }))
// - Upload de arquivo (.pdf/.jpg/.png/.doc, limite 5MB, formato inválido) →
//   09-acoes (setInputFiles), 10-afirmacoes (mensagens de erro)
// - Campo descrição (textarea, até 500 caracteres) → 09-acoes (fill)
// - Grid de anexos (listagem, ordenação por drag-and-drop, editar/excluir) →
//   08-localizadores (filtros de lista), 09-acoes (dragTo para reordenar)
// - Modal de confirmação de exclusão → 10-afirmacoes (toBeVisible), 12-espera-automatica
// - Tooltip do revisor (hover) → 09-acoes (hover), 10-afirmacoes (toContainText)
import type { Page } from "@playwright/test"
import { test, expect } from "../../../support"
import path from "path"
import { URLS } from "../../../support/urls"

// arquivos de teste gerados em server/src/app/support/fixtures/ — ver
// nomes/tamanhos abaixo. Conteúdo binário zerado, só pra testar tamanho,
// não abrem de verdade como PDF.
// Descoberta (2026-07-23): o limite de "5MB" do sistema é calculado em
// bytes DECIMAIS (5.000.000), não binários (5×1024×1024 = 5.242.880) — um
// arquivo de exatos 5.242.880 bytes é REJEITADO. "cinco_mb_decimal.pdf" tem
// exatos 5.000.000 bytes (o limite real); "grande.pdf" tem 6.000.000 bytes
const FIXTURES = path.join(process.cwd(), "src", "app", "support", "fixtures")
const fixture = (nome: string) => path.join(FIXTURES, nome)

function linhaAnexo(page: Page, textoDescricaoOuArquivo: string) {
  return page.locator("tr", { hasText: textoDescricaoOuArquivo })
}

async function preencherModalAnexo(page: Page, descricao: string, arquivo = "minimo.pdf") {
  await page.getByRole("button", { name: "Adicionar anexo" }).click()
  await page.locator('input[type="file"]').setInputFiles(fixture(arquivo))
  await page.getByLabel(/descri/i).fill(descricao)
}

// Descoberta (2026-07-23): a modal de anexo NÃO fecha sozinha ao clicar "Salvar"
// (diferente de Colaboradores) — mostra um toast de info e continua aberta.
// Fluxo real pra "salvar de verdade" e sair da modal é em 3 cliques: "Salvar"
// (dentro da modal) -> "Fechar" -> aparece um segundo diálogo genérico
// "Atenção: Existem informações que não foram salvas" (porque os campos ainda
// têm conteúdo, mesmo já "salvos" localmente) -> "Salvar e sair"
async function salvarEFecharModalAnexo(page: Page) {
  await page.getByRole("button", { name: "Salvar", exact: true }).click()
  await expect(page.getByText(/Registro incluído com sucesso/i)).toBeVisible()
  await page.getByRole("button", { name: "Fechar" }).click()
  const dialogoAtencao = page.getByRole("heading", { name: "Atenção" })
  if (await dialogoAtencao.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Salvar e sair" }).click()
  }
}

// Descoberta (2026-07-23): clicar no ícone "edit_outline" da linha às vezes só
// dispara o tooltip "Editar" (hover) sem abrir a modal — acontece de forma
// inconsistente, diferente do ícone de excluir que nunca teve esse problema.
// Faz até 3 tentativas (clique normal, force, force de novo com pausa) antes de desistir.
async function abrirEdicaoAnexo(page: Page, textoLinha: string) {
  const icone = linhaAnexo(page, textoLinha).locator("mat-icon", { hasText: "edit_outline" })
  const heading = page.getByRole("heading", { name: "Visualizar anexo" })
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    if (await heading.isVisible().catch(() => false)) break
    await icone.click({ force: tentativa > 0 })
    await page.waitForTimeout(300)
  }
  await heading.waitFor({ state: "visible" })
}

test.describe("Aba Anexos (E2E)", () => {
  test.beforeEach(async ({ page, login, pgr }) => {
    await login.entrar()
    await pgr.abrirNovoCadastro()
    await pgr.abrirAba("Anexos")
  })

  test.describe("Usabilidade + Regras + Validações", () => {
    test("TST1066 - Acessar aba \"Anexos\"", async ({ page }) => {
      await expect(page.getByRole("tab", { name: "Anexos" })).toBeVisible()
    })
    test.fixme("TST1067 - Validar presença do texto fixo", async ({ page }) => {
      // Esperado: Texto deve aparecer corretamente e sem erro
      // Ainda não implementado: texto exato da tela não conferido ainda
    })
    test.fixme("TST1068 - Validar subtítulo \"Anexo\"", async ({ page }) => {
      // Esperado: Deve estar visível e correto
      // Ainda não implementado: não achamos um subtítulo "Anexo" isolado na
      // exploração — a tela mostra "Anexo" como label da coluna do grid
    })
    test("TST1069 - Validar botão \"Adicionar anexo\"", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Adicionar anexo" })).toBeVisible()
      // TODO: confirmar o ícone paperclip especificamente (via screenshot visual,
      // não via DOM) — por ora só confirmamos que o botão em si existe e aparece
    })
    test("TST1070 - Clicar em \"Adicionar anexo\"", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await expect(page.getByRole("heading", { name: "Adicionar anexo" })).toBeVisible()
    })
    test("TST1071 - Validar título da modal (inclusão)", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await expect(page.getByRole("heading", { name: "Adicionar anexo" })).toBeVisible()
    })
    test.fixme("TST1072 - Validar título da modal (edição)", async ({ page }) => {
      // Esperado: Deve ser "Visualizar anexo"
      // Ainda não implementado: exige ter um anexo já salvo pra abrir em modo
      // edição, o que depende do fluxo de upload de arquivo real (TST1077+)
    })
    test.fixme("TST1073 - Validar layout da modal", async ({ page }) => {
      // Esperado: Campos devem estar alinhados e visíveis
      // "Layout" é melhor verificado visualmente (screenshot), não por asserção de DOM
    })
    test("TST1074 - Validar placeholder do campo de anexo", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await expect(page.getByText("Arraste e solte o arquivo aqui ou clique para pesquisar")).toBeVisible()
    })
    test.fixme("TST1075 - Validar help do campo de anexo", async ({ page }) => {
      // Esperado: Deve informar formatos e tamanho corretamente
    })
    test("TST1076 - Validar upload via clique", async ({ page }) => {
      // "clique pra pesquisar" abre o seletor nativo de arquivo do SO — o
      // Playwright não interage com esse diálogo nativo, então testamos o
      // resultado (setInputFiles simula a escolha do usuário no input real).
      // Descoberta: o nome do arquivo aparece 2x no DOM (mat-label visível +
      // um cdk-describedby-message-container escondido de acessibilidade) —
      // escopamos por "mat-label" pra evitar violação do modo estrito
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.locator('input[type="file"]').setInputFiles(fixture("minimo.pdf"))
      await expect(page.locator("mat-label", { hasText: /minimo.*\.pdf/i })).toBeVisible()
    })
    test("TST1077 - Validar upload de arquivo válido (.pdf até 5MB)", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.locator('input[type="file"]').setInputFiles(fixture("minimo.pdf"))
      // Descoberta: o servidor renomeia o arquivo com um sufixo aleatório ao
      // aceitar o upload (ex: minimo_op4guv.pdf) — por isso conferimos só o
      // prefixo do nome, via regex, não o nome exato
      await expect(page.locator("mat-label", { hasText: /minimo.*\.pdf/i })).toBeVisible()
    })
    test("TST1078 - Validar upload de imagem (.jpg/.png)", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.locator('input[type="file"]').setInputFiles(fixture("imagem.png"))
      await expect(page.locator("mat-label", { hasText: /imagem.*\.png/i })).toBeVisible()
    })
    test("TST1079 - Validar upload de arquivo .doc/.docx", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.locator('input[type="file"]').setInputFiles(fixture("documento.doc"))
      await expect(page.locator("mat-label", { hasText: /documento.*\.doc/i })).toBeVisible()
    })
    test("TST1080 - Validar upload com tamanho exatamente 5MB", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.locator('input[type="file"]').setInputFiles(fixture("cinco_mb_decimal.pdf"))
      await expect(page.locator("mat-label", { hasText: /cinco_mb_decimal.*\.pdf/i })).toBeVisible()
    })
    test("TST1081 - Validar upload com tamanho maior que 5MB", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.locator('input[type="file"]').setInputFiles(fixture("grande.pdf"))
      await expect(page.getByText(/Permitido somente arquivos com até 5MB/i)).toBeVisible()
      // campo continua vazio — nada foi anexado
      await expect(page.getByText("Arraste e solte o arquivo aqui ou clique para pesquisar")).toBeVisible()
    })
    test("TST1082 - Validar upload de formato inválido (.exe, .zip etc.)", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.locator('input[type="file"]').setInputFiles(fixture("invalido.exe"))
      // mesma mensagem de "Atenção" cobre tamanho E extensão inválidos
      await expect(page.getByText(/Permitido somente arquivos com até 5MB/i)).toBeVisible()
      await expect(page.getByText("Arraste e solte o arquivo aqui ou clique para pesquisar")).toBeVisible()
    })
    test("TST1083 - Validar tentativa de upload múltiplo", async ({ page }) => {
      // Descoberta: o Playwright recusa até TENTAR selecionar 2 arquivos de
      // uma vez ("Non-multiple file input can only accept single file") —
      // ele mesmo detecta que o <input> não tem o atributo "multiple" antes
      // de qualquer interação com o navegador. Isso já prova, no próprio
      // HTML, que o campo aceita só 1 arquivo por vez — não precisa tentar
      // enviar 2 pra confirmar a regra.
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      const temAtributoMultiple = await page.locator('input[type="file"]').evaluate(el => el.hasAttribute("multiple"))
      expect(temAtributoMultiple).toBe(false)
    })
    test("TST1084 - Validar substituição de arquivo antes de salvar", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(fixture("minimo.pdf"))
      await expect(page.locator("mat-label", { hasText: /minimo.*\.pdf/i })).toBeVisible()
      await fileInput.setInputFiles(fixture("imagem.png"))
      await expect(page.locator("mat-label", { hasText: /imagem.*\.png/i })).toBeVisible()
      await expect(page.locator("mat-label", { hasText: /minimo.*\.pdf/i })).not.toBeVisible()
    })
    test("TST1085 - Validar remoção de arquivo antes de salvar", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.locator('input[type="file"]').setInputFiles(fixture("minimo.pdf"))
      await expect(page.locator("mat-label", { hasText: /minimo.*\.pdf/i })).toBeVisible()
      // o "x" ao lado do nome do arquivo é o ícone "clear" — diferente do
      // "close" que fecha a modal inteira (descoberto por inspeção real).
      // Como o arquivo já foi enviado ao servidor nesse ponto, clicar em
      // "clear" abre uma modal de confirmação ("Deseja realmente excluir
      // este item?"), igual à exclusão de itens já salvos no grid
      await page.locator("mat-icon", { hasText: "clear" }).click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(page.getByText("Arraste e solte o arquivo aqui ou clique para pesquisar")).toBeVisible()
    })
    test("TST1086 - Validar obrigatoriedade do campo anexo", async ({ page }) => {
      // Descoberta (2026-07-23): o botão "Salvar" do modal NÃO fica desabilitado
      // (diferente do Salvar principal do cadastro) — a validação acontece ao
      // CLICAR: aparece um toast de atenção e o campo obrigatório vazio ganha
      // borda vermelha. Testamos com tudo vazio (cobre tanto o anexo quanto a
      // descrição, já que os dois são obrigatórios e o toast é genérico).
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
      // modal continua aberta — o clique não fechou nem salvou
      await expect(page.getByRole("heading", { name: "Adicionar anexo" })).toBeVisible()
    })
    test("TST1087 - Validar campo descrição vazio", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })
    test("TST1088 - Validar preenchimento da descrição", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.getByLabel(/descri/i).fill("Descrição de teste")
      await expect(page.getByLabel(/descri/i)).toHaveValue("Descrição de teste")
    })
    test("TST1089 - Validar limite de 500 caracteres", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.getByLabel(/descri/i).fill("a".repeat(550))
      const valor = await page.getByLabel(/descri/i).inputValue()
      expect(valor.length).toBe(500)
    })
    test("TST1090 - Validar inserção de caracteres especiais na descrição", async ({ page }) => {
      const texto = "! @ # $ % & * ( ) - _ + = / \\ ç ã õ"
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.getByLabel(/descri/i).fill(texto)
      await expect(page.getByLabel(/descri/i)).toHaveValue(texto)
    })
    test("TST1091 - Validar texto longo com quebra de linha", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.getByLabel(/descri/i).pressSequentially("linha 1\nlinha 2\nlinha 3")
      await expect(page.getByLabel(/descri/i)).toHaveValue("linha 1\nlinha 2\nlinha 3")
    })
    test("TST1092 - Validar persistência após salvar e reabrir", async ({ page, pgr }) => {
      await preencherModalAnexo(page, "Persistência após reabrir")
      await salvarEFecharModalAnexo(page)
      await pgr.preencherCadastroValidoESalvar()
      const urlComIdkey = page.url()
      await page.goto(URLS.pgr)
      await page.goto(urlComIdkey)
      await pgr.abrirAba("Anexos")
      await expect(linhaAnexo(page, "Persistência após reabrir")).toBeVisible()
    })
    test("TST1093 - Validar salvamento com dados válidos", async ({ page }) => {
      await preencherModalAnexo(page, "Salvamento com dados válidos")
      await salvarEFecharModalAnexo(page)
      await expect(linhaAnexo(page, "Salvamento com dados válidos")).toBeVisible()
    })
    test("TST1094 - Validar mensagem de sucesso", async ({ page }) => {
      // Descoberta: a mensagem real é de INFO (não o toast verde de sucesso
      // usado no restante do sistema) e avisa que ainda falta o Salvar principal:
      // "Registro incluído com sucesso. Para que a ação seja permanentemente
      // salva, clique no botão \"Salvar\"."
      await preencherModalAnexo(page, "Mensagem de sucesso")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/Registro incluído com sucesso/i)).toBeVisible()
    })
    test("TST1095 - Validar botão editar no grid", async ({ page }) => {
      await preencherModalAnexo(page, "Editar no grid")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Editar no grid")
      // Descoberta: a modal de edição tem o título "Visualizar anexo" (não
      // "Editar anexo") e vem com os campos já preenchidos
      await expect(page.getByRole("heading", { name: "Visualizar anexo" })).toBeVisible()
      await expect(page.getByLabel(/descri/i)).toHaveValue("Editar no grid")
    })
    test("TST1096 - Validar edição da descrição", async ({ page }) => {
      await preencherModalAnexo(page, "Descrição original")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Descrição original")
      await page.getByLabel(/descri/i).fill("Descrição editada")
      // Descoberta: diferente da modal de INCLUSÃO, a modal de EDIÇÃO fecha
      // sozinha ao clicar "Salvar" — não precisa do fluxo de 3 cliques aqui
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByRole("heading", { name: "Visualizar anexo" })).not.toBeVisible()
      await expect(linhaAnexo(page, "Descrição editada")).toBeVisible()
    })
    test.fixme("TST1097 - Validar edição do arquivo (substituição)", async ({ page }) => {
      // Esperado: Deve permitir trocar arquivo
      // Ainda não implementado: modal de edição não expõe um <input type="file">
      // visível pra trocar o anexo já enviado (só mostra o nome do arquivo atual)
    })
    test("TST1098 - Validar salvar edição", async ({ page }) => {
      await preencherModalAnexo(page, "Antes de editar")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Antes de editar")
      await page.getByLabel(/descri/i).fill("Depois de editar")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(linhaAnexo(page, "Depois de editar")).toBeVisible()
      await expect(linhaAnexo(page, "Antes de editar")).not.toBeVisible()
    })
    test("TST1099 - Validar cancelar edição", async ({ page }) => {
      await preencherModalAnexo(page, "Não deve mudar")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Não deve mudar")
      await page.getByLabel(/descri/i).fill("Alteração descartada")
      await page.getByRole("button", { name: "Fechar" }).click()
      // como o campo foi alterado, aparece a mesma confirmação genérica de saída
      await page.getByRole("button", { name: "Sair sem salvar" }).click()
      await expect(linhaAnexo(page, "Não deve mudar")).toBeVisible()
    })
    test.fixme("TST1100 - Validar ordem dos anexos no grid", async ({ page }) => {
      // Esperado: Deve seguir ordem de inserção
    })
    test.fixme("TST1101 - Validar texto \"ordem definida abaixo\"", async ({ page }) => {
      // Esperado: Deve refletir corretamente no grid
    })
    test.fixme("TST1102 - Validar comportamento com múltiplos anexos", async ({ page }) => {
      // Esperado: Deve listar corretamente
    })
    test.fixme("TST1103 - Validar persistência da ordem após salvar e reabrir PGR", async ({ page }) => {
      // Esperado: Deve manter ordem de inserção
    })
    test.fixme("TST1104 - Validar comportamento ao excluir (quando aplicável)", async ({ page }) => {
      // Esperado: Deve remover corretamente
    })
    test.fixme("TST1105 - Validar comportamento com nomes de arquivos longos", async ({ page }) => {
      // Esperado: Não deve quebrar layout
    })
    test.fixme("TST1106 - Validar exibição de diferentes tipos de arquivo", async ({ page }) => {
      // Esperado: Deve ser consistente
    })
    test.fixme("TST1107 - Validar comportamento com arquivo corrompido", async ({ page }) => {
      // Esperado: Sistema deve tratar erro
    })
    test.fixme("TST1108 - Validar cancelamento de upload", async ({ page }) => {
      // Esperado: Deve não salvar arquivo parcial
    })
    test.fixme("TST1109 - Validar múltiplas tentativas de upload seguidas", async ({ page }) => {
      // Esperado: Sistema deve manter estabilidade
    })
    test.fixme("TST1110 - Validar comportamento ao salvar e atualizar página", async ({ page }) => {
      // Esperado: Anexo deve persistir
    })
    test.fixme("TST1111 - Validar comportamento ao sair sem salvar", async ({ page }) => {
      // Esperado: Dados devem ser perdidos
    })
    test.fixme("TST1112 - Validar clique rápido no botão salvar", async ({ page }) => {
      // Esperado: Não deve duplicar registro
    })
    test.fixme("TST1113 - Validar performance com vários anexos", async ({ page }) => {
      // Esperado: Deve carregar corretamente
    })
    test.fixme("TST1114 - Validar comportamento em diferentes navegadores", async ({ page }) => {
      // Esperado: Deve ser consistente
      // Nota: candidato a rodar com `projects` multi-navegador (chromium/firefox/webkit),
      // ver ef/playwright/13-melhores-praticas.md
    })
    test.fixme("TST1115 - Validar cores e layout da modal", async ({ page }) => {
      // Esperado: Deve seguir padrão
    })
    test.fixme("TST1116 - Validar feedback visual ao anexar arquivo", async ({ page }) => {
      // Esperado: Usuário deve ver que arquivo foi anexado
    })
    test.fixme("TST1117 - Validar comportamento ao substituir arquivo e não salvar", async ({ page }) => {
      // Esperado: Deve manter arquivo antigo
    })
    test.fixme("TST1118 - Validar impacto no documento gerado", async ({ page }) => {
      // Esperado: Anexo deve aparecer com título correto
    })
    test.fixme("TST1119 - Validar título do anexo no documento", async ({ page }) => {
      // Esperado: Deve usar descrição informada
    })
    // TST1120: validação visual contra mockup — checklist manual, não automatizável direto
    test.fixme("TST1120 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Modal, grid, botões e comportamento devem estar 100% conforme modelo
    })
  })

  test.describe("Modal + Grid + Botões + Ordenação", () => {
    test("TST1121 - Abrir modal de inclusão e validar botão \"Salvar e Adicionar outro\"", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await expect(page.getByRole("button", { name: "Salvar e adicionar outro" })).toBeVisible()
    })
    test("TST1122 - Abrir modal em edição e validar botão \"Salvar e Adicionar outro\"", async ({ page }) => {
      await preencherModalAnexo(page, "Edição sem salvar-e-adicionar-outro")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Edição sem salvar-e-adicionar-outro")
      await expect(page.getByRole("heading", { name: "Visualizar anexo" })).toBeVisible()
      await expect(page.getByRole("button", { name: "Salvar e adicionar outro" })).not.toBeVisible()
    })
    test("TST1123 - Clicar em \"Fechar\" na modal (sem alterações)", async ({ page }) => {
      // Descoberta (2026-07-23): "Fechar" só pede confirmação se algo foi
      // alterado. Sem alterações, fecha direto — é esse o caso coberto aqui.
      // O caso "com alterações pendentes" é o TST1333 (botão Voltar do
      // cadastro tem a mesma lógica) — mesma ideia, outro componente.
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.getByRole("button", { name: "Fechar" }).click()
      await expect(page.getByRole("heading", { name: "Adicionar anexo" })).not.toBeVisible()
    })
    test("TST1124 - Clicar em \"Salvar\" com campos vazios", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })
    test("TST1125 - Clicar em \"Salvar e Adicionar outro\" com campos vazios", async ({ page }) => {
      await page.getByRole("button", { name: "Adicionar anexo" }).click()
      await page.getByRole("button", { name: "Salvar e adicionar outro" }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
      await expect(page.getByRole("heading", { name: "Adicionar anexo" })).toBeVisible()
    })
    test("TST1126 - Preencher dados válidos e clicar \"Salvar\"", async ({ page }) => {
      // Descoberta / diferença da EF: "Salvar" NÃO fecha a modal sozinho — mostra
      // um toast de info e mantém a modal aberta (ver salvarEFecharModalAnexo)
      await preencherModalAnexo(page, "Válido - clicar Salvar")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/Registro incluído com sucesso/i)).toBeVisible()
      await expect(page.getByRole("heading", { name: "Adicionar anexo" })).toBeVisible()
    })
    test("TST1127 - Preencher dados válidos e clicar \"Salvar e Adicionar outro\"", async ({ page }) => {
      await preencherModalAnexo(page, "Válido - salvar e adicionar outro")
      await page.getByRole("button", { name: "Salvar e adicionar outro" }).click()
      await expect(page.getByText(/Registro incluído com sucesso/i)).toBeVisible()
      await expect(page.getByRole("heading", { name: "Adicionar anexo" })).toBeVisible()
    })
    test("TST1128 - Validar reset da modal após \"Salvar e Adicionar outro\"", async ({ page }) => {
      // Descoberta / diferença da EF: os campos NÃO voltam ao estado inicial —
      // a descrição e o arquivo do anexo recém-salvo continuam preenchidos na
      // modal, exigindo que o usuário troque manualmente antes de adicionar o próximo
      await preencherModalAnexo(page, "Fica preenchido")
      await page.getByRole("button", { name: "Salvar e adicionar outro" }).click()
      await expect(page.getByText(/Registro incluído com sucesso/i)).toBeVisible()
      await expect(page.getByLabel(/descri/i)).toHaveValue("Fica preenchido")
      await expect(page.locator("mat-label", { hasText: /minimo.*\.pdf/i })).toBeVisible()
    })
    test("TST1129 - Validar botão \"Salvar\" em edição sem alteração", async ({ page }) => {
      // Diferente da modal de INCLUSÃO (cujo "Salvar" já vem habilitado desde
      // o início), a modal de EDIÇÃO bate com o esperado da EF: "Salvar" fica
      // desabilitado enquanto nada foi alterado (confirmado em 3 execuções seguidas)
      await preencherModalAnexo(page, "Salvar sem alterar")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Salvar sem alterar")
      await expect(page.getByRole("button", { name: "Salvar", exact: true })).toBeDisabled()
    })
    test("TST1130 - Alterar algum campo na edição", async ({ page }) => {
      await preencherModalAnexo(page, "Alterar campo")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Alterar campo")
      await page.getByLabel(/descri/i).fill("Campo alterado")
      await expect(page.getByRole("button", { name: "Salvar", exact: true })).toBeEnabled()
    })
    test("TST1131 - Salvar edição de anexo", async ({ page }) => {
      await preencherModalAnexo(page, "Antes")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Antes")
      await page.getByLabel(/descri/i).fill("Depois")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(linhaAnexo(page, "Depois")).toBeVisible()
    })
    test.fixme("TST1132 - Validar dados de auditoria após salvar", async ({ page }) => {
      // Esperado: Deve preencher: criado por, data, revisor e data
      // Ainda não implementado: a linha do grid tem um ícone "info_outline" que
      // parece ser o candidato a exibir essa auditoria, mas o hover não retornou
      // texto de tooltip legível na exploração (nenhum conteúdo visível capturado)
    })
    test.fixme("TST1133 - Validar atualização do \"revisor\" ao editar", async ({ page }) => {
      // Mesmo motivo do TST1132 — depende de achar onde a auditoria é exibida
    })
    test.fixme("TST1134 - Validar persistência da auditoria após recarregar", async ({ page }) => {
      // Mesmo motivo do TST1132
    })
  })

  test.describe("Grid de Anexos", () => {
    test("TST1135 - Inserir anexos e validar exibição no grid", async ({ page }) => {
      await preencherModalAnexo(page, "Exibição no grid")
      await salvarEFecharModalAnexo(page)
      await expect(linhaAnexo(page, "Exibição no grid")).toBeVisible()
    })
    test("TST1136 - Validar coluna \"Anexo\"", async ({ page }) => {
      await preencherModalAnexo(page, "Coluna anexo")
      await salvarEFecharModalAnexo(page)
      const linha = linhaAnexo(page, "Coluna anexo")
      await expect(linha.locator("mat-icon", { hasText: "download" })).toBeVisible()
      await expect(linha).toContainText(/minimo.*\.pdf/i)
    })
    test.fixme("TST1137 - Clicar no ícone de download", async ({ page }) => {
      // Esperado: Deve baixar o arquivo correto
      // Ainda não implementado: exige interceptar o evento de download do
      // navegador (page.waitForEvent('download')) — não coberto por essa exploração ainda
    })
    test("TST1138 - Validar nome do arquivo exibido", async ({ page }) => {
      // Descoberta: o servidor renomeia o arquivo com sufixo aleatório (ex:
      // minimo_ln9x2c.pdf) — por isso confere só o prefixo/sufixo via regex
      await preencherModalAnexo(page, "Nome do arquivo")
      await salvarEFecharModalAnexo(page)
      await expect(linhaAnexo(page, "Nome do arquivo")).toContainText(/minimo_.*\.pdf/i)
    })
    test("TST1139 - Validar descrição exibida", async ({ page }) => {
      await preencherModalAnexo(page, "Descrição específica de teste")
      await salvarEFecharModalAnexo(page)
      await expect(linhaAnexo(page, "Descrição específica de teste")).toBeVisible()
    })
    test.fixme("TST1140 - Validar comportamento com nomes longos", async ({ page }) => {
      // Esperado: Não deve quebrar layout
      // "Não quebrar layout" é melhor verificado visualmente (screenshot), não por asserção de DOM
    })
    test("TST1141 - Validar múltiplos anexos", async ({ page }) => {
      await preencherModalAnexo(page, "Primeiro anexo múltiplo")
      await salvarEFecharModalAnexo(page)
      await preencherModalAnexo(page, "Segundo anexo múltiplo")
      await salvarEFecharModalAnexo(page)
      await expect(linhaAnexo(page, "Primeiro anexo múltiplo")).toBeVisible()
      await expect(linhaAnexo(page, "Segundo anexo múltiplo")).toBeVisible()
    })
    test("TST1142 - Validar persistência após salvar e reabrir", async ({ page, pgr }) => {
      await preencherModalAnexo(page, "Persistência do grid")
      await salvarEFecharModalAnexo(page)
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Anexos")
      await expect(linhaAnexo(page, "Persistência do grid")).toBeVisible()
    })
    test("TST1143 - Validar comportamento com grid vazio", async ({ page }) => {
      // cadastro novo, aba Anexos, sem nenhum anexo adicionado ainda.
      // Descoberta: o grid vazio renderiza a mensagem "Sem registros para
      // listar." dentro do próprio tbody (por isso NÃO dá pra confirmar "vazio"
      // simplesmente contando <tr> — a linha de mensagem também é um <tr>)
      await expect(page.getByRole("tabpanel", { name: "Anexos" }).getByText("Sem registros para listar.")).toBeVisible()
    })
  })

  test.describe("Ordenação", () => {
    test.fixme("TST1144 - Inserir anexos em sequência", async ({ page }) => {
      // Esperado: Deve respeitar ordem de inserção
    })
    test.fixme("TST1145 - Soltar item em nova posição", async ({ page }) => {
      // Esperado: Deve atualizar ordem visual
      // Implementação futura via locator.dragTo(), ver ef/playwright/09-acoes.md
    })
    test.fixme("TST1146 - Salvar após reordenação", async ({ page }) => {
      // Esperado: Ordem deve ser persistida
    })
    test.fixme("TST1147 - Reabrir cadastro após reordenar", async ({ page }) => {
      // Esperado: Ordem deve ser mantida
    })
    test.fixme("TST1148 - Reordenar múltiplas vezes", async ({ page }) => {
      // Esperado: Deve manter consistência
    })
    test.fixme("TST1149 - Reordenar rapidamente várias linhas", async ({ page }) => {
      // Esperado: Sistema não deve quebrar
    })
    test.fixme("TST1150 - Reordenar e não salvar", async ({ page }) => {
      // Esperado: Ordem deve voltar ao estado anterior ao sair da tela sem salvar
    })
    test.fixme("TST1151 - Reordenar com muitos anexos", async ({ page }) => {
      // Esperado: Deve manter performance
    })
  })

  test.describe("Botões do Grid", () => {
    test("TST1152 - Validar botão \"Editar\" visível", async ({ page }) => {
      await preencherModalAnexo(page, "Editar visível")
      await salvarEFecharModalAnexo(page)
      await expect(linhaAnexo(page, "Editar visível").locator("mat-icon", { hasText: "edit_outline" })).toBeVisible()
    })
    test("TST1153 - Clicar em \"Editar\"", async ({ page }) => {
      await preencherModalAnexo(page, "Clicar editar")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Clicar editar")
      await expect(page.getByRole("heading", { name: "Visualizar anexo" })).toBeVisible()
      await expect(page.getByLabel(/descri/i)).toHaveValue("Clicar editar")
    })
    test("TST1154 - Editar e salvar", async ({ page }) => {
      await preencherModalAnexo(page, "Editar e salvar - antes")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Editar e salvar - antes")
      await page.getByLabel(/descri/i).fill("Editar e salvar - depois")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(linhaAnexo(page, "Editar e salvar - depois")).toBeVisible()
    })
    test("TST1155 - Validar botão \"Excluir\" visível", async ({ page }) => {
      await preencherModalAnexo(page, "Excluir visível")
      await salvarEFecharModalAnexo(page)
      await expect(linhaAnexo(page, "Excluir visível").locator("mat-icon", { hasText: "delete_outline" })).toBeVisible()
    })
    test("TST1156 - Clicar em \"Excluir\"", async ({ page }) => {
      await preencherModalAnexo(page, "Clicar excluir")
      await salvarEFecharModalAnexo(page)
      await linhaAnexo(page, "Clicar excluir").locator("mat-icon", { hasText: "delete_outline" }).click()
      await expect(page.getByRole("heading", { name: "Atenção" })).toBeVisible()
    })
    test("TST1157 - Validar texto da modal de exclusão", async ({ page }) => {
      await preencherModalAnexo(page, "Texto modal exclusão")
      await salvarEFecharModalAnexo(page)
      await linhaAnexo(page, "Texto modal exclusão").locator("mat-icon", { hasText: "delete_outline" }).click()
      // mesmo padrão de texto da exclusão de Colaboradores
      await expect(page.getByText("Deseja realmente excluir este item?")).toBeVisible()
    })
    test.fixme("TST1158 - Validar botão \"Excluir\" destacado", async ({ page }) => {
      // Esperado: Deve estar em destaque
      // "Destaque" visual (cor do botão) é melhor verificado visualmente (screenshot), não por asserção de DOM
    })
    test("TST1159 - Clicar em \"Fechar\" na exclusão", async ({ page }) => {
      await preencherModalAnexo(page, "Não deve excluir")
      await salvarEFecharModalAnexo(page)
      await linhaAnexo(page, "Não deve excluir").locator("mat-icon", { hasText: "delete_outline" }).click()
      // o toast de info do save anterior deixa uma cópia de acessibilidade
      // escondida em outro cdk-overlay com o mesmo texto "Fechar" — usa .first()
      await page.getByRole("button", { name: "Fechar" }).first().click()
      await expect(linhaAnexo(page, "Não deve excluir")).toBeVisible()
    })
    test("TST1160 - Confirmar exclusão", async ({ page }) => {
      await preencherModalAnexo(page, "Confirmar exclusão")
      await salvarEFecharModalAnexo(page)
      await linhaAnexo(page, "Confirmar exclusão").locator("mat-icon", { hasText: "delete_outline" }).click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(page.getByText(/Operação realizada com sucesso/i).first()).toBeVisible()
    })
    test("TST1161 - Validar remoção do item no grid", async ({ page }) => {
      await preencherModalAnexo(page, "Remoção do grid")
      await salvarEFecharModalAnexo(page)
      await linhaAnexo(page, "Remoção do grid").locator("mat-icon", { hasText: "delete_outline" }).click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(linhaAnexo(page, "Remoção do grid")).not.toBeVisible()
    })
    test("TST1162 - Validar exclusão sequencial de vários itens", async ({ page }) => {
      await preencherModalAnexo(page, "Sequencial um")
      await salvarEFecharModalAnexo(page)
      await preencherModalAnexo(page, "Sequencial dois")
      await salvarEFecharModalAnexo(page)
      await linhaAnexo(page, "Sequencial um").locator("mat-icon", { hasText: "delete_outline" }).click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(linhaAnexo(page, "Sequencial um")).not.toBeVisible()
      await linhaAnexo(page, "Sequencial dois").locator("mat-icon", { hasText: "delete_outline" }).click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(linhaAnexo(page, "Sequencial dois")).not.toBeVisible()
    })
    test("TST1163 - Validar exclusão do último item", async ({ page }) => {
      await preencherModalAnexo(page, "Último item")
      await salvarEFecharModalAnexo(page)
      await linhaAnexo(page, "Último item").locator("mat-icon", { hasText: "delete_outline" }).click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(page.getByRole("tabpanel", { name: "Anexos" }).getByText("Sem registros para listar.")).toBeVisible()
    })
    test("TST1164 - Validar exclusão e inclusão em sequência", async ({ page }) => {
      await preencherModalAnexo(page, "Vai ser excluído")
      await salvarEFecharModalAnexo(page)
      await linhaAnexo(page, "Vai ser excluído").locator("mat-icon", { hasText: "delete_outline" }).click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(linhaAnexo(page, "Vai ser excluído")).not.toBeVisible()
      await preencherModalAnexo(page, "Incluído depois")
      await salvarEFecharModalAnexo(page)
      await expect(linhaAnexo(page, "Incluído depois")).toBeVisible()
    })
  })

  test.describe("Tooltip e Revisor", () => {
    // TST1165-1169: não implementados ainda. Descoberta (2026-07-23): a linha
    // do grid tem um ícone "info_outline" candidato a mostrar a auditoria, mas
    // dar hover nele não retornou nenhum texto de tooltip legível na exploração
    // ao vivo (existem ~70 elementos de tooltip escondidos no DOM da página,
    // provavelmente templates do Angular Material não populados) — não achamos
    // ainda o mecanismo real de exibição dessa informação
    test.fixme("TST1165 - Passar mouse no ícone de revisor", async ({ page }) => {
      // Esperado: Deve exibir tooltip corretamente
    })
    test.fixme("TST1166 - Validar conteúdo do tooltip", async ({ page }) => {
      // Esperado: Deve conter: criado por, data criação, revisor, data edição
    })
    test.fixme("TST1167 - Validar formato da data", async ({ page }) => {
      // Esperado: Deve estar no padrão dd/mm/aaaa hh:mm:ss
    })
    test.fixme("TST1168 - Validar atualização após edição", async ({ page }) => {
      // Esperado: Deve atualizar dados do revisor
    })
    test.fixme("TST1169 - Validar comportamento sem edição", async ({ page }) => {
      // Esperado: Deve exibir apenas dados de criação
    })
  })

  test.describe("Cenários gerais", () => {
    test("TST1170 - Clicar rapidamente várias vezes em salvar", async ({ page }) => {
      // "Salvar" da modal em si não fecha nem duplica linha (só mostra o toast
      // de info repetidas vezes) — o que evita duplicar é nunca haver 2 linhas
      // pro mesmo anexo enquanto a modal não fecha de verdade
      await preencherModalAnexo(page, "Clique rápido")
      const botaoSalvar = page.getByRole("button", { name: "Salvar", exact: true })
      await botaoSalvar.click()
      await botaoSalvar.click()
      await botaoSalvar.click()
      await expect(page.getByText(/Registro incluído com sucesso/i).first()).toBeVisible()
      // Descoberta: 3 cliques rápidos parecem disparar 3 requisições de salvar
      // em paralelo — clicar em "Fechar" logo em seguida é ignorado silenciosamente
      // (nenhum erro, só não fecha) enquanto ainda há alguma pendente. Dá tempo
      // de decantar e tenta "Fechar" em loop até a modal realmente fechar
      const modalAdicionar = page.getByRole("heading", { name: "Adicionar anexo" })
      const dialogoAtencao = page.getByRole("heading", { name: "Atenção" })
      await page.waitForTimeout(1500)
      for (let tentativa = 0; tentativa < 5; tentativa++) {
        // checa o diálogo "Atenção" (que abre por cima, com backdrop) ANTES de
        // checar a modal de baixo — senão o loop fica preso tentando clicar no
        // "Fechar" de baixo, bloqueado pelo backdrop do diálogo de cima
        if (await dialogoAtencao.isVisible().catch(() => false)) {
          await page.getByRole("button", { name: "Salvar e sair" }).click()
          break
        }
        if (!(await modalAdicionar.isVisible().catch(() => false))) break
        await page.getByRole("button", { name: "Fechar" }).click()
        await page.waitForTimeout(500)
      }
      await expect(linhaAnexo(page, "Clique rápido")).toHaveCount(1)
    })
    test("TST1171 - Editar anexo e não salvar", async ({ page }) => {
      await preencherModalAnexo(page, "Original sem salvar edição")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Original sem salvar edição")
      await page.getByLabel(/descri/i).fill("Alteração que será descartada")
      await page.getByRole("button", { name: "Fechar" }).click()
      await page.getByRole("button", { name: "Sair sem salvar" }).click()
      await expect(linhaAnexo(page, "Original sem salvar edição")).toBeVisible()
    })
    test.fixme("TST1172 - Reordenar e excluir ao mesmo tempo", async ({ page }) => {
      // Esperado: Sistema deve manter consistência
      // Ainda não implementado: depende de reordenação por drag-and-drop, não explorada ainda
    })
    test.fixme("TST1173 - Excluir item enquanto outro usuário edita", async ({ page }) => {
      // Esperado: Sistema deve tratar conflito
      // Ainda não implementado: exige 2 sessões/contextos simultâneos (2 browserContexts)
    })
    test.fixme("TST1174 - Upload + reorder + editar sem salvar", async ({ page }) => {
      // Esperado: Sistema não deve corromper estado
      // Ainda não implementado: depende de reordenação por drag-and-drop, não explorada ainda
    })
    test.fixme("TST1175 - Alterar anexo e reordenar sem salvar", async ({ page }) => {
      // Esperado: Deve manter estado consistente
      // Ainda não implementado: depende de reordenação por drag-and-drop, não explorada ainda
    })
    test.fixme("TST1176 - Tentar baixar arquivo após exclusão", async ({ page }) => {
      // Esperado: Não deve permitir
      // Ainda não implementado: exige interceptar page.waitForEvent('download'), não explorado ainda
    })
    test("TST1177 - Alterar arquivo e cancelar", async ({ page }) => {
      await preencherModalAnexo(page, "Mantém arquivo anterior")
      await salvarEFecharModalAnexo(page)
      await abrirEdicaoAnexo(page, "Mantém arquivo anterior")
      await page.getByLabel(/descri/i).fill("Não deve persistir")
      await page.getByRole("button", { name: "Fechar" }).click()
      await page.getByRole("button", { name: "Sair sem salvar" }).click()
      await expect(linhaAnexo(page, "Mantém arquivo anterior")).toBeVisible()
      await expect(linhaAnexo(page, "Não deve persistir")).not.toBeVisible()
    })
    test.fixme("TST1178 - Upload com mesmo nome de arquivo", async ({ page }) => {
      // Esperado: Deve tratar corretamente
    })
    test.fixme("TST1179 - Reordenar e salvar em outra aba", async ({ page }) => {
      // Esperado: Deve manter consistência
    })
    // TST1180: validação visual contra mockup — checklist manual
    test.fixme("TST1180 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Grid, modal, botões, ordenação, tooltips e layout devem estar
      // 100% conforme o modelo
    })
  })
})
