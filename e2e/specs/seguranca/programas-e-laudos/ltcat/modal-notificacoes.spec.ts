// EF LTCAT > Cabeçalho > Notificações > Modal "Notificações" (TST586-TST645).
// Todos rodam num LTCAT novo que nunca é salvo: o Salvar da modal só guarda na tela, então nada fica no ambiente.
// O envio dos e-mails (TST616-TST645) depende da rotina diária e da caixa de entrada: ficam comentados no fim.
import { test, expect } from "@support"
import { DIAS_ANTES, type DiasAntes } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATNotificacoes"
import type { LtcatNotificacoesModal } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATNotificacoes"

const MSG_OBRIGATORIOS = "Existem um ou mais campos obrigatórios que não foram preenchidos."
const MSG_SUCESSO = "Operação realizada com sucesso. Para que a alteração seja permanentemente salva, clique no botão \"Salvar\"."
const MSG_SEM_OPCAO = "Atenção! Caso nenhuma opção seja selecionada, não haverá notificação por e-mail."
const GRUPO = "001 - Operacional"
const OUTRO_GRUPO = "RH - Recursos Humanos"
const DATA_FUTURA = `01/01/${new Date().getFullYear() + 1}`
const dd = (n: number) => String(n).padStart(2, "0")
const hoje = new Date()
const HOJE = `${dd(hoje.getDate())}/${dd(hoje.getMonth() + 1)}/${hoje.getFullYear()}`

// marca os dias e escolhe o grupo: o mínimo para o Salvar da modal aceitar
const preencherObrigatorios = async (m: LtcatNotificacoesModal, dias: DiasAntes = "30") => {
  await m.marcarDiasAntes(dias)
  await m.escolherGrupos(GRUPO)
}

