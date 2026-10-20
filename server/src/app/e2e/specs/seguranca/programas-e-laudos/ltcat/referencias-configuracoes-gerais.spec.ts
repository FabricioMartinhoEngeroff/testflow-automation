// EF LTCAT > 5.1 Referências > Configurações Gerais: Modelo de documento, Vigência do laudo e os
// checkboxes do documento. Em Curitiba o catálogo tem 10 modelos (conferido em 2026-10-20), então nenhum
// vem selecionado sozinho; a regra "uma única opção vem selecionada" precisa de uma Região com 1 modelo.
import type { Locator, Page } from "@playwright/test"
import { test, expect } from "../../../../../support"
import type { OpcaoReferencias } from "../../../../../support/actions/seguranca/programas-e-laudos/ltcat/LTCATReferencias"
import { ltcatValido } from "../../../../../support/data/ltcat"

const MODELO = "1233 - joao"
const OUTRO_MODELO = "00001 - ATA edição"
const MODELO_ABRANGENCIA = "QA-AUT-57265"
const MODELO_INATIVO = "QAutomação inativo"
const MODELO_SEM_LTCAT = "QAutomação SEM LTCAT"
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

// o catálogo do modelo carrega em etapas (aparecem primeiro os corporativos): espera a lista parar de mudar
async function opcoesEstaveis(page: Page) {
  let anterior = ""
  await expect.poll(async () => {
    const atual = (await page.getByRole("option").allInnerTexts()).map((t) => t.trim()).join("|")
    const estavel = atual === anterior && !/^$|Nenhum registro/.test(atual)
    anterior = atual
    return estavel
  }, { intervals: [700] }).toBe(true)
  return (await page.getByRole("option").allInnerTexts()).map((t) => t.trim())
}

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
    // EF abrangência: sem Região só entram os modelos com "Modelo corporativo" marcado
    test("05 - habilitado, vazio e só com modelos corporativos enquanto não há Região", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      await expect(r.modeloDocumento).toBeEnabled()
      await expect(r.modeloDocumento).toHaveValue("")
      await r.modeloDocumento.click()
      const semRegiao = await opcoesEstaveis(page)
      await page.keyboard.press("Escape")
      expect(semRegiao).not.toContain(MODELO)

      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await r.modeloDocumento.click()
      const comRegiao = await opcoesEstaveis(page)
      expect(comRegiao).toContain(MODELO)
      for (const corporativo of semRegiao) expect(comRegiao).toContain(corporativo)
    })

    test("06 - com várias opções no catálogo, nenhuma vem selecionada ao escolher a Região", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await expect(r.modeloDocumento).toHaveValue("")
      await r.modeloDocumento.click()
      expect(await page.getByRole("option").count()).toBeGreaterThan(1)
      await page.keyboard.press("Escape")
    })

    test("06b - catálogo de Curitiba sem repetir modelo, com e sem Unidade", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      const opcoes = async () => {
        await r.modeloDocumento.click()
        const lista = await opcoesEstaveis(page)
        await page.keyboard.press("Escape")
        return lista
      }
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      const soH1 = await opcoes()
      expect(new Set(soH1).size).toBe(soH1.length)
      await cadastro.selecionarOpcao(cadastro.unidade, /711001/)
      const comH2 = await opcoes()
      expect(new Set(comH2).size).toBe(comH2.length)
    })

    // QA-AUT-57265 (não mexer): LTCAT, não corporativo, abrangência 70/7003 e 71/711005
    test.describe("abrangência (modelo QA-AUT-57265)", () => {
      const modeloAbrangencia = (opcoes: string[]) => opcoes.some((o) => o.startsWith(MODELO_ABRANGENCIA))
      const listaCom = async (page: Page, r: { modeloDocumento: import("@playwright/test").Locator }) => {
        await r.modeloDocumento.click()
        const lista = await opcoesEstaveis(page)
        await page.keyboard.press("Escape")
        return lista
      }

      test("06c - Argentina com a Unidade 7003 traz o modelo", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
        await cadastro.selecionarOpcao(cadastro.regiao, /70 - /)
        await cadastro.selecionarOpcao(cadastro.unidade, /7003/)
        expect(modeloAbrangencia(await listaCom(page, r))).toBe(true)
      })

      test("06d - Curitiba com a Unidade 711005 traz o modelo", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
        await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
        await cadastro.selecionarOpcao(cadastro.unidade, /711005/)
        expect(modeloAbrangencia(await listaCom(page, r))).toBe(true)
      })

      // POSSÍVEL BUG: em 2026-10-20 o modelo (abrangência só 711005) aparece em Curitiba com a Unidade 711001. Pela EF (mesma H1 + mesma H2) não deveria listar.
      test.fail("06e - Curitiba com a Unidade 711001 não traz o modelo da 711005", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
        await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
        await cadastro.selecionarOpcao(cadastro.unidade, /711001/)
        expect(modeloAbrangencia(await listaCom(page, r))).toBe(false)
      })
    })

    test("07 - opções no formato 'código - descrição' em ordem crescente de código", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await r.modeloDocumento.click()
      await r.modeloDocumento.selectText()
      await r.modeloDocumento.press("Backspace")
      const opcoes = await opcoesEstaveis(page)
      // o código pode ter espaço ("0teste fa - teste fa")
      for (const opcao of opcoes) expect(opcao).toMatch(/^.+ - .+$/)
      expect(opcoes.length).toBeGreaterThan(1)
      const codigos = opcoes.map((o) => o.split(" - ")[0])
      // ordem textual do código ("0006" antes de "0teste fa" e de "1233"), não numérica (visto em 2026-10-20)
      expect(codigos).toEqual([...codigos].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)))
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
        await expect(page.getByRole("option", { name: MODELO })).toBeVisible()
        for (const opcao of await page.getByRole("option").allInnerTexts()) expect(opcao.toLowerCase()).toContain(termo)
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

    test("12 - troca de modelo já selecionado por outro", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r }) => {
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await r.selecionarOpcao(r.modeloDocumento, MODELO)
      await expect(r.modeloDocumento).toHaveValue(MODELO)
      await r.selecionarOpcao(r.modeloDocumento, OUTRO_MODELO)
      await expect(r.modeloDocumento).toHaveValue(OUTRO_MODELO)
    })

    // modelos de teste (não mexer), ambos corporativos: MODELO_INATIVO (LTCAT, status inativo) e MODELO_SEM_LTCAT (ativo, sem a flag LTCAT)
    test("13 - lista só modelos ativos e com a flag LTCAT", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      await r.modeloDocumento.click()
      const semRegiao = await opcoesEstaveis(page)
      await page.keyboard.press("Escape")
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await cadastro.selecionarOpcao(cadastro.unidade, /711005/)
      await r.modeloDocumento.click()
      const comUnidade = await opcoesEstaveis(page)
      await page.keyboard.press("Escape")
      for (const lista of [semRegiao, comUnidade]) {
        expect(lista.some((o) => o.startsWith(MODELO_INATIVO))).toBe(false)
        expect(lista.some((o) => o.startsWith(MODELO_SEM_LTCAT))).toBe(false)
      }
      expect(comUnidade.some((o) => o.startsWith(MODELO_ABRANGENCIA))).toBe(true)
    })

    // sempre sobram os modelos corporativos ativos com LTCAT (0teste fa, 1teste fa1), então não há como ficar sem opção
    test.fixme("14 - sem nenhum modelo compatível, campo fica vazio com mensagem", async () => {})
    // 15 e 36-38 ficam para a suíte de gerar laudo (o arquivo precisa ser conferido)
    test.fixme("15 - edição do cadastro do modelo aparece no LTCAT e o laudo gera", async () => {})
    test.fixme("16 - modelo excluído: campo em branco, obrigatório e laudo gera sem erro", async () => {})
  })

  test.describe("Vigência do laudo", () => {
    test("17 - em branco por padrão e obrigatória", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.vigenciaInicio).toHaveValue("")
      await expect(r.vigenciaFim).toHaveValue("")
      await expect(r.campoVigencia.locator(".mat-form-field-required-marker")).toBeVisible()
    })

    test("17b - salvar com a vigência em branco é bloqueado com a mensagem de obrigatório", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page }) => {
      await cadastro.preencherObrigatorios({ ...ltcatValido, vigenciaInicio: "", vigenciaFim: "" })
      await cadastro.preencherConfiguracoesObrigatorias()
      await cadastro.salvar()
      await toast.temTexto(MSG_OBRIGATORIOS)
      await expect(r.campoVigencia).toHaveClass(/mat-form-field-invalid/)
      await expect(page).not.toHaveURL(/idkey=/)
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

    test("24b - aceita no máximo 8 dígitos (dd/mm/aaaa)", async ({ ltcatReferenciasPage: r }) => {
      await r.vigenciaInicio.pressSequentially("010120261234")
      await expect(r.vigenciaInicio).toHaveValue("01/01/2026")
    })

    test("24c - permite colar a data", async ({ ltcatReferenciasPage: r, context, page }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"])
      await page.evaluate(() => navigator.clipboard.writeText("01012026"))
      await r.vigenciaInicio.click()
      await page.keyboard.press("Control+V")
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
    for (const opcao of SEMPRE_HABILITADAS) test(`30 - marcado usa a cor primária do tema na borda e no check: ${opcao}`, async ({ ltcatReferenciasPage: r, page }) => {
      const cb = r.opcao(opcao)
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

      await r.alternarOpcao(opcao)
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

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("40b - salvar sem marcar nenhum checkbox mantém todos desmarcados ao reabrir", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await cadastro.preencherObrigatorios({ ...ltcatValido, vigenciaInicio: "01/01/2026", vigenciaFim: "31/12/2026" })
    await cadastro.preencherConfiguracoesObrigatorias()
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await page.reload()
    await cadastro.titulo.waitFor()
    for (const opcao of [...SEMPRE_HABILITADAS, HISTORICO]) await expect(r.opcao(opcao).locator("input")).not.toBeChecked()
  })

  test("40 - salva tudo, recarrega, edita, descarta uma edição e persiste a outra", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, ltcatHistoricoRevisoesModal: modal, page }) => {
    test.setTimeout(240000)
    await cadastro.preencherObrigatorios({ ...ltcatValido, vigenciaInicio: "01/01/2026", vigenciaFim: "31/12/2026" })
    await cadastro.preencherConfiguracoesObrigatorias()
    const modeloEscolhido = await r.modeloDocumento.inputValue()
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
    await expect(r.modeloDocumento).toHaveValue(modeloEscolhido)
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

  // os 3 campos usam o mesmo componente: type="text", maxlength=10; o que não é dígito é descartado na digitação
  // e na colagem (sem mensagem de erro) e "00010" vira "10"
  test.describe("Expostos", () => {
    const CAMPOS = [
      { nome: "Mulheres", campo: "expostosMulheres" as const, help: "Informe a quantidade de mulheres expostas neste LTCAT" },
      { nome: "Homens", campo: "expostosHomens" as const, help: "Informe a quantidade de homens expostos neste LTCAT" },
      { nome: "PCDs", campo: "expostosPcds" as const, help: "Informe a quantidade pessoas com deficiência expostas neste LTCAT" },
    ]
    const ENTRADAS: [string, string, string][] = [
      ["inteiro válido", "10", "10"],
      ["zero", "0", "0"],
      ["10 dígitos", "9999999999", "9999999999"],
      ["mais de 10 dígitos é limitado a 10", "123456789012345", "1234567890"],
      ["negativo: o '-' é descartado", "-5", "5"],
      ["decimal: o '.' é descartado e os dígitos se juntam", "10.5", "105"],
      ["letras", "abc", ""],
      ["caracteres especiais", "@#%", ""],
      ["números e letras", "10abc", "10"],
      ["zeros à esquerda são normalizados", "00010", "10"],
      ["só espaços", "   ", ""],
      ["espaços ao redor", " 10 ", "10"],
    ]
    const formField = (campo: Locator) => campo.locator("xpath=ancestor::mat-form-field[1]")

    for (const { nome, campo, help } of CAMPOS) {
      test.describe(nome, () => {
        test(`41 - ${nome}: visível, habilitado, vazio e não obrigatório`, async ({ ltcatReferenciasPage: r }) => {
          await expect(r[campo]).toBeVisible()
          await expect(r[campo]).toBeEnabled()
          await expect(r[campo]).toHaveValue("")
          await expect(formField(r[campo]).locator(".mat-form-field-required-marker")).toHaveCount(0)
        })

        for (const [titulo, digitado, esperado] of ENTRADAS) {
          test(`42 - ${nome}: digitar ${titulo} (${JSON.stringify(digitado)})`, async ({ ltcatReferenciasPage: r }) => {
            await r[campo].pressSequentially(digitado)
            await expect(r[campo]).toHaveValue(esperado)
          })
        }

        for (const colado of ["123456789012345", "abc", "10abc", " 10 "]) {
          test(`43 - ${nome}: colar ${JSON.stringify(colado)}`, async ({ ltcatReferenciasPage: r, context, page }) => {
            await context.grantPermissions(["clipboard-read", "clipboard-write"])
            await page.evaluate((t) => navigator.clipboard.writeText(t), colado)
            await r[campo].click()
            await page.keyboard.press("Control+V")
            await expect(r[campo]).toHaveValue(colado.replace(/\D/g, "").slice(0, 10))
          })
        }

        test(`44 - ${nome}: digitação rápida de valores inválidos não trava o campo`, async ({ ltcatReferenciasPage: r }) => {
          await r[campo].pressSequentially("a1-b2.c3@d4#e5 f6g7h8i9j0k1l2", { delay: 0 })
          await expect(r[campo]).toHaveValue("1234567890")
          await expect(r[campo]).toBeEnabled()
        })

        test(`45 - ${nome}: limpar depois de preencher volta para vazio`, async ({ ltcatReferenciasPage: r }) => {
          await r[campo].pressSequentially("25")
          await r[campo].fill("")
          await expect(r[campo]).toHaveValue("")
        })

        test(`46 - ${nome}: help`, async ({ ltcatReferenciasPage: r, idioma }) => {
          await expect(await idioma.textoDoHelp(formField(r[campo]).locator("apls-icon"))).toHaveText(help)
        })

        test(`47 - ${nome}: foco ao clicar e valor independente dos outros campos`, async ({ ltcatReferenciasPage: r }) => {
          await r[campo].click()
          await expect(r[campo]).toBeFocused()
          await r[campo].pressSequentially("3")
          await r.avaliacaoRealizadaEm.fill("outro campo")
          await expect(r[campo]).toHaveValue("3")
        })
      })
    }

    // POSSÍVEL ERRO DE TEXTO (EF e tela): "quantidade pessoas com deficiência" sem o "de"; a planilha pede "quantidade de pessoas"
    test.fail("46b - PCDs: help com a ortografia 'quantidade de pessoas'", async ({ ltcatReferenciasPage: r, idioma }) => {
      const icone = formField(r.expostosPcds).locator("apls-icon")
      await expect(await idioma.textoDoHelp(icone)).toHaveText("Informe a quantidade de pessoas com deficiência expostas neste LTCAT")
    })

    test("48 - TAB percorre Mulheres, Homens e PCDs nessa ordem", async ({ ltcatReferenciasPage: r }) => {
      await r.expostosMulheres.click()
      await r.expostosMulheres.press("Tab")
      await expect(r.expostosHomens).toBeFocused()
      await r.expostosHomens.press("Tab")
      await expect(r.expostosPcds).toBeFocused()
    })

    test("49 - três campos alinhados com a mesma altura; em resolução reduzida continuam visíveis", async ({ ltcatReferenciasPage: r, page }) => {
      const caixas = []
      for (const { campo } of CAMPOS) caixas.push((await formField(r[campo]).locator(".mat-form-field-flex").boundingBox())!)
      expect(new Set(caixas.map((c) => c.y)).size).toBe(1)
      expect(new Set(caixas.map((c) => c.height)).size).toBe(1)
      await page.setViewportSize({ width: 768, height: 900 })
      for (const { campo } of CAMPOS) await expect(r[campo]).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })

    test("50 - preencher os três, limpar um mantendo os outros e valores discrepantes", async ({ ltcatReferenciasPage: r }) => {
      await r.expostosMulheres.pressSequentially("10")
      await r.expostosHomens.pressSequentially("15")
      await r.expostosPcds.pressSequentially("5")
      await expect(r.expostosMulheres).toHaveValue("10")
      await expect(r.expostosHomens).toHaveValue("15")
      await expect(r.expostosPcds).toHaveValue("5")
      await r.expostosHomens.fill("")
      await r.expostosPcds.fill("")
      await expect(r.expostosMulheres).toHaveValue("10")
      await r.expostosHomens.pressSequentially("1")
      await r.expostosMulheres.fill("")
      await r.expostosMulheres.pressSequentially("9999999999")
      await expect(r.expostosHomens).toHaveValue("1")
      await expect(r.expostosMulheres).toHaveValue("9999999999")
    })

    test("51 - salvar com os três vazios é permitido", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      await cadastro.preencherObrigatorios({ ...ltcatValido, vigenciaInicio: "01/01/2026", vigenciaFim: "31/12/2026" })
      await cadastro.preencherConfiguracoesObrigatorias()
      await cadastro.salvar()
      await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
      await expect(page).toHaveURL(/idkey=\d+/)
      await page.reload()
      await cadastro.titulo.waitFor()
      for (const { campo } of CAMPOS) await expect(r[campo]).toHaveValue("")
    })

    // BUG REAL (visto em 2026-10-20): o campo aceita 10 dígitos (EF), mas a API só aceita int (até 2147483647);
    // acima disso o POST /ltcat_ghe/ltcat responde 400 "Numeric value out of range of int" e a tela mostra
    // "Ocorreu um erro inesperado. Favor entrar em contato com o suporte."
    test.fail("51b - salvar com 9999999999 (10 dígitos, limite da EF) salva normalmente", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      await cadastro.preencherObrigatorios({ ...ltcatValido, vigenciaInicio: "01/01/2026", vigenciaFim: "31/12/2026" })
      await cadastro.preencherConfiguracoesObrigatorias()
      await r.expostosHomens.pressSequentially("9999999999")
      await cadastro.salvar()
      await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
      await expect(page).toHaveURL(/idkey=\d+/)
    })

    test("52 - salva (com 2147483647), reabre, edita, limpa um mantendo os outros e descarta edição sem salvar", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      test.setTimeout(240000)
      const recarregar = async () => {
        await page.reload()
        await cadastro.titulo.waitFor()
      }
      const salvar = async () => {
        await cadastro.salvar()
        await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
      }
      await cadastro.preencherObrigatorios({ ...ltcatValido, vigenciaInicio: "01/01/2026", vigenciaFim: "31/12/2026" })
      await cadastro.preencherConfiguracoesObrigatorias()
      await r.expostosMulheres.pressSequentially("10")
      await r.expostosHomens.pressSequentially("2147483647")
      await r.expostosPcds.pressSequentially("0")
      await salvar()
      await recarregar()
      await expect(r.expostosMulheres).toHaveValue("10")
      await expect(r.expostosHomens).toHaveValue("2147483647")
      await expect(r.expostosPcds).toHaveValue("0")

      await r.expostosMulheres.fill("")
      await r.expostosMulheres.pressSequentially("77")
      await recarregar()
      await expect(r.expostosMulheres).toHaveValue("10")

      await r.expostosMulheres.fill("")
      await r.expostosMulheres.pressSequentially("20")
      await r.expostosHomens.fill("")
      await salvar()
      await recarregar()
      await expect(r.expostosMulheres).toHaveValue("20")
      await expect(r.expostosHomens).toHaveValue("")
      await expect(r.expostosPcds).toHaveValue("0")

      await r.expostosPcds.fill("")
      await salvar()
      await recarregar()
      await expect(r.expostosPcds).toHaveValue("")
      await expect(r.expostosMulheres).toHaveValue("20")
    })

    // fora deste spec: duplicar LTCAT, laudo (suíte de gerar laudo), navegadores, dados antigos e mockup
    test.fixme("53 - duplicar um LTCAT copia os valores de Expostos", async () => {})
    test.fixme("54 - laudo reflete os valores de Expostos (inclusive 9999999999 sem quebrar o layout)", async () => {})
  })
})
