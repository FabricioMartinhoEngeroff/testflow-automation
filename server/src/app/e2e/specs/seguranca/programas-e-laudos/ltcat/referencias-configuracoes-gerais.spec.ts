// EF LTCAT > 5.1 Referências > Configurações Gerais: Modelo de documento, Vigência do laudo e os
// checkboxes do documento. No dev só existe 1 modelo ("1233 - joao"), que vem selecionado sozinho
// ao escolher a Região (regra da EF para catálogo com uma opção).
import { test, expect } from "../../../../../support"
import type { OpcaoReferencias } from "../../../../../support/actions/seguranca/programas-e-laudos/ltcat/LTCATReferencias"
import { ltcatValido } from "../../../../../support/data/ltcat"

const MODELO = "1233 - joao"
const MSG_OBRIGATORIOS = "Existem um ou mais campos obrigatórios que não foram preenchidos."
const MSG_DATA_INVALIDA = "Informe uma data válida."
const MSG_FIM_MENOR = "A data de fim não pode ser menor que a data de início. Favor verificar."
const HELP_HISTORICO = "Para selecionar essa opção é necessário possuir ao menos um histórico de revisão na janela de histórico de revisões. Caso esta opção seja marcada, o histórico de revisões será exibido no documento."

const SEMPRE_HABILITADAS: OpcaoReferencias[] = [
  "Incluir logotipo na capa",
  "Incluir logotipo no cabeçalho de todas as páginas",
  "Incluir anexo de Anotação de Responsabilidade Técnica (ART)",
  "Incluir data de realização na capa do laudo",
]
const HISTORICO: OpcaoReferencias = "Incluir histórico de revisões"

// ordem da EF (5.1, coluna "Configurações Gerais")
const ORDEM_EF = [
  "Modelo de documento",
  "Vigência do laudo",
  "Expostos - Mulheres",
  "Expostos - Homens",
  "Expostos - PCDs",
  "Total de expostos",
  "Incluir logotipo na capa",
  "Incluir logotipo no cabeçalho de todas as páginas",
  "Incluir anexo de Anotação de Responsabilidade Técnica (ART)",
  "Incluir histórico de revisões",
  "Incluir data de realização na capa do laudo",
]

const dd = (n: number) => String(n).padStart(2, "0")
const formatar = (d: Date) => `${dd(d.getDate())}/${dd(d.getMonth() + 1)}/${d.getFullYear()}`

