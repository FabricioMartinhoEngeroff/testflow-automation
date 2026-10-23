// Cenários da flag "Responsável Técnico" do cadastro de Profissionais (PROFI073–PROFI088).
// Flag: checkbox, não obrigatório, default desmarcado.
// Help: "Marcar este campo para o profissional que assinará e se responsabilizará
// tecnicamente pelos trabalhos a ele atribuídos no/pelo sistema."
//
// Campos condicionais à flag (todos c2 turquesa — FORA DO ESCOPO):
//   Certificado Digital, Senha, Validar, Dados do Certificado.
// Esses campos são ignorados; apenas a flag em si é testada aqui.
import { test, expect } from "@support"
import { cpfUnico } from "@support/utils/cpf"

// Localiza o checkbox "Responsável Técnico" pelo texto do label visível —
// mesmo padrão de clicarCheckboxMaterial em support/pgr.ts: o mat-checkbox
// esconde o <input> real (cdk-visually-hidden) e o clique deve ser no texto.
async function marcarResponsavelTecnico(page: import("@playwright/test").Page) {
  await page.getByText("Responsável Técnico", { exact: true }).click()
}

test.describe('Flag "Responsável Técnico" (E2E)', () => {
  test.beforeEach(async ({ page, login, profissionalPage }) => {
    await login.entrar()
    await profissionalPage.abrirNovoCadastro()
    await page.getByText("Responsável Técnico", { exact: true }).waitFor({ state: "visible" })
  })

  test.describe("Estado inicial", () => {
    test("PROFI073 - Flag visível na tela", async ({ page }) => {
      await expect(page.getByText("Responsável Técnico", { exact: true })).toBeVisible()
    })

    test("PROFI074 - Por default está desmarcada", async ({ page }) => {
      await expect(
        page.getByRole("checkbox", { name: /Responsável Técnico/ })
      ).not.toBeChecked()
    })
  })

  test.describe("Help text", () => {
    test.fixme("PROFI075 - Tooltip/help exibe texto correto sobre assinatura técnica", async ({ page }) => {
      // Esperado: "Marcar este campo para o profissional que assinará e se
      // responsabilizará tecnicamente pelos trabalhos a ele atribuídos no/pelo sistema."
      // Verificar se o help é tooltip (aria-describedby) ou texto inline
    })
  })

  test.describe("Toggle da flag", () => {
    test("PROFI076 - Clicar uma vez marca a flag", async ({ page }) => {
      await marcarResponsavelTecnico(page)
      await expect(
        page.getByRole("checkbox", { name: /Responsável Técnico/ })
      ).toBeChecked()
    })

    test("PROFI077 - Clicar duas vezes retorna ao estado desmarcado", async ({ page }) => {
      await marcarResponsavelTecnico(page)
      await marcarResponsavelTecnico(page)
      await expect(
        page.getByRole("checkbox", { name: /Responsável Técnico/ })
      ).not.toBeChecked()
    })

    test("PROFI078 - Estado da flag mantido ao alternar abas/campos", async ({ page }) => {
      await marcarResponsavelTecnico(page)
      // navega para outro campo e volta
      await page.getByLabel("Nome *").click()
      await expect(
        page.getByRole("checkbox", { name: /Responsável Técnico/ })
      ).toBeChecked()
    })
  })

  test.describe("Campos condicionais (c2 turquesa — fora do escopo)", () => {
    test.fixme("PROFI079 - Ao marcar, campos Certificado Digital e Senha ficam visíveis", async ({ page }) => {
      // c2 turquesa — ignorado no escopo atual
    })

    test.fixme("PROFI080 - Ao desmarcar, campos Certificado Digital e Senha somem", async ({ page }) => {
      // c2 turquesa — ignorado no escopo atual
    })

    test.fixme("PROFI081 - Botão Validar visível apenas com flag marcada", async ({ page }) => {
      // c2 turquesa — ignorado no escopo atual
    })
  })

  test.describe("Não obrigatoriedade", () => {
    test("PROFI082 - Salvar com flag desmarcada não bloqueia o cadastro", async ({ page }) => {
      await page.getByLabel("CPF *").pressSequentially(cpfUnico().replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      // flag permanece desmarcada (default)
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText("Profissional salvo com sucesso")).toBeVisible()
    })

    test("PROFI083 - Salvar com flag marcada e sem certificado funciona normalmente", async ({ page }) => {
      // Certificado Digital é c2 turquesa (opcional e ainda não implementado),
      // mas a flag em si é não-colorida e testável agora — marcar a flag e
      // salvar sem certificado deve funcionar normalmente.
      await page.getByLabel("CPF *").pressSequentially(cpfUnico().replace(/\D/g, ""))
      await page.getByLabel("Nome *").fill("Ana Costa")
      await page.getByLabel("Cargo *").fill("Médico do Trabalho")
      await marcarResponsavelTecnico(page)
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await expect(page.getByText("Profissional salvo com sucesso")).toBeVisible()
    })
  })

  test.describe("Persistência da flag", () => {
    test.fixme("PROFI084 - Flag marcada é persistida após salvar e reabrir", async ({ page }) => {
      // Pré-condição: CPF único + salvar com flag marcada
      // Esperado: ao reabrir, flag aparece marcada
    })

    test.fixme("PROFI085 - Flag desmarcada em edição é persistida após re-salvar", async ({ page }) => {
      // Esperado: flag volta a desmarcada e persiste
    })
  })

  test.describe("Acesso e edição", () => {
    test.fixme("PROFI086 - Flag habilitada na tela de edição de cadastro já salvo", async ({ page }) => {
      // Esperado: é possível alterar a flag ao editar um profissional existente
    })

    test.fixme("PROFI087 - Usuário sem permissão ALT não consegue alterar a flag", async ({ page }) => {
      // Esperado: campo desabilitado ou tela em modo leitura
      // Pré-condição: usuário de teste sem permissão ALT de Profissionais
    })

    test.fixme("PROFI088 - Usuário com permissão apenas VIS vê flag mas não altera", async ({ page }) => {
      // Esperado: campo readonly ou desabilitado
    })
  })
})
