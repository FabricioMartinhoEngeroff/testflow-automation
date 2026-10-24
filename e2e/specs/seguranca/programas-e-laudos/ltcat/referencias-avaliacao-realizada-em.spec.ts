// EF LTCAT > 5.1 Referências > "pass:":
// descritivo, obrigatório, até 50 caracteres, com help.
import { test, expect } from "@support"
import { ltcatValido } from "@support/data/ltcat"
import { tooltipDe } from "@support/utils/material"

const LABEL = "Avaliação das condições ambientais de trabalho foi realizada em:"
const HELP = "Descreva de forma objetiva a data ou período de avaliação. Exemplos: '05 de dezembro de 2018'; ou '18 de maio a 22 de maio de 2018'."
const MSG_OBRIGATORIOS = "Existem um ou mais campos obrigatórios que não foram preenchidos."
const CINQUENTA = "Avaliação de 18 a 22/05/2018 - Área ext. (setor A)" // 50 caracteres

test.describe("LTCAT - Referências - Avaliação realizada em", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  test.describe("Estado inicial e label", () => {
    test("TST799 - exibido em branco e habilitado no novo cadastro", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.avaliacaoRealizadaEm).toBeVisible()
      await expect(r.avaliacaoRealizadaEm).toBeEditable()
      await expect(r.avaliacaoRealizadaEm).toHaveValue("")
    })

    test("TST800 - é um campo descritivo (texto livre)", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.avaliacaoRealizadaEm).toHaveAttribute("type", "text")
      await expect(r.avaliacaoRealizadaEm).toHaveAttribute("maxlength", "50")
    })

    test("TST801 - label completo, sem cortes", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.labelAvaliacaoRealizadaEm.locator("mat-label")).toHaveText(LABEL)
      const cortado = await r.labelAvaliacaoRealizadaEm.evaluate((e) => e.scrollWidth > e.clientWidth)
      expect(cortado).toBe(false)
    })
  })

  test.describe("Help", () => {
    test("TST802/TST803 - texto do help igual ao da documentação", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.helpAvaliacaoRealizadaEm.locator("mat-icon")).toHaveText("help_outline")
      await expect(await tooltipDe(r.helpAvaliacaoRealizadaEm)).toHaveText(HELP)
    })

    test("TST805 - help abre como tooltip ao passar o mouse no ícone", async ({ ltcatReferenciasPage: r, page }) => {
      await r.helpAvaliacaoRealizadaEm.hover()
      await expect(page.locator("mat-tooltip-component")).toHaveText(HELP)
    })

    test("TST804 - em resolução reduzida o help fica inteiro dentro da tela", async ({ ltcatReferenciasPage: r, page }) => {
      await page.setViewportSize({ width: 768, height: 900 })
      await r.helpAvaliacaoRealizadaEm.hover()
      const tooltip = page.locator("mat-tooltip-component .mat-tooltip")
      await expect(tooltip).toHaveText(HELP)
      const box = (await tooltip.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(768)
    })
  })

  test.describe("Obrigatoriedade", () => {
    test("TST808 - label com asterisco e destaque vermelho ao sair do campo vazio", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.avaliacaoRealizadaEm).toHaveAttribute("aria-required", "true")
      await expect(r.labelAvaliacaoRealizadaEm.locator(".mat-form-field-required-marker")).toHaveText("*")

      await r.avaliacaoRealizadaEm.click()
      await r.avaliacaoRealizadaEm.press("Tab")
      await expect(r.campoAvaliacaoRealizadaEm).toHaveClass(/mat-form-field-invalid/)
    })

    test("TST806/TST807 - salvar sem preencher é bloqueado com a mensagem de obrigatório", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page }) => {
      await cadastro.preencherObrigatorios()
      await cadastro.preencherConfiguracoesObrigatorias()
      await r.avaliacaoRealizadaEm.fill("")
      await cadastro.salvar()

      await toast.temTexto(MSG_OBRIGATORIOS)
      await expect(r.campoAvaliacaoRealizadaEm).toHaveClass(/mat-form-field-invalid/)
      await expect(page).not.toHaveURL(/idkey=/)
    })
  })

  test.describe("Conteúdo aceito", () => {
    const aceitos = [
      { titulo: "TST809 - texto simples", valor: "Avaliação feita no período de inverno" },
      { titulo: "TST810 - data por extenso '05 de dezembro de 2018'", valor: "05 de dezembro de 2018" },
      { titulo: "TST811/TST812 - período '18 de maio a 22 de maio de 2018'", valor: "18 de maio a 22 de maio de 2018" },
      { titulo: "TST813/TST814 - caixa alta", valor: "AVALIAÇÃO REALIZADA EM MAIO DE 2025" },
      { titulo: "TST815 - caixa baixa", valor: "avaliação realizada em maio de 2025" },
      { titulo: "TST816 - caixa alta e baixa misturadas", valor: "AvAlIaÇãO em MaIo De 2025" },
      { titulo: "TST817/TST818 - caracteres especiais '05/12/2018 - Área externa (setor A)'", valor: "05/12/2018 - Área externa (setor A)" },
      { titulo: "TST819/TST820 - acentos e cedilha", valor: "Avaliação realizada na seção elétrica" },
      { titulo: "TST821 - espaços entre palavras", valor: "maio de 2025" },
      { titulo: "TST822 - múltiplos espaços consecutivos", valor: "maio    de     2025" },
      { titulo: "TST832/TST833 - só números e barras '05/12/2018'", valor: "05/12/2018" },
      { titulo: "TST834/TST835 - só caracteres especiais '---///***'", valor: "---///***" },
    ]
    for (const { titulo, valor } of aceitos) {
      test(titulo, async ({ ltcatReferenciasPage: r, toast }) => {
        await r.avaliacaoRealizadaEm.pressSequentially(valor)
        await expect(r.avaliacaoRealizadaEm).toHaveValue(valor)
        await expect(toast.mensagem).toHaveCount(0)
      })
    }

    test("TST823/TST824 - aceita colar 'Período de 01 a 05 de março de 2026'", async ({ ltcatReferenciasPage: r, page }) => {
      await r.avaliacaoRealizadaEm.click()
      await page.keyboard.insertText("Período de 01 a 05 de março de 2026")
      await expect(r.avaliacaoRealizadaEm).toHaveValue("Período de 01 a 05 de março de 2026")
    })

    // input de uma linha: o navegador troca as quebras por espaço
    test("TST825 - colar texto com quebra de linha vira uma linha só, sem quebrar o layout", async ({ ltcatReferenciasPage: r, page }) => {
      const altura = (await r.campoAvaliacaoRealizadaEm.boundingBox())!.height
      await r.avaliacaoRealizadaEm.click()
      await page.keyboard.insertText("linha 1\nlinha 2\r\nlinha 3")
      await expect(r.avaliacaoRealizadaEm).toHaveValue("linha 1 linha 2 linha 3")
      expect((await r.campoAvaliacaoRealizadaEm.boundingBox())!.height).toBe(altura)
    })
  })

  test.describe("Limite de 50 caracteres", () => {
    test("TST826/TST827 - aceita exatamente 50 caracteres", async ({ ltcatReferenciasPage: r }) => {
      expect(CINQUENTA).toHaveLength(50)
      await r.avaliacaoRealizadaEm.pressSequentially(CINQUENTA)
      await expect(r.avaliacaoRealizadaEm).toHaveValue(CINQUENTA)
    })

    test("TST828/TST829 - digitando o 51º caractere, ele é bloqueado", async ({ ltcatReferenciasPage: r }) => {
      await r.avaliacaoRealizadaEm.pressSequentially(CINQUENTA + "X")
      await expect(r.avaliacaoRealizadaEm).toHaveValue(CINQUENTA)
    })

    test("TST828 (colar) - colando mais de 50, trunca no 50º caractere", async ({ ltcatReferenciasPage: r, page }) => {
      await r.avaliacaoRealizadaEm.click()
      await page.keyboard.insertText(CINQUENTA + "EXCEDENTE")
      await expect(r.avaliacaoRealizadaEm).toHaveValue(CINQUENTA)
    })
  })

  test.describe("Edição e navegação", () => {
    test("TST830 - apagar parte do texto mantém o restante", async ({ ltcatReferenciasPage: r }) => {
      await r.avaliacaoRealizadaEm.pressSequentially("05 de dezembro de 2018")
      for (let i = 0; i < 8; i++) await r.avaliacaoRealizadaEm.press("Backspace")
      await expect(r.avaliacaoRealizadaEm).toHaveValue("05 de dezembro")
      await r.avaliacaoRealizadaEm.pressSequentially(" de 2019")
      await expect(r.avaliacaoRealizadaEm).toHaveValue("05 de dezembro de 2019")
    })

    test("TST831 - entra pelo TAB vindo do ART e sai pelo TAB", async ({ ltcatReferenciasPage: r, page }) => {
      await r.art.click()
      await page.keyboard.press("Tab")
      await expect(r.avaliacaoRealizadaEm).toBeFocused()
      await page.keyboard.type("maio de 2025")
      await page.keyboard.press("Home")
      await page.keyboard.press("Shift+End")
      await page.keyboard.press("Delete")
      await expect(r.avaliacaoRealizadaEm).toHaveValue("")
      await page.keyboard.type("junho de 2025")
      await page.keyboard.press("Tab")
      await expect(r.avaliacaoRealizadaEm).not.toBeFocused()
      await expect(r.avaliacaoRealizadaEm).toHaveValue("junho de 2025")
    })

    test("TST836 - refresh sem salvar volta o campo para branco", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
      await r.avaliacaoRealizadaEm.pressSequentially("05 de dezembro de 2018")
      await page.reload()
      await cadastro.titulo.waitFor()
      await expect(r.avaliacaoRealizadaEm).toHaveValue("")
    })

    test("TST842 - colar, apagar e editar rápido várias vezes mantém só o último valor", async ({ ltcatReferenciasPage: r, page }) => {
      await r.avaliacaoRealizadaEm.click()
      for (let i = 0; i < 5; i++) {
        await page.keyboard.insertText(`Período ${i} de março de 2026`)
        await r.avaliacaoRealizadaEm.press("Control+A")
        await r.avaliacaoRealizadaEm.press("Backspace")
        await r.avaliacaoRealizadaEm.pressSequentially(`maio ${i}`)
        await r.avaliacaoRealizadaEm.press("Backspace")
      }
      await r.avaliacaoRealizadaEm.pressSequentially("final")
      await expect(r.avaliacaoRealizadaEm).toHaveValue("maio final")
    })
  })

  test.describe("Layout", () => {
    test("TST843 - em resolução reduzida continua utilizável e sem rolagem horizontal", async ({ ltcatReferenciasPage: r, page }) => {
      await page.setViewportSize({ width: 768, height: 900 })
      await expect(r.avaliacaoRealizadaEm).toBeVisible()
      await r.avaliacaoRealizadaEm.pressSequentially(CINQUENTA)
      await expect(r.avaliacaoRealizadaEm).toHaveValue(CINQUENTA)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })

    test("TST844 - alinhado com ART e Condições operacionais, mesma largura", async ({ ltcatReferenciasPage: r }) => {
      const caixa = async (campo: typeof r.campoArt) => (await campo.boundingBox())!
      const art = await caixa(r.campoArt)
      const avaliacao = await caixa(r.campoAvaliacaoRealizadaEm)
      const condicoes = await caixa(r.campoCondicoesOperacionais)

      expect(avaliacao.x).toBe(art.x)
      expect(avaliacao.x).toBe(condicoes.x)
      expect(avaliacao.width).toBe(art.width)
      expect(avaliacao.y).toBeGreaterThan(art.y)
      expect(condicoes.y).toBeGreaterThan(avaliacao.y)
    })
  })

  // comparação com o mockup é visual/manual
  test.fixme("TST845 - implementação segue o mockup da documentação", async () => {})

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("TST837/TST838/TST839 - salva, persiste após reload e grava a edição", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    test.setTimeout(150000)
    await cadastro.preencherObrigatorios({ ...ltcatValido, avaliacaoRealizadaEm: "05 de dezembro de 2018" })
    await cadastro.preencherConfiguracoesObrigatorias()
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)
    await page.reload()
    await expect(r.avaliacaoRealizadaEm).toHaveValue("05 de dezembro de 2018")

    await r.avaliacaoRealizadaEm.fill("")
    await r.avaliacaoRealizadaEm.pressSequentially(CINQUENTA)
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await page.reload()
    await expect(r.avaliacaoRealizadaEm).toHaveValue(CINQUENTA)
  })
})

// Chamado #53056: help em ES/EN com erros de tradução e espaço antes da aspa.
test.describe("LTCAT - Referências - Avaliação realizada em (help em outros idiomas)", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  const idiomas = [
    {
      idioma: "es" as const,
      titulo: "TST802 (es) - help em espanhol com 'de' nos exemplos e sem espaço antes da aspa",
      esperado: "Describa objetivamente la fecha o período de evaluación. Ejemplos: '05 de diciembre de 2018'; o '18 de mayo al 22 de mayo de 2018'.",
    },
    {
      idioma: "en" as const,
      titulo: "TST802 (en) - help em inglês sem espaço antes da aspa",
      esperado: "Describe objectively the date or evaluation period. Examples: '05 December 2018'; or '18 May to 22 May 2018'.",
    },
  ]
  for (const { idioma, titulo, esperado } of idiomas) {
    // seletor pelo formcontrolname: o nome da aba muda com o idioma ("Referencias")
    test(titulo, async ({ idioma: i, page }) => {
      await i.trocar(idioma)
      const help = page.locator("apls-input[formcontrolname=avaliacaoCondicoesRealizadaEm] apls-icon")
      await expect(await i.textoDoHelp(help)).toHaveText(esperado)
    })
  }
})