test.describe("LTCAT - Referências - Configurações gerais", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  test.describe("Seção", () => {
    test("01 - todos os componentes visíveis", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.modeloDocumento).toBeVisible()
      await expect(r.vigenciaInicio).toBeVisible()
      await expect(r.vigenciaFim).toBeVisible()
      for (const opcao of [...SEMPRE_HABILITADAS, HISTORICO]) await expect(r.opcao(opcao)).toBeVisible()
    })

    test("02 - componentes na ordem da documentação", async ({ page }) => {
      const secao = page.locator("apollus-ngx-ivy-ltcat-aba-referencia .col-6").nth(1)
      const textos = await secao.locator("mat-label, .mat-checkbox-label").allInnerTexts()
      expect(textos.map((t) => t.replace("help_outline", "").replace("*", "").trim())).toEqual(ORDEM_EF)
    })

    test("03 - em resolução reduzida continua utilizável e sem rolagem horizontal", async ({ ltcatReferenciasPage: r, page }) => {
      await page.setViewportSize({ width: 768, height: 900 })
      await expect(r.modeloDocumento).toBeVisible()
      await expect(r.vigenciaInicio).toBeVisible()
      await r.alternarOpcao("Incluir logotipo na capa")
      await expect(r.opcao("Incluir logotipo na capa").locator("input")).toBeChecked()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })

    test("04 - Modelo e Vigência alinhados com a mesma largura, checkboxes alinhados entre si", async ({ ltcatReferenciasPage: r }) => {
      // compara a caixa visível: na Vigência o padding da coluna fica dentro do mat-form-field
      const modelo = (await r.campoModeloDocumento.locator(".mat-form-field-flex").boundingBox())!
      const vigencia = (await r.campoVigencia.locator(".mat-form-field-flex").boundingBox())!
      expect(vigencia.x).toBe(modelo.x)
      expect(vigencia.width).toBe(modelo.width)

      const xs = []
      for (const opcao of [...SEMPRE_HABILITADAS, HISTORICO]) {
        xs.push((await r.opcao(opcao).locator(".mat-checkbox-inner-container").boundingBox())!.x)
      }
      expect(new Set(xs).size).toBe(1)
    })
  })

  test.describe("Modelo de documento", () => {
    test("05 - habilitado, vazio e sem opções enquanto não há Região (abrangência)", async ({ ltcatReferenciasPage: r, page }) => {
      await expect(r.modeloDocumento).toBeEnabled()
      await expect(r.modeloDocumento).toHaveValue("")
      await r.modeloDocumento.click()
      await expect(page.getByRole("option")).toHaveText(["Nenhum registro encontrado."])
    })

    test("06 - com uma única opção no catálogo, vem selecionada ao escolher a Região", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r }) => {
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await expect(r.modeloDocumento).toHaveValue(MODELO)
    })

    test("07 - opções no formato 'código - descrição' em ordem crescente de código", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await r.modeloDocumento.click()
      await r.modeloDocumento.selectText()
      await r.modeloDocumento.press("Backspace")
      const lista = page.getByRole("option")
      await expect.poll(async () => (await lista.allInnerTexts()).join()).not.toMatch(/^\s*$|Nenhum registro/)
      const opcoes = (await lista.allInnerTexts()).map((t) => t.trim())
      for (const opcao of opcoes) expect(opcao).toMatch(/^\S+ - .+$/)
      const codigos = opcoes.map((o) => o.split(" - ")[0])
      expect(codigos).toEqual([...codigos].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true })))
    })

    for (const { titulo, termo } of [
      { titulo: "08 - pesquisa pelo código", termo: "1233" },
      { titulo: "09 - pesquisa pela descrição", termo: "joa" },
    ]) {
      test(titulo, async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
        await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
        // digita por cima do texto selecionado: depois de apagar o sistema pode re-selecionar o único modelo
        await r.modeloDocumento.click()
        await r.modeloDocumento.selectText()
        await r.modeloDocumento.pressSequentially(termo)
        await expect(page.getByRole("option")).toHaveText([MODELO])
        await page.getByRole("option", { name: MODELO }).click()
        await expect(r.modeloDocumento).toHaveValue(MODELO)
      })
    }

    test("10 - salvar sem modelo é bloqueado com a mensagem de obrigatório", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page }) => {
      await cadastro.preencherObrigatorios()
      await cadastro.preencherConfiguracoesObrigatorias()
      await r.apagarModeloDocumento()
      await cadastro.salvar()
      await toast.temTexto(MSG_OBRIGATORIOS)
      await expect(r.campoModeloDocumento).toHaveClass(/mat-form-field-invalid/)
      await expect(page).not.toHaveURL(/idkey=/)
    })

    test("11 - apagar e escolher o modelo de novo mantém a seleção", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r }) => {
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      // com uma opção só, o sistema pode trazê-la de volta sozinho depois de apagar (regra da EF)
      await r.apagarModeloDocumento()
      await r.selecionarOpcao(r.modeloDocumento, MODELO)
      await expect(r.modeloDocumento).toHaveValue(MODELO)
    })

    // dependem de massa/cadastros que o dev não tem hoje (só 1 modelo) ou de mexer em outro módulo
    test.fixme("12 - troca de modelo já selecionado por outro", async () => {})
    test.fixme("13 - lista só modelos ativos e com a flag LTCAT", async () => {})
    test.fixme("14 - sem nenhum modelo compatível, campo fica vazio com mensagem", async () => {})
    test.fixme("15 - edição do cadastro do modelo aparece no LTCAT e o laudo gera", async () => {})
    test.fixme("16 - modelo excluído: campo em branco, obrigatório e laudo gera sem erro", async () => {})
  })

  test.describe("Vigência do laudo", () => {
    test("17 - em branco por padrão e obrigatória", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.vigenciaInicio).toHaveValue("")
      await expect(r.vigenciaFim).toHaveValue("")
      await expect(r.campoVigencia.locator(".mat-form-field-required-marker")).toBeVisible()
    })

    test("18 - aceita período válido 01/01/2026 a 31/12/2026", async ({ ltcatReferenciasPage: r, page }) => {
      await r.vigenciaInicio.pressSequentially("01012026")
      await r.vigenciaFim.click()
      await r.vigenciaFim.pressSequentially("31122026")
      await r.vigenciaFim.press("Tab")
      await expect(r.vigenciaInicio).toHaveValue("01/01/2026")
      await expect(r.vigenciaFim).toHaveValue("31/12/2026")
      await expect(r.campoVigencia).not.toHaveClass(/mat-form-field-invalid/)
      await expect(page.locator("apls-toast")).toHaveCount(0)
    })

    test("19 - fim menor que o início é bloqueado com alerta", async ({ ltcatReferenciasPage: r, toast }) => {
      await r.vigenciaInicio.pressSequentially("31122026")
      await r.vigenciaFim.click()
      await r.vigenciaFim.pressSequentially("01012026")
      await r.vigenciaFim.press("Tab")
      await toast.temTexto(MSG_FIM_MENOR)
      await expect(r.campoVigencia).toHaveClass(/mat-form-field-invalid/)
    })

    test("20 - início maior que o fim é bloqueado com alerta", async ({ ltcatReferenciasPage: r, toast }) => {
      await r.vigenciaFim.click()
      await r.vigenciaFim.pressSequentially("01012026")
      await r.vigenciaInicio.click()
      await r.vigenciaInicio.pressSequentially("31122026")
      await r.vigenciaInicio.press("Tab")
      await toast.temTexto(/data de fim não pode ser menor|data de início não pode ser maior/)
      await expect(r.campoVigencia).toHaveClass(/mat-form-field-invalid/)
    })

    for (const { titulo, campo } of [
      { titulo: "21 - só a data de início: salvar é bloqueado", campo: "vigenciaInicio" as const },
      { titulo: "22 - só a data de fim: salvar é bloqueado", campo: "vigenciaFim" as const },
    ]) {
      test(titulo, async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page }) => {
        await cadastro.preencherObrigatorios()
        await cadastro.preencherConfiguracoesObrigatorias()
        await r.vigenciaInicio.fill("")
        await r.vigenciaFim.fill("")
        await r[campo].click()
        await r[campo].pressSequentially("01012026")
        await r[campo].press("Tab")
        await cadastro.salvar()
        await toast.temTexto(MSG_OBRIGATORIOS)
        await expect(r.campoVigencia).toHaveClass(/mat-form-field-invalid/)
        await expect(page).not.toHaveURL(/idkey=/)
      })
    }

    test("23 - data inválida 32/13/2026 é recusada com alerta e campo em vermelho", async ({ ltcatReferenciasPage: r, toast }) => {
      await r.vigenciaInicio.pressSequentially("32132026")
      await r.vigenciaInicio.press("Tab")
      await toast.temTexto(MSG_DATA_INVALIDA)
      await expect(r.campoVigencia).toHaveClass(/mat-form-field-invalid/)
    })

    test("24 - aceita só números (letras e espaços são ignorados)", async ({ ltcatReferenciasPage: r }) => {
      await r.vigenciaInicio.pressSequentially("ab 01 cd 01 2026")
      await expect(r.vigenciaInicio).toHaveValue("01/01/2026")
    })

    test("25 - seleciona início e fim pelo calendário", async ({ ltcatReferenciasPage: r, page }) => {
      const hoje = new Date()
      await r.botaoCalendarioVigencia.click()
      const dia = (n: number) => page.locator("mat-calendar .mat-calendar-body-cell-content").getByText(String(n), { exact: true })
      await dia(1).click()
      await dia(15).click()
      await expect(r.vigenciaInicio).toHaveValue(formatar(new Date(hoje.getFullYear(), hoje.getMonth(), 1)))
      await expect(r.vigenciaFim).toHaveValue(formatar(new Date(hoje.getFullYear(), hoje.getMonth(), 15)))
    })

    test("26 - seleciona o período pelo teclado no calendário", async ({ ltcatReferenciasPage: r, page }) => {
      const hoje = new Date()
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 2)
      await r.botaoCalendarioVigencia.click()
      await expect(page.locator("mat-calendar")).toBeVisible()
      await page.keyboard.press("Enter")
      await page.keyboard.press("ArrowRight")
      await page.keyboard.press("ArrowRight")
      await page.keyboard.press("Enter")
      await expect(r.vigenciaInicio).toHaveValue(formatar(hoje))
      await expect(r.vigenciaFim).toHaveValue(formatar(fim))
    })
  })

  test.describe("Checkboxes", () => {
    for (const opcao of SEMPRE_HABILITADAS) {
      test(`27 - começa desmarcado e marca/desmarca: ${opcao}`, async ({ ltcatReferenciasPage: r }) => {
        const input = r.opcao(opcao).locator("input")
        await expect(input).not.toBeChecked()
        await expect(input).toBeEnabled()
        await r.alternarOpcao(opcao)
        await expect(input).toBeChecked()
        await r.alternarOpcao(opcao)
        await expect(input).not.toBeChecked()
      })
    }

    test("28 - vários marcados funcionam de forma independente", async ({ ltcatReferenciasPage: r }) => {
      for (const opcao of SEMPRE_HABILITADAS) await r.alternarOpcao(opcao)
      await r.alternarOpcao("Incluir logotipo no cabeçalho de todas as páginas")
      for (const opcao of SEMPRE_HABILITADAS) {
        const marcado = opcao !== "Incluir logotipo no cabeçalho de todas as páginas"
        await expect(r.opcao(opcao).locator("input")).toBeChecked({ checked: marcado })
      }
    })

    test("29 - cliques rápidos repetidos mantêm o estado consistente", async ({ ltcatReferenciasPage: r }) => {
      const label = r.opcao("Incluir logotipo na capa").locator("label")
      for (let i = 0; i < 5; i++) await label.click({ delay: 0 })
      await expect(r.opcao("Incluir logotipo na capa").locator("input")).toBeChecked()
    })

    // o fundo fica transparente nos dois estados; marcado, a borda e o check vão para a cor primária do tema
    test("30 - marcado usa a cor primária do tema na borda e no check", async ({ ltcatReferenciasPage: r, page }) => {
      const cb = r.opcao("Incluir logotipo na capa")
      const cores = () => cb.evaluate((e) => ({
        borda: getComputedStyle(e.querySelector(".mat-checkbox-frame")!).borderColor,
        check: getComputedStyle(e.querySelector(".mat-checkbox-checkmark-path")!).stroke,
      }))
      const primaria = await page.evaluate(() => {
        const hex = getComputedStyle(document.documentElement).getPropertyValue("--apls-default-primary-color").trim().slice(1)
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
        return `rgb(${r}, ${g}, ${b})`
      })
      expect((await cores()).borda).not.toBe(primaria)

      await r.alternarOpcao("Incluir logotipo na capa")
      await expect.poll(cores).toEqual({ borda: primaria, check: primaria })
    })

    // EF: o checkbox não depende do campo ART, só gera o título do anexo no laudo
    test("31 - anexo de ART marcado não torna o campo ART obrigatório", async ({ ltcatReferenciasPage: r }) => {
      await r.alternarOpcao("Incluir anexo de Anotação de Responsabilidade Técnica (ART)")
      await expect(r.art).toHaveAttribute("aria-required", "false")
      await expect(r.art).toHaveValue("")
    })

    test("32 - histórico de revisões vem desmarcado e bloqueado sem revisão, com help", async ({ ltcatReferenciasPage: r, idioma }) => {
      await expect(r.opcao(HISTORICO).locator("input")).not.toBeChecked()
      await expect(r.opcao(HISTORICO).locator("input")).toBeDisabled()
      await expect(await idioma.textoDoHelp(r.opcao(HISTORICO).locator("apls-icon"))).toHaveText(HELP_HISTORICO)
    })

    test.describe("com uma revisão incluída", () => {
      test.beforeEach(async ({ ltcatHistoricoRevisoesModal: modal, page }) => {
        await modal.abrir()
        await modal.preencher({ versao: "1", motivo: "Motivo 1", responsavel: /211\.576\.325-48/ })
        await modal.botaoIncluirNaTabela.click()
        await expect(modal.linhas).toHaveCount(1)
        await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
        await modal.botaoSalvar.click()
        await expect(modal.titulo).toBeHidden()
      })

      test("33 - histórico habilita e pode ser marcado", async ({ ltcatReferenciasPage: r }) => {
        const input = r.opcao(HISTORICO).locator("input")
        await expect(input).toBeEnabled()
        await r.alternarOpcao(HISTORICO)
        await expect(input).toBeChecked()
      })

      test("34 - marcado, ao remover todas as revisões e salvar a modal, volta desmarcado e bloqueado", async ({ ltcatReferenciasPage: r, ltcatHistoricoRevisoesModal: modal, page }) => {
        const input = r.opcao(HISTORICO).locator("input")
        await r.alternarOpcao(HISTORICO)
        await expect(input).toBeChecked()

        await modal.abrir()
        await modal.botaoDaLinha(0, "Excluir").click()
        await modal.confirmacao("Deseja realmente excluir este item?").getByRole("button", { name: "Excluir" }).click()
        await expect(modal.linhas).toHaveCount(0)
        await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
        await modal.botaoSalvar.click()
        await expect(modal.titulo).toBeHidden()

        await expect(input).not.toBeChecked()
        await expect(input).toBeDisabled()
      })
    })
  })

  test("35 - refresh sem salvar perde as alterações", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await r.vigenciaInicio.pressSequentially("01012026")
    await r.alternarOpcao("Incluir logotipo na capa")
    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(r.modeloDocumento).toHaveValue("")
    await expect(r.vigenciaInicio).toHaveValue("")
    await expect(r.opcao("Incluir logotipo na capa").locator("input")).not.toBeChecked()
  })

  // o "Gerar laudo" não devolve download direto (testado 4 min sem arquivo); falta saber por onde o
  // documento chega para conferir o conteúdo
  test.fixme("36 - laudo inclui o histórico de revisões quando marcado e não inclui quando desmarcado", async () => {})
  test.fixme("37 - laudo reflete logotipo na capa, logotipo no cabeçalho, anexo de ART e data na capa", async () => {})
  test.fixme("38 - laudo com nenhum checkbox marcado sai sem os elementos opcionais", async () => {})
  // comparação com o mockup é visual/manual
  test.fixme("39 - seção segue o mockup da documentação", async () => {})

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("40 - salva tudo, recarrega, edita, descarta uma edição e persiste a outra", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, ltcatHistoricoRevisoesModal: modal, page }) => {
    test.setTimeout(240000)
    await cadastro.preencherObrigatorios({ ...ltcatValido, vigenciaInicio: "01/01/2026", vigenciaFim: "31/12/2026" })
    await cadastro.preencherConfiguracoesObrigatorias()
    await modal.abrir()
    await modal.preencher({ versao: "1", motivo: "Motivo 1", responsavel: /211\.576\.325-48/ })
    await modal.botaoIncluirNaTabela.click()
    await page.locator("apls-toast").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {})
    await modal.botaoSalvar.click()
    await expect(modal.titulo).toBeHidden()
    for (const opcao of [...SEMPRE_HABILITADAS, HISTORICO]) await r.alternarOpcao(opcao)

    const inicio = Date.now()
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    expect(Date.now() - inicio).toBeLessThan(15000)
    await expect(page).toHaveURL(/idkey=\d+/)

    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(r.modeloDocumento).toHaveValue(MODELO)
    await expect(r.vigenciaInicio).toHaveValue("01/01/2026")
    await expect(r.vigenciaFim).toHaveValue("31/12/2026")
    for (const opcao of [...SEMPRE_HABILITADAS, HISTORICO]) await expect(r.opcao(opcao).locator("input")).toBeChecked()

    // edição descartada: muda e recarrega sem salvar
    await r.vigenciaFim.fill("")
    await r.vigenciaFim.pressSequentially("30062026")
    await r.alternarOpcao("Incluir logotipo na capa")
    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(r.vigenciaFim).toHaveValue("31/12/2026")
    await expect(r.opcao("Incluir logotipo na capa").locator("input")).toBeChecked()

    // edição salva
    await r.vigenciaFim.fill("")
    await r.vigenciaFim.pressSequentially("30062026")
    await r.vigenciaFim.press("Tab")
    await r.alternarOpcao("Incluir logotipo na capa")
    await r.alternarOpcao("Incluir data de realização na capa do laudo")
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(r.vigenciaFim).toHaveValue("30/06/2026")
    await expect(r.opcao("Incluir logotipo na capa").locator("input")).not.toBeChecked()
    await expect(r.opcao("Incluir data de realização na capa do laudo").locator("input")).not.toBeChecked()
    await expect(r.opcao("Incluir logotipo no cabeçalho de todas as páginas").locator("input")).toBeChecked()
    await expect(r.opcao(HISTORICO).locator("input")).toBeChecked()
  })
})
