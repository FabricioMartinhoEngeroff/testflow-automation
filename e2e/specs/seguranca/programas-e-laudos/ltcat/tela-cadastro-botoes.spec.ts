// EF Geração LTCAT > 6 Botões da Tela: Voltar (TST1390-TST1399), Dados da Assinatura Digital (TST1401-TST1406), Assinar Digitalmente (TST1407-TST1415), Salvar (TST1416-TST1430), Gerar Laudo (TST1431-TST1442) e Duplicar (TST1443-TST1458).
import { readFileSync } from "node:fs"
import type { Page } from "@playwright/test"
import { test, expect } from "@support"
import { LtcatCadastroPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro"
import { LtcatReferenciasPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATReferencias"
import { ltcatValido } from "@support/data/ltcat"
import { senhaAssinatura } from "@shared/env"
import type { RelatoriosPage } from "@support/actions/Relatorios"
import { cliquesRapidos } from "@support/utils/cliques"

// LTCAT 154: salvo, responsável Administrador Apollus
const LTCAT_SALVO = 154
const MSG_OBRIGATORIOS = "Existem um ou mais campos obrigatórios que não foram preenchidos."
const URL_PESQUISA = /\/ltcat$/

test.describe("LTCAT - Botões do cadastro - Voltar", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  const alterarRegiaoEVoltar = async (cadastro: LtcatCadastroPage) => {
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await cadastro.botaoVoltar.click()
  }

  test("TST1390 - Voltar sem alterações volta direto para a pesquisa", async ({ ltcatCadastroPage: cadastro, ltcatPage, page }) => {
    await cadastro.botaoVoltar.click()
    await expect(ltcatPage.titulo).toBeVisible()
    await expect(page).toHaveURL(URL_PESQUISA)
    await expect(cadastro.confirmacaoSaida).toHaveCount(0)
  })

  test("TST1391 - alterar um campo e clicar em Voltar abre a confirmação", async ({ ltcatCadastroPage: cadastro }) => {
    await alterarRegiaoEVoltar(cadastro)
    await expect(cadastro.confirmacaoSaida).toHaveCount(1)
    await expect(cadastro.titulo).toBeVisible()
  })

  test("TST1392 - texto da confirmação", async ({ ltcatCadastroPage: cadastro }) => {
    await alterarRegiaoEVoltar(cadastro)
    await expect(cadastro.confirmacaoSaida.getByRole("heading", { name: "Atenção" })).toBeVisible()
    await expect(cadastro.confirmacaoSaida.locator(".apls-popup-content")).toHaveText("Existem informações que não foram salvas.\nDeseja salvá-las antes de sair?")
  })

  test("TST1393 - 'Salvar e sair' é o botão padrão: em destaque e com o foco", async ({ ltcatCadastroPage: cadastro }) => {
    await alterarRegiaoEVoltar(cadastro)
    const salvarESair = cadastro.botaoConfirmacaoSaida("Salvar e sair")
    await expect(salvarESair).toHaveClass(/mat-primary/)
    await expect(salvarESair).toBeFocused()
    await expect(cadastro.botaoConfirmacaoSaida("Sair sem salvar")).toHaveClass(/mat-secondary/)
  })

  // salva um LTCAT novo e devolve o idkey dele. Cria 1 LTCAT no ambiente de homologação a cada execução (sem rollback)
  const criarLtcat = async (cadastro: LtcatCadastroPage, page: Page) => {
    await cadastro.preencherObrigatorios({ ...ltcatValido, vigenciaInicio: "01/01/2026", vigenciaFim: "31/12/2026" })
    await cadastro.preencherConfiguracoesObrigatorias()
    await cadastro.salvar()
    await expect(page).toHaveURL(/idkey=\d+/, { timeout: 15000 })
    return page.url().match(/idkey=(\d+)/)![1]
  }

  // cada desfecho usa o seu LTCAT para os dois poderem rodar em paralelo: o 154 nunca é gravado, o "Salvar e sair" grava num criado na hora.
  // Confere só o ART para não aumentar a complexidade: um campo já prova se gravou ou descartou
  const desfechosDoVoltar = [
    { botao: "Sair sem salvar", gravaAlteracao: false, ltcat: async () => String(LTCAT_SALVO) },
    { botao: "Salvar e sair", gravaAlteracao: true, ltcat: criarLtcat },
  ] as const

  for (const { botao, gravaAlteracao, ltcat } of desfechosDoVoltar) {
    test(`TST1394/TST1395 - '${botao}' volta para a pesquisa ${gravaAlteracao ? "e grava" : "e descarta"} a alteração`, async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, ltcatPage, page }) => {
      test.setTimeout(120000)
      const idkey = await ltcat(cadastro, page)
      await cadastro.abrir(idkey)
      const original = await r.art.inputValue()
      const alterado = `ART-${Date.now()}`
      await r.art.fill(alterado)
      await cadastro.botaoVoltar.click()
      await cadastro.botaoConfirmacaoSaida(botao).click()
      await expect(ltcatPage.titulo).toBeVisible({ timeout: 15000 })
      await expect(page).toHaveURL(URL_PESQUISA)

      await cadastro.abrir(idkey)
      await expect(r.art).toHaveValue(gravaAlteracao ? alterado : original)
    })
  }

  test("TST1396 - 'Salvar e sair' com obrigatórios vazios valida como o Salvar e fica no cadastro", async ({ ltcatCadastroPage: cadastro, toast, page }) => {
    await alterarRegiaoEVoltar(cadastro)
    await cadastro.botaoConfirmacaoSaida("Salvar e sair").click()
    await toast.temTexto(MSG_OBRIGATORIOS)
    await expect(cadastro.titulo).toBeVisible()
    await expect(page).not.toHaveURL(/idkey=/)
    await expect(cadastro.regiao).toHaveValue(ltcatValido.regiao)
  })

  const formasDeFechar = [
    { titulo: "X da confirmação", fechar: (cadastro: LtcatCadastroPage) => cadastro.confirmacaoSaida.locator(".apls-popup-header-close").click() },
    { titulo: "Esc", fechar: (_: LtcatCadastroPage, page: Page) => page.keyboard.press("Escape") },
  ]

  for (const { titulo, fechar } of formasDeFechar) {
    test(`TST1397 - fechar a confirmação pelo ${titulo} mantém o cadastro com a alteração`, async ({ ltcatCadastroPage: cadastro, page }) => {
      await alterarRegiaoEVoltar(cadastro)
      await expect(cadastro.confirmacaoSaida).toHaveCount(1)
      await fechar(cadastro, page)
      await expect(cadastro.confirmacaoSaida).toHaveCount(0)
      await expect(cadastro.titulo).toBeVisible()
      await expect(cadastro.regiao).toHaveValue(ltcatValido.regiao)
    })
  }

  test("TST1398 - alteração feita só em outra aba também abre a confirmação", async ({ ltcatCadastroPage: cadastro, ltcatConclusaoPage: co }) => {
    await cadastro.abrirAba("Conclusão")
    await co.digitar("conclusão não salva")
    await cadastro.abrirAba("Referências")
    await cadastro.botaoVoltar.click()
    await expect(cadastro.confirmacaoSaida).toHaveCount(1)
  })

  test("TST1398 - alterações em várias abas: 'Sair sem salvar' descarta todas", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, ltcatConclusaoPage: co, ltcatPage }) => {
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await r.art.fill("ART-NAO-SALVO")
    await cadastro.abrirAba("Conclusão")
    await co.digitar("conclusão não salva")
    await cadastro.abrirAba("Referências")
    await cadastro.botaoVoltar.click()
    await cadastro.botaoConfirmacaoSaida("Sair sem salvar").click()
    await expect(ltcatPage.titulo).toBeVisible()

    await cadastro.abrir()
    await expect(cadastro.regiao).toHaveValue("")
    await expect(r.art).toHaveValue("")
  })

  // Ignorado (decidido pelo QA em 2026-10-24): não é bug. A confirmação abre com o "Sair sem salvar" no mesmo ponto do Voltar,
  // então o 2º clique cai nele e sai sem salvar (ver scripts/explorar/diversos/explorar-voltar-duplo-clique.spec.ts)
  // test("TST1399 - vários cliques rápidos em Voltar com alteração abrem uma confirmação só", async ({ ltcatCadastroPage: cadastro, page }) => {
  //   await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
  //   await cliquesRapidos(cadastro.botaoVoltar, 3, { force: true })
  //   await expect(cadastro.confirmacaoSaida).toHaveCount(1)
  //   await cadastro.botaoConfirmacaoSaida("Sair sem salvar").click()
  //   await expect(page).toHaveURL(URL_PESQUISA)
  // })

  test("TST1399 - vários cliques rápidos em Voltar sem alteração voltam uma vez só, para a pesquisa", async ({ ltcatCadastroPage: cadastro, ltcatPage, page }) => {
    await ltcatPage.abrir()
    await ltcatPage.botaoNovo.click()
    await cadastro.titulo.waitFor()
    await cliquesRapidos(cadastro.botaoVoltar)
    await expect(ltcatPage.titulo).toBeVisible()
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(URL_PESQUISA)
  })
})

