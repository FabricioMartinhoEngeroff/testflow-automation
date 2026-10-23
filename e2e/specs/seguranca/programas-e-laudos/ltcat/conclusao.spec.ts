// LTCAT > aba Conclusão (TST1337-TST1388): editor de texto rico (CKEditor), formatação, imagens e limite de 10MB.
// Sem salvar: LTCAT novo. Com salvar: LTCAT existente (LTCAT_IDKEY, padrão 145), que volta para CONCLUSAO_ORIGINAL no afterEach.
// TST1336 é só o título do bloco na planilha.
import type { Page } from "@playwright/test"
import { test, expect } from "@support"
import { URLS } from "@support/urls"
import { arquivoDeTeste } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"
import type { LtcatCadastroPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro"
import type { LtcatConclusaoPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATConclusao"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"
const URL_EXISTENTE = `${URLS.ltcatCadastro}?idkey=${IDKEY}`
const CONCLUSAO_ORIGINAL = process.env.CONCLUSAO_ORIGINAL ?? "<p>teste</p>"
const PLACEHOLDER =
  "Descreva a conclusão do LTCAT considerando riscos identificados, medidas de prevenção e recomendações de melhoria. Este capítulo será incluído no documento apenas se houver conteúdo preenchido neste campo."
const MSG_ACIMA_10MB = "O tamanho da conclusão não pode ultrapassar 10 MB. Favor verificar."
const VERMELHO = "rgb(220, 53, 69)"
const IMAGEM_GRANDE = arquivoDeTeste("imagem_5_15MiB.jpg") // 5,15 MiB → 6,87 MB no contador (base64)
const IMAGEM_GRANDE_2 = arquivoDeTeste("imagem_5_15MiB.png")

const abrirExistente = async (page: Page, c: LtcatCadastroPage, co: LtcatConclusaoPage) => {
  await page.goto(URL_EXISTENTE)
  await c.titulo.waitFor({ timeout: 60000 })
  await c.abrirAba("Conclusão")
  await expect(co.editor).toBeVisible({ timeout: 60000 })
}

const trocarAba = (c: LtcatCadastroPage) => (nome: "Referências" | "Conclusão") => c.abrirAba(nome)

const salvarEReabrir = async (page: Page, c: LtcatCadastroPage, co: LtcatConclusaoPage) => {
  await expect(c.botaoSalvar).toBeEnabled()
  await c.salvar()
  await expect(c.mensagemSalvoComSucesso).toBeVisible({ timeout: 60000 })
  await abrirExistente(page, c, co)
}

test.describe("LTCAT - Conclusão", () => {
  test.describe("Sem salvar (LTCAT novo)", () => {
    test.beforeEach(async ({ login, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await login.entrar()
      await c.abrir()
      await c.abrirAba("Conclusão")
      await expect(co.editor).toBeVisible()
    })

    test("TST1337 - aba Conclusão com o campo visível e habilitado", async ({ ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await expect(c.aba("Conclusão")).toHaveAttribute("aria-selected", "true")
      await expect(co.editor).toBeVisible()
      await expect(co.editor).toHaveAttribute("contenteditable", "true")
      await expect(co.barraDeFerramentas).toBeVisible()
    })

    test("TST1338 - placeholder completo", async ({ ltcatConclusaoPage: co }) => {
      await expect(co.placeholder).toHaveAttribute("data-placeholder", PLACEHOLDER)
    })

    test("TST1339 - campo vazio por padrão", async ({ ltcatConclusaoPage: co }) => {
      expect(await co.conteudo()).toBe("")
      await expect(co.contadorDeTamanho).toHaveText(/0\.00 MB de 10 MB/)
    })

    test("TST1343 - digitação de texto simples", async ({ ltcatConclusaoPage: co }) => {
      await co.digitar("Conclusão simples do laudo")
      expect(await co.conteudo()).toBe("<p>Conclusão simples do laudo</p>")
    })

    test("TST1348 - formatação negrito, itálico, sublinhado e tachado", async ({ page, ltcatConclusaoPage: co }) => {
      await co.editor.click()
      for (const [botao, texto] of [["Negrito", "N"], ["Itálico", "I"], ["Sublinhado", "S"], ["Tachado", "T"]] as const) {
        await co.ferramenta(botao).click()
        await co.editor.pressSequentially(texto)
        await co.ferramenta(botao).click() // desliga antes do próximo
      }
      const html = await co.conteudo()
      expect(html).toContain("<strong>N</strong>")
      expect(html).toContain("<i>I</i>")
      expect(html).toContain("<u>S</u>")
      expect(html).toContain("<s>T</s>")
      await expect(page.locator("apls-toast")).toHaveCount(0)
    })

    test("TST1351 - listas com marcadores e numerada", async ({ page, ltcatConclusaoPage: co }) => {
      await co.editor.click()
      await co.ferramenta("Lista com marcadores").click()
      await co.editor.pressSequentially("item a")
      await page.keyboard.press("Enter")
      await co.editor.pressSequentially("item b")
      await page.keyboard.press("Enter")
      await page.keyboard.press("Enter") // sai da lista
      await co.ferramenta("Lista numerada").click()
      await co.editor.pressSequentially("passo 1")
      const html = await co.conteudo()
      expect(html).toContain("<ul><li>item a</li><li>item b</li></ul>")
      expect(html).toContain("<ol><li>passo 1</li></ol>")
    })

    test("TST1352 - quebra de linha (Shift+Enter) mantém o parágrafo", async ({ page, ltcatConclusaoPage: co }) => {
      await co.digitar("linha 1")
      await page.keyboard.press("Shift+Enter")
      await co.editor.pressSequentially("linha 2")
      expect(await co.conteudo()).toBe("<p>linha 1<br>linha 2</p>")
    })

    test("TST1353 - vários parágrafos", async ({ page, ltcatConclusaoPage: co }) => {
      await co.digitar("Parágrafo 1")
      for (const n of [2, 3]) {
        await page.keyboard.press("Enter")
        await co.editor.pressSequentially(`Parágrafo ${n}`)
      }
      expect(await co.conteudo()).toBe("<p>Parágrafo 1</p><p>Parágrafo 2</p><p>Parágrafo 3</p>")
    })

    // o texto visível tem que ser igual ao digitado (o HTML guarda &, < e > escapados)
    const textos = [
      { id: "TST1354", caso: "caracteres especiais", texto: "!@#$%&*()-_=+[]{};:'\",.<>/?\\|~^°" },
      { id: "TST1355", caso: "acentos", texto: "Ação, coração, pé, avô, à, ü, ñ, Ç" },
      { id: "TST1359", caso: "caracteres incomuns", texto: "™ © ® ½ ∑ ≥ ≤ → ∞ µ ° 漢字 😀" },
    ]
    for (const t of textos) {
      test(`${t.id} - aceita ${t.caso}`, async ({ ltcatConclusaoPage: co }) => {
        await co.digitar(t.texto)
        await expect(co.areaEditavel).toHaveText(t.texto)
        expect(await co.conteudo()).toMatch(/^<p>.+<\/p>$/)
      })
    }

    test("TST1356 - colar texto do Word mantém a formatação básica", async ({ ltcatConclusaoPage: co }) => {
      await co.colarHtml(
        '<p class="MsoNormal"><b>Título negrito</b> e <i>itálico</i> e <u>sublinhado</u></p><ul><li>item 1</li><li>item 2</li></ul>',
        "Título negrito e itálico e sublinhado",
      )
      const html = await co.conteudo()
      expect(html).toContain("<strong>Título negrito</strong>")
      expect(html).toContain("<i>itálico</i>")
      expect(html).toContain("<u>sublinhado</u>")
      expect(html).toContain("<ul><li>item 1</li><li>item 2</li></ul>")
    })

    test("TST1357 - colar formatação pesada não quebra o layout", async ({ page, ltcatConclusaoPage: co }) => {
      const largura = (await co.areaEditavel.boundingBox())!.width
      await co.colarHtml(
        `<div style="width:3000px;font-size:48pt;color:red;background:yellow;font-family:Comic Sans MS"><h1>Título enorme</h1><p style="margin-left:900px">${"palavra ".repeat(300)}</p><table border="5"><tr><td>a</td><td>b</td></tr></table></div>`,
      )
      const html = await co.conteudo()
      expect(html).toContain("Título enorme")
      // estilos inline de cor/tamanho/fundo são descartados
      expect(html).not.toMatch(/color:\s*red|font-size:\s*48pt|background:\s*yellow/)
      expect(Math.abs((await co.areaEditavel.boundingBox())!.width - largura)).toBeLessThanOrEqual(2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })

    test("TST1358 - colar texto com link mantém o link", async ({ ltcatConclusaoPage: co }) => {
      await co.colarHtml('<p>Veja a <a href="https://www.gov.br/trabalho">NR-15</a> no site</p>', "Veja a NR-15 no site")
      const html = await co.conteudo()
      expect(html).toMatch(/<a [^>]*href="https:\/\/www\.gov\.br\/trabalho"[^>]*>NR-15<\/a>/)
    })

    test("TST1368 - inserir imagem e exibir", async ({ ltcatConclusaoPage: co }) => {
      await co.inserirImagem(arquivoDeTeste("foto_e.jpg"))
      await expect(co.imagens.first()).toBeVisible()
      expect(await co.imagens.first().evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      expect(await co.conteudo()).toContain('src="data:image/jpeg;base64,')
    })

    test("TST1370 - várias imagens somam no contador", async ({ ltcatConclusaoPage: co }) => {
      for (const arq of ["imagem.png", "foto_e.jpg", "foto_f.jpeg"]) await co.inserirImagem(arquivoDeTeste(arq))
      await expect(co.imagens).toHaveCount(3)
      expect(await co.megabytes()).toBeGreaterThan(0.3)
    })

    test("TST1371 - imagem muito grande conta no limite total", async ({ ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      test.setTimeout(180000)
      await co.inserirImagem(IMAGEM_GRANDE)
      expect(await co.megabytes()).toBeCloseTo(6.87, 1)
      await co.inserirImagem(IMAGEM_GRANDE_2)
      // conteúdo grande: o contador só atualiza quando o foco sai do editor
      await c.abrirAba("Referências")
      await c.abrirAba("Conclusão")
      expect(await co.megabytes()).toBeGreaterThan(10)
      expect(await co.contadorDeTamanho.evaluate((e) => getComputedStyle(e).color)).toBe(VERMELHO)
    })

    test("TST1366 - texto grande com imagens continua respondendo", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      test.setTimeout(180000)
      await co.definirConteudo(`<p>${"texto longo ".repeat(1500)}</p>`, trocarAba(c))
      for (const arq of ["imagem.png", "foto_e.jpg", "foto_f.jpeg"]) await co.inserirImagem(arquivoDeTeste(arq))
      const t = Date.now()
      await co.cursorNoFim()
      await co.editor.pressSequentially("fim")
      await expect(co.areaEditavel).toContainText("fim")
      expect(Date.now() - t, "digitar com o editor cheio").toBeLessThan(5000)
      await expect(co.imagens).toHaveCount(3)
      await expect(page.locator("apls-toast")).toHaveCount(0)
    })

    test("TST1374 - preencher e atualizar a página sem salvar perde o conteúdo", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await co.digitar("Não vai ficar")
      await page.reload()
      await c.titulo.waitFor()
      await c.abrirAba("Conclusão")
      await expect(co.editor).toBeVisible()
      expect(await co.conteudo()).toBe("")
    })

    // resoluções comuns de notebook (1536x864 = tela 1920x1080 com zoom de 125% do Windows)
    for (const tela of [
      { width: 1280, height: 720 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
    ]) {
      test(`TST1379 - editor cabe numa tela de notebook ${tela.width}x${tela.height}`, async ({ page, ltcatConclusaoPage: co }) => {
        await page.setViewportSize(tela)
        await expect(co.barraDeFerramentas).toBeInViewport({ ratio: 1 })
        await expect(co.ferramenta("Exibir mais itens")).toBeInViewport({ ratio: 1 })
        await expect(co.editor).toBeInViewport()
        await expect(co.contadorDeTamanho).toBeInViewport()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      })
    }

    test("TST1380 - padrão visual: fonte do documento e contador neutro", async ({ ltcatConclusaoPage: co }) => {
      // padrão do editor de documentos do Apollus: Arial 12pt (16px)
      const fonte = await co.areaEditavel.evaluate((e) => [getComputedStyle(e).fontFamily, getComputedStyle(e).fontSize])
      expect(fonte[0]).toMatch(/Arial/)
      expect(fonte[1]).toBe("16px")
      for (const nome of ["Desfazer", "Negrito", "Itálico", "Sublinhado", "Lista numerada", "Exibir mais itens"] as const) {
        await expect(co.ferramenta(nome)).toBeVisible()
      }
      expect(await co.contadorDeTamanho.evaluate((e) => getComputedStyle(e).color)).not.toBe(VERMELHO)
    })
  })

  test.describe("Salvando no LTCAT existente", () => {
    test.beforeEach(async ({ login, page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await login.entrar()
      await abrirExistente(page, c, co)
    })

    // devolve a conclusão do LTCAT existente ao valor conhecido, mesmo se o teste falhar
    test.afterEach(async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await abrirExistente(page, c, co)
      if ((await co.conteudo()) === CONCLUSAO_ORIGINAL) return
      await co.definirConteudo(CONCLUSAO_ORIGINAL, trocarAba(c))
      await c.salvar()
      await expect(c.mensagemSalvoComSucesso).toBeVisible({ timeout: 60000 })
    })

    test("TST1340/TST1341 - campo não é obrigatório: salva com a conclusão vazia", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await co.definirConteudo("", trocarAba(c))
      await salvarEReabrir(page, c, co)
      expect(await co.conteudo()).toBe("")
    })

    test("TST1344/TST1373 - texto preenchido persiste depois de salvar", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await co.definirConteudo("<p>Conclusão salva pelo teste</p>", trocarAba(c))
      await salvarEReabrir(page, c, co)
      expect(await co.conteudo()).toBe("<p>Conclusão salva pelo teste</p>")
    })

    test("TST1346/TST1376 - editar texto já salvo e salvar de novo", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await co.definirConteudo("<p>Primeira versão</p>", trocarAba(c))
      await salvarEReabrir(page, c, co)
      await co.definirConteudo("<p>Segunda versão</p>", trocarAba(c))
      await salvarEReabrir(page, c, co)
      expect(await co.conteudo()).toBe("<p>Segunda versão</p>")
    })

    test("TST1349 - formatação persiste depois de salvar e reabrir", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      const html = "<p><strong>negrito</strong> <i>itálico</i> <u>sublinhado</u> <s>tachado</s></p><ul><li>item</li></ul><ol><li>passo</li></ol>"
      await co.definirConteudo(html, trocarAba(c))
      await salvarEReabrir(page, c, co)
      expect(await co.conteudo()).toBe(html)
    })

    const tamanhos = [
      { id: "TST1360", caso: "texto pequeno", n: 1 },
      { id: "TST1361", caso: "texto médio (~5.000 caracteres)", n: 5000 },
      { id: "TST1362", caso: "texto de 15.000 caracteres", n: 15000 },
      { id: "TST1363", caso: "texto acima de 15.000 caracteres (20.000)", n: 20000 },
    ]
    for (const { id, caso, n } of tamanhos) {
      test(`${id} - ${caso} salva normalmente`, async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
        const texto = "a".repeat(n)
        await co.definirConteudo(`<p>${texto}</p>`, trocarAba(c))
        await salvarEReabrir(page, c, co)
        expect(await co.conteudo()).toBe(`<p>${texto}</p>`)
      })
    }

    test("TST1364/TST1367 - conteúdo até 10MB (texto + imagem) salva em tempo aceitável", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      test.setTimeout(240000)
      await co.definirConteudo(`<p>${"texto ".repeat(2000)}</p>`, trocarAba(c))
      await co.inserirImagem(IMAGEM_GRANDE)
      await c.abrirAba("Referências")
      await c.abrirAba("Conclusão")
      const mb = await co.megabytes()
      expect(mb).toBeGreaterThan(6)
      expect(mb).toBeLessThanOrEqual(10)
      const t = Date.now()
      await c.salvar()
      await expect(c.mensagemSalvoComSucesso).toBeVisible({ timeout: 60000 })
      expect(Date.now() - t, "salvar ~7MB").toBeLessThan(20000)
      await abrirExistente(page, c, co)
      await expect(co.imagens).toHaveCount(1)
    })

    test("TST1365 - acima de 10MB bloqueia o salvamento com aviso", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      test.setTimeout(240000)
      await co.inserirImagem(IMAGEM_GRANDE)
      await co.inserirImagem(IMAGEM_GRANDE_2)
      await c.abrirAba("Referências")
      await c.abrirAba("Conclusão")
      expect(await co.megabytes()).toBeGreaterThan(10)
      await c.salvar()
      await expect(page.locator("apls-toast").filter({ hasText: MSG_ACIMA_10MB }).first()).toBeVisible()
      await abrirExistente(page, c, co)
      expect(await co.conteudo()).toBe(CONCLUSAO_ORIGINAL)
    })

    test("TST1372 - remover imagem e salvar", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await co.inserirImagem(arquivoDeTeste("foto_e.jpg"))
      await c.abrirAba("Referências")
      await salvarEReabrir(page, c, co)
      await expect(co.imagens).toHaveCount(1)

      await co.imagens.first().click() // seleciona o widget da imagem
      await page.keyboard.press("Delete")
      await expect(co.imagens).toHaveCount(0)
      await c.abrirAba("Referências")
      await salvarEReabrir(page, c, co)
      await expect(co.imagens).toHaveCount(0)
    })

    test("TST1375 - salvar e reabrir o cadastro pela tela de pesquisa mantém o conteúdo", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await co.definirConteudo("<p>Reaberto pela pesquisa</p>", trocarAba(c))
      await c.salvar()
      await expect(c.mensagemSalvoComSucesso).toBeVisible({ timeout: 60000 })
      await page.goto(URLS.ltcat)
      await abrirExistente(page, c, co)
      expect(await co.conteudo()).toBe("<p>Reaberto pela pesquisa</p>")
    })

    test("TST1377 - alterar e não salvar descarta a alteração", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      await co.digitar(" alterado sem salvar")
      await page.reload()
      await c.titulo.waitFor()
      await c.abrirAba("Conclusão")
      await expect(co.editor).toBeVisible()
      expect(await co.conteudo()).toBe(CONCLUSAO_ORIGINAL)
    })

    test("TST1378 - salvar várias vezes seguidas não corrompe o conteúdo", async ({ page, ltcatCadastroPage: c, ltcatConclusaoPage: co }) => {
      test.setTimeout(180000)
      for (const n of [1, 2, 3]) {
        await co.definirConteudo(`<p>Versão ${n}</p>`, trocarAba(c))
        await c.salvar()
        await expect(c.mensagemSalvoComSucesso.first()).toBeVisible({ timeout: 60000 })
      }
      await abrirExistente(page, c, co)
      expect(await co.conteudo()).toBe("<p>Versão 3</p>")
    })
  })

  // o conteúdo do laudo gerado (docx/pdf via painel Relatórios) ainda não é lido pela automação
  test.describe("Laudo gerado", () => {
    for (const cenario of [
      "TST1342 - laudo sem preenchimento não tem o capítulo Conclusão",
      "TST1345 - laudo com conteúdo tem o capítulo Conclusão",
      "TST1347 - limpar e salvar remove o capítulo do laudo",
      "TST1350 - laudo reflete a formatação",
      "TST1369 - laudo exibe a imagem",
      "TST1381 - campo vazio: capítulo não exibido",
      "TST1382 - texto simples: capítulo exibido",
      "TST1383 - formatação refletida no laudo",
      "TST1384 - imagem refletida no laudo",
      "TST1385 - remover conteúdo: capítulo desaparece",
      "TST1386 - alterar conteúdo: laudo atualizado",
      "TST1387 - conteúdo grande renderizado no laudo",
    ]) {
      test.fixme(cenario, async () => {})
    }
  })

  // comparação com o mockup da documentação é visual/manual
  test.fixme("TST1388 - campo, placeholder, comportamento e layout conforme o mockup", async () => {})
})