test.describe("LTCAT - Modal Notificações", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage: cadastro, ltcatNotificacoesModal: m }) => {
    await login.entrar()
    await cadastro.abrir()
    await m.abrir()
  })

  // Permissões comentadas (2026-10-24): os cadastros dos usuários de permissão ainda não foram ajustados para este teste
  // test.describe("Permissões", () => {
  //   // o usuário do .env tem todas as permissões
  //   test("TST586/TST588 - usuário com INC/ALT abre a modal normalmente", async ({ ltcatNotificacoesModal: m }) => {
  //     await expect(m.titulo).toBeVisible()
  //     await expect(m.diasAntes("15")).toBeEnabled()
  //   })
  //
  //   // precisa de um usuário só com VIS (QAutomatizador_vis_h1) e a EF não diz se o botão some ou fica bloqueado
  //   test.fixme("TST587 - usuário sem INC/ALT não acessa a modal", async () => {})
  // })

  test.describe("Componentes e estado inicial", () => {
    test("TST589 - exibe todos os componentes", async ({ ltcatNotificacoesModal: m }) => {
      for (const dias of DIAS_ANTES) await expect(m.diasAntes(dias)).toHaveCount(1)
      await expect(m.avisoSemOpcao).toBeVisible()
      await expect(m.dataSeguinte).toHaveCount(1)
      await expect(m.dataFimVigencia).toHaveCount(1)
      await expect(m.gruposDeEmail).toHaveCount(1)
      await expect(m.botaoFechar).toBeVisible()
      await expect(m.botaoSalvar).toBeVisible()
    })

    test("TST590 - sem nenhum dia marcado, data e grupos ficam desabilitados e limpos", async ({ ltcatNotificacoesModal: m }) => {
      for (const dias of DIAS_ANTES) await expect(m.diasAntes(dias)).not.toBeChecked()
      for (const radio of [m.dataSeguinte, m.dataFimVigencia]) {
        await expect(radio).toBeDisabled()
        await expect(radio).not.toBeChecked()
      }
      await expect(m.gruposDeEmail).toBeDisabled()
      await expect(m.gruposDeEmail).toHaveValue("")
      await expect(m.dataEspecifica).toHaveCount(0)
    })

    // a planilha separa "texto abaixo dos checkboxes" e "box fixo", mas na tela é o mesmo box amarelo
    test("TST594/TST595 - box de alerta abaixo dos checkboxes com o texto correto", async ({ ltcatNotificacoesModal: m }) => {
      await expect(m.avisoSemOpcao).toHaveText(MSG_SEM_OPCAO)
    })
  })

  test.describe("Checkboxes de dias", () => {
    for (const dias of [["30"], ["30", "60"]] as DiasAntes[][]) {
      test(`TST591/TST592 - marcar ${dias.join(" e ")} dias habilita data e grupos`, async ({ ltcatNotificacoesModal: m }) => {
        for (const d of dias) await m.marcarDiasAntes(d)
        for (const d of dias) await expect(m.diasAntes(d)).toBeChecked()
        await expect(m.dataSeguinte).toBeEnabled()
        await expect(m.dataFimVigencia).toBeEnabled()
        await expect(m.gruposDeEmail).toBeEnabled()
      })
    }

    test("TST593 - desmarcar todos limpa e desabilita data e grupos de novo", async ({ ltcatNotificacoesModal: m }) => {
      await m.marcarDiasAntes("30")
      await m.marcarDiasAntes("60")
      await m.dataSeguinte.check({ force: true })
      await m.digitarData(DATA_FUTURA)
      await m.escolherGrupos(GRUPO)

      await m.desmarcarDiasAntes("30")
      await m.desmarcarDiasAntes("60")
      await expect(m.dataSeguinte).toBeDisabled()
      await expect(m.dataSeguinte).not.toBeChecked()
      await expect(m.dataFimVigencia).not.toBeChecked()
      await expect(m.dataEspecifica).toHaveCount(0)
      await expect(m.gruposDeEmail).toBeDisabled()
      await expect(m.gruposDeEmail).toHaveValue("")
    })
  })

  test.describe("Vencimento a considerar", () => {
    const radios = [
      { id: "TST596", nome: "A seguinte data", radio: (m: LtcatNotificacoesModal) => m.dataSeguinte, calendarios: 1 },
      { id: "TST597", nome: "A data fim da vigência", radio: (m: LtcatNotificacoesModal) => m.dataFimVigencia, calendarios: 0 },
    ]

    for (const { id, nome, radio, calendarios } of radios) {
      test(`${id} - '${nome}' ${calendarios ? "exibe" : "não exibe"} o calendário`, async ({ ltcatNotificacoesModal: m }) => {
        await m.marcarDiasAntes("30")
        await radio(m).check({ force: true })
        await expect(radio(m)).toBeChecked()
        await expect(m.dataEspecifica).toHaveCount(calendarios)
      })
    }

    // a planilha espera bloqueio por radio vazio, mas a EF (componente 04) define "A data fim da vigência do laudo" como opção padrão:
    // ao marcar um dia ela já vem marcada, então não há como ficar sem radio
    test("TST598 - ao marcar um dia, 'A data fim da vigência' já vem marcada", async ({ ltcatNotificacoesModal: m }) => {
      await m.marcarDiasAntes("30")
      await expect(m.dataFimVigencia).toBeChecked()
      await expect(m.dataSeguinte).not.toBeChecked()
    })

    const datasRecusadas = [
      { id: "TST600", titulo: "data passada", data: "01/01/2020", mensagem: "A data não pode ser anterior à data atual." },
      { id: "TST602", titulo: "data inválida (32/13/2026)", data: "32/13/2026", mensagem: "Informe uma data válida." },
    ]

    for (const { id, titulo, data, mensagem } of datasRecusadas) {
      test(`${id} - ${titulo} é recusada com aviso`, async ({ ltcatNotificacoesModal: m, toast }) => {
        await m.marcarDiasAntes("30")
        await m.dataSeguinte.check({ force: true })
        await m.digitarData(data)
        await toast.temTexto(mensagem)
        await expect(m.dataEspecifica).toHaveAttribute("aria-invalid", "true")
      })
    }

    // Comentado (2026-10-24): aguardando o analista sobre o texto. Com hoje o sistema diz "não pode ser anterior à data atual",
    // mas a regra da EF (componente 05) é "apenas data posterior à data atual". Passava assim: campo vermelho ao sair dele e o Salvar recusa
    // test("TST600 (hoje) - data de hoje é recusada ao salvar e a modal continua aberta", async ({ ltcatNotificacoesModal: m, toast }) => {
    //   await preencherObrigatorios(m)
    //   await m.dataSeguinte.check({ force: true })
    //   await m.digitarData(HOJE)
    //   await expect(m.dataEspecifica).toHaveAttribute("aria-invalid", "true")
    //   await m.botaoSalvar.click()
    //   await toast.temTexto("A data do campo Vencimento não pode ser anterior à data atual.")
    //   await expect(m.titulo).toBeVisible()
    // })

    test("TST601 - data futura é aceita e a modal salva", async ({ ltcatNotificacoesModal: m, toast }) => {
      await preencherObrigatorios(m)
      await m.dataSeguinte.check({ force: true })
      await m.digitarData(DATA_FUTURA)
      await expect(m.dataEspecifica).toHaveValue(DATA_FUTURA)
      await expect(m.dataEspecifica).toHaveAttribute("aria-invalid", "false")
      await toast.aguardarSumir()
      await m.botaoSalvar.click()
      await toast.temTexto(MSG_SUCESSO)
    })
  })

  test.describe("Grupos de e-mail", () => {
    test("TST603 - aceita mais de um grupo", async ({ ltcatNotificacoesModal: m }) => {
      await m.marcarDiasAntes("30")
      await m.escolherGrupos(GRUPO, OUTRO_GRUPO)
      await expect(m.gruposDeEmail).toHaveValue(`${GRUPO}, ${OUTRO_GRUPO}`)
    })

    // os inativos vêm da lista de Cadastros Auxiliares > Grupos de E-mail, então não depende de um grupo fixo
    test("TST605 - grupo inativo não aparece no catálogo", async ({ grupoEmailPage, ltcatCadastroPage: cadastro, ltcatNotificacoesModal: m }) => {
      const inativos = (await grupoEmailPage.todosOsGrupos()).filter((g) => !g.ativo).map((g) => `${g.codigo} - ${g.descricao}`)
      expect(inativos.length, "a lista de grupos precisa ter algum inativo").toBeGreaterThan(0)

      await cadastro.abrir()
      await m.abrir()
      await m.marcarDiasAntes("30")
      await m.gruposDeEmail.click()
      await expect(m.opcoesGrupos.first()).toBeVisible()
      const catalogo = (await m.opcoesGrupos.allInnerTexts()).map((o) => o.trim())
      expect(catalogo.filter((o) => inativos.includes(o)), "grupos inativos no catálogo").toEqual([])
    })

    test("TST606 - catálogo em ordem alfabética crescente pelo código", async ({ ltcatNotificacoesModal: m }) => {
      await m.marcarDiasAntes("30")
      await m.gruposDeEmail.click()
      await expect(m.opcoesGrupos.first()).toBeVisible()
      const codigos = (await m.opcoesGrupos.allInnerTexts()).map((o) => o.trim().split(" - ")[0])
      const ordenados = [...codigos].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base", ignorePunctuation: true }))
      expect(codigos).toEqual(ordenados)
    })

    test("TST607 - pesquisa pelo nome filtra o catálogo, sem diferenciar maiúsculas", async ({ ltcatNotificacoesModal: m }) => {
      await m.marcarDiasAntes("30")
      await m.gruposDeEmail.click()
      await m.gruposDeEmail.fill("RECURSOS HUMANOS")
      await expect(m.opcoesGrupos).toHaveText([OUTRO_GRUPO])
    })
  })

  test.describe("Salvar e campos obrigatórios", () => {
    // cada caso deixa faltar um obrigatório diferente
    const faltando = [
      { id: "TST599", titulo: "'A seguinte data' sem data", preparar: async (m: LtcatNotificacoesModal) => {
        await preencherObrigatorios(m)
        await m.dataSeguinte.check({ force: true })
      } },
      { id: "TST604/TST609", titulo: "dia marcado sem grupo de e-mail", preparar: (m: LtcatNotificacoesModal) => m.marcarDiasAntes("30") },
    ]

    for (const { id, titulo, preparar } of faltando) {
      test(`${id} - ${titulo} exibe [campos_obrigatorios] e não salva`, async ({ ltcatNotificacoesModal: m, toast }) => {
        await preparar(m)
        await m.botaoSalvar.click()
        await toast.temTexto(MSG_OBRIGATORIOS)
        await expect(m.titulo).toBeVisible()
      })
    }

    test("TST608/TST614 - salva com [info_sucesso] e os dados continuam ao reabrir", async ({ ltcatNotificacoesModal: m, toast }) => {
      await preencherObrigatorios(m)
      await m.botaoSalvar.click()
      await toast.temTexto(MSG_SUCESSO)
      await expect(m.titulo).toBeHidden()

      await m.abrir()
      await expect(m.diasAntes("30")).toBeChecked()
      await expect(m.dataFimVigencia).toBeChecked()
      await expect(m.gruposDeEmail).toHaveValue(GRUPO)
    })

    test("TST615 - salvar a modal e não salvar o LTCAT não guarda nada", async ({ ltcatCadastroPage: cadastro, ltcatNotificacoesModal: m, toast, page }) => {
      await preencherObrigatorios(m)
      await m.botaoSalvar.click()
      await toast.temTexto(MSG_SUCESSO)
      await page.reload()
      await cadastro.titulo.waitFor()
      await m.abrir()
      await expect(m.diasAntes("30")).not.toBeChecked()
      await expect(m.gruposDeEmail).toHaveValue("")
    })
  })

  test.describe("Fechar", () => {
    test("TST610 - Fechar sem alterações fecha direto, sem confirmação", async ({ ltcatNotificacoesModal: m }) => {
      await m.botaoFechar.click()
      await expect(m.titulo).toBeHidden()
      await expect(m.confirmacaoSaida).toHaveCount(0)
    })

    const desfechos = [
      { id: "TST612", botao: "Sair sem salvar", mantem: false },
      { id: "TST613", botao: "Salvar e sair", mantem: true },
    ] as const

    for (const { id, botao, mantem } of desfechos) {
      test(`TST611/${id} - Fechar com alteração pede confirmação; '${botao}' ${mantem ? "guarda" : "descarta"} a alteração`, async ({ ltcatNotificacoesModal: m }) => {
        await preencherObrigatorios(m)
        await m.botaoFechar.click()
        await expect(m.confirmacaoSaida).toBeVisible()
        await m.botaoConfirmacaoSaida(botao).click()
        await expect(m.titulo).toBeHidden()

        await m.abrir()
        await expect(m.diasAntes("30")).toBeChecked({ checked: mantem })
        await expect(m.gruposDeEmail).toHaveValue(mantem ? GRUPO : "")
      })
    }
  })

  // Envio dos e-mails: depende da rotina diária do servidor e de ler a caixa de entrada dos destinatários,
  // o que o projeto ainda não faz. Ficam registrados para não perder o cenário; não rodam.
  // test("TST616 - com 15 e 30 dias marcados, envia nas duas datas", async () => {})
  // test("TST617 - sem nenhum dia marcado, não envia", async () => {})
  // test("TST618 - envia no dia (vencimento - dias marcados)", async () => {})
  // test("TST619 - data calculada igual a hoje: envia", async () => {})
  // test("TST620 - data calculada diferente de hoje: não envia", async () => {})
  // test("TST621 - 'A seguinte data' usa a data do calendário", async () => {})
  // test("TST622 - 'Data fim da vigência' usa a vigência do LTCAT", async () => {})
  // test("TST623 - grupo ativo segue o fluxo de envio", async () => {})
  // test("TST624 - grupo inativo não envia", async () => {})
  // test("TST625 - destinatário 'Todos' recebe independente da hierarquia", async () => {})
  // test("TST626 - destinatário interno ativo com e-mail recebe", async () => {})
  // test("TST627 - destinatário interno sem e-mail não recebe", async () => {})
  // test("TST628 - destinatário interno inativo não recebe", async () => {})
  // test("TST629 - destinatário externo recebe conforme a regra", async () => {})
  // test("TST630 - destinatário externo recebe no idioma do grupo", async () => {})
  // test("TST631 - destinatário interno recebe no idioma do usuário", async () => {})
  // test("TST632 - e-mail com título e corpo da especificação", async () => {})
  // test("TST633 - e-mail mostra só as hierarquias do LTCAT", async () => {})
  // test("TST634 - LTCAT só com H1: e-mail mostra só H1", async () => {})
  // test("TST635 - LTCAT com H1, H2 e H3: e-mail mostra as três", async () => {})
  // test("TST636 - e-mail mostra o nome do destinatário", async () => {})
  // test("TST637 - e-mail mostra a data de vencimento da regra", async () => {})
  // test("TST638 - envia para todos os destinatários válidos", async () => {})
  // test("TST639 - grande volume de destinatários processa sem falha", async () => {})
  // test("TST640 - verificação roda todo dia", async () => {})
  // test("TST641 - rodar duas vezes no mesmo dia não duplica", async () => {})
  // test("TST642 - mudar a configuração perto da data vale a nova", async () => {})
  // test("TST643 - mudar a hierarquia do LTCAT vale a nova", async () => {})
  // test("TST644 - mudar o grupo de e-mails vale o novo", async () => {})
  // test("TST645 - layout fiel ao mockup", async () => {})  // visual: conferência manual
})