// EF Geração LTCAT > 6 Botões da Tela > Dados da Assinatura Digital (TST1401-TST1406).
// Precisa de um LTCAT assinado que nenhuma suíte salve: salvar um LTCAT assinado apaga a assinatura (EF, Salvar 5a).
// O 145 não serve, porque Conclusão e Colaboradores salvam ele. TST1405 (permissão) ficou comentado em permissoes-ltcat.spec.ts: já há suíte de permissões.
// LTCAT 8 ("NAO MEXER NO CADASTRO"): assinado, nenhuma suíte salva ele
const IDKEY_ASSINADO = process.env.LTCAT_ASSINADO_IDKEY ?? "8"

test.describe("LTCAT - Botões do cadastro - Dados da assinatura digital", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage: cadastro, page }) => {
    await login.entrar()
    await page.goto(`/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=${IDKEY_ASSINADO}`)
    await cadastro.titulo.waitFor()
    await expect(cadastro.botaoDadosAssinatura.or(cadastro.botaoAssinarDigitalmente), "o LTCAT perdeu a assinatura? (foi salvo de novo)").toBeVisible()
  })

  test("TST1401 - LTCAT assinado mostra o botão 'Dados da assinatura digital'", async ({ ltcatCadastroPage: cadastro }) => {
    await expect(cadastro.botaoDadosAssinatura).toBeVisible()
    await expect(cadastro.botaoDadosAssinatura).toBeEnabled()
  })

  test("TST1402 - clicar abre a modal com os dados preenchidos", async ({ ltcatCadastroPage: cadastro, ltcatDadosAssinaturaModal: m }) => {
    await cadastro.botaoDadosAssinatura.click()
    await expect(m.titulo).toBeVisible()
    await expect(m.dados).toHaveCount(5)
    for (const linha of await m.dados.allInnerTexts()) expect(linha).toMatch(/^[^:]+: \S/)
  })

  test("TST1403 - conteúdo da modal: aviso, dados da assinatura e botões", async ({ ltcatCadastroPage: cadastro, ltcatDadosAssinaturaModal: m }) => {
    await cadastro.botaoDadosAssinatura.click()
    await expect(m.alerta).toHaveText("Atenção! Caso esse documento tenha sido atualizado é necessário assiná-lo novamente antes de fazer o download.")
    await expect(m.dados).toHaveText([
      "Documento: LTCAT",
      /^Assinado por: .+$/,
      /^Emissor: .+$/,
      /^Assinado digitalmente em: \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}:\d{2}$/,
      /^\s*Validade:\s+.+\s+Expira em: \d{2}\/\d{2}\/\d{4}\.\s*$/,
    ])
    await expect(m.botaoFechar).toBeVisible()
    await expect(m.botaoDownload).toBeVisible()
  })

  // o Download não baixa direto: entra na fila do painel Relatórios, que fica verde (gerou) ou vermelho (falhou)
  test("TST1404 - Download gera o PDF assinado no painel Relatórios, com status verde, e baixa o arquivo", async ({ ltcatCadastroPage: cadastro, ltcatDadosAssinaturaModal: m, relatorios }) => {
    test.setTimeout(300000)
    await relatorios.abrir()
    const antes = await relatorios.nomesDosArquivos()
    await relatorios.fechar()

    await cadastro.botaoDadosAssinatura.click()
    await m.botaoDownload.click()
    if (await m.modal.isVisible()) await m.botaoFechar.click()
    await expect(m.modal).toBeHidden()

    await relatorios.abrir()
    const novo = async () => (await relatorios.nomesDosArquivos()).find((n) => /ASSINADO/.test(n) && !antes.includes(n))
    await expect.poll(async () => {
      await relatorios.atualizar()
      return novo()
    }, { timeout: 90000, intervals: [5000] }).toBeTruthy()
    const arquivo = (await novo())!
    const linha = relatorios.linha(arquivo)

    await expect.poll(async () => {
      await relatorios.atualizar()
      return relatorios.status(linha)
    }, { timeout: 180000, intervals: [5000] }).not.toBe("processando")
    expect(await relatorios.status(linha), `${arquivo} ficou vermelho: o sistema não gerou o PDF`).toBe("verde")

    const download = await relatorios.baixar(arquivo)
    expect(download.suggestedFilename()).toMatch(/^RELATORIO_LTCAT_GHE_ASSINADO_\d+\.pdf$/)
    const caminho = await download.path()
    const inicio = readFileSync(caminho).subarray(0, 4).toString()
    expect(inicio).toBe("%PDF")
  })

  test("TST1406 - vários cliques rápidos abrem uma modal só, e abrir e fechar várias vezes mantém os dados", async ({ ltcatCadastroPage: cadastro, ltcatDadosAssinaturaModal: m, page }) => {
    for (let i = 0; i < 3; i++) await cadastro.botaoDadosAssinatura.click({ timeout: 1000 }).catch(() => {})
    await expect(m.modal).toHaveCount(1)
    const dados = await m.dados.allInnerTexts()
    await m.botaoFechar.click()
    await expect(m.modal).toHaveCount(0)

    // o botão ignora cliques muito próximos do anterior (proteção contra duplo clique): tenta de novo até abrir
    const abrir = () => expect(async () => {
      if (!(await m.modal.isVisible())) await cadastro.botaoDadosAssinatura.click({ timeout: 2000 })
      await expect(m.titulo).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 15000 })

    // só o X e o Fechar fecham: Esc e clique fora mantêm a modal aberta
    for (const [como, fechar] of [["X", () => m.botaoX.click()], ["Fechar", () => m.botaoFechar.click()]] as const) {
      await test.step(`abrir e fechar pelo ${como}`, async () => {
        await abrir()
        await expect(m.modal).toHaveCount(1)
        await expect(m.dados).toHaveText(dados)
        await fechar()
        await expect(m.modal).toHaveCount(0)
      })
    }
    await expect(cadastro.titulo).toBeVisible()
  })
})

