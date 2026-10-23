// Cenários de exclusão de Profissional (PROFI166–PROFI185).
// "Excluir" está no escopo da EF seção 1.1. A mensagem `exclusao` está
// documentada na seção 7: "Registro excluído com sucesso."
//
// A exclusão ocorre tipicamente na lista de profissionais — o botão
// de excluir fica por linha no grid (padrão Apollus). Todos os testes
// aqui navegam para a lista antes de executar a ação de excluir.
//
// Mensagens esperadas (seção 7 da EF):
//   exclusao → "Registro excluído com sucesso." (tipo Sucesso, cor Verde)
import { test, expect } from "@support"
import { cpfUnico } from "@support/utils/cpf"

test.describe("Exclusão de Profissional (E2E)", () => {
  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Modal de confirmação de exclusão", () => {
    test.beforeEach(async ({ page, login, profissionalPage }) => {
      // cria um profissional e vai para a lista para poder excluir
      await login.entrar()
      await profissionalPage.abrirNovoCadastro()
      await profissionalPage.salvarValido(cpfUnico())
      await page.getByRole("button", { name: "Não" }).click()
      await profissionalPage.irParaLista()
    })

    test.fixme("PROFI166 - Clicar em excluir abre modal de confirmação", async ({ page }) => {
      // Esperado: modal de confirmação aparece antes de excluir
      // TODO: confirmar localização do botão de excluir na lista (ícone lixeira ou "delete")
    })

    test.fixme("PROFI167 - Modal exibe texto 'Deseja realmente excluir este item?'", async ({ page }) => {
      // Texto padrão Apollus confirmado em outros módulos
    })

    test.fixme("PROFI168 - Modal possui botões 'Excluir' e 'Fechar'", async ({ page }) => {
      // Esperado: dois botões visíveis na modal de exclusão
    })

    test.fixme("PROFI169 - Botão 'Excluir' aparece em destaque na modal", async ({ page }) => {
      // Esperado: botão primário visualmente destacado (cor diferente)
    })

    test.fixme("PROFI170 - Clicar 'Fechar' na modal mantém o registro na lista", async ({ page }) => {
      // Esperado: modal fecha sem excluir; profissional ainda aparece na lista
    })

    test.fixme("PROFI171 - Fechar modal pelo X mantém o registro na lista", async ({ page }) => {
      // Esperado: mesmo comportamento do botão Fechar
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Confirmar exclusão", () => {
    test.beforeEach(async ({ page, login, profissionalPage }) => {
      await login.entrar()
      await profissionalPage.abrirNovoCadastro()
      await profissionalPage.salvarValido(cpfUnico())
      await page.getByRole("button", { name: "Não" }).click()
      await profissionalPage.irParaLista()
    })

    test.fixme("PROFI172 - Confirmar exclusão remove o registro da lista", async ({ page }) => {
      // Esperado: profissional some da listagem após confirmar
    })

    test.fixme("PROFI173 - Confirmar exclusão exibe mensagem de sucesso", async ({ page }) => {
      // EF seção 7: mensagem `exclusao` = "Registro excluído com sucesso."
      // Tipo: Sucesso; Cor: Verde
    })

    test.fixme("PROFI174 - Mensagem de exclusão é verde (tipo Sucesso)", async ({ page }) => {
      // Esperado: mesma classe/tipo das mensagens de sucesso do sistema
    })

    test.fixme("PROFI175 - Após exclusão a lista permanece sem o profissional excluído", async ({ page }) => {
      // Esperado: recarregar a lista não faz o profissional reaparecer
    })

    test.fixme("PROFI176 - Excluir e tentar recriar com o mesmo CPF deve funcionar", async ({ page }) => {
      // Esperado: após excluir, o CPF fica livre e pode ser reutilizado
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Exclusão com vínculos", () => {
    test.fixme("PROFI177 - Excluir profissional vinculado a um PGR exibe mensagem de vínculo", async ({ page }) => {
      // Esperado: sistema não permite excluir e exibe a mensagem padrão de vínculos do Apollus
      // Pré-condição: profissional que seja Responsável Técnico de algum PGR ativo
    })

    test.fixme("PROFI178 - Botão Excluir da modal ainda aparece mas a ação é bloqueada pelo servidor", async ({ page }) => {
      // Esperado: erro vem do servidor, não da validação de tela
    })

    test.fixme("PROFI179 - Mensagem de vínculo exibida é clara e indica onde está o vínculo", async ({ page }) => {
      // Esperado: mensagem cita o módulo/item vinculado ao profissional
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  test.describe("Consistência após exclusão", () => {
    test.fixme("PROFI180 - Tentar acessar URL de cadastro excluído exibe erro ou redireciona", async ({ page }) => {
      // Esperado: sistema não retorna um formulário vazio para um ID que não existe mais
    })

    test.fixme("PROFI181 - Profissional excluído não aparece como opção no select de Responsável Técnico do PGR", async ({ page }) => {
      // Esperado: seletor do PGR não exibe profissionais excluídos
    })

    test.fixme("PROFI182 - Exclusão de múltiplos profissionais sequencialmente funciona sem erro", async ({ page }) => {
      // Esperado: cada exclusão exibe a modal e mensagem; lista diminui corretamente
    })
  })
})
