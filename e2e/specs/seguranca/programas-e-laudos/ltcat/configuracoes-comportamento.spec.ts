// EF LTCAT > 5.3 Configurações (Aba 02): radio de ordenação dos GHEs, "Exibir a descrição das atividades por",
// "Incluir riscos associados às atividades do GHE" e "Incluir fotos dos GHEs".
// Com a Configuração Geral em Bloquear (estado do ambiente em 2026-10-21) os campos da aba ficam travados, então
// cada teste coloca a coluna LTCAT em Sugerir, testa e devolve os modos originais: roda sozinho (project ltcat-config-geral).
// Os testes que salvam criam 1 LTCAT novo no ambiente a cada execução (sem rollback), como nas outras suítes.
import type { Page } from "@playwright/test"
import { test, expect } from "@support"
import type { LinhaConfig } from "@support/actions/seguranca/programas-e-laudos/ConfiguracaoGeral"
import type { LtcatConfiguracoesPage, OrdenacaoGhes } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATConfiguracoes"
import type { LtcatCadastroPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro"
import { URLS } from "@support/urls"
import { ltcatValido } from "@support/data/ltcat"
import { repetir } from "@support/utils/repetir"

const MSG_DESCRICAO = "Para prosseguir ao menos uma opção de descrição das atividades deve ser marcada. Favor verificar."
const RISCOS = "Incluir riscos associados às atividades do GHE"
const DADOS = { ...ltcatValido, vigenciaInicio: "01/01/2026", vigenciaFim: "31/12/2026" }
const ORDENACOES: OrdenacaoGhes[] = ["Código do GHE", "Código da área a que pertence", "Descrição do GHE", "Descrição da área a que pertence"]

test.describe.configure({ mode: "serial" })

test.describe("LTCAT - Aba Configurações - comportamento dos campos", () => {
  let original: LinhaConfig[] = []

  test.beforeEach(async ({ login, configuracaoGeralPage: cg, ltcatCadastroPage: cadastro }) => {
    test.setTimeout(240000)
    await login.entrar()
    await cg.abrir()
    original = await cg.lerLtcat()
    // os testes de campo bloqueado ficam num grupo com "Bloquear" no nome; todo o resto precisa de campos editáveis
    await cg.aplicarModoEmTodas(test.info().titlePath.some((t) => t.includes("Bloquear")) ? "Bloquear" : "Sugerir")
    if (await cg.botaoSalvar.isEnabled()) await cg.salvar()
    await cadastro.abrir()
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await cadastro.abrirAba("Configurações")
  })

  test.afterEach(async ({ configuracaoGeralPage: cg, page }) => {
    test.setTimeout(240000)
    if (!original.length) return
    await page.goto(URLS.ltcat)
    await cg.abrir()
    await cg.restaurar(original)
    if (await cg.botaoSalvar.isEnabled()) await cg.salvar()
  })

  const salvarERecarregar = async (cadastro: LtcatCadastroPage, page: Page) => {
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await page.reload()
    await cadastro.titulo.waitFor()
    await cadastro.abrirAba("Configurações")
  }

  const preencherReferencias = async (cadastro: LtcatCadastroPage) => {
    await cadastro.abrirAba("Referências")
    await cadastro.preencherObrigatorios(DADOS)
    await cadastro.abrirAba("Configurações")
  }

  test.describe("Listar os GHEs em ordem alfabética por", () => {
    test("TST1048 - alternar várias vezes entre 'Código do GHE' e 'Código da área' mantém só a última opção", async ({ ltcatConfiguracoesPage: c }) => {
      await repetir(3, async () => {
        await c.escolherOrdenacao("Código da área a que pertence")
        await c.escolherOrdenacao("Código do GHE")
      })
      await c.escolherOrdenacao("Código da área a que pertence")
      await expect(c.ordenacao("Código da área a que pertence").locator("input")).toBeChecked()
      await expect(c.ordenacao("Código do GHE").locator("input")).not.toBeChecked()
      await expect(c.ordenacoesMarcadas).toHaveCount(1)
    })

    // planilha: o radio sempre abre com uma opção já preenchida (a gravada na Configuração Geral, 'Código do GHE' por padrão)
    test("TST1047 - ao abrir sempre há uma ordenação marcada e ela é a da Configuração Geral", async ({ ltcatConfiguracoesPage: c }) => {
      await expect(c.ordenacoesMarcadas).toHaveCount(1)
      const esperada = original.find((l) => l.rotulo.startsWith("Listar os GHEs"))!.valor as OrdenacaoGhes
      await expect(c.ordenacao(esperada).locator("input")).toBeChecked()
    })

    for (const opcao of ORDENACOES) {
      test(`TST1049 - radio: só '${opcao}' fica marcado ao escolhê-lo`, async ({ ltcatConfiguracoesPage: c }) => {
        await c.escolherOrdenacao(opcao)
        await expect(c.ordenacoesMarcadas).toHaveCount(1)
        await expect(c.ordenacao(opcao).locator("input")).toBeChecked()
        for (const outra of ORDENACOES.filter((o) => o !== opcao)) await expect(c.ordenacao(outra).locator("input")).not.toBeChecked()
      })
    }

    // nunca vazio e nunca mais de uma: clicar de novo na opção já marcada não a desmarca, e cada troca deixa exatamente uma
    test("TST1049 (clicar de novo) - clicar de novo na opção marcada mantém ela marcada (grupo nunca fica vazio)", async ({ ltcatConfiguracoesPage: c }) => {
      for (const opcao of ORDENACOES) {
        await c.escolherOrdenacao(opcao)
        await c.escolherOrdenacao(opcao)
        await expect(c.ordenacao(opcao).locator("input")).toBeChecked()
        await expect(c.ordenacoesMarcadas).toHaveCount(1)
      }
    })

    test("TST1095 (clicar de novo) - mesma regra no fator de troca (q3 / q5)", async ({ ltcatConfiguracoesPage: c }) => {
      for (const fator of ["q3", "q3", "q5", "q5", "q3"] as const) {
        await c.escolherFator(fator)
        await expect(c.fatorDeTroca(fator).locator("input")).toBeChecked()
        await expect(c.fatoresMarcados).toHaveCount(1)
      }
    })

    // a ordem só aparece nos itens 6 e 7 do laudo gerado; o "Gerar laudo" não entrega arquivo conferível (ver referencias-configuracoes-gerais, 36-38)
    test.fixme("TST1050 - 'Código da área a que pertence' ordena os GHEs em árvore (hierarquia 1, 2 e 3) no laudo", async () => {})
    test.fixme("TST1051 - muitos GHEs agrupados por hierarquia continuam legíveis no laudo, sem quebra de layout", async () => {})
  })

  test.describe("Exibir a descrição das atividades por", () => {
    for (const { titulo, cargo, ghe } of [
      { titulo: "TST1052 - só Cargo", cargo: true, ghe: false },
      { titulo: "TST1053 - só GHE", cargo: false, ghe: true },
      { titulo: "TST1054 - Cargo e GHE", cargo: true, ghe: true },
    ]) {
      test(`${titulo}: salva e mantém ao reabrir`, async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
        // marca primeiro o que fica ligado: nunca passa pelo estado "nenhuma"
        for (const [opcao, marcado] of [["Cargo", cargo], ["GHE", ghe]] as const) if (marcado) await c.definir(opcao, true)
        for (const [opcao, marcado] of [["Cargo", cargo], ["GHE", ghe]] as const) if (!marcado) await c.definir(opcao, false)
        await c.garantirFatorDeTroca()
        await preencherReferencias(cadastro)
        await salvarERecarregar(cadastro, page)
        await expect(page).toHaveURL(/idkey=\d+/)
        await expect(c.opcao("Cargo").locator("input")).toBeChecked({ checked: cargo })
        await expect(c.opcao("GHE").locator("input")).toBeChecked({ checked: ghe })
      })
    }

    test("TST1055 - salvar sem Cargo nem GHE é bloqueado com a mensagem de descrição obrigatória", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, toast, page }) => {
      await c.definir("Cargo", false)
      await c.definir("GHE", false)
      await c.garantirFatorDeTroca()
      await preencherReferencias(cadastro)
      await cadastro.salvar()
      await toast.temTexto(MSG_DESCRICAO)
      await expect(page).not.toHaveURL(/idkey=/)
    })

    test("TST1418 - Salvar sem Cargo nem GHE destaca as duas flags e exibe [descricao_atividade_obrigatoria]", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, toast, page }) => {
      await c.definir("Cargo", false)
      await c.definir("GHE", false)
      await c.garantirFatorDeTroca()
      await preencherReferencias(cadastro)
      await cadastro.salvar()
      await toast.temTexto(MSG_DESCRICAO)
      for (const opcao of ["Cargo", "GHE"] as const) {
        console.log(opcao, await c.opcao(opcao).evaluate((e) => ({ classe: e.className, cor: getComputedStyle(e.querySelector(".mat-checkbox-frame")!).borderColor, label: getComputedStyle(e.querySelector(".mat-checkbox-label")!).color })))
      }
      await expect(page).not.toHaveURL(/idkey=/)
    })

    test("TST1419 - Salvar sem Cargo nem GHE estando em outra aba leva para a aba Configurações", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, toast, page }) => {
      await c.definir("Cargo", false)
      await c.definir("GHE", false)
      await c.garantirFatorDeTroca()
      await cadastro.abrirAba("Referências")
      await cadastro.preencherObrigatorios(DADOS)
      await cadastro.abrirAba("Conclusão")
      await cadastro.salvar()
      await toast.temTexto(MSG_DESCRICAO)
      await expect(cadastro.aba("Configurações")).toHaveAttribute("aria-selected", "true")
      await expect(c.opcao("Cargo")).toBeVisible()
      await expect(page).not.toHaveURL(/idkey=/)
    })
  })

  test.describe("Incluir riscos associados às atividades do GHE", () => {
    test("TST1056 - com 'GHE' desmarcado fica desmarcado e bloqueado", async ({ ltcatConfiguracoesPage: c }) => {
      await c.definir("GHE", false)
      await expect(c.opcao(RISCOS).locator("input")).not.toBeChecked()
      await expect(c.opcao(RISCOS).locator("input")).toBeDisabled()
    })

    test("TST1057 - marcar 'GHE' desbloqueia o campo", async ({ ltcatConfiguracoesPage: c }) => {
      await c.definir("GHE", false)
      await expect(c.opcao(RISCOS).locator("input")).toBeDisabled()
      await c.definir("GHE", true)
      await expect(c.opcao(RISCOS).locator("input")).toBeEnabled()
    })

    // GRO > Configurações > Configurações - GHE > Gerais é global do ambiente: o valor original volta no finally
    // ciclo num teste só (sem dois workers disputando o GRO), navegando pelo menu como o usuário faz, sem recarregar a página
    test("TST1058 - a flag acompanha a exibição da aba 'Atividades x Fatores de Risco' no GRO (Oculta esconde, Visível mostra)", async ({ menuLateral: menu, configGheAbaGeraisPage: gro, ltcatPage: lista, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
      test.setTimeout(480000)
      // durante a animação de rota a tela que sai e a que entra ficam juntas no DOM (dois "Região *")
      const telaUnica = () => expect(page.getByRole("combobox", { name: "Região *" })).toHaveCount(1, { timeout: 15000 })
      const irParaListaLtcat = async () => {
        const item = menu.item(/LTCAT/).locator("visible=true")
        if (!(await item.isVisible())) await menu.grupo("Programas e Laudos").click()
        await item.click()
        const sair = cadastro.botaoConfirmacaoSaida("Sair sem salvar")
        await lista.titulo.or(sair).first().waitFor()
        if (await sair.isVisible()) await sair.click()
        await lista.titulo.waitFor()
        await telaUnica()
        // a lista lembra o filtro entre idas e vindas pelo menu
        if (!(await lista.regiao.inputValue())) await lista.marcarEConfirmar(lista.regiao, ltcatValido.regiao)
      }
      const flagNaAba = async () => {
        await cadastro.abrirAba("Configurações")
        await c.opcao("EPCs").waitFor()
        return c.opcao(RISCOS)
      }

      await gro.abrir()
      const original = await gro.lerExibicao()
      try {
        for (const valor of ["Oculta", "Visível"] as const) {
          const esperado = valor === "Oculta" ? 0 : 1
          await test.step(`GRO em ${valor}`, async () => {
            await gro.abrir()
            await gro.definirExibicao(valor)
            if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
          })
          await test.step(`LTCAT novo com GRO em ${valor}`, async () => {
            await irParaListaLtcat()
            await lista.botaoNovo.click()
            await cadastro.titulo.waitFor()
            await telaUnica()
            await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
            await expect(await flagNaAba(), `novo, GRO em ${valor}`).toHaveCount(esperado)
          })
          await test.step(`LTCAT já cadastrado com GRO em ${valor}`, async () => {
            await irParaListaLtcat()
            await lista.botaoPesquisar.click()
            await expect(lista.mensagemSemRegistros).toHaveCount(0)
            await lista.linhas.first().dblclick()
            await cadastro.titulo.waitFor()
            await telaUnica()
            await expect(await flagNaAba(), `cadastrado, GRO em ${valor}`).toHaveCount(esperado)
          })
        }
      } finally {
        await gro.abrir()
        await gro.definirExibicao(original)
        if (await gro.botaoSalvar.isEnabled()) await gro.salvar()
      }
    })
  })

  test.describe("Incluir fotos dos GHEs", () => {
    test("TST1059 - marcar e salvar mantém marcado ao recarregar", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
      // primeiro grava desmarcado, para o "marcar" ser uma mudança de verdade
      await c.definir("Incluir fotos dos GHEs", false)
      await c.garantirFatorDeTroca()
      await preencherReferencias(cadastro)
      await salvarERecarregar(cadastro, page)
      await expect(c.opcao("Incluir fotos dos GHEs").locator("input")).not.toBeChecked()

      await c.definir("Incluir fotos dos GHEs", true)
      await salvarERecarregar(cadastro, page)
      await expect(c.opcao("Incluir fotos dos GHEs").locator("input")).toBeChecked()
    })

    test("TST1060 - desmarcar e salvar mantém desmarcado ao recarregar", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
      await c.definir("Incluir fotos dos GHEs", true)
      await c.garantirFatorDeTroca()
      await preencherReferencias(cadastro)
      await salvarERecarregar(cadastro, page)
      await expect(c.opcao("Incluir fotos dos GHEs").locator("input")).toBeChecked()

      await c.definir("Incluir fotos dos GHEs", false)
      await salvarERecarregar(cadastro, page)
      await expect(c.opcao("Incluir fotos dos GHEs").locator("input")).not.toBeChecked()
    })
  })

  // ---- 2ª leva de cenários da planilha ----
  const primaria = (page: Page) => page.evaluate(() => {
    const hex = getComputedStyle(document.documentElement).getPropertyValue("--apls-default-primary-color").trim().slice(1)
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
    return `rgb(${r}, ${g}, ${b})`
  })

  // cadastro novo: ajusta o que o teste quer, preenche as Referências, salva e recarrega na aba Configurações
  const gravarNovo = async ({ cadastro, c, page }: { cadastro: LtcatCadastroPage; c: LtcatConfiguracoesPage; page: Page }) => {
    await c.garantirFatorDeTroca()
    await preencherReferencias(cadastro)
    await salvarERecarregar(cadastro, page)
    await expect(page).toHaveURL(/idkey=\d+/)
  }

  test.describe("Flags e valores default", () => {
    // TST1089 - ignorado: exige base nova, sem parametrização na Configuração Geral (dúvida registrada no doc 09)
    // test("TST1089 - 'Considerar frequência para conclusão' vem marcada quando não há parametrização prévia", async () => {})

    test("TST1090 - marcar 'Incluir fichas de campo' e salvar mantém marcado", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
      await c.definir("Incluir fichas de campo", false)
      await c.definir("Incluir fichas de campo", true)
      await gravarNovo({ cadastro, c, page })
      await expect(c.opcao("Incluir fichas de campo").locator("input")).toBeChecked()
    })

    test("TST1091 - não existe mais 'Incluir anexo de Relatório de Análise'", async ({ ltcatConfiguracoesPage: c }) => {
      await expect(c.aba.getByText(/Relatório de Análise/i)).toHaveCount(0)
    })

    test("TST1092 - sem rótulo, help ou checkbox órfão: todo componente tem texto", async ({ ltcatConfiguracoesPage: c }) => {
      const vazios = await c.aba.locator("mat-checkbox, mat-radio-button").evaluateAll((els) =>
        els.filter((e) => !(e.querySelector(".mat-checkbox-label, .mat-radio-label-content") as HTMLElement)?.innerText.replace("help_outline", "").trim()).length)
      expect(vazios).toBe(0)
      await expect(c.aba.getByText(/Relat[óo]rio de An[áa]lise/i)).toHaveCount(0)
    })

    test("TST1093 - marcar 'Sinalizar EPIs com CA vencido' e salvar mantém marcado", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
      await c.definir("Sinalizar EPIs com CA vencido", false)
      await c.definir("Sinalizar EPIs com CA vencido", true)
      await gravarNovo({ cadastro, c, page })
      await expect(c.opcao("Sinalizar EPIs com CA vencido").locator("input")).toBeChecked()
    })

    test("TST1094 - 'Sinalizar EPIs com CA vencido': marcado usa a cor primária do tema na borda e no check", async ({ ltcatConfiguracoesPage: c, page }) => {
      await c.definir("Sinalizar EPIs com CA vencido", false)
      const cb = c.opcao("Sinalizar EPIs com CA vencido")
      const cores = () => cb.evaluate((e) => ({
        borda: getComputedStyle(e.querySelector(".mat-checkbox-frame")!).borderColor,
        check: getComputedStyle(e.querySelector(".mat-checkbox-checkmark-path")!).stroke,
      }))
      const cor = await primaria(page)
      expect((await cores()).borda).not.toBe(cor)
      await c.definir("Sinalizar EPIs com CA vencido", true)
      await expect.poll(cores).toEqual({ borda: cor, check: cor })
    })
  })

  test.describe("Fator de troca (q3 / q5)", () => {
    // o radio não se desmarca pela tela, então "salvar sem nenhum" não é alcançável: confere que sempre há exatamente um marcado
    test("TST1095 - o fator de troca obrigatório sempre tem q3 ou q5 marcado", async ({ ltcatConfiguracoesPage: c }) => {
      await expect(c.fatoresMarcados).toHaveCount(1)
      await c.escolherFator("q3")
      await c.escolherFator("q3")
      await expect(c.fatoresMarcados).toHaveCount(1)
    })

    for (const fator of ["q3", "q5"] as const) {
      const outro = fator === "q3" ? "q5" : "q3"
      test(`${fator === "q3" ? "TST1096" : "TST1097"} - selecionar ${fator} mantém só ${fator}`, async ({ ltcatConfiguracoesPage: c }) => {
        await c.escolherFator(fator)
        await expect(c.fatorDeTroca(fator).locator("input")).toBeChecked()
        await expect(c.fatorDeTroca(outro).locator("input")).not.toBeChecked()
        await expect(c.fatoresMarcados).toHaveCount(1)
      })
    }

    test("TST1098 - alternar rapidamente entre q3 e q5 nunca deixa dois marcados", async ({ ltcatConfiguracoesPage: c }) => {
      await repetir(6, async () => {
        await c.fatorDeTroca("q3").locator("label").click({ delay: 0 })
        await c.fatorDeTroca("q5").locator("label").click({ delay: 0 })
      })
      await expect(c.fatorDeTroca("q5").locator("input")).toBeChecked()
      await expect(c.fatoresMarcados).toHaveCount(1)
    })

    for (const [num, fator, outro] of [["TST1099", "q3", "q5"], ["TST1100", "q5", "q3"]] as const) {
      test(`${num} - ${fator} persiste após salvar e reabrir`, async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
        // sai do outro valor para a escolha ser uma mudança de verdade
        await c.escolherFator(outro)
        await c.escolherFator(fator)
        await gravarNovo({ cadastro, c, page })
        await expect(c.fatorDeTroca(fator).locator("input")).toBeChecked()
        await expect(c.fatorDeTroca(outro).locator("input")).not.toBeChecked()
      })
    }
  })

  // "marcado" = o item É considerado na conclusão (a planilha descreve o contrário; o rótulo e a EF dizem "Considerar na conclusão")
  test.describe("Considerar na conclusão", () => {
    for (const { num, titulo, epis, epcs } of [
      { num: "TST1101", titulo: "só EPIs", epis: true, epcs: false },
      { num: "TST1102", titulo: "só EPCs", epis: false, epcs: true },
      { num: "TST1103", titulo: "EPIs e EPCs juntos", epis: true, epcs: true },
    ]) {
      test(`${num} - ${titulo}: salva e mantém ao reabrir`, async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
        await c.definir("EPIs", epis)
        await c.definir("EPCs", epcs)
        await gravarNovo({ cadastro, c, page })
        await expect(c.opcao("EPIs").locator("input")).toBeChecked({ checked: epis })
        await expect(c.opcao("EPCs").locator("input")).toBeChecked({ checked: epcs })
      })
    }
  })

  test.describe("Layout e usabilidade", () => {
    test("TST1104 - nenhum componente sobrepõe outro", async ({ ltcatConfiguracoesPage: c }) => {
      const caixas = await c.aba.locator("mat-checkbox, mat-radio-button").evaluateAll((els) =>
        els.map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height })))
      type Caixa = (typeof caixas)[number]
      const sobrepoe = (a: Caixa, b: Caixa) => a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1
      // todos os pares (i, j) com j > i que se sobrepõem
      const sobrepostos = caixas.flatMap((a, i) => caixas.slice(i + 1).flatMap((b, k) => (sobrepoe(a, b) ? [`${i} e ${i + 1 + k}`] : [])))
      expect(sobrepostos, "pares de componentes sobrepostos").toEqual([])
    })

    test("TST1105 - a rolagem alcança o último campo e volta ao topo", async ({ ltcatConfiguracoesPage: c, page }) => {
      const ultimo = c.opcao("EPCs")
      await ultimo.scrollIntoViewIfNeeded()
      await expect(ultimo).toBeInViewport()
      await expect(page.getByRole("button", { name: "Salvar", exact: true })).toBeVisible()
      await c.ordenacao("Código do GHE").scrollIntoViewIfNeeded()
      await expect(c.ordenacao("Código do GHE")).toBeInViewport()
    })

    test("TST1106 - em resolução reduzida os campos continuam acessíveis e sem rolagem horizontal", async ({ ltcatConfiguracoesPage: c, page }) => {
      await page.setViewportSize({ width: 768, height: 900 })
      await expect(c.ordenacao("Código do GHE")).toBeVisible()
      await c.opcao("EPCs").scrollIntoViewIfNeeded()
      await expect(c.opcao("EPCs")).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })

    // Textos da EF 5.3 (sem os trechos riscados). Onde a EF só difere em caixa/singular/crase do título da seção, vale a grafia da tela:
    // EF "Incluir foto dos GHEs", "Incluir risco das Categorias:", "Incluir GHEs sem Riscos (Descritivo)", "Incluir Ficha de Campo",
    // "Incluir Equipamentos de Medições", "(habitual/eventual)" e o help "junto as atividades" (sem crase)
    test("TST1107 - ortografia dos rótulos e helps conforme a EF 5.3", async ({ ltcatConfiguracoesPage: c, page }) => {
      const esperados = [
        "Listar os GHEs em ordem alfabética por:", "Código do GHE", "Código da área a que pertence", "Descrição do GHE", "Descrição da área a que pertence",
        "Exibir a descrição das atividades por:", "Cargo", "GHE", "Incluir fotos dos GHEs", "Incluir GHEs sem integrantes", "Incluir GHEs sem riscos",
        "Incluir GHEs sem riscos - Descritivo", "Restaurar texto padrão", "Incluir riscos das categorias:", "Mecânico/Acidente", "Ergonômico/Psicossocial",
        "Incluir código eSocial", "Incluir CAS number", "Incluir riscos associados às atividades do GHE",
        "Incluir somente riscos com possível enquadramento previdenciário", "Incluir tipo de avaliação", "Incluir registro de medições",
        "Incluir equipamentos de medição", "Incluir certificado de calibração dos equipamentos de medição", "Incluir técnica de medição",
        "Incluir dados quantitativos de critério técnico", "Considerar frequência para conclusão (habitual / eventual)", "Incluir fichas de campo",
        "Incluir laudo da amostra", "Sinalizar EPIs com CA vencido", "Selecione o fator de troca que será considerado para as conclusões:", "q3", "q5",
        "Considerar na conclusão:", "EPIs", "EPCs",
      ]
      const linhas = (await c.aba.innerText()).split("\n").map((l) => l.replace(/\*$/, "").trim())
        .filter((l) => l && l !== "help_outline" && l !== "auto_awesome")
      expect(linhas).toEqual(esperados)

      const helps = [
        "Caso esta opção seja selecionada, os GHEs que não possuam integrantes ou que não tenham integrantes ativos serão incluídos no laudo.",
        "Caso esta opção seja marcada, o texto abaixo será exibido nos GHEs sem riscos identificados.",
        "Se esta opção for marcada, junto às atividades do GHE serão listados os riscos associados, respectivamente, a cada descrição.",
        "Caso esta opção estiver marcada, no fluxo para gerar a conclusão somente serão considerados riscos com potencial de insalubridade identificados no GHE com severidade considerada como exposição habitual.",
      ]
      const icones = c.aba.locator("mat-icon", { hasText: "help_outline" })
      await expect(icones).toHaveCount(helps.length)
      const tooltip = page.locator("mat-tooltip-component")
      for (const [i, texto] of helps.entries()) {
        await icones.nth(i).hover()
        await expect(tooltip).toHaveText(texto)
        await page.mouse.move(0, 0)
        await expect(tooltip).toHaveCount(0)
      }
    })

    test("TST1108 - checkboxes alinhados entre si em cada coluna", async ({ ltcatConfiguracoesPage: c }) => {
      for (const coluna of [0, 1]) {
        const xs = await c.aba.locator(`form > div > .col-6`).nth(coluna).locator("mat-checkbox.col-12 .mat-checkbox-inner-container")
          .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)))
        expect(xs.length).toBeGreaterThan(1)
        expect(new Set(xs).size, `coluna ${coluna}: ${xs}`).toBe(1)
      }
    })

    test("TST1112 - fechar (Voltar) com alterações sem salvar alerta sobre alterações pendentes", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c }) => {
      await c.definir("Incluir fotos dos GHEs", !(await c.opcao("Incluir fotos dos GHEs").locator("input").isChecked()))
      await cadastro.botaoVoltar.click()
      await expect(cadastro.confirmacaoSaida.getByRole("heading", { name: "Atenção" })).toBeVisible()
      await expect(cadastro.confirmacaoSaida).toContainText("Existem informações que não foram salvas.")
      await expect(cadastro.botaoConfirmacaoSaida("Sair sem salvar")).toBeVisible()
      await expect(cadastro.botaoConfirmacaoSaida("Salvar e sair")).toBeVisible()
    })

    test("TST1115 - a aba carrega em até 5 segundos", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c }) => {
      await cadastro.abrirAba("Referências")
      const inicio = Date.now()
      await cadastro.abrirAba("Configurações")
      await expect(c.opcao("EPCs")).toBeVisible()
      expect(Date.now() - inicio).toBeLessThan(5000)
    })

    test("TST1116 - clicar no texto de cada flag habilitada marca/desmarca", async ({ ltcatConfiguracoesPage: c }) => {
      const flags = await c.aba.locator("mat-checkbox").all()
      expect(flags.length).toBeGreaterThan(20)
      for (const flag of flags) {
        if (!(await flag.locator("input").isEnabled())) continue
        const antes = await flag.locator("input").isChecked()
        await flag.locator(".mat-checkbox-label").click()
        await c.recusarAtualizarTotalSeAparecer()
        await expect(flag.locator("input"), (await flag.innerText()).trim()).toBeChecked({ checked: !antes })
      }
    })

    test("TST1117 - TAB percorre Cargo, GHE, fotos e GHEs sem integrantes nessa ordem", async ({ ltcatConfiguracoesPage: c }) => {
      await c.opcao("Cargo").locator("input").focus()
      await c.opcao("Cargo").locator("input").press("Tab")
      await expect(c.opcao("GHE").locator("input")).toBeFocused()
      await c.opcao("GHE").locator("input").press("Tab")
      await expect(c.opcao("Incluir fotos dos GHEs").locator("input")).toBeFocused()
      await c.opcao("Incluir fotos dos GHEs").locator("input").press("Tab")
      await expect(c.opcao("Incluir GHEs sem integrantes").locator("input")).toBeFocused()
    })

    // os radios obrigatórios (ordenação e fator de troca) nunca ficam vazios: vêm sempre com uma opção marcada, por isso a aba não usa o *
    test("TST1118 - radios obrigatórios sempre vêm preenchidos, mesmo depois de trocar a opção", async ({ ltcatConfiguracoesPage: c }) => {
      await expect(c.ordenacoesMarcadas).toHaveCount(1)
      await expect(c.fatoresMarcados).toHaveCount(1)
      await c.escolherOrdenacao("Descrição do GHE")
      await c.escolherOrdenacao("Código do GHE")
      await expect(c.ordenacoesMarcadas).toHaveCount(1)
    })

    // TST1120 - ignorado: sem mockup para comparar
    // test("TST1120 - tela segue o mockup aprovado", async () => {})
  })

  test.describe("Campos bloqueados (modo Bloquear)", () => {
    test("TST1109 - nenhum campo da aba aceita clique ou alteração", async ({ ltcatConfiguracoesPage: c }) => {
      // "Incluir GHEs sem riscos" não tem linha na Configuração Geral, então nunca é travado
      const habilitadas = await c.aba.locator("input").evaluateAll((els) =>
        els.filter((e) => !(e as HTMLInputElement).disabled).filter((e) => e.closest("[formcontrolname]")?.getAttribute("formcontrolname") !== "incluirGhesSemRiscos").map((e) => `${e.closest("[formcontrolname]")?.getAttribute("formcontrolname") ?? e.id}:${(e as HTMLInputElement).type}`),
      )
      expect(habilitadas).toEqual([])
      const antes = await c.opcao("Cargo").locator("input").isChecked()
      await c.opcao("Cargo").locator("label").click({ force: true })
      await c.ordenacao("Descrição do GHE").locator("label").click({ force: true })
      await expect(c.opcao("Cargo").locator("input")).toBeChecked({ checked: antes })
      await expect(c.ordenacao("Descrição do GHE").locator("input")).not.toBeChecked()
    })

    test("TST1110 - reabilitar o campo pela inspeção do navegador não persiste a alteração", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
      const cargo = c.opcao("Cargo").locator("input")
      const original = await cargo.isChecked()
      await cargo.evaluate((e) => (e as HTMLInputElement).removeAttribute("disabled"))
      await c.opcao("Cargo").locator("label").click({ force: true })
      await gravarNovo({ cadastro, c, page })
      await expect(cargo).toBeChecked({ checked: original })
      await expect(cargo).toBeDisabled()
    })
  })

  test.describe("Persistência e falhas", () => {
    test("TST1111 - várias alterações de uma vez são todas persistidas", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
      await c.definir("Incluir fotos dos GHEs", false)
      await c.definir("Incluir fichas de campo", true)
      await c.definir("Sinalizar EPIs com CA vencido", false)
      await c.definir("EPIs", true)
      await c.definir("EPCs", false)
      await c.escolherFator("q5")
      await c.escolherOrdenacao("Descrição do GHE")
      await gravarNovo({ cadastro, c, page })
      await expect(c.opcao("Incluir fotos dos GHEs").locator("input")).not.toBeChecked()
      await expect(c.opcao("Incluir fichas de campo").locator("input")).toBeChecked()
      await expect(c.opcao("Sinalizar EPIs com CA vencido").locator("input")).not.toBeChecked()
      await expect(c.opcao("EPIs").locator("input")).toBeChecked()
      await expect(c.opcao("EPCs").locator("input")).not.toBeChecked()
      await expect(c.fatorDeTroca("q5").locator("input")).toBeChecked()
      await expect(c.ordenacao("Descrição do GHE").locator("input")).toBeChecked()
    })

    // TST1113 - ignorado: exigiria duas sessões gravando o mesmo registro ao mesmo tempo
    // test("TST1113 - a mesma configuração aberta em dois navegadores não grava de forma inconsistente", async () => {})

    test("TST1114 - sem conexão ao salvar mostra erro e nada é gravado", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, toast, page }) => {
      await c.garantirFatorDeTroca()
      await preencherReferencias(cadastro)
      await page.context().setOffline(true)
      try {
        await cadastro.salvar()
        await expect(toast.mensagem.first()).toBeVisible({ timeout: 15000 })
        await expect(cadastro.mensagemSalvoComSucesso).toHaveCount(0)
        await expect(page).not.toHaveURL(/idkey=/)
      } finally {
        await page.context().setOffline(false)
      }
    })

    test("TST1119 - limpar o cache do navegador não perde o que foi salvo", async ({ ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }) => {
      await c.definir("Incluir fichas de campo", true)
      await c.escolherFator("q5")
      await gravarNovo({ cadastro, c, page })
      const cdp = await page.context().newCDPSession(page)
      await cdp.send("Network.clearBrowserCache")
      await page.reload()
      await cadastro.titulo.waitFor()
      await cadastro.abrirAba("Configurações")
      await expect(c.opcao("Incluir fichas de campo").locator("input")).toBeChecked()
      await expect(c.fatorDeTroca("q5").locator("input")).toBeChecked()
    })
  })
})
