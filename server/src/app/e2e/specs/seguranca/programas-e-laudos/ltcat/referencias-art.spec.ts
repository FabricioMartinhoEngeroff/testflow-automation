// EF LTCAT > 5.1 Referências > ART: descritivo, até 30 caracteres, não obrigatório, aceita colar.
import { test, expect } from "../../../../../support"
import { ltcatValido } from "../../../../../support/data/ltcat"

const LTCAT_SALVO = "/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=154"
const TRINTA = "ART-2026/0001 Çãé #@!% abcdefg" // 30 caracteres

test.describe("LTCAT - Referências - ART", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  test("01 - visível, habilitado, vazio e não obrigatório", async ({ ltcatReferenciasPage: r }) => {
    await expect(r.art).toBeVisible()
    await expect(r.art).toBeEditable()
    await expect(r.art).toHaveValue("")
    await expect(r.art).toHaveAttribute("aria-required", "false")
  })

  const aceitos = [
    { titulo: "02 - aceita números", valor: "123456789" },
    { titulo: "03 - aceita letras e números", valor: "ART-2026-001" },
    { titulo: "04 - aceita caracteres especiais", valor: "#@!%&*()/" },
    { titulo: "05 - aceita acentos e caixa alta/baixa", valor: "Ação ÇÃO éÉ" },
    { titulo: "06 - aceita espaços no início e no fim", valor: "  ART 01  " },
    { titulo: "07 - aceita só espaços sem erro", valor: "     " },
  ]
  for (const { titulo, valor } of aceitos) {
    test(titulo, async ({ ltcatReferenciasPage: r, page }) => {
      await r.art.pressSequentially(valor)
      await expect(r.art).toHaveValue(valor)
      await expect(page.locator("apls-toast")).toHaveCount(0)
    })
  }

  test("08 - aceita exatamente 30 caracteres", async ({ ltcatReferenciasPage: r }) => {
    expect(TRINTA).toHaveLength(30)
    await r.art.pressSequentially(TRINTA)
    await expect(r.art).toHaveValue(TRINTA)
  })

  test("09 - digitando mais de 30, para no 30º caractere", async ({ ltcatReferenciasPage: r }) => {
    await r.art.pressSequentially(TRINTA + "EXCEDENTE")
    await expect(r.art).toHaveValue(TRINTA)
  })

  test("10 - colando mais de 30, trunca no 30º caractere", async ({ ltcatReferenciasPage: r, page }) => {
    await r.art.click()
    await page.keyboard.insertText(TRINTA + "EXCEDENTE")
    await expect(r.art).toHaveValue(TRINTA)
  })

  test("11 - apagar o conteúdo deixa o campo vazio", async ({ ltcatReferenciasPage: r }) => {
    await r.art.pressSequentially("ART-2026-001")
    await r.art.press("Control+A")
    await r.art.press("Backspace")
    await expect(r.art).toHaveValue("")
  })

  test("12 - várias edições seguidas mantêm só o último valor", async ({ ltcatReferenciasPage: r }) => {
    for (const valor of ["A1", "B22", "C333", "D4444", "ART-FINAL"]) {
      await r.art.fill("")
      await r.art.pressSequentially(valor)
    }
    await expect(r.art).toHaveValue("ART-FINAL")
  })

  test("13 - recebe foco ao clicar e pelo TAB", async ({ ltcatReferenciasPage: r, page }) => {
    await r.art.click()
    await expect(r.art).toBeFocused()

    // o campo anterior no DOM é o botão Adicionar da Equipe
    await r.botaoAdicionarEquipe.focus()
    for (let i = 0; i < 5 && !(await r.art.evaluate((e) => e === document.activeElement)); i++) {
      await page.keyboard.press("Tab")
    }
    await expect(r.art).toBeFocused()
  })

  test("14 - valor permanece ao trocar de aba e voltar", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r }) => {
    await r.art.pressSequentially("ART-2026-001")
    await cadastro.abrirAba("Configurações")
    await cadastro.abrirAba("Referências")
    await expect(r.art).toHaveValue("ART-2026-001")
  })

  test("15 - não altera os outros campos da aba", async ({ ltcatReferenciasPage: r }) => {
    await r.art.pressSequentially(TRINTA)
    await expect(r.responsavelTecnico).toHaveValue("")
    await expect(r.avaliacaoRealizadaEm).toHaveValue("")
    await expect(r.condicoesOperacionais).toHaveValue("")
    await expect(r.linhasEquipe).toHaveCount(0)
  })

  test("16 - texto no limite não quebra o layout", async ({ ltcatReferenciasPage: r, page }) => {
    const largura = (await r.art.boundingBox())!.width
    await r.art.pressSequentially("W".repeat(30))
    expect((await r.art.boundingBox())!.width).toBe(largura)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test("17 - sair sem salvar não guarda o valor", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await r.art.pressSequentially("ART-NAO-SALVO")
    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(r.art).toHaveValue("")
  })

  test("18 - LTCAT já salvo carrega o campo sem erro e editável", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await page.goto(LTCAT_SALVO)
    await cadastro.titulo.waitFor()
    await expect(r.art).toBeEditable()
    await expect(page.locator("apls-toast")).toHaveCount(0)
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("19 - salva vazio, depois com 30 caracteres, depois editado, e persiste após reload", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    test.setTimeout(150000)
    await cadastro.preencherObrigatorios(ltcatValido)
    await cadastro.preencherConfiguracoesObrigatorias()
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)
    await page.reload()
    await expect(r.art).toHaveValue("")

    await r.art.pressSequentially(TRINTA + "EXCEDENTE")
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await page.reload()
    await expect(r.art).toHaveValue(TRINTA)

    await r.art.fill("")
    await r.art.pressSequentially("ART-EDITADO-02")
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await page.reload()
    await expect(r.art).toHaveValue("ART-EDITADO-02")
  })
})
