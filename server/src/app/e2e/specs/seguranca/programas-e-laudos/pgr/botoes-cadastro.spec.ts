// SETUP/SCAFFOLD — cenários da planilha real (TST1332-TST1399), botões gerais
// do cadastro de PGR (Voltar, Assinatura Digital, Salvar, Gerar PGR, Duplicar) —
// não são exclusivos de uma aba específica. Ver aba-configuracoes.spec.ts para
// a explicação de por que usamos test.fixme() em vez de test() aqui.
//
// Doc de referência (ver ef/playwright/):
// - Botões (Voltar, Salvar, Gerar PGR, Duplicar, Assinar Digitalmente) →
//   09-acoes (click), 08-localizadores (getByRole('button', { name })),
//   10-afirmacoes (toBeDisabled / toBeHidden conforme regra de permissão)
// - Modal de confirmação ao sair sem salvar / duplicar / excluir →
//   10-afirmacoes (toBeVisible), 12-espera-automatica
// - Visibilidade condicional por permissão de usuário (INC/ALT) → conecta com
//   os perfis de teste do projeto (ver [[project_testes_automatizados_playwright]])
import { test, expect } from "../../../../../support"

test.describe("Botões do Cadastro (E2E)", () => {
  test.beforeEach(async ({ page, login, pgr }) => {
    await login.entrar()
    await pgr.abrirNovoCadastro()
    await page.getByRole("button", { name: "Voltar" }).waitFor({ state: "visible" })
  })

  test.describe("Botão \"Voltar\"", () => {
    test("TST1332 - Clicar em \"Voltar\" sem alterações", async ({ page }) => {
      await page.getByRole("button", { name: "Voltar" }).click()
      await expect(page).toHaveURL(/\/pgr$/)
    })
    test("TST1333 - Alterar qualquer campo e clicar \"Voltar\"", async ({ page }) => {
      await page.getByLabel("ART").fill("teste123")
      await page.getByRole("button", { name: "Voltar" }).click()
      await expect(page.getByRole("heading", { name: "Atenção" })).toBeVisible()
    })
    test("TST1334 - Validar texto da modal de confirmação", async ({ page }) => {
      await page.getByLabel("ART").fill("teste123")
      await page.getByRole("button", { name: "Voltar" }).click()
      await expect(page.getByText("Existem informações que não foram salvas. Deseja salvá-las antes de sair?")).toBeVisible()
    })
    test.fixme("TST1335 - Validar botão padrão da modal", async ({ page }) => {
      // Esperado: "Salvar e Sair" deve estar em destaque
      // "Destaque" é visual (cor vermelha) — melhor avaliado por screenshot,
      // não por asserção de DOM
    })
    test("TST1336 - Clicar em \"Sair sem Salvar\"", async ({ page }) => {
      await page.getByLabel("ART").fill("teste123")
      await page.getByRole("button", { name: "Voltar" }).click()
      await page.getByRole("button", { name: "Sair sem salvar" }).click()
      await expect(page).toHaveURL(/\/pgr$/)
    })
    test.fixme("TST1337 - Clicar em \"Salvar e Sair\" com dados válidos", async ({ page }) => {
      // Esperado: Deve salvar e redirecionar
      // Ainda não implementado: precisa do formulário inteiro preenchido
      // (Região, Responsável técnico, Modelo de documento, Vigência, Data base)
    })
    test.fixme("TST1338 - Clicar em \"Salvar e Sair\" com dados inválidos", async ({ page }) => {
      // Esperado: Deve validar como botão salvar e impedir
      // Mesmo motivo do TST1337
    })
    test("TST1339 - Fechar modal sem ação", async ({ page }) => {
      await page.getByLabel("ART").fill("teste123")
      await page.getByRole("button", { name: "Voltar" }).click()
      await expect(page.getByRole("heading", { name: "Atenção" })).toBeVisible()
      // fecha pelo "x" — não é um <button>, é o próprio <mat-icon> clicável.
      // getByRole('img', { name }) não funciona aqui (nome acessível de
      // role=img não considera o texto/ligature do ícone) — igual aos
      // ícones de ação em grids (edit_outline/delete_outline), localizamos
      // pelo texto interno do <mat-icon> mesmo. Existem 2 "close" na página
      // (o outro fecha o painel lateral "Segurança") — .last() pega o mais
      // recente no DOM, que é o da modal "Atenção"
      await page.locator("mat-icon", { hasText: "close" }).last().click()
      // modal fecha e o usuário permanece na tela de cadastro (não navega)
      await expect(page.getByRole("heading", { name: "Atenção" })).not.toBeVisible()
      await expect(page).toHaveURL(/\/pgr\/cadastro/)
    })
    test.fixme("TST1340 - Alterar múltiplas abas e clicar voltar", async ({ page }) => {
      // Esperado: Deve considerar todas as alterações
    })
    test.fixme("TST1341 - Alterar e clicar voltar rapidamente várias vezes", async ({ page }) => {
      // Esperado: Sistema deve manter consistência e voltar apenas uma vez
    })
  })

  test.describe("Botão \"Dados da Assinatura Digital\"", () => {
    test("TST1342 - PGR sem assinatura digital", async ({ page }) => {
      // num cadastro "Novo" (nunca salvo) não há assinatura de forma nenhuma
      await expect(page.getByRole("button", { name: "Dados da Assinatura Digital" })).toBeHidden()
    })
    test.fixme("TST1343 - PGR com assinatura digital", async ({ page }) => {
      // Esperado: Botão deve estar visível
    })
    test.fixme("TST1344 - Clicar no botão", async ({ page }) => {
      // Esperado: Deve abrir modal com dados preenchidos
    })
    test.fixme("TST1345 - Validar conteúdo da modal", async ({ page }) => {
      // Esperado: Deve exibir informações corretas
    })
    test.fixme("TST1346 - Validar download do PDF", async ({ page }) => {
      // Esperado: Deve baixar arquivo correto
    })
    test.fixme("TST1347 - Validar acesso sem permissão", async ({ page }) => {
      // Esperado: Deve respeitar visibilidade
    })
    test.fixme("TST1348 - Validar múltiplos acessos rápidos", async ({ page }) => {
      // Esperado: Deve manter estabilidade
    })
  })

  test.describe("Botão \"Assinar Digitalmente\"", () => {
    test.fixme("TST1349 - PGR já assinado", async ({ page }) => {
      // Esperado: Botão deve estar oculto
    })
    test.fixme("TST1350 - PGR não assinado", async ({ page }) => {
      // Esperado: Botão deve estar visível
    })
    test.fixme("TST1351 - Usuário com CPF diferente do responsável técnico", async ({ page }) => {
      // Esperado: Botão deve estar oculto
    })
    test.fixme("TST1352 - Usuário com CPF igual ao responsável técnico", async ({ page }) => {
      // Esperado: Botão deve estar visível
    })
    test.fixme("TST1353 - Clicar para assinar", async ({ page }) => {
      // Esperado: Deve abrir modal de assinatura
    })
    test.fixme("TST1354 - PGR com múltiplos arquivos", async ({ page }) => {
      // Esperado: Botão deve estar bloqueado
    })
    test.fixme("TST1355 - Clicar com bloqueio", async ({ page }) => {
      // Esperado: Deve exibir [arquivo_grande]
    })
    test.fixme("TST1356 - Validar assinatura com sucesso", async ({ page }) => {
      // Esperado: Deve atualizar estado do PGR
    })
    test.fixme("TST1357 - Validar erro na assinatura (caso ocorra algum erro)", async ({ page }) => {
      // Esperado: Deve exibir erro e manter estado sem gerar o arquivo
    })
  })

  test.describe("Botão \"Salvar\"", () => {
    test.fixme("TST1358 - Usuário sem permissão INC/ALT", async ({ page }) => {
      // Esperado: Botão não deve estar visível
    })
    test("TST1359 - Usuário com permissão", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Salvar", exact: true })).toBeVisible()
    })
    test.fixme("TST1360 - Clicar salvar sem marcar flags obrigatórias (campo 02 config)", async ({ page }) => {
      // Esperado: Deve destacar campos e exibir [descricao_atividade_obrigatoria]
      // Ainda não implementado: por padrão num cadastro novo, "GHE" já vem
      // marcado no campo 02 (ver aba-configuracoes.spec.ts) — precisa
      // desmarcar as duas opções antes, cenário composto com outro spec
    })
    test.fixme("TST1361 - Validar redirecionamento para aba Configurações", async ({ page }) => {
      // Esperado: Deve ocorrer automaticamente
      // Mesmo motivo do TST1360
    })
    test("TST1362 - Clicar salvar com campos obrigatórios vazios", async ({ page }) => {
      // "suja" o formulário (Salvar só habilita depois de alguma alteração —
      // ver descoberta em cabecalho-campo-data-base.spec.ts) e tenta salvar
      // sem preencher Responsável técnico/Modelo/Vigência/Data base
      await page.getByLabel("ART").fill("teste123")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText(/campos obrigatórios/i)).toBeVisible()
    })
    test("TST1363 - Validar redirecionamento para primeira aba com erro", async ({ page }) => {
      await page.getByLabel("ART").fill("teste123")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      // "Referências" é a primeira aba e é onde estão os campos obrigatórios
      // vazios (Responsável técnico) — o sistema navega até ela sozinho
      await expect(page.getByRole("tab", { name: "Referências", selected: true })).toBeVisible()
    })
    test.fixme("TST1364 - Corrigir campos e salvar novamente", async ({ page }) => {
      // Esperado: Deve permitir salvar
    })
    test.fixme("TST1365 - Validar conflito de edição simultânea", async ({ page }) => {
      // Esperado: Deve exibir [edicao_realizada]
    })
    test("TST1366 - Salvar com sucesso", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      // toast [sucesso] confirmado literalmente igual à EF: "Sucesso — Registro salvo com sucesso."
      await expect(page.getByText("Registro salvo com sucesso")).toBeVisible()
    })
    test("TST1367 - Validar persistência após salvar", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await expect(page.getByLabel("Responsável técnico *")).toHaveValue(/Administrador Apollus/)
      await expect(page.getByLabel("Data Base")).toHaveValue("01/01/2026")
    })
    test.fixme("TST1368 - Salvar múltiplas vezes rapidamente", async ({ page }) => {
      // Esperado: Não deve duplicar ou corromper
    })
    test.fixme("TST1369 - Salvar após assinatura digital existente", async ({ page }) => {
      // Esperado: Deve remover assinatura e exibir [assinar_novamente]
    })
    test.fixme("TST1370 - Validar ocultação do botão \"Dados da Assinatura Digital\" após salvar", async ({ page }) => {
      // Esperado: Deve ocorrer
    })
    test.fixme("TST1371 - Validar exibição do botão \"Assinar Digitalmente\" após salvar", async ({ page }) => {
      // Esperado: Deve ocorrer
    })
    test.fixme("TST1372 - Alterar dados e duplicar sem salvar", async ({ page }) => {
      // Esperado: Deve duplicar dados salvos apenas
    })
  })

  test.describe("Botão \"Gerar PGR\"", () => {
    test("TST1373 - PGR não salvo", async ({ page }) => {
      // Descoberta (2026-07-23): num cadastro nunca salvo, o botão "Gerar PGR"
      // não aparece no DOM (nem desabilitado) — bate com a EF: "Visível
      // sempre que o PGR estiver salvo"
      await expect(page.getByRole("button", { name: "Gerar PGR" })).toBeHidden()
    })
    test.fixme("TST1374 - Alterações pendentes", async ({ page }) => {
      // Esperado: Botão deve permanecer desabilitado
    })
    test.fixme("TST1375 - PGR salvo sem GHE", async ({ page }) => {
      // Esperado: Deve exibir [sem_dados]
      // Descoberta (2026-07-23): deixar o campo GHE do cabeçalho vazio NÃO
      // reproduz esse cenário — "Gerar PGR" funcionou normalmente mesmo sem
      // selecionar nenhum GHE no filtro (ver TST1376). O campo é um FILTRO,
      // não uma seleção obrigatória; "sem GHE" na EF provavelmente significa
      // a Região/Unidade não ter nenhum GHE cadastrado no sistema — não
      // sabemos montar essa condição sem mais contexto dos dados reais
    })
    test("TST1376 - PGR com GHE válido (filtro vazio = considera todos)", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await page.getByRole("button", { name: "Gerar PGR" }).click()
      await expect(page.getByText(/Seu relatório está sendo gerado/i).first()).toBeVisible()
    })
    test("TST1377 - Validar envio para processamento", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await page.getByRole("button", { name: "Gerar PGR" }).click()
      await expect(page.getByText(/Seu relatório está sendo gerado e assim que for finalizado você poderá baixá-lo/i).first()).toBeVisible()
    })
    test.fixme("TST1378 - Validar geração em segundo plano", async ({ page }) => {
      // Esperado: Deve ocorrer corretamente
    })
    test("TST1379 - Validar permanência na tela", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      const urlAntes = page.url()
      await page.getByRole("button", { name: "Gerar PGR" }).click()
      await expect(page.getByText(/Seu relatório está sendo gerado/i).first()).toBeVisible()
      await expect(page).toHaveURL(urlAntes)
    })
    test.fixme("TST1380 - Validar erro na geração", async ({ page }) => {
      // Esperado: Deve exibir erro e manter estado sem gerar o arquivo
    })
    test.fixme("TST1381 - Validar múltiplos cliques no botão", async ({ page }) => {
      // Esperado: Não deve duplicar geração
    })
    test.fixme("TST1382 - Validar filtros de hierarquia aplicados", async ({ page }) => {
      // Esperado: Deve considerar corretamente
    })
    test.fixme("TST1383 - Validar geração com diferentes H1/H2", async ({ page }) => {
      // Esperado: Deve respeitar contexto
    })
    test.fixme("TST1384 - Validar conteúdo gerado", async ({ page }) => {
      // Esperado: Deve refletir dados do cadastro
    })
  })

  test.describe("Botão \"Duplicar\"", () => {
    test("TST1385 - PGR não salvo", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Duplicar" })).toBeHidden()
    })
    test.fixme("TST1386 - Usuário sem permissão INC", async ({ page }) => {
      // Esperado: Botão não deve estar visível
    })
    test.fixme("TST1387 - Usuário com permissão INC", async ({ page }) => {
      // Esperado: Botão deve estar visível
    })
    test.fixme("TST1388 - Clicar em duplicar", async ({ page }) => {
      // Esperado: Deve abrir modal de confirmação
    })
    test.fixme("TST1389 - Validar texto da modal", async ({ page }) => {
      // Esperado: Deve listar corretamente os campos não copiados
    })
    test.fixme("TST1390 - Clicar em \"Não\"", async ({ page }) => {
      // Esperado: Deve fechar modal
    })
    test.fixme("TST1391 - Clicar em \"Sim\"", async ({ page }) => {
      // Esperado: Deve abrir novo formulário
    })
    test.fixme("TST1392 - Validar campos copiados", async ({ page }) => {
      // Esperado: Deve copiar corretamente
    })
    test.fixme("TST1393 - Validar campos não copiados (H1, H2, H3, GHE etc.)", async ({ page }) => {
      // Esperado: Devem estar em branco
    })
    test.fixme("TST1394 - Validar que dados inativos não são copiados", async ({ page }) => {
      // Esperado: Deve respeitar regra
    })
    test.fixme("TST1395 - Validar profissionais inativos", async ({ page }) => {
      // Esperado: Não devem ser copiados
    })
    test.fixme("TST1396 - Validar equipe inativa", async ({ page }) => {
      // Esperado: Não deve ser copiada
    })
    test.fixme("TST1397 - Validar grupos de e-mail inativos", async ({ page }) => {
      // Esperado: Não devem ser copiados
    })
    test.fixme("TST1398 - Validar novo registro após duplicação", async ({ page }) => {
      // Esperado: Deve permitir edição normal
    })
    test.fixme("TST1399 - Validar salvar PGR duplicado", async ({ page }) => {
      // Esperado: Deve funcionar corretamente
    })
  })
})
