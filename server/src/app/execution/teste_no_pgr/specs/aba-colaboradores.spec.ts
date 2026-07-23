// SETUP/SCAFFOLD — cenários da planilha real (TST1182-TST1278), aba Colaboradores
// do cadastro de PGR. Ver aba-configuracoes.spec.ts para a explicação de por que
// usamos test.fixme() em vez de test() aqui.
//
// Doc de referência (ver ef/playwright/):
// - Botão "Adicionar" / modal Colaboradores → 09-acoes (click), 08-localizadores
// - Campos "Colaborador" e "Cargo" (texto, limite 60 caracteres) → 09-acoes (fill),
//   10-afirmacoes (toHaveValue, mensagens de erro)
// - Grid (listagem, ordem de inserção, sem ordenação por coluna) → 08-localizadores
//   (getByRole('row')/filter), 10-afirmacoes (toHaveCount, toHaveText)
// - Botões Editar/Excluir por linha + modal de confirmação → 09-acoes, 10-afirmacoes
import { test, expect, type Page } from "@playwright/test"
import { login } from "../../support/login"
import { abrirNovoCadastroPgr, abrirAba, preencherCadastroValidoESalvar } from "../../support/pgr"

// o botão "Adicionar" existe em mais de uma aba (Referências tem um pra
// Equipe) — sem escopar pela aba certa, getByRole bate em 2 elementos e
// quebra o modo estrito do Playwright (ver 08-localizadores.md)
function botaoAdicionarColaborador(page: Page) {
  return page.getByLabel("Colaboradores").getByRole("button", { name: "Adicionar" })
}

async function adicionarColaborador(page: Page, nome: string, cargo: string) {
  await botaoAdicionarColaborador(page).click()
  await page.getByRole("textbox", { name: /Colaborador/ }).fill(nome)
  await page.getByRole("textbox", { name: /Cargo/ }).fill(cargo)
  await page.getByRole("button", { name: "Salvar", exact: true }).click()
  // espera a modal realmente fechar (some o heading) antes de devolver o
  // controle — sem isso, uma chamada seguinte (ex: adicionar outro colaborador
  // em sequência) pode tentar interagir com a tela ainda em transição
  await expect(page.getByRole("heading", { name: "Colaboradores" })).not.toBeVisible()
}

// a <tr> não tem role="row" explícito nessa tabela — getByRole('row') não
// funciona aqui, por isso escopamos por CSS "tr" contendo o texto do nome
function linhaColaborador(page: Page, nome: string) {
  return page.locator("tr", { has: page.getByText(nome, { exact: true }) })
}

function botaoEditarLinha(page: Page, nome: string) {
  return linhaColaborador(page, nome).locator("button", { has: page.locator("mat-icon", { hasText: "edit_outline" }) })
}

function botaoExcluirLinha(page: Page, nome: string) {
  return linhaColaborador(page, nome).locator("button", { has: page.locator("mat-icon", { hasText: "delete_outline" }) })
}

