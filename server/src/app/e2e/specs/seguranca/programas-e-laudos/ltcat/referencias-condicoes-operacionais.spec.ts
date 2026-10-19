// EF LTCAT > 5.1 Referências > Condições Operacionais: descritivo, obrigatório, até 1000 caracteres, aceita colar.
import { test, expect } from "../../../../../support"
import { ltcatValido } from "../../../../../support/data/ltcat"

const MSG_OBRIGATORIOS = "Existem um ou mais campos obrigatórios que não foram preenchidos."
const MIL = "Condições operacionais: ".padEnd(1000, "x")

test.describe("LTCAT - Referências - Condições operacionais", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
  })

  test.describe("Estado inicial", () => {
    test("01 - exibido em branco e habilitado no novo cadastro", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.condicoesOperacionais).toBeVisible()
      await expect(r.condicoesOperacionais).toBeEditable()
      await expect(r.condicoesOperacionais).toHaveValue("")
    })

    test("02 - é um campo descritivo com limite de 1000 caracteres", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.condicoesOperacionais).toHaveJSProperty("tagName", "TEXTAREA")
      await expect(r.condicoesOperacionais).toHaveAttribute("maxlength", "1000")
    })
  })

  test.describe("Obrigatoriedade", () => {
    test("03 - label com asterisco e destaque vermelho ao sair do campo vazio", async ({ ltcatReferenciasPage: r }) => {
      await expect(r.condicoesOperacionais).toHaveAttribute("aria-required", "true")
      await expect(r.labelCondicoesOperacionais.locator(".mat-form-field-required-marker")).toHaveText("*")

      await r.condicoesOperacionais.click()
      await r.condicoesOperacionais.press("Tab")
      await expect(r.campoCondicoesOperacionais).toHaveClass(/mat-form-field-invalid/)
    })

    test("04 - salvar sem preencher é bloqueado com a mensagem de obrigatório", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast, page }) => {
      await cadastro.preencherObrigatorios()
      await cadastro.preencherConfiguracoesObrigatorias()
      await r.condicoesOperacionais.fill("")
      await cadastro.salvar()

      await toast.temTexto(MSG_OBRIGATORIOS)
      await expect(r.campoCondicoesOperacionais).toHaveClass(/mat-form-field-invalid/)
      await expect(page).not.toHaveURL(/idkey=/)
    })
  })

  test.describe("Conteúdo aceito", () => {
    const aceitos = [
      { titulo: "05 - letras e números", valor: "Turno 1 - jornada de 8h com 2 pausas" },
      { titulo: "06 - caracteres especiais", valor: "#@!%&*()/-_;:,.?" },
      { titulo: "07 - caixa alta", valor: "OPERAÇÃO CONTÍNUA EM REGIME DE TURNOS" },
      { titulo: "08 - caixa baixa", valor: "operação contínua em regime de turnos" },
      { titulo: "09 - acentos e cedilha", valor: "Área de produção, seção elétrica e manutenção" },
      { titulo: "10 - espaços entre palavras e consecutivos", valor: "linha   de    produção" },
    ]
    for (const { titulo, valor } of aceitos) {
      test(titulo, async ({ ltcatReferenciasPage: r, page }) => {
        await r.condicoesOperacionais.pressSequentially(valor)
        await expect(r.condicoesOperacionais).toHaveValue(valor)
        await expect(page.locator("apls-toast")).toHaveCount(0)
      })
    }

    test("11 - aceita colar texto, mantendo as quebras de linha", async ({ ltcatReferenciasPage: r, page }) => {
      await r.condicoesOperacionais.click()
      await page.keyboard.insertText("Turno A: 06h às 14h\nTurno B: 14h às 22h")
      await expect(r.condicoesOperacionais).toHaveValue("Turno A: 06h às 14h\nTurno B: 14h às 22h")
    })
  })

  test.describe("Limite de 1000 caracteres", () => {
    test("12 - aceita exatamente 1000 caracteres", async ({ ltcatReferenciasPage: r, page }) => {
      expect(MIL).toHaveLength(1000)
      await r.condicoesOperacionais.click()
      await page.keyboard.insertText(MIL)
      await expect(r.condicoesOperacionais).toHaveValue(MIL)
    })

    test("13 - digitando o 1001º caractere, ele é bloqueado", async ({ ltcatReferenciasPage: r, page }) => {
      await r.condicoesOperacionais.click()
      await page.keyboard.insertText(MIL)
      await r.condicoesOperacionais.press("End")
      await r.condicoesOperacionais.pressSequentially("Y")
      await expect(r.condicoesOperacionais).toHaveValue(MIL)
    })

    test("14 - colando mais de 1000, trunca no 1000º caractere", async ({ ltcatReferenciasPage: r, page }) => {
      await r.condicoesOperacionais.click()
      await page.keyboard.insertText(MIL + "EXCEDENTE")
      await expect(r.condicoesOperacionais).toHaveValue(MIL)
    })

    test("15 - texto no limite não quebra o layout da página", async ({ ltcatReferenciasPage: r, page }) => {
      await r.condicoesOperacionais.click()
      await page.keyboard.insertText(MIL)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  })

  test("16 - refresh sem salvar volta o campo para branco", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    await r.condicoesOperacionais.pressSequentially("Condições não salvas")
    await page.reload()
    await cadastro.titulo.waitFor()
    await expect(r.condicoesOperacionais).toHaveValue("")
  })

  // cria 1 LTCAT novo no ambiente de homologação a cada execução (sem rollback)
  test("17 - salva, persiste após reload e grava a edição", async ({ ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
    test.setTimeout(150000)
    const inicial = "Turno A: 06h às 14h\nTurno B: 14h às 22h"
    await cadastro.preencherObrigatorios({ ...ltcatValido, condicoesOperacionais: inicial })
    await cadastro.preencherConfiguracoesObrigatorias()
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await expect(page).toHaveURL(/idkey=\d+/)
    await page.reload()
    await expect(r.condicoesOperacionais).toHaveValue(inicial)

    await r.condicoesOperacionais.fill("")
    await r.condicoesOperacionais.click()
    await page.keyboard.insertText(MIL)
    await cadastro.salvar()
    await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
    await page.reload()
    await expect(r.condicoesOperacionais).toHaveValue(MIL)
  })
})