// EF Geração LTCAT > 6 Botões da Tela > Assinar Digitalmente (TST1407-TST1415).
// O botão só aparece se o CPF do usuário logado for o do Responsável técnico. O 031.044.320-23 (Fabricio) é o do usuário dos testes.
// LTCAT 145: não assinado, responsável Fabricio. LTCAT 154: responsável Administrador Apollus (outro CPF).
const CPF_DO_USUARIO = "031.044.320-23"
const URL_LTCAT = (idkey: string) => `/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=${idkey}`
const MSG_SENHA_INVALIDA = "Senha inválida! Informe novamente a senha do certificado digital."

test.describe("LTCAT - Botões do cadastro - Assinar digitalmente", () => {
  test.beforeEach(async ({ login }) => {
    await login.entrar()
  })

  const abrirLtcat = async (page: import("@playwright/test").Page, cadastro: import("@support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro").LtcatCadastroPage, idkey: string) => {
    await page.goto(URL_LTCAT(idkey))
    await cadastro.titulo.waitFor()
    await expect(cadastro.botaoVoltar).toBeVisible()
  }

  test("TST1407 - LTCAT já assinado não mostra 'Assinar digitalmente'", async ({ ltcatCadastroPage: cadastro, page }) => {
    await abrirLtcat(page, cadastro, IDKEY_ASSINADO)
    await expect(cadastro.botaoDadosAssinatura).toBeVisible()
    await expect(cadastro.botaoAssinarDigitalmente).toBeHidden()
  })

  test("TST1408/TST1410 - LTCAT não assinado com o CPF do usuário no Responsável técnico mostra o botão", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await abrirLtcat(page, cadastro, "145")
    await expect(r.responsavelTecnico).toHaveValue(new RegExp(`^${CPF_DO_USUARIO}`))
    await expect(cadastro.botaoDadosAssinatura).toBeHidden()
    await expect(cadastro.botaoAssinarDigitalmente).toBeVisible()
    await expect(cadastro.botaoAssinarDigitalmente).toBeEnabled()
  })

  test("TST1409 - Responsável técnico com CPF diferente do usuário não mostra o botão", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await abrirLtcat(page, cadastro, "154")
    await expect(r.responsavelTecnico).not.toHaveValue(new RegExp(`^${CPF_DO_USUARIO}`))
    await expect(cadastro.botaoAssinarDigitalmente).toBeHidden()
  })

  test("TST1411 - clicar abre a modal de assinatura com os dados do certificado e a senha", async ({ ltcatCadastroPage: cadastro, ltcatAssinaturaModal: m, page }) => {
    await abrirLtcat(page, cadastro, "145")
    await cadastro.botaoAssinarDigitalmente.click()
    await expect(m.titulo).toBeVisible()
    await expect(m.dados).toHaveText([
      "Documento: LTCAT",
      /^Profissional responsável: .+$/,
      /^Emissor: .+$/,
      /^\s*Validade:\s+.+\s+Expira em: \d{2}\/\d{2}\/\d{4}\.\s*$/,
    ])
    await expect(m.senha).toBeEditable()
    await expect(m.senha).toHaveValue("")
    await expect(m.botaoAssinar).toHaveClass(/mat-primary/)
    await expect(m.botaoFechar).toBeVisible()
  })

  // TST1412 e TST1413 inválidos: a EF Geração LTCAT não define bloqueio por múltiplos arquivos nem a mensagem [arquivo_grande]
  // test.fixme("TST1412 - LTCAT com múltiplos arquivos deixa o botão bloqueado", async () => {})
  // test.fixme("TST1413 - clicar com o botão bloqueado exibe [arquivo_grande]", async () => {})

  // cria e assina 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("TST1414 - assinar com a senha certa troca 'Assinar digitalmente' por 'Dados da assinatura digital'", async ({ ltcatCadastroPage: cadastro, ltcatAssinaturaModal: m, ltcatDadosAssinaturaModal: dados, page }) => {
    test.setTimeout(240000)
    await cadastro.abrir()
    await cadastro.preencherObrigatorios({ ...ltcatValido, responsavelTecnico: CPF_DO_USUARIO })
    await cadastro.preencherConfiguracoesObrigatorias()
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)
    await expect(cadastro.botaoAssinarDigitalmente).toBeVisible()

    const antes = new Date()
    await cadastro.botaoAssinarDigitalmente.click()
    await m.assinar(senhaAssinatura())
    // assinou: a mesma modal passa a mostrar os dados da assinatura enquanto o PDF é gerado
    await expect(m.modal).toContainText("Aguarde alguns instantes para fazer o download", { timeout: 60000 })
    await m.botaoFechar.click()
    await expect(m.modal).toBeHidden()
    await expect(cadastro.botaoDadosAssinatura).toBeVisible()
    await expect(cadastro.botaoAssinarDigitalmente).toBeHidden()

    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(cadastro.botaoDadosAssinatura).toBeVisible()
    await cadastro.botaoDadosAssinatura.click()
    const dd = (n: number) => String(n).padStart(2, "0")
    const hoje = `${dd(antes.getDate())}/${dd(antes.getMonth() + 1)}/${antes.getFullYear()}`
    await expect(dados.dados.filter({ hasText: "Assinado digitalmente em" })).toContainText(hoje)
  })

  test("TST1415 - senha errada exibe o erro, mantém a modal e o LTCAT continua sem assinatura", async ({ ltcatCadastroPage: cadastro, ltcatAssinaturaModal: m, toast, page }) => {
    await abrirLtcat(page, cadastro, "145")
    await cadastro.botaoAssinarDigitalmente.click()
    await m.assinar("senha-errada")
    await toast.temTexto(MSG_SENHA_INVALIDA)
    await expect(m.modal).toBeVisible()

    // Fechar com a senha preenchida pergunta se quer prosseguir e assinar
    await m.botaoFechar.click()
    const confirmacao = page.locator("apls-popup").filter({ hasText: "Você deseja prosseguir e assinar o documento?" })
    await confirmacao.getByRole("button", { name: "Não" }).click()
    await expect(m.modal).toBeHidden()
    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(cadastro.botaoAssinarDigitalmente).toBeVisible()
    await expect(cadastro.botaoDadosAssinatura).toBeHidden()
  })
})

