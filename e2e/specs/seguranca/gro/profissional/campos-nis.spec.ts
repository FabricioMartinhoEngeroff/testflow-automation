// Cenários do campo NIS do cadastro de Profissionais (PROFI040–PROFI052).
// NIS: descritivo, máx 11 dígitos, máscara 000.00000.00-0, numérico,
// sem espaços, colar permitido, NÃO obrigatório (revisão c3 de 23/02/2022).
// Help: "Preencher com o Número de Inscrição do Segurado - NIS, o qual pode
// ser o PIS, PASEP ou NIT. Informe este campo caso a empresa utilize o PPP."
import { test, expect } from "@support"
import { cpfUnico } from "@support/utils/cpf"

test.describe('Campo "NIS" (E2E)', () => {
  test.beforeEach(async ({ login, profissionalPage }) => {
    await login.entrar()
    await profissionalPage.abrirNovoCadastro()
    await profissionalPage.nis.waitFor({ state: "visible" })
  })

  test.describe("Estado inicial", () => {
    test("PROFI040 - Campo visível e habilitado", async ({ profissionalPage }) => {
      const campo = profissionalPage.nis
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
    })

    test("PROFI041 - Por default está em branco", async ({ profissionalPage }) => {
      await expect(profissionalPage.nis).toHaveValue("")
    })
  })

  test.describe("Help text", () => {
    test.fixme("PROFI042 - Help exibe texto correto sobre PIS/PASEP/NIT e PPP", async ({ page }) => {
      // Esperado: tooltip/help exibe "Preencher com o Número de Inscrição do
      // Segurado - NIS, o qual pode ser o PIS, PASEP ou NIT. Informe este
      // campo caso a empresa utilize o PPP."
      // Padrão de localização: mesmo helper textoTooltipDoIcone de aba-referencias.spec.ts
    })
  })

  test.describe("Tipo e inserção de dados", () => {
    test("PROFI043 - Aceita inserção de dígitos numéricos", async ({ profissionalPage }) => {
      const campo = profissionalPage.nis
      await campo.pressSequentially("123")
      const valor = await campo.inputValue()
      expect(valor).not.toBe("")
    })

    test("PROFI044 - Não aceita letras", async ({ profissionalPage }) => {
      const campo = profissionalPage.nis
      await campo.pressSequentially("abc")
      await expect(campo).toHaveValue("")
    })

    test("PROFI045 - Não aceita espaços isolados", async ({ profissionalPage }) => {
      const campo = profissionalPage.nis
      await campo.pressSequentially("   ")
      await expect(campo).toHaveValue("")
    })

    test("PROFI046 - Aceita no máximo 11 dígitos", async ({ profissionalPage }) => {
      const campo = profissionalPage.nis
      await campo.pressSequentially("123456789012") // 12 dígitos
      const valor = await campo.inputValue()
      const apenasDigitos = valor.replace(/\D/g, "")
      expect(apenasDigitos.length).toBeLessThanOrEqual(11)
    })

    test.fixme("PROFI047 - Máscara 000.00000.00-0 aplicada ao digitar", async ({ page }) => {
      // Esperado: ao digitar 11 dígitos, campo exibe "xxx.xxxxx.xx-x"
      // Confirmar se máscara aplica em tempo real ou só ao sair do campo
    })

    test.fixme("PROFI048 - Colar NIS formatado via clipboard", async ({ page }) => {
      // Esperado: campo aceita e mantém a formatação
      // Não implementado: fill() não reproduz ClipboardEvent
    })
  })

  test.describe("Não obrigatoriedade (revisão c3 — 23/02/2022)", () => {
    test("PROFI049 - Salvar sem preencher NIS não bloqueia o cadastro", async ({ profissionalPage }) => {
      // NIS foi tornado NÃO obrigatório na revisão de 23/02/2022 (c3)
      await profissionalPage.preencherObrigatorios(cpfUnico())
      await profissionalPage.botaoSalvar.click()
      // sistema não deve barrar por ausência de NIS
      await expect(profissionalPage.mensagemSalvoComSucesso).toBeVisible()
    })

    test("PROFI050 - Campo NIS não é marcado em vermelho ao salvar sem preencher", async ({ profissionalPage }) => {
      await profissionalPage.preencherObrigatorios(cpfUnico())
      await profissionalPage.botaoSalvar.click()
      const campoContainer = profissionalPage.containerDe(profissionalPage.nis)
      await expect(campoContainer).not.toHaveClass(/ng-invalid|mat-form-field-invalid/)
    })
  })

  test.describe("Persistência", () => {
    test.fixme("PROFI051 - NIS preenchido é persistido após salvar e reabrir", async ({ page }) => {
      // Pré-condição: CPF único válido + NIS preenchido + salvar com sucesso
      // Esperado: ao reabrir o cadastro, NIS aparece com o valor digitado
    })

    test.fixme("PROFI052 - NIS editado em cadastro já salvo é atualizado", async ({ page }) => {
      // Esperado: novo valor persiste após re-salvar
    })
  })
})
