// SETUP/SCAFFOLD — cenários de regressão da planilha real (TST1064, TST1400-TST1405).
// Ver aba-configuracoes.spec.ts para a explicação de por que usamos test.fixme()
// em vez de test() aqui.
//
// TST1064 mora aqui (e não em nenhum arquivo de aba) porque descreve a REMOÇÃO
// de uma aba antiga ("Metodologia") que não existe mais na tela — é regressão,
// não comportamento de uma aba atual.
import { test, expect } from "../../../support"

test.describe("Regressão — aba Metodologia removida (E2E)", () => {
  test.beforeEach(async ({ page, login }) => {
    await login.entrar()
    // TODO: navegar até um cadastro de PGR existente
  })

  test.fixme("TST1064 - Validar que a aba Metodologia foi retirada da tela e não é exibida no arquivo de saída", async ({ page }) => {
    // Esperado: campos da antiga aba "Metodologia" devem estar ocultos na tela
    // e não devem aparecer no PGR gerado
  })
})

test.describe("Cenários gerais e de Regressão (E2E)", () => {
  test.beforeEach(async ({ page, login }) => {
    await login.entrar()
    // TODO: navegar até um cadastro de PGR existente, de preferência um
    // registro criado ANTES da mudança que introduziu os campos/regras atuais
    // (é o que a planilha chama de "PGR antigo")
  })

  test.fixme("TST1400 - Abrir PGR antigo", async ({ page }) => {
    // Esperado: Deve carregar corretamente
  })
  test.fixme("TST1401 - Editar PGR antigo", async ({ page }) => {
    // Esperado: Não deve quebrar
  })
  test.fixme("TST1402 - Salvar PGR antigo", async ({ page }) => {
    // Esperado: Deve migrar corretamente
  })
  test.fixme("TST1403 - Gerar relatório antigo COM e SEM edição", async ({ page }) => {
    // Esperado: Deve funcionar
  })
  test.fixme("TST1404 - PGR com dados de campos removidos", async ({ page }) => {
    // Esperado: Sistema deve ignorar e gerar o arquivo no novo formato
  })
  // TST1405: sem resultado esperado explícito na planilha — validação textual
  // das mensagens de help, comparando com o texto citado no chamado original
  test.fixme("TST1405 - Validar texto das helps conforme citado no chamado", async ({ page }) => {
    // Esperado: (não especificado na planilha — conferir texto exato no chamado)
  })
})