// EF Geração LTCAT > 6 Botões da Tela > Salvar (TST1416-TST1430).
// TST1416/TST1417 (Salvar visível só com INC/ALT) já são cobertos em permissoes-ltcat.spec.ts.
// TST1418/TST1419 (Cargo e GHE desmarcados) ficam em configuracoes-comportamento.spec.ts: precisam da Configuração Geral em Sugerir.
const MSG_EDICAO_REALIZADA = "Os dados foram atualizados por outro usuário. Favor visualizar novamente o registro."
const MSG_ASSINAR_NOVAMENTE = "O documento deve ser assinado digitalmente pelo responsável novamente após a edição."
const DADOS_SALVAR = { ...ltcatValido, responsavelTecnico: CPF_DO_USUARIO }

test.describe("LTCAT - Botões do cadastro - Salvar", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage: cadastro }) => {
    await login.entrar()
    await cadastro.abrir()
  })

  // cria o LTCAT e fica nele, já com o idkey na URL
  const criar = async (cadastro: LtcatCadastroPage, page: Page) => {
    await cadastro.preencherObrigatorios(DADOS_SALVAR)
    await cadastro.preencherConfiguracoesObrigatorias()
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)
  }

  test("TST1420 - Salvar com obrigatórios vazios exibe [campos_obrigatorios] e não salva", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page }) => {
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await cadastro.salvar()
    await toast.temTexto(MSG_OBRIGATORIOS)
    await expect(r.campoResponsavelTecnico).toHaveClass(/mat-form-field-invalid/)
    await expect(page).not.toHaveURL(/idkey=/)
  })

  test("TST1421 - Salvar com erro na aba Referências estando em outra aba leva para Referências", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast }) => {
    await cadastro.preencherObrigatorios(DADOS_SALVAR)
    await cadastro.preencherConfiguracoesObrigatorias()
    await r.condicoesOperacionais.fill("")
    await cadastro.abrirAba("Conclusão")
    await cadastro.salvar()
    await toast.temTexto(MSG_OBRIGATORIOS)
    await expect(cadastro.aba("Referências")).toHaveAttribute("aria-selected", "true")
    await expect(r.campoCondicoesOperacionais).toHaveClass(/mat-form-field-invalid/)
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("TST1422 - corrigir o campo obrigatório e salvar de novo salva", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page }) => {
    await cadastro.preencherObrigatorios(DADOS_SALVAR)
    await cadastro.preencherConfiguracoesObrigatorias()
    await r.condicoesOperacionais.fill("")
    await cadastro.salvar()
    await toast.temTexto(MSG_OBRIGATORIOS)
    await expect(page).not.toHaveURL(/idkey=/)

    await r.condicoesOperacionais.fill(ltcatValido.condicoesOperacionais)
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("TST1423 - salvar um LTCAT que outra aba já alterou exibe [edicao_realizada] e não grava", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page, context }) => {
    test.setTimeout(180000)
    await criar(cadastro, page)
    const outra = await context.newPage()
    const cadastroOutra = new LtcatCadastroPage(outra)
    const rOutra = new LtcatReferenciasPage(outra)
    await outra.goto(page.url())
    await cadastroOutra.titulo.waitFor()
    await rOutra.art.fill("ART-OUTRA-ABA")
    await cadastroOutra.salvar()
    await expect(cadastroOutra.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })

    await r.art.fill("ART-ABA-DESATUALIZADA")
    await cadastro.salvar()
    await toast.temTexto(MSG_EDICAO_REALIZADA)
    await expect(cadastro.titulo).toBeVisible()
    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(r.art).toHaveValue("ART-OUTRA-ABA")
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("TST1424/TST1425 - salva com [sucesso], fica no cadastro e os dados permanecem depois de recarregar", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await cadastro.preencherObrigatorios(DADOS_SALVAR)
    await cadastro.preencherConfiguracoesObrigatorias()
    await r.art.fill("ART-PERSISTE-01")
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(cadastro.titulo).toBeVisible()
    await expect(page).toHaveURL(/idkey=\d+/)

    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(cadastro.regiao).toHaveValue(ltcatValido.regiao)
    await expect(cadastro.dataBase).toHaveValue(ltcatValido.dataBase)
    await expect(r.responsavelTecnico).toHaveValue(new RegExp(`^${CPF_DO_USUARIO}`))
    await expect(r.vigenciaInicio).toHaveValue(ltcatValido.vigenciaInicio)
    await expect(r.vigenciaFim).toHaveValue(ltcatValido.vigenciaFim)
    await expect(r.avaliacaoRealizadaEm).toHaveValue(ltcatValido.avaliacaoRealizadaEm)
    await expect(r.condicoesOperacionais).toHaveValue(ltcatValido.condicoesOperacionais)
    await expect(r.art).toHaveValue("ART-PERSISTE-01")
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("TST1426 - vários cliques rápidos em Salvar criam um LTCAT só", async ({ ltcatCadastroPage: cadastro, page }) => {
    const criacoes: string[] = []
    page.on("request", (req) => {
      if (req.method() === "POST" && /\/ltcat_ghe\/ltcat(\?|$)/.test(req.url())) criacoes.push(req.url())
    })
    await cadastro.preencherObrigatorios(DADOS_SALVAR)
    await cadastro.preencherConfiguracoesObrigatorias()
    for (let i = 0; i < 3; i++) await cadastro.botaoSalvar.click({ delay: 0, timeout: 1000 }).catch(() => {})
    await expect(cadastro.mensagemSalvoComSucesso.first()).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)
    await page.waitForTimeout(3000)
    expect(criacoes, "requisições de criação do LTCAT").toHaveLength(1)
  })

  // cria e assina 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("TST1427/TST1428/TST1429 - salvar um LTCAT assinado remove a assinatura e exibe [assinar_novamente]", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, ltcatAssinaturaModal: m, toast, page }) => {
    test.setTimeout(240000)
    await criar(cadastro, page)
    await cadastro.botaoAssinarDigitalmente.click()
    await m.assinar(senhaAssinatura())
    await expect(m.modal).toContainText("Aguarde alguns instantes para fazer o download", { timeout: 60000 })
    await m.botaoFechar.click()
    await expect(cadastro.botaoDadosAssinatura).toBeVisible()

    await r.art.fill("ART-ALTERADO-APOS-ASSINAR")
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await toast.temTexto(MSG_ASSINAR_NOVAMENTE)
    await expect(cadastro.botaoDadosAssinatura).toBeHidden()
    await expect(cadastro.botaoAssinarDigitalmente).toBeVisible()

    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(cadastro.botaoAssinarDigitalmente).toBeVisible()
    await expect(cadastro.botaoDadosAssinatura).toBeHidden()
  })

  test("TST1430 - alterar sem salvar e Duplicar copia os dados salvos, não a alteração", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await page.goto(URL_LTCAT("145"))
    await cadastro.titulo.waitFor()
    const artSalvo = await r.art.inputValue()
    await r.art.fill("ART-NAO-SALVO-DUPLICAR")
    await cadastro.botaoDuplicar.click()
    await cadastro.botaoConfirmacaoDuplicar("Sim").click()
    await page.waitForTimeout(3000)
    console.log("após duplicar:", page.url(), "| toasts:", await page.locator("apls-toast").allInnerTexts(), "| popups:", await page.locator("apls-popup").allInnerTexts())
    await expect(r.art).toHaveValue(artSalvo)
  })
})