test.describe("Aba Colaboradores (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await abrirNovoCadastroPgr(page)
    await abrirAba(page, "Colaboradores")
  })

  test.describe("Modal + Regras + Usabilidade", () => {
    test("TST1182 - Acessar aba \"Colaboradores\"", async ({ page }) => {
      await expect(page.getByRole("tab", { name: "Colaboradores" })).toBeVisible()
    })
    test.fixme("TST1183 - Validar texto fixo da tela", async ({ page }) => {
      // Esperado: Texto deve estar correto, sem erro ortográfico
      // "Correto/sem erro ortográfico" é melhor avaliado por revisão humana
      // do texto, não por asserção automatizada
    })
    test("TST1184 - Validar clareza do texto", async ({ page }) => {
      // texto real conferido na tela (2026-07-23): avisa que o capítulo some
      // do laudo se a lista de colaboradores ficar vazia — é exatamente a
      // "clareza sobre o impacto no laudo" que o cenário pede
      await expect(page.getByText(/capítulo sobre Colaboradores não será exibido no laudo/i)).toBeVisible()
    })
    test("TST1185 - Validar botão \"Adicionar\"", async ({ page }) => {
      await expect(botaoAdicionarColaborador(page)).toBeVisible()
      // TODO: confirmar o ícone "+" especificamente via inspeção visual
    })
    test("TST1186 - Clicar em \"Adicionar\"", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible()
    })
    test("TST1187 - Validar título da modal", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible()
    })
    test("TST1188 - Validar presença dos campos", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await expect(page.getByRole("textbox", { name: /Colaborador/ })).toBeVisible()
      await expect(page.getByRole("textbox", { name: /Cargo/ })).toBeVisible()
    })
    test.fixme("TST1189 - Validar layout da modal", async ({ page }) => {
      // Esperado: Campos devem estar alinhados
      // "Layout" é melhor verificado visualmente (screenshot), não por asserção de DOM
    })
    test("TST1190 - Validar campo \"Colaborador\" vazio", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Analista")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })
    test("TST1191 - Validar campo \"Cargo\" vazio", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("Fulano de Tal")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })
    test("TST1192 - Tentar salvar sem preencher campos", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })
    test("TST1193 - Preencher ambos os campos corretamente", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("Fulano de Tal")
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Analista de Testes")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()

      // modal fecha e o novo colaborador aparece no grid — confirma que salvou.
      // Descoberta: o nome aparece 2x no DOM (célula + tooltip escondido do
      // Material) — getByText bate nos dois e quebra o modo estrito, por
      // isso escopamos pela célula da grid especificamente
      await expect(page.getByRole("heading", { name: "Colaboradores" })).not.toBeVisible()
      await expect(page.getByRole("cell", { name: "Fulano de Tal" })).toBeVisible()
    })
    test("TST1194 - Validar limite de 60 caracteres no campo \"Colaborador\"", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      const colaborador = page.getByRole("textbox", { name: /Colaborador/ })
      await colaborador.fill("a".repeat(60))
      await expect(colaborador).toHaveValue("a".repeat(60))
    })
    test("TST1195 - Inserir mais de 60 caracteres", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      const colaborador = page.getByRole("textbox", { name: /Colaborador/ })
      await colaborador.fill("a".repeat(70))
      // bloqueado pelo próprio campo — só entram os 60 primeiros (mesmo
      // padrão do campo 06 da aba Configurações, ver TST1036)
      await expect(colaborador).toHaveValue("a".repeat(60))
    })
    test("TST1196 - Validar limite de 60 caracteres no campo \"Cargo\"", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      const cargo = page.getByRole("textbox", { name: /Cargo/ })
      await cargo.fill("a".repeat(70))
      await expect(cargo).toHaveValue("a".repeat(60))
    })
    test("TST1197 - Validar inserção de caracteres especiais", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      const colaborador = page.getByRole("textbox", { name: /Colaborador/ })
      await colaborador.fill("José D'Ávila & Cia. (Ltda.) - #1")
      await expect(colaborador).toHaveValue("José D'Ávila & Cia. (Ltda.) - #1")
    })
    test("TST1198 - Validar uso de letras maiúsculas e minúsculas", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      const colaborador = page.getByRole("textbox", { name: /Colaborador/ })
      await colaborador.fill("MaRiA da SILVA")
      await expect(colaborador).toHaveValue("MaRiA da SILVA")
    })
    test("TST1199 - Validar inserção com espaços", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      const colaborador = page.getByRole("textbox", { name: /Colaborador/ })
      await colaborador.fill("Maria   da   Silva")
      await expect(colaborador).toHaveValue("Maria   da   Silva")
    })
    test.fixme("TST1200 - Validar colagem de texto", async ({ page }) => {
      // Esperado: Deve permitir
      // Ainda não implementado: colar (Ctrl+V) via Playwright exige simular
      // o clipboard do SO, mais complexo que fill() — deixado pra depois
    })
    test.fixme("TST1201 - Validar colagem com texto longo", async ({ page }) => {
      // Esperado: Deve respeitar limite
      // Mesmo motivo do TST1200
    })
    test("TST1202 - Clicar em \"Salvar\" com dados válidos", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("Ciclano de Souza")
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Técnico de Segurança")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByRole("heading", { name: "Colaboradores" })).not.toBeVisible()
    })
    test("TST1203 - Validar mensagem de sucesso", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("Beltrano Souza")
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Engenheiro")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // o texto do toast aparece 2x no DOM (o elemento visível + uma cópia
      // dentro de um cdk-overlay) — .first() evita a violação do modo estrito
      await expect(page.getByText(/Operação realizada com sucesso/i).first()).toBeVisible()
    })
    test("TST1204 - Validar persistência após salvar e reabrir", async ({ page }) => {
      await adicionarColaborador(page, "Persistencia Reabrir", "Cargo")
      await preencherCadastroValidoESalvar(page)
      const urlComIdkey = page.url()
      await page.goto("/apollus/seguranca/programas-laudos/pgr")
      await page.goto(urlComIdkey)
      await abrirAba(page, "Colaboradores")
      await expect(page.getByRole("cell", { name: "Persistencia Reabrir", exact: true })).toBeVisible()
    })
    test("TST1205 - Clicar em \"Salvar e Adicionar outro\"", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("Salvar Adicionar Outro")
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Cargo X")
      await page.getByRole("button", { name: "Salvar e adicionar outro" }).click()
      // modal continua aberta (confirmado via exploração ao vivo), diferente
      // do "Salvar" normal que fecha — deixa aberta pra adicionar o próximo.
      // Descoberta: com a modal aberta, o Angular Material marca o conteúdo
      // de fundo como aria-hidden — getByRole('cell') não encontra nada
      // (mesmo existindo no DOM) até a modal fechar. Usa locator CSS puro,
      // que ignora aria-hidden, pra checar a linha por trás da modal
      await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible()
      await expect(page.locator("td", { hasText: "Salvar Adicionar Outro" })).toBeVisible()
    })
    test("TST1206 - Validar limpeza da modal após salvar e adicionar outro", async ({ page }) => {
      // Descoberta: diferente da modal de Anexos (que mantém os campos
      // preenchidos), a modal de Colaboradores REALMENTE reseta os campos
      // após "Salvar e adicionar outro" — confirmado via exploração ao vivo
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("Sera Resetado")
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Cargo Y")
      await page.getByRole("button", { name: "Salvar e adicionar outro" }).click()
      await expect(page.getByRole("textbox", { name: /Colaborador/ })).toHaveValue("")
      await expect(page.getByRole("textbox", { name: /Cargo/ })).toHaveValue("")
    })
    test("TST1207 - Validar botão \"Salvar e Adicionar outro\" em inclusão", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await expect(page.getByRole("button", { name: "Salvar e adicionar outro" })).toBeVisible()
    })
    test("TST1208 - Validar botão \"Salvar e Adicionar outro\" em edição (futuro)", async ({ page }) => {
      await adicionarColaborador(page, "Sem Salvar Outro Edicao", "Cargo")
      await botaoEditarLinha(page, "Sem Salvar Outro Edicao").click()
      await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible()
      await expect(page.getByRole("button", { name: "Salvar e adicionar outro" })).not.toBeVisible()
    })
    test("TST1209 - Clicar em \"Fechar\"", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("button", { name: "Fechar" }).click()
      await expect(page.getByRole("heading", { name: "Colaboradores" })).not.toBeVisible()
    })
    test("TST1210 - Preencher dados e fechar sem salvar", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("Nao Deve Salvar")
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Cargo")
      await page.getByRole("button", { name: "Fechar" }).click()
      // campo foi alterado -> pede confirmação (mesmo padrão de Anexos)
      await page.getByRole("button", { name: "Sair sem salvar" }).click()
      await expect(page.getByRole("cell", { name: "Nao Deve Salvar", exact: true })).not.toBeVisible()
    })
    test("TST1211 - Validar múltiplos cadastros sequenciais", async ({ page }) => {
      await adicionarColaborador(page, "Seq Multi 1", "A")
      await adicionarColaborador(page, "Seq Multi 2", "B")
      await adicionarColaborador(page, "Seq Multi 3", "C")
      await expect(page.getByRole("cell", { name: "Seq Multi 1", exact: true })).toBeVisible()
      await expect(page.getByRole("cell", { name: "Seq Multi 2", exact: true })).toBeVisible()
      await expect(page.getByRole("cell", { name: "Seq Multi 3", exact: true })).toBeVisible()
    })
    test.fixme("TST1212 - Validar comportamento com muitos colaboradores", async ({ page }) => {
      // Esperado: Deve manter performance
      // "Performance" não é uma boa asserção funcional de Playwright — melhor
      // medido por ferramenta de performance dedicada, não E2E funcional
    })
    // Descoberta / BUG real (2026-07-23): clicar em "Salvar" 2x bem rápido
    // (antes do 1º clique fechar a modal) DUPLICA o colaborador — confirmado
    // por screenshot mostrando 2 linhas idênticas "Duplo Clique Salvar" após
    // um duplo clique disparado com Promise.all. O cenário espera "não deve
    // duplicar registros", mas o sistema real duplica — mantido como fixme
    // pra não reportar um bug real como teste passando
    test.fixme("TST1213 - Validar comportamento ao salvar rapidamente várias vezes", async ({ page }) => {
      // Esperado: Não deve duplicar registros
      // BUG: clicar 2x rápido em "Salvar" duplica o colaborador no grid
    })
    test("TST1214 - Validar inserção de nomes iguais", async ({ page }) => {
      await adicionarColaborador(page, "Nome Repetido", "Cargo A")
      await adicionarColaborador(page, "Nome Repetido", "Cargo B")
      await expect(page.getByRole("cell", { name: "Nome Repetido", exact: true })).toHaveCount(2)
    })
    test("TST1215 - Validar inserção de cargos iguais", async ({ page }) => {
      await adicionarColaborador(page, "Pessoa A", "Cargo Repetido")
      await adicionarColaborador(page, "Pessoa B", "Cargo Repetido")
      await expect(page.getByRole("cell", { name: "Cargo Repetido", exact: true })).toHaveCount(2)
    })
    test.fixme("TST1216 - Validar comportamento com dados vazios no grid", async ({ page }) => {
      // Esperado: Capítulo não deve aparecer no laudo
    })
    test.fixme("TST1217 - Validar comportamento com ao menos 1 colaborador", async ({ page }) => {
      // Esperado: Capítulo deve aparecer no laudo
    })
    test.fixme("TST1218 - Adicionar e remover todos os colaboradores", async ({ page }) => {
      // Esperado: Capítulo deve voltar a ficar oculto
    })
    test("TST1219 - Validar persistência após salvar e reabrir tela", async ({ page }) => {
      // variação do TST1204: aqui usa reload() em vez de navegar pra fora e voltar
      await adicionarColaborador(page, "Persistencia Reload", "Cargo")
      await preencherCadastroValidoESalvar(page)
      await page.reload()
      await abrirAba(page, "Colaboradores")
      await expect(page.getByRole("cell", { name: "Persistencia Reload", exact: true })).toBeVisible()
    })
    test("TST1220 - Validar comportamento ao atualizar página sem salvar", async ({ page }) => {
      await adicionarColaborador(page, "Perde No Reload", "Cargo")
      await page.reload()
      await abrirAba(page, "Colaboradores")
      await expect(page.getByRole("cell", { name: "Perde No Reload", exact: true })).not.toBeVisible()
    })
    test.fixme("TST1221 - Validar clique rápido nos botões", async ({ page }) => {
      // Esperado: Sistema deve manter consistência
    })
    test.fixme("TST1222 - Validar comportamento em múltiplas abas", async ({ page }) => {
      // Esperado: Deve manter consistência
    })
    test.fixme("TST1223 - Validar layout responsivo", async ({ page }) => {
      // Esperado: Deve se adaptar corretamente
    })
    test.fixme("TST1224 - Validar cores dos botões", async ({ page }) => {
      // Esperado: Devem seguir padrão do sistema
    })
    // TST1225: validação visual contra mockup — checklist manual
    test.fixme("TST1225 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Modal, campos, botões e comportamento devem estar 100%
      // conforme o modelo
    })
  })

  test.describe("Grid de Colaboradores (Listagem + Ações + Regras)", () => {
    test("TST1226 - Inserir um colaborador", async ({ page }) => {
      await adicionarColaborador(page, "Colaborador Solo", "Cargo Solo")
      await expect(page.getByRole("cell", { name: "Colaborador Solo", exact: true })).toBeVisible()
    })
    test("TST1227 - Inserir múltiplos colaboradores", async ({ page }) => {
      await adicionarColaborador(page, "Multi Um", "Cargo A")
      await adicionarColaborador(page, "Multi Dois", "Cargo B")
      await expect(page.getByRole("cell", { name: "Multi Um", exact: true })).toBeVisible()
      await expect(page.getByRole("cell", { name: "Multi Dois", exact: true })).toBeVisible()
    })
    test("TST1228 - Validar coluna \"Colaborador\"", async ({ page }) => {
      await adicionarColaborador(page, "Nome Exato Aqui", "Cargo Qualquer")
      await expect(page.getByRole("cell", { name: "Nome Exato Aqui", exact: true })).toBeVisible()
    })
    test("TST1229 - Validar coluna \"Cargo\"", async ({ page }) => {
      await adicionarColaborador(page, "Alguém", "Cargo Exato Aqui")
      await expect(page.getByRole("cell", { name: "Cargo Exato Aqui", exact: true })).toBeVisible()
    })
    test("TST1230 - Validar grid sem registros", async ({ page }) => {
      // mesmo texto confirmado na aba Anexos: "Sem registros para listar."
      // — precisa escopar por tabpanel pois a mensagem pode se repetir em
      // mais de uma grid vazia na mesma tela
      await expect(page.getByRole("tabpanel", { name: "Colaboradores" }).getByText("Sem registros para listar.")).toBeVisible()
    })
    test("TST1231 - Validar ordem de inserção", async ({ page }) => {
      await adicionarColaborador(page, "Ordem Primeiro", "X")
      await adicionarColaborador(page, "Ordem Segundo", "Y")
      const linhas = page.locator("tr", { has: page.getByRole("cell") })
      const textoPrimeiraLinha = await linhas.first().textContent()
      expect(textoPrimeiraLinha).toContain("Ordem Primeiro")
    })
    test("TST1232 - Inserir 3 colaboradores em sequência", async ({ page }) => {
      await adicionarColaborador(page, "Seq A", "1")
      await adicionarColaborador(page, "Seq B", "2")
      await adicionarColaborador(page, "Seq C", "3")
      const linhas = page.locator("tr", { has: page.getByRole("cell") })
      await expect(linhas.nth(0)).toContainText("Seq A")
      await expect(linhas.nth(1)).toContainText("Seq B")
      await expect(linhas.nth(2)).toContainText("Seq C")
    })
    test("TST1233 - Editar colaborador do meio", async ({ page }) => {
      await adicionarColaborador(page, "Meio A", "1")
      await adicionarColaborador(page, "Meio B", "2")
      await adicionarColaborador(page, "Meio C", "3")

      await botaoEditarLinha(page, "Meio B").click()
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Cargo Editado")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()

      const linhas = page.locator("tr", { has: page.getByRole("cell") })
      await expect(linhas.nth(0)).toContainText("Meio A")
      await expect(linhas.nth(1)).toContainText("Meio B")
      await expect(linhas.nth(2)).toContainText("Meio C")
    })
    test("TST1234 - Excluir colaborador do meio", async ({ page }) => {
      await adicionarColaborador(page, "Del A", "1")
      await adicionarColaborador(page, "Del B", "2")
      await adicionarColaborador(page, "Del C", "3")

      await botaoExcluirLinha(page, "Del B").click()
      await page.getByRole("button", { name: "Excluir" }).click()

      const linhas = page.locator("tr", { has: page.getByRole("cell") })
      await expect(linhas.nth(0)).toContainText("Del A")
      await expect(linhas.nth(1)).toContainText("Del C")
      await expect(page.getByRole("cell", { name: "Del B", exact: true })).not.toBeVisible()
    })
    test("TST1235 - Inserir novo após exclusão", async ({ page }) => {
      await adicionarColaborador(page, "PosDel A", "1")
      await adicionarColaborador(page, "PosDel B", "2")
      await botaoExcluirLinha(page, "PosDel A").click()
      await page.getByRole("button", { name: "Excluir" }).click()

      await adicionarColaborador(page, "PosDel C", "3")
      const linhas = page.locator("tr", { has: page.getByRole("cell") })
      await expect(linhas.last()).toContainText("PosDel C")
    })
    test("TST1236 - Validar que não permite ordenação por coluna", async ({ page }) => {
      // Descoberta: confirmado via inspeção real — o cabeçalho da coluna tem
      // a classe "mat-sort-header-disabled" (Angular Material CDK), provando
      // no próprio DOM que a ordenação está desligada nessa tabela
      const cabecalho = page.getByLabel("Colaboradores").getByRole("columnheader", { name: "Colaborador" })
      const desabilitado = await cabecalho.locator(".mat-sort-header").evaluate(el => el.classList.contains("mat-sort-header-disabled"))
      expect(desabilitado).toBe(true)
    })
    test("TST1237 - Tentar ordenar via clique no cabeçalho", async ({ page }) => {
      await adicionarColaborador(page, "Zebra Ordem", "1")
      await adicionarColaborador(page, "Abacaxi Ordem", "2")
      await page.getByLabel("Colaboradores").getByRole("columnheader", { name: "Colaborador" }).click()
      const linhas = page.locator("tr", { has: page.getByRole("cell") })
      // clicar no cabeçalho não reordena — "Zebra Ordem" continua primeiro
      // (ordem de inserção), mesmo sendo alfabeticamente depois de "Abacaxi"
      await expect(linhas.first()).toContainText("Zebra Ordem")
    })
  })

  test.describe("Botão Editar", () => {
    test("TST1238 - Validar botão \"Editar\" visível", async ({ page }) => {
      await adicionarColaborador(page, "Editar Visivel", "Cargo")
      await expect(botaoEditarLinha(page, "Editar Visivel")).toBeVisible()
    })
    test("TST1239 - Clicar em \"Editar\"", async ({ page }) => {
      await adicionarColaborador(page, "Clicar Editar", "Cargo")
      await botaoEditarLinha(page, "Clicar Editar").click()
      await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible()
    })
    test("TST1240 - Validar dados carregados", async ({ page }) => {
      await adicionarColaborador(page, "Dados Carregados", "Cargo Original")
      await botaoEditarLinha(page, "Dados Carregados").click()
      await expect(page.getByRole("textbox", { name: /Colaborador/ })).toHaveValue("Dados Carregados")
      await expect(page.getByRole("textbox", { name: /Cargo/ })).toHaveValue("Cargo Original")
    })
    test("TST1241 - Editar nome do colaborador", async ({ page }) => {
      await adicionarColaborador(page, "Nome Original", "Cargo X")
      await botaoEditarLinha(page, "Nome Original").click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("Nome Alterado")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByRole("cell", { name: "Nome Alterado", exact: true })).toBeVisible()
    })
    test("TST1242 - Editar cargo", async ({ page }) => {
      await adicionarColaborador(page, "Pessoa Cargo", "Cargo Original")
      await botaoEditarLinha(page, "Pessoa Cargo").click()
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Cargo Alterado")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByRole("cell", { name: "Cargo Alterado", exact: true })).toBeVisible()
    })
    test("TST1243 - Salvar edição", async ({ page }) => {
      await adicionarColaborador(page, "Antes Da Edicao", "Cargo")
      await botaoEditarLinha(page, "Antes Da Edicao").click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("Depois Da Edicao")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByRole("cell", { name: "Depois Da Edicao", exact: true })).toBeVisible()
      await expect(page.getByRole("cell", { name: "Antes Da Edicao", exact: true })).not.toBeVisible()
    })
    test("TST1244 - Validar mensagem de sucesso", async ({ page }) => {
      await adicionarColaborador(page, "Msg Sucesso", "Cargo")
      await botaoEditarLinha(page, "Msg Sucesso").click()
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Cargo Novo")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // o texto do toast aparece 2x no DOM (o elemento visível + uma cópia
      // dentro de um cdk-overlay) — .first() evita a violação do modo estrito
      await expect(page.getByText(/Operação realizada com sucesso/i).first()).toBeVisible()
    })
    test("TST1245 - Editar e fechar sem salvar", async ({ page }) => {
      await adicionarColaborador(page, "Fechar Sem Salvar", "Cargo Original")
      await botaoEditarLinha(page, "Fechar Sem Salvar").click()
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Cargo Que Nao Deve Salvar")
      await page.getByRole("button", { name: "Fechar" }).click()
      // alterou um campo -> aparece a confirmação "Atenção" (mesmo padrão da
      // modal de Anexos) — descartamos escolhendo "Sair sem salvar"
      await page.getByRole("button", { name: "Sair sem salvar" }).click()
      await expect(page.getByRole("cell", { name: "Cargo Original", exact: true })).toBeVisible()
    })
    test("TST1246 - Editar removendo conteúdo obrigatório", async ({ page }) => {
      await adicionarColaborador(page, "Remover Obrigatorio", "Cargo")
      await botaoEditarLinha(page, "Remover Obrigatorio").click()
      await page.getByRole("textbox", { name: /Colaborador/ }).fill("")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
      // modal continua aberta — não salvou
      await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible()
    })
    test("TST1247 - Editar com mais de 60 caracteres", async ({ page }) => {
      await adicionarColaborador(page, "Limite Edicao", "Cargo")
      await botaoEditarLinha(page, "Limite Edicao").click()
      const colaborador = page.getByRole("textbox", { name: /Colaborador/ })
      await colaborador.fill("b".repeat(70))
      await expect(colaborador).toHaveValue("b".repeat(60))
    })
    test.fixme("TST1248 - Editar rapidamente vários registros", async ({ page }) => {
      // Esperado: Sistema deve manter consistência
      // Ainda não implementado: teste de estabilidade sob cliques rápidos
      // repetidos, mais elaborado que os outros do grupo
    })
    test("TST1249 - Editar e atualizar página sem salvar", async ({ page }) => {
      await adicionarColaborador(page, "Editar Sem Salvar Reload", "Cargo Original")
      await preencherCadastroValidoESalvar(page)
      await abrirAba(page, "Colaboradores")
      await botaoEditarLinha(page, "Editar Sem Salvar Reload").click()
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Cargo Alterado Nao Salvo")
      await page.reload()
      await abrirAba(page, "Colaboradores")
      await expect(page.getByRole("cell", { name: "Cargo Original", exact: true })).toBeVisible()
    })
  })

  test.describe("Botão Excluir", () => {
    test("TST1250 - Validar botão \"Excluir\" visível", async ({ page }) => {
      await adicionarColaborador(page, "Excluir Visivel", "Cargo")
      await expect(botaoExcluirLinha(page, "Excluir Visivel")).toBeVisible()
    })
    test("TST1251 - Clicar em \"Excluir\"", async ({ page }) => {
      await adicionarColaborador(page, "Clicar Excluir", "Cargo")
      await botaoExcluirLinha(page, "Clicar Excluir").click()
      await expect(page.getByRole("heading", { name: "Atenção" })).toBeVisible()
    })
    test("TST1252 - Validar texto da modal de exclusão", async ({ page }) => {
      await adicionarColaborador(page, "Texto Exclusao", "Cargo")
      await botaoExcluirLinha(page, "Texto Exclusao").click()
      await expect(page.getByText("Deseja realmente excluir este item?")).toBeVisible()
    })
    test.fixme("TST1253 - Validar botão \"Excluir\" destacado", async ({ page }) => {
      // Esperado: Deve estar em destaque
      // "Destaque" é visual (cor vermelha) — melhor avaliado por screenshot,
      // não por asserção de DOM
    })
    test("TST1254 - Clicar em \"Fechar\"", async ({ page }) => {
      await adicionarColaborador(page, "Fechar Nao Exclui", "Cargo")
      await botaoExcluirLinha(page, "Fechar Nao Exclui").click()
      await page.getByRole("button", { name: "Fechar" }).click()
      await expect(page.getByRole("cell", { name: "Fechar Nao Exclui", exact: true })).toBeVisible()
    })
    test("TST1255 - Confirmar exclusão", async ({ page }) => {
      await adicionarColaborador(page, "Confirmar Exclusao", "Cargo")
      await botaoExcluirLinha(page, "Confirmar Exclusao").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      // o texto do toast aparece 2x no DOM (o elemento visível + uma cópia
      // dentro de um cdk-overlay) — .first() evita a violação do modo estrito
      await expect(page.getByText(/Operação realizada com sucesso/i).first()).toBeVisible()
      await expect(page.getByRole("cell", { name: "Confirmar Exclusao", exact: true })).not.toBeVisible()
    })
    test("TST1256 - Validar remoção do item no grid", async ({ page }) => {
      await adicionarColaborador(page, "Remover Do Grid", "Cargo")
      await expect(page.getByRole("cell", { name: "Remover Do Grid", exact: true })).toBeVisible()
      await botaoExcluirLinha(page, "Remover Do Grid").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(page.getByRole("cell", { name: "Remover Do Grid", exact: true })).not.toBeVisible()
    })
    test("TST1257 - Excluir último item", async ({ page }) => {
      await adicionarColaborador(page, "Unico Item", "Cargo")
      await botaoExcluirLinha(page, "Unico Item").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(page.getByRole("cell", { name: "Unico Item", exact: true })).not.toBeVisible()
    })
    test("TST1258 - Excluir todos os colaboradores", async ({ page }) => {
      await adicionarColaborador(page, "Todos A", "1")
      await adicionarColaborador(page, "Todos B", "2")
      await botaoExcluirLinha(page, "Todos A").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await botaoExcluirLinha(page, "Todos B").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(page.getByRole("cell", { name: "Todos A", exact: true })).not.toBeVisible()
      await expect(page.getByRole("cell", { name: "Todos B", exact: true })).not.toBeVisible()
    })
    test("TST1259 - Excluir rapidamente vários itens", async ({ page }) => {
      await adicionarColaborador(page, "Rapido A", "1")
      await adicionarColaborador(page, "Rapido B", "2")
      await botaoExcluirLinha(page, "Rapido A").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await botaoExcluirLinha(page, "Rapido B").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(page.getByRole("cell", { name: "Rapido A", exact: true })).not.toBeVisible()
      await expect(page.getByRole("cell", { name: "Rapido B", exact: true })).not.toBeVisible()
    })
    test("TST1260 - Excluir e inserir novo item", async ({ page }) => {
      await adicionarColaborador(page, "Sera Excluido", "Cargo")
      await botaoExcluirLinha(page, "Sera Excluido").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await adicionarColaborador(page, "Inserido Depois", "Cargo Novo")
      await expect(page.getByRole("cell", { name: "Inserido Depois", exact: true })).toBeVisible()
    })
    test("TST1261 - Excluir item e atualizar página", async ({ page }) => {
      // Descoberta: excluir um colaborador na grid só remove localmente —
      // igual ao padrão já visto em Anexos, precisa clicar no "Salvar"
      // PRINCIPAL do cadastro pra persistir de verdade no backend. Sem isso,
      // um reload() busca o estado ainda salvo no servidor e o item "volta"
      await adicionarColaborador(page, "Excluir Persistente", "Cargo")
      await preencherCadastroValidoESalvar(page)
      await abrirAba(page, "Colaboradores")
      await botaoExcluirLinha(page, "Excluir Persistente").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(page.getByRole("cell", { name: "Excluir Persistente", exact: true })).not.toBeVisible()
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Registro salvo com sucesso").waitFor({ state: "visible" })
      await page.reload()
      await abrirAba(page, "Colaboradores")
      await expect(page.getByRole("cell", { name: "Excluir Persistente", exact: true })).not.toBeVisible()
    })
  })

  test.describe("Cenários gerais", () => {
    test("TST1262 - Inserir, editar e excluir em sequência", async ({ page }) => {
      await adicionarColaborador(page, "Sequencia Completa", "Cargo Original")
      await botaoEditarLinha(page, "Sequencia Completa").click()
      await page.getByRole("textbox", { name: /Cargo/ }).fill("Cargo Editado")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByRole("cell", { name: "Cargo Editado", exact: true })).toBeVisible()
      await botaoExcluirLinha(page, "Sequencia Completa").click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(page.getByRole("cell", { name: "Sequencia Completa", exact: true })).not.toBeVisible()
    })
    test("TST1263 - Inserir duplicados (mesmo nome e cargo)", async ({ page }) => {
      await adicionarColaborador(page, "Duplicado Igual", "Cargo Igual")
      await adicionarColaborador(page, "Duplicado Igual", "Cargo Igual")
      await expect(page.getByRole("cell", { name: "Duplicado Igual", exact: true })).toHaveCount(2)
    })
    test("TST1264 - Inserir dados com espaços extras", async ({ page }) => {
      await botaoAdicionarColaborador(page).click()
      const colaborador = page.getByRole("textbox", { name: /Colaborador/ })
      await colaborador.fill("Nome   Com   Espacos")
      await expect(colaborador).toHaveValue("Nome   Com   Espacos")
    })
    test("TST1265 - Inserir dados com caracteres especiais", async ({ page }) => {
      const nome = "Ana-Paula O'Brien & Cia. #1"
      await adicionarColaborador(page, nome, "Cargo #Especial")
      await expect(page.getByRole("cell", { name: nome, exact: true })).toBeVisible()
    })
    test("TST1266 - Inserir dados com acentos", async ({ page }) => {
      const nome = "José António Conceição"
      await adicionarColaborador(page, nome, "Coordenação")
      await expect(page.getByRole("cell", { name: nome, exact: true })).toBeVisible()
    })
    test("TST1267 - Inserir nome muito curto (ex: \"A\")", async ({ page }) => {
      await adicionarColaborador(page, "A", "Cargo Curto")
      await expect(page.getByRole("cell", { name: "A", exact: true })).toBeVisible()
    })
    test("TST1268 - Inserir cargo com números", async ({ page }) => {
      await adicionarColaborador(page, "Pessoa Numerica", "Nivel 3 - Grau 2")
      await expect(page.getByRole("cell", { name: "Nivel 3 - Grau 2", exact: true })).toBeVisible()
    })
    test.fixme("TST1269 - Inserir texto colado com quebra de linha", async ({ page }) => {
      // Esperado: Deve tratar corretamente
      // Mesmo motivo do TST1200/1201 — colar (Ctrl+V) exige simular clipboard do SO
    })
    test("TST1270 - Inserir vários registros e navegar entre abas", async ({ page }) => {
      await adicionarColaborador(page, "Navega Abas", "Cargo")
      await abrirAba(page, "Configurações")
      await abrirAba(page, "Colaboradores")
      // formulário mantém estado em memória entre abas (mesmo padrão do
      // TST1053 da aba Configurações), mesmo sem ter salvo o cadastro ainda
      await expect(page.getByRole("cell", { name: "Navega Abas", exact: true })).toBeVisible()
    })
    test("TST1271 - Inserir registros e atualizar página sem salvar", async ({ page }) => {
      await adicionarColaborador(page, "Perde Registro Sem Salvar", "Cargo")
      await page.reload()
      await abrirAba(page, "Colaboradores")
      await expect(page.getByRole("cell", { name: "Perde Registro Sem Salvar", exact: true })).not.toBeVisible()
    })
    test("TST1272 - Salvar e reabrir cadastro", async ({ page }) => {
      await adicionarColaborador(page, "Reabrir Cadastro", "Cargo")
      await preencherCadastroValidoESalvar(page)
      const urlComIdkey = page.url()
      await page.goto("/apollus/seguranca/programas-laudos/pgr")
      await page.goto(urlComIdkey)
      await abrirAba(page, "Colaboradores")
      await expect(page.getByRole("cell", { name: "Reabrir Cadastro", exact: true })).toBeVisible()
    })
    test("TST1273 - Validar comportamento com muitos registros", async ({ page }) => {
      for (let i = 1; i <= 5; i++) {
        await adicionarColaborador(page, `Muitos Registros ${i}`, `Cargo ${i}`)
      }
      for (let i = 1; i <= 5; i++) {
        await expect(page.getByRole("cell", { name: `Muitos Registros ${i}`, exact: true })).toBeVisible()
      }
    })
    test("TST1274 - Clicar múltiplas vezes em excluir", async ({ page }) => {
      await adicionarColaborador(page, "Clique Multiplo Excluir", "Cargo")
      await botaoExcluirLinha(page, "Clique Multiplo Excluir").click()
      const botaoExcluirConfirmar = page.getByRole("button", { name: "Excluir" })
      await botaoExcluirConfirmar.click()
      // clique extra depois da modal já ter fechado não deve gerar erro — usa
      // um timeout curto explícito, senão o Playwright fica retentando esse
      // clique (o botão já não existe mais) até o timeout padrão de 30s,
      // consumindo o orçamento inteiro do teste mesmo estando num .catch()
      await botaoExcluirConfirmar.click({ force: true, timeout: 2000 }).catch(() => {})
      await expect(page.getByRole("cell", { name: "Clique Multiplo Excluir", exact: true })).not.toBeVisible()
    })
    test.fixme("TST1275 - Clicar rápido em editar + excluir", async ({ page }) => {
      // Esperado: Sistema deve manter consistência e não deve corromper grid
      // Ainda não implementado: combinação de 2 ações concorrentes é mais
      // elaborada que os outros testes de clique rápido do grupo
    })
    test.fixme("TST1276 - Excluir item e clicar voltar no navegador", async ({ page }) => {
      // Esperado: Não deve restaurar indevidamente
      // Ainda não implementado: comportamento de page.goBack() numa SPA Angular
      // não foi explorado ao vivo ainda — arriscado escrever sem confirmar
      // pra onde o "voltar" realmente navega nesse fluxo
    })
    test.fixme("TST1277 - Grid com muitos itens (stress)", async ({ page }) => {
      // Esperado: Deve manter performance
      // "Performance"/stress não é uma boa asserção funcional de Playwright —
      // ver TST1212, mesmo motivo
    })
    // TST1278: validação visual contra mockup — checklist manual
    test.fixme("TST1278 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Grid, colunas, botões, modais e comportamento devem estar
      // 100% conforme o modelo
    })
  })
})