// EF Geração LTCAT > 6 Botões da Tela > Gerar Laudo (TST1431-TST1442).
// Antes de gerar o sistema consulta existe_ghe_vigente_area (Ação 2) e depois chama ltcat/gerar/<idkey>.
// O laudo vai para a fila do painel Relatórios. O LTCAT 145 só é aberto, nunca salvo.
const MSG_GERANDO = "Seu relatório está sendo gerado e assim que for finalizado você poderá baixá-lo na janela de consulta de relatórios."
const MSG_SEM_GHE = /não possuem GHEs vinculados/
const URL_GERAR = /\/ltcat_ghe\/ltcat\/gerar\//

test.describe("LTCAT - Botões do cadastro - Gerar laudo", () => {
  test.beforeEach(async ({ login }) => {
    await login.entrar()
  })

  const abrir145 = async (page: Page, cadastro: LtcatCadastroPage) => {
    await page.goto(URL_LTCAT("145"))
    await cadastro.titulo.waitFor()
    await expect(cadastro.botaoGerarLaudo).toBeVisible()
  }

  // nomes de arquivo de LTCAT que entraram na fila depois de "antes"
  const novosLaudos = async (relatorios: RelatoriosPage, antes: string[]) =>
    (await relatorios.nomesDosArquivos()).filter((n) => /^RELATORIO_LTCAT_GHE_\d+\.pdf$/.test(n) && !antes.includes(n))

  const filaAtual = async (relatorios: RelatoriosPage) => {
    await relatorios.abrir()
    const nomes = await relatorios.nomesDosArquivos()
    await relatorios.fechar()
    return nomes
  }

  // a planilha diz "desabilitado"; na tela o botão nem aparece enquanto o LTCAT não está salvo
  test("TST1431 - LTCAT novo, ainda não salvo, não mostra o botão Gerar laudo", async ({ ltcatCadastroPage: cadastro }) => {
    await cadastro.abrir()
    await expect(cadastro.botaoVoltar).toBeVisible()
    await expect(cadastro.botaoGerarLaudo).toHaveCount(0)
  })

  test("TST1432 - com alteração pendente o botão Gerar laudo some até salvar", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await abrir145(page, cadastro)
    await r.avaliacaoRealizadaEm.fill(`${await r.avaliacaoRealizadaEm.inputValue()}`.slice(0, 49) + "x")
    await expect(cadastro.botaoSalvar).toBeEnabled()
    await expect(cadastro.botaoGerarLaudo).toHaveCount(0)
  })

  // simula a resposta "sem GHE vigente" da Ação 2: não depende de achar uma data base sem GHE no ambiente
  test("TST1433 - LTCAT sem GHE vigente na data base exibe [sem_dados] e não gera", async ({ ltcatCadastroPage: cadastro, relatorios, toast, page }) => {
    await abrir145(page, cadastro)
    const antes = await filaAtual(relatorios)
    await page.route(/existe_ghe_vigente_area/, async (route) => {
      const resposta = await route.fetch()
      const corpo = await resposta.text()
      await route.fulfill({ response: resposta, body: corpo.replace("\"objetoResposta\":true", "\"objetoResposta\":false") })
    })
    const gerou = page.waitForRequest(URL_GERAR, { timeout: 5000 }).then(() => true).catch(() => false)
    await cadastro.botaoGerarLaudo.click()
    await toast.temTexto(MSG_SEM_GHE)
    expect(await gerou, "não deve chamar a geração").toBe(false)
    await relatorios.abrir()
    expect(await novosLaudos(relatorios, antes)).toHaveLength(0)
  })

  test("TST1434/TST1435/TST1437 - LTCAT com GHE gera: exibe [relatorio_gerando] e continua no cadastro", async ({ ltcatCadastroPage: cadastro, toast, page }) => {
    await abrir145(page, cadastro)
    const url = page.url()
    await cadastro.botaoGerarLaudo.click()
    await toast.temTexto(MSG_GERANDO)
    await expect(cadastro.titulo).toBeVisible()
    await expect(page).toHaveURL(url)
  })

  test("TST1436 - a geração roda em segundo plano: o laudo entra em Relatórios e fica verde", async ({ ltcatCadastroPage: cadastro, relatorios, page }) => {
    test.setTimeout(300000)
    await abrir145(page, cadastro)
    const antes = await filaAtual(relatorios)
    await cadastro.botaoGerarLaudo.click()

    await relatorios.abrir()
    await expect.poll(async () => {
      await relatorios.atualizar()
      return (await novosLaudos(relatorios, antes)).length
    }, { timeout: 60000, intervals: [3000] }).toBe(1)
    const [arquivo] = await novosLaudos(relatorios, antes)
    const linha = relatorios.linha(arquivo)
    await expect.poll(async () => {
      await relatorios.atualizar()
      return relatorios.status(linha)
    }, { timeout: 240000, intervals: [10000] }).not.toBe("processando")
    expect(await relatorios.status(linha), `${arquivo} ficou vermelho: o sistema não gerou o laudo`).toBe("verde")
  })

  test("TST1438 - erro na geração exibe a mensagem, mantém o cadastro e não entra laudo novo em Relatórios", async ({ ltcatCadastroPage: cadastro, relatorios, toast, page }) => {
    await abrir145(page, cadastro)
    const antes = await filaAtual(relatorios)
    await page.route(URL_GERAR, (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "erro simulado pelo teste" }) }))
    await cadastro.botaoGerarLaudo.click()
    await toast.temTexto("Ocorreu um erro inesperado. Favor entrar em contato com o suporte.")
    await expect(cadastro.titulo).toBeVisible()
    await page.unroute(URL_GERAR)
    await relatorios.abrir()
    expect(await novosLaudos(relatorios, antes)).toHaveLength(0)
  })

  // Não é bug (confirmado pelo QA em 2026-10-24): é comportamento do sistema, 3 cliques rápidos fazem 2 chamadas de gerar e 2 laudos entram na fila de Relatórios.
  // Mantido como fixme só para registrar o cenário; reativar se passarem a exigir um laudo só.
  test.fixme("TST1439 - vários cliques rápidos em Gerar laudo geram um laudo só", async ({ ltcatCadastroPage: cadastro, relatorios, page }) => {
    test.setTimeout(180000)
    await abrir145(page, cadastro)
    const antes = await filaAtual(relatorios)
    const geracoes: string[] = []
    page.on("request", (req) => {
      if (URL_GERAR.test(req.url())) geracoes.push(req.url())
    })
    for (let i = 0; i < 3; i++) await cadastro.botaoGerarLaudo.click({ delay: 0, timeout: 1000 }).catch(() => {})
    await page.waitForTimeout(5000)
    await relatorios.abrir()
    await relatorios.atualizar()
    expect(geracoes, "chamadas de geração").toHaveLength(1)
    expect(await novosLaudos(relatorios, antes), "laudos novos na fila de Relatórios").toHaveLength(1)
  })

  // conferem o conteúdo do PDF: o projeto ainda não tem biblioteca para ler PDF
  test.fixme("TST1440 - o laudo considera os filtros de hierarquia aplicados", async () => {})
  test.fixme("TST1441 - o laudo respeita o contexto de H1/H2 diferentes", async () => {})
  test.fixme("TST1442 - o conteúdo do laudo reflete os dados do cadastro", async () => {})
})

// EF Geração LTCAT > 6 Botões da Tela > Duplicar (TST1443-TST1458). Parte do LTCAT 145, que nunca é salvo.
// TST1444/TST1445 (Duplicar só com INC) já são cobertos em permissoes-ltcat.spec.ts.
const MSG_DUPLICADO = "Cadastro duplicado com sucesso. Realize as alterações necessárias e clique em SALVAR para concluir o registro."
const MSG_DUPLICAR = "Você deseja criar um novo LTCAT duplicando os dados deste cadastro?\nPara duplicar, o sistema copiará todos os dados, exceto: Região, Unidade, Setor, GHE, data base, vigência do laudo, histórico de revisões e dados inativos."

test.describe("LTCAT - Botões do cadastro - Duplicar", () => {
  test.beforeEach(async ({ login }) => {
    await login.entrar()
  })

  // os campos copiáveis do 145, lidos antes de duplicar
  const lerCopiaveis = async (r: LtcatReferenciasPage) => ({
    responsavel: await r.responsavelTecnico.inputValue(),
    art: await r.art.inputValue(),
    avaliacao: await r.avaliacaoRealizadaEm.inputValue(),
    condicoes: await r.condicoesOperacionais.inputValue(),
    modelo: await r.modeloDocumento.inputValue(),
    expostos: [await r.expostosMulheres.inputValue(), await r.expostosHomens.inputValue(), await r.expostosPcds.inputValue()],
    equipe: await r.profissionaisDaEquipe(),
  })

  const duplicar145 = async (page: Page, cadastro: LtcatCadastroPage, r: LtcatReferenciasPage) => {
    await page.goto(URL_LTCAT("145"))
    await cadastro.titulo.waitFor()
    await expect(cadastro.botaoDuplicar).toBeVisible()
    const original = await lerCopiaveis(r)
    await cadastro.botaoDuplicar.click()
    await cadastro.botaoConfirmacaoDuplicar("Sim").click()
    await expect(page).not.toHaveURL(/idkey=145/)
    await cadastro.titulo.waitFor()
    return original
  }

  test("TST1443 - LTCAT ainda não salvo não mostra o Duplicar", async ({ ltcatCadastroPage: cadastro }) => {
    await cadastro.abrir()
    await expect(cadastro.botaoVoltar).toBeVisible()
    await expect(cadastro.botaoDuplicar).toHaveCount(0)
  })

  // BUG REAL (2026-10-24): o texto da modal tem um espaço antes da vírgula em "Região ,". Remover o test.fail quando corrigirem.
  // PENDENTE com o analista: o Modelo de documento não é copiado (depende da Região, que vem em branco), mas a modal não o lista
  // entre as exceções. Foi pedido incluir "Modelo de documento" no texto; ao mudar, atualizar MSG_DUPLICAR.
  test("TST1446/TST1447 - Duplicar abre a confirmação listando o que não é copiado", async ({ ltcatCadastroPage: cadastro, page }) => {
    test.fail(true, "espaço antes da vírgula em \"Região ,\"")
    await page.goto(URL_LTCAT("145"))
    await cadastro.titulo.waitFor()
    await cadastro.botaoDuplicar.click()
    await expect(cadastro.textoConfirmacaoDuplicar).toHaveText(MSG_DUPLICAR)
    await expect(cadastro.botaoConfirmacaoDuplicar("Não")).toBeVisible()
    await expect(cadastro.botaoConfirmacaoDuplicar("Sim")).toBeVisible()
  })

  test("TST1448 - 'Não' fecha a confirmação e continua no LTCAT original", async ({ ltcatCadastroPage: cadastro, page }) => {
    await page.goto(URL_LTCAT("145"))
    await cadastro.titulo.waitFor()
    await cadastro.botaoDuplicar.click()
    await cadastro.botaoConfirmacaoDuplicar("Não").click()
    await expect(cadastro.confirmacaoDuplicar).toHaveCount(0)
    await expect(page).toHaveURL(/idkey=145/)
  })

  // Regra: o Modelo de documento não é copiado (depende da Região, que é limpa), por isso fica fora da comparação e vem em branco.
  test("TST1449/TST1450 - 'Sim' abre um formulário novo com os dados copiados", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    const original = await duplicar145(page, cadastro, r)
    const { modelo, ...copiados } = original
    expect(await lerCopiaveis(r)).toEqual({ ...copiados, modelo: "" })
  })

  test("TST1449 - ao duplicar exibe o aviso de registro duplicado e o Salvar fica desabilitado", async ({ ltcatCadastroPage: cadastro, toast, page }) => {
    await page.goto(URL_LTCAT("145"))
    await cadastro.titulo.waitFor()
    await cadastro.botaoDuplicar.click()
    await cadastro.botaoConfirmacaoDuplicar("Sim").click()
    await toast.temTexto(MSG_DUPLICADO)
    await expect(cadastro.botaoSalvar).toBeDisabled()
  })

  test("TST1451 - Região, Unidade, Setor, GHE, data base, vigência e histórico de revisões vêm em branco", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await duplicar145(page, cadastro, r)
    for (const campo of [cadastro.regiao, cadastro.unidade, cadastro.setor, cadastro.ghe, cadastro.dataBase, r.vigenciaInicio, r.vigenciaFim]) {
      await expect(campo).toHaveValue("")
    }
    await expect(cadastro.botaoRevisoes.locator(".mat-badge-content")).toHaveText("0")
  })

  // precisam de massa: um LTCAT com profissional, membro de equipe e grupo de e-mail inativos
  test.fixme("TST1452 - dados inativos não são copiados", async () => {})
  test.fixme("TST1453 - profissional inativo não é copiado", async () => {})
  test.fixme("TST1454 - membro de equipe inativo não é copiado", async () => {})
  test.fixme("TST1455 - grupo de e-mail inativo não é copiado", async () => {})

  test("TST1456 - o formulário duplicado aceita edição normal", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await duplicar145(page, cadastro, r)
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await expect(cadastro.regiao).toHaveValue(ltcatValido.regiao)
    await r.art.fill("ART-DUPLICADO")
    await expect(r.art).toHaveValue("ART-DUPLICADO")
    await expect(cadastro.botaoSalvar).toBeEnabled()
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("TST1457 - o LTCAT duplicado salva como um registro novo", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await duplicar145(page, cadastro, r)
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await cadastro.dataBase.fill(ltcatValido.dataBase)
    await r.vigenciaInicio.fill(ltcatValido.vigenciaInicio)
    await r.vigenciaFim.fill(ltcatValido.vigenciaFim)
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)
    await expect(page).not.toHaveURL(/idkey=145(\D|$)/)
  })

  test("TST1458 - o cadastro não tem mais os botões Gravar visão e Limpar visão", async ({ ltcatCadastroPage: cadastro, page }) => {
    await cadastro.abrir()
    await expect(cadastro.botaoVoltar).toBeVisible()
    await expect(page.getByRole("button", { name: /Gravar visão|Limpar visão/i })).toHaveCount(0)
  })
})
