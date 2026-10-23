// Cenários da planilha real (TST659-TST1012), aba Referências do cadastro
// de PGR. Ver aba-configuracoes.spec.ts pro porquê de test.fixme() vs test().
// Descobertas completas em ef/doc_testes_passaram_pgr/doc_testes_passaram_pgr.md.
//
// BUGS REAIS: zero à esquerda nos campos "Expostos" colapsa o valor pra "0"
// (ver TST757); "Incluir GHEs sem riscos - Descritivo" (aba Configurações)
// às vezes não carrega o texto padrão a tempo, bloqueando o Salvar de
// qualquer PGR novo (contornado em support/pgr.ts).
import type { Locator, Page } from "@playwright/test"
import { test, expect } from "@support"
import { URLS } from "@support/urls"

// `.hover()` + esperar `.mat-mdc-tooltip` é flaky neste app (mesmo problema
// do ícone de Anexos) — o CDK sempre expõe o texto do tooltip num elemento
// `#cdk-describedby-message-...` referenciado via `aria-describedby` num
// ancestral do ícone, sem precisar de hover.
async function textoTooltipDoIcone(page: Page, icone: Locator): Promise<string> {
  const gatilho = icone.locator("xpath=ancestor-or-self::*[@aria-describedby][1]")
  const describedById = await gatilho.getAttribute("aria-describedby")
  if (!describedById) return ""
  return (await page.locator(`#${describedById}`).textContent()) ?? ""
}

test.describe("Aba Referências (E2E)", () => {
  test.beforeEach(async ({ page, login, pgr }) => {
    await login.entrar()
    await pgr.abrirNovoCadastro()
    await pgr.abrirAba("Referências")
  })

  test.describe('Campo "Responsável Técnico"', () => {
    test("TST659/660 - Campos antigos de CPF/Nome (Responsável Técnico e Equipe) não existem mais", async ({ page }) => {
      // só existe 1 select combinado (Responsável Técnico) e 1 multiselect (Equipe) — campos antigos de CPF/Nome não existem mais
      await expect(page.getByLabel("CPF", { exact: true })).toHaveCount(0)
      await expect(page.getByLabel("Nome", { exact: true })).toHaveCount(0)
    })
    test.fixme("TST661 - Validar layout após remoção dos campos antigos", async ({ page }) => {
      // Esperado: Layout deve estar ajustado sem espaços vazios ou desalinhamento
    })
    test("TST662 - Validar presença do novo campo 'Responsável Técnico'", async ({ page }) => {
      const campo = page.getByLabel("Responsável técnico *")
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
    })
    test("TST663 - Validar valor padrão do campo", async ({ page }) => {
      // "Profissional responsável" é o PLACEHOLDER, não um valor pré-selecionado (a EF usa "valor padrão" de forma ambígua)
      const campo = page.getByLabel("Responsável técnico *")
      await expect(campo).toHaveValue("")
      await expect(campo).toHaveAttribute("placeholder", "Profissional responsável")
    })
    test("TST664 - Abrir select sem digitar", async ({ page }) => {
      await page.getByLabel("Responsável técnico *").click()
      await expect(page.locator("mat-option").first()).toBeVisible()
      expect(await page.locator("mat-option").count()).toBeGreaterThan(0)
    })
    test("TST665 - Validar exibição das opções", async ({ page }) => {
      await page.getByLabel("Responsável técnico *").click()
      const primeiraOpcao = await page.locator("mat-option").first().textContent()
      // formato "CPF - Nome - Registro conselho"
      expect(primeiraOpcao?.trim()).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2} - .+ - .+$/)
    })
    test.fixme("TST666 - Buscar profissional pelo nome (ex: 'Maria')", async ({ page }) => {
      // Esperado: Sistema deve filtrar corretamente
    })
    test.fixme("TST667 - Buscar pelo CPF (parcial ou completo)", async ({ page }) => {
      // Esperado: Deve retornar corretamente
    })
    test.fixme("TST668 - Buscar com texto inexistente", async ({ page }) => {
      // Esperado: Deve exibir lista vazia sem erro
    })
    test.fixme("TST669 - Validar que apenas profissionais com checkbox 'Responsável Técnico' aparecem", async ({ page }) => {
      // Esperado: Profissionais sem essa flag não devem aparecer
      // Não implementado: exige inspecionar/cadastrar profissional sem a flag antes
    })
    test.fixme("TST670 - Validar que apenas profissionais com 'Programas e laudos' aparecem", async ({ page }) => {
      // Esperado: Deve respeitar esse filtro
    })
    test.fixme("TST671 - Validar profissional com apenas um dos critérios", async ({ page }) => {
      // Esperado: Não deve aparecer
    })
    test("TST672 - Selecionar um profissional válido", async ({ page }) => {
      await page.getByLabel("Responsável técnico *").click()
      const nomeOpcao = await page.locator("mat-option").first().textContent()
      await page.locator("mat-option").first().click()
      await expect(page.getByLabel("Responsável técnico *")).toHaveValue(nomeOpcao?.trim() ?? "")
    })
    test.fixme("TST673 - Limpar seleção do campo", async ({ page }) => {
      // Esperado: Campo deve permitir limpar (se permitido)
    })
    test.fixme("TST674 - Tentar salvar sem selecionar responsável técnico", async ({ page }) => {
      // Esperado: Sistema deve bloquear (campo obrigatório)
      // já coberto de forma genérica em botoes-cadastro.spec.ts TST1362
    })
    test("TST675 - Selecionar responsável e salvar", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
    })
    test("TST676 - Validar persistência após salvar e reabrir", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      const valorSalvo = await page.getByLabel("Responsável técnico *").inputValue()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Responsável técnico *")).toHaveValue(valorSalvo)
    })
    test("TST677 - Editar registro e alterar responsável técnico", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      const valorInicial = await page.getByLabel("Responsável técnico *").inputValue()
      await page.getByLabel("Responsável técnico *").click()
      // escolhe uma opção diferente da primeira (que já estava selecionada)
      await page.locator("mat-option").nth(1).click()
      const novoValor = await page.getByLabel("Responsável técnico *").inputValue()
      expect(novoValor).not.toBe(valorInicial)
    })
    test.fixme("TST678 - Validar comportamento com dados antigos (CPF/Nome já salvos)", async ({ page }) => {
      // Esperado: Sistema deve migrar ou exibir corretamente sem erro
      // Não implementado: exige um registro legado no banco pra reproduzir
    })
    test.fixme("TST679 - Validar comportamento com profissional removido/inativo", async ({ page }) => {
      // Esperado: Sistema deve tratar sem quebrar (manter ou limpar com aviso)
    })
    test.fixme("TST680 - Colar texto no campo de busca", async ({ page }) => {
      // Esperado: Deve tratar corretamente
    })
    test("TST681 - Validar ordenação da lista", async ({ page }) => {
      // ordenação é por NOME (2º segmento) — comparar a linha inteira ordenaria pelo CPF (1º segmento, numérico)
      await page.getByLabel("Responsável técnico *").click()
      const opcoes = await page.locator("mat-option").allTextContents()
      const nomes = opcoes.map((o) => o.trim().split(" - ")[1].toLocaleLowerCase("pt-BR"))
      const ordenado = [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"))
      expect(nomes).toEqual(ordenado)
    })
    test("TST682 - Validar duplicidade na lista", async ({ page }) => {
      await page.getByLabel("Responsável técnico *").click()
      const opcoes = await page.locator("mat-option").allTextContents()
      const cpfs = opcoes.map((o) => o.trim().split(" - ")[0])
      expect(new Set(cpfs).size).toBe(cpfs.length)
    })
    test.fixme("TST683 - Validar nomes com acentuação", async ({ page }) => {
      // Esperado: Busca deve funcionar corretamente
    })
    test("TST684 - Validar máscara do CPF exibido", async ({ page }) => {
      await page.getByLabel("Responsável técnico *").click()
      const opcoes = await page.locator("mat-option").allTextContents()
      for (const o of opcoes) {
        expect(o.trim()).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}/)
      }
    })
    test.fixme("TST685 - Validar foco ao acessar o campo", async ({ page }) => {
      // Esperado: Deve permitir navegação via teclado
    })
    test.fixme("TST686 - Validar seleção via teclado (ENTER/TAB)", async ({ page }) => {
      // Esperado: Deve funcionar corretamente
    })
    test.fixme("TST687 - Validar comportamento ao trocar rapidamente de seleção", async ({ page }) => {
      // Esperado: Sistema não deve apresentar inconsistência
    })
    test.fixme("TST688 - Validar impacto no restante do cadastro do PGR", async ({ page }) => {
      // Esperado: Responsável técnico deve refletir corretamente nos dados do cadastro
    })
    test("TST689 - Validar ausência de referências antigas no frontend (CPF/Nome separados)", async ({ page }) => {
      // mesma evidência do TST659/660: nenhum texto/campo com o padrão antigo
      const panel = page.getByRole("tabpanel", { name: "Referências" })
      await expect(panel.getByText("Digite 3 letras")).toHaveCount(0)
    })
    test.fixme("TST690 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Campo deve estar fiel ao layout, comportamento e exibição esperada
      // Não implementado: requer o arquivo de mockup em mãos pra comparação visual
    })
  })

  test.describe("Campo Observações", () => {
    test("TST691/692 - Acessar aba e visualizar campo 'Observações' em estado inicial", async ({ page }) => {
      const campo = page.getByLabel("Observações")
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
      await expect(campo).toHaveValue("")
    })
    test("TST693 - Inserir texto válido", async ({ page }) => {
      const campo = page.getByLabel("Observações")
      await campo.fill("Documento revisado")
      await expect(campo).toHaveValue("Documento revisado")
    })
    test("TST694 - Inserir texto com exatamente 400 caracteres", async ({ page }) => {
      const campo = page.getByLabel("Observações")
      await campo.fill("a".repeat(400))
      await expect(campo).toHaveValue("a".repeat(400))
    })
    test("TST695 - Inserir texto com mais de 400 caracteres", async ({ page }) => {
      const campo = page.getByLabel("Observações")
      await campo.fill("a".repeat(450))
      await expect(campo).toHaveValue("a".repeat(400))
    })
    test.fixme("TST696 - Colar texto com mais de 400 caracteres", async ({ page }) => {
      // Esperado: Sistema deve truncar ou impedir excedente
      // Não implementado: `fill()` não reproduz um evento de "colar" real
      // (clipboard) — precisa simular via `page.evaluate` disparando um
      // ClipboardEvent, ver 09-acoes.md
    })
    test.fixme("TST697 - Inserir apenas espaços", async ({ page }) => {
      // Esperado: Sistema deve aceitar ou limpar (não deve causar erro)
    })
    test.fixme("TST698 - Inserir caracteres especiais (ex: @#%&)", async ({ page }) => {
      // Esperado: Sistema deve aceitar sem erro
    })
    test.fixme("TST699 - Inserir texto com quebra de linha (enter)", async ({ page }) => {
      // Esperado: Sistema deve aceitar ou manter formato conforme padrão
    })
    test.fixme("TST700 - Digitar rapidamente no campo (uso incorreto)", async ({ page }) => {
      // Esperado: Sistema não deve travar ou perder dados
    })
    test("TST701 - Limpar conteúdo após preenchimento", async ({ page }) => {
      const campo = page.getByLabel("Observações")
      await campo.fill("texto temporário")
      await campo.fill("")
      await expect(campo).toHaveValue("")
    })
    test("TST702 - Salvar com campo preenchido", async ({ page, pgr }) => {
      await page.getByLabel("Observações").fill("observação de teste")
      await pgr.preencherCadastroValidoESalvar()
      await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
    })
    test("TST703 - Salvar com campo vazio", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
    })
    test("TST704 - Reabrir cadastro após salvar", async ({ page, pgr }) => {
      await page.getByLabel("Observações").fill("observação persistida")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Observações")).toHaveValue("observação persistida")
    })
    test("TST705 - Editar conteúdo já salvo", async ({ page, pgr }) => {
      await page.getByLabel("Observações").fill("valor original")
      await pgr.preencherCadastroValidoESalvar()
      await page.getByLabel("Observações").fill("valor editado")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Registro salvo com sucesso").first().waitFor({ state: "visible" })
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Observações")).toHaveValue("valor editado")
    })
    test.fixme("TST706 - Inserir texto muito longo e salvar rapidamente", async ({ page }) => {
      // Esperado: Sistema deve respeitar limite sem inconsistência
    })
    test.fixme("TST707 - Validar comportamento ao fechar sem salvar", async ({ page }) => {
      // Esperado: Alterações não devem ser persistidas definitivamente
    })
    test("TST708 - Validar comportamento ao alternar abas após preencher", async ({ page }) => {
      await page.getByLabel("Observações").fill("mantém entre abas")
      await page.getByRole("tab", { name: "Anexos" }).click()
      await page.getByRole("tab", { name: "Referências" }).click()
      await expect(page.getByLabel("Observações")).toHaveValue("mantém entre abas")
    })
    test("TST709 - Validar impacto com outros campos (ex: Responsável Técnico)", async ({ page }) => {
      await page.getByLabel("Observações").fill("independente")
      await page.getByLabel("Responsável técnico *").click()
      await page.locator("mat-option").first().click()
      await expect(page.getByLabel("Observações")).toHaveValue("independente")
    })
    test.fixme("TST710 - Validar comportamento com dados antigos", async ({ page }) => {
      // Esperado: Campo deve carregar corretamente sem erro
    })
    test.fixme("TST711 - Validar exibição de texto longo na tela", async ({ page }) => {
      // Esperado: Layout não deve quebrar (pode ter scroll ou truncamento)
    })
    test.fixme("TST712 - Validar alinhamento do campo na tela", async ({ page }) => {
      // Esperado: Deve seguir padrão visual
    })
    test.fixme("TST713 - Validar cores e foco ao clicar no campo", async ({ page }) => {
      // Esperado: Deve seguir padrão do sistema
    })
    test.fixme("TST714 - Validar comportamento com caracteres acentuados", async ({ page }) => {
      // Esperado: Deve exibir corretamente
    })
    // TST715: performance não é bom candidato a E2E funcional (ver TST1026
    // em aba-configuracoes.spec.ts pro mesmo raciocínio)
    test.fixme("TST715 - Validar performance com texto próximo ao limite", async ({ page }) => {
      // Esperado: Campo deve responder normalmente
    })
    test.fixme("TST716 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Campo deve estar fiel ao layout, tamanho e comportamento esperado
    })
  })

  test.describe("Campo ART", () => {
    test("TST717/718 - Acessar aba e visualizar campo 'ART' em estado inicial", async ({ page }) => {
      const campo = page.getByLabel("ART")
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
      await expect(campo).toHaveValue("")
    })
    test("TST719 - Inserir texto válido (ex: '123456789')", async ({ page }) => {
      const campo = page.getByLabel("ART")
      await campo.fill("123456789")
      await expect(campo).toHaveValue("123456789")
    })
    test("TST720 - Inserir texto com exatamente 30 caracteres", async ({ page }) => {
      const campo = page.getByLabel("ART")
      await campo.fill("a".repeat(30))
      await expect(campo).toHaveValue("a".repeat(30))
    })
    test("TST721 - Inserir texto com mais de 30 caracteres", async ({ page }) => {
      const campo = page.getByLabel("ART")
      await campo.fill("a".repeat(40))
      await expect(campo).toHaveValue("a".repeat(30))
    })
    test.fixme("TST722 - Colar texto com mais de 30 caracteres", async ({ page }) => {
      // Esperado: Sistema deve truncar ou impedir excedente
      // Não implementado: mesmo motivo do TST696 (colar ≠ fill)
    })
    test("TST723 - Inserir apenas números", async ({ page }) => {
      const campo = page.getByLabel("ART")
      await campo.fill("987654321")
      await expect(campo).toHaveValue("987654321")
    })
    test("TST724 - Inserir letras e números (ex: 'ART-2026-001')", async ({ page }) => {
      const campo = page.getByLabel("ART")
      await campo.fill("ART-2026-001")
      await expect(campo).toHaveValue("ART-2026-001")
    })
    test("TST725 - Inserir caracteres especiais (ex: '#@!%')", async ({ page }) => {
      const campo = page.getByLabel("ART")
      await campo.fill("ART-2026-001 #@!")
      await expect(campo).toHaveValue("ART-2026-001 #@!")
    })
    test.fixme("TST726 - Inserir apenas espaços", async ({ page }) => {
      // Esperado: Sistema deve aceitar ou limpar (sem gerar erro)
    })
    test.fixme("TST727 - Inserir texto com espaços no início/fim", async ({ page }) => {
      // Esperado: Sistema deve manter ou tratar corretamente
    })
    test("TST728 - Limpar campo após preenchimento", async ({ page }) => {
      const campo = page.getByLabel("ART")
      await campo.fill("valor temporário")
      await campo.fill("")
      await expect(campo).toHaveValue("")
    })
    test("TST729 - Salvar com campo preenchido", async ({ page, pgr }) => {
      await page.getByLabel("ART").fill("ART-teste-729")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("ART")).toHaveValue("ART-teste-729")
    })
    test("TST730 - Salvar com campo vazio", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
    })
    test("TST731 - Reabrir cadastro após salvar", async ({ page, pgr }) => {
      await page.getByLabel("ART").fill("ART-731")
      await pgr.preencherCadastroValidoESalvar()
      const urlComIdkey = page.url()
      await page.goto(URLS.pgr)
      await page.goto(urlComIdkey)
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("ART")).toHaveValue("ART-731")
    })
    test("TST732 - Editar valor já salvo", async ({ page, pgr }) => {
      await page.getByLabel("ART").fill("valor original")
      await pgr.preencherCadastroValidoESalvar()
      await page.getByLabel("ART").fill("valor editado")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Registro salvo com sucesso").first().waitFor({ state: "visible" })
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("ART")).toHaveValue("valor editado")
    })
    test.fixme("TST733 - Inserir valor no limite e salvar rapidamente", async ({ page }) => {
      // Esperado: Sistema deve respeitar limite sem inconsistência
    })
    test.fixme("TST734 - Validar comportamento ao fechar sem salvar", async ({ page }) => {
      // Esperado: Alterações não devem ser persistidas definitivamente
    })
    // TST735: já confirmado em aba-configuracoes.spec.ts TST1054 (usa o
    // próprio campo ART pra provar persistência de estado entre abas)
    test("TST735 - Validar comportamento ao alternar abas após preencher", async ({ page }) => {
      await page.getByLabel("ART").fill("teste-multi-aba")
      await page.getByRole("tab", { name: "Anexos" }).click()
      await page.getByRole("tab", { name: "Referências" }).click()
      await expect(page.getByLabel("ART")).toHaveValue("teste-multi-aba")
    })
    test("TST736 - Validar impacto com outros campos da aba", async ({ page }) => {
      await page.getByLabel("ART").fill("independente")
      await page.getByLabel("Observações").fill("outro campo")
      await expect(page.getByLabel("ART")).toHaveValue("independente")
    })
    test.fixme("TST737 - Validar exibição de texto no layout", async ({ page }) => {
      // Esperado: Campo não deve quebrar layout
    })
    test.fixme("TST738 - Validar alinhamento do campo na tela", async ({ page }) => {
      // Esperado: Deve seguir padrão visual
    })
    test("TST739 - Validar foco ao clicar no campo", async ({ page }) => {
      const campo = page.getByLabel("ART")
      await campo.click()
      await expect(campo).toBeFocused()
    })
    test.fixme("TST740 - Validar navegação via teclado (TAB)", async ({ page }) => {
      // Esperado: Deve permitir acesso
    })
    test.fixme("TST741 - Validar inserção de caracteres acentuados", async ({ page }) => {
      // Esperado: Deve exibir corretamente
    })
    test.fixme("TST742 - Validar comportamento com dados antigos", async ({ page }) => {
      // Esperado: Deve carregar corretamente sem erro
    })
    test.fixme("TST743 - Validar consistência após múltiplas edições", async ({ page }) => {
      // Esperado: Valor deve permanecer íntegro
    })
    test.fixme("TST744 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Campo deve estar fiel ao layout, tamanho e comportamento esperado
    })
  })

  // os 3 campos "Expostos" (Mulheres/Homens/PCDs) usam o mesmo componente: type="text", maxlength=10, filtra letra mas deixa dígitos ao redor de "-"/"." passarem
  test.describe("Campo Expostos mulheres", () => {
    test("TST745/746 - Acessar aba e visualizar campo 'Expostos - Mulheres' em estado inicial", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
      await expect(campo).toHaveValue("")
    })
    test("TST747 - Inserir número inteiro válido (ex: 10)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.pressSequentially("10")
      await expect(campo).toHaveValue("10")
    })
    test("TST748 - Inserir número inteiro grande dentro do limite (10 dígitos)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.pressSequentially("9876543210")
      await expect(campo).toHaveValue("9876543210")
    })
    test("TST749 - Inserir número com mais de 10 dígitos", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.pressSequentially("123456789012345")
      // maxlength=10 corta o excedente — só os 10 primeiros dígitos entram
      await expect(campo).toHaveValue("1234567890")
    })
    test.fixme("TST750 - Colar número com mais de 10 dígitos", async ({ page }) => {
      // Esperado: Sistema deve truncar ou impedir excedente
      // Não implementado: mesmo motivo do TST696/TST722 (colar ≠ fill)
    })
    test("TST751 - Inserir número negativo (ex: -5)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.pressSequentially("-5")
      // o caractere "-" é descartado pelo próprio campo — não é possível
      // digitar um valor negativo (o dígito "5" continua entrando normalmente)
      await expect(campo).toHaveValue("5")
    })
    test("TST752 - Inserir número decimal (ex: 10.5)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.pressSequentially("10.5")
      // o "." é descartado, os dígitos ao redor permanecem e se concatenam
      await expect(campo).toHaveValue("105")
    })
    test("TST753 - Inserir letras (ex: 'abc')", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.pressSequentially("abc")
      await expect(campo).toHaveValue("")
    })
    test.fixme("TST754 - Inserir caracteres especiais (ex: '@#%')", async ({ page }) => {
      // Esperado: Sistema deve bloquear
    })
    test.fixme("TST755 - Inserir mistura de números e letras (ex: '10abc')", async ({ page }) => {
      // Esperado: Sistema deve impedir ou limpar entrada inválida
    })
    test("TST756 - Inserir valor '0'", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.pressSequentially("0")
      await expect(campo).toHaveValue("0")
    })
    // BUG REAL: zero à esquerda colapsa o valor pra "0" (perde os dígitos
    // seguintes), também em "Expostos - Homens/PCDs" (mesmo componente).
    test.fixme("TST757 - Inserir valor com zeros à esquerda (ex: 00010)", async ({ page }) => {
      // Esperado (planilha): Sistema deve aceitar e manter ou normalizar valor
      // Repro: campo.fill(""); await campo.pressSequentially("00010") -> valor final "0"
    })
    test.fixme("TST758 - Inserir apenas espaços", async ({ page }) => {
      // Esperado: Sistema deve limpar ou ignorar
    })
    test.fixme("TST759 - Digitar rapidamente valores (uso incorreto)", async ({ page }) => {
      // Esperado: Sistema não deve travar ou apresentar erro
    })
    test("TST760 - Limpar valor após preenchimento", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.pressSequentially("25")
      await campo.fill("")
      await expect(campo).toHaveValue("")
    })
    test("TST761 - Salvar com campo preenchido", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - Mulheres").pressSequentially("12")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - Mulheres")).toHaveValue("12")
    })
    test("TST762 - Salvar com campo vazio", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
    })
    test("TST763 - Reabrir cadastro após salvar", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - Mulheres").pressSequentially("7")
      await pgr.preencherCadastroValidoESalvar()
      const urlComIdkey = page.url()
      await page.goto(URLS.pgr)
      await page.goto(urlComIdkey)
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - Mulheres")).toHaveValue("7")
    })
    test("TST764 - Editar valor existente", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - Mulheres").pressSequentially("5")
      await pgr.preencherCadastroValidoESalvar()
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.fill("")
      await campo.pressSequentially("9")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Registro salvo com sucesso").first().waitFor({ state: "visible" })
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - Mulheres")).toHaveValue("9")
    })
    test.fixme("TST765 - Inserir valor no limite e salvar rapidamente", async ({ page }) => {
      // Esperado: Sistema deve respeitar limite sem inconsistência
    })
    test.fixme("TST766 - Validar comportamento ao fechar sem salvar", async ({ page }) => {
      // Esperado: Alterações não devem ser persistidas definitivamente
    })
    test("TST767/768 - Validar help do campo e ortografia", async ({ page }) => {
      const helpIcon = page.getByRole("tabpanel", { name: "Referências" })
        .locator("mat-icon", { hasText: "help_outline" })
      // o ícone de help do campo "Expostos - Mulheres" é o 2º da aba
      // (1º é o help genérico da seção "Incluir histórico de revisões")
      expect(await textoTooltipDoIcone(page, helpIcon.nth(1))).toBe("Informe a quantidade de mulheres expostas neste PGR")
    })
    test("TST769 - Validar foco ao clicar no campo", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.click()
      await expect(campo).toBeFocused()
    })
    test.fixme("TST770 - Validar navegação via teclado (TAB)", async ({ page }) => {
      // Esperado: Deve permitir acesso ao campo
    })
    test.fixme("TST771 - Validar alinhamento do campo na tela", async ({ page }) => {
      // Esperado: Deve seguir padrão visual
    })
    test("TST772 - Validar comportamento com valores extremos (ex: 9999999999)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Mulheres")
      await campo.pressSequentially("9999999999")
      await expect(campo).toHaveValue("9999999999")
    })
    test("TST773 - Validar impacto com outros campos da aba", async ({ page }) => {
      await page.getByLabel("Expostos - Mulheres").pressSequentially("3")
      await page.getByLabel("ART").fill("outro campo")
      await expect(page.getByLabel("Expostos - Mulheres")).toHaveValue("3")
    })
    test.fixme("TST774 - Validar comportamento com dados antigos", async ({ page }) => {
      // Esperado: Deve carregar corretamente sem erro
    })
    test.fixme("TST775 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Campo deve estar fiel ao layout, tamanho e comportamento esperado
    })
  })

  test.describe("Campo Expostos homens", () => {
    test("TST776/777 - Acessar aba e visualizar campo 'Expostos - Homens' em estado inicial", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
      await expect(campo).toHaveValue("")
    })
    test("TST778 - Inserir número inteiro válido (ex: 15)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await campo.pressSequentially("15")
      await expect(campo).toHaveValue("15")
    })
    test("TST779 - Inserir número com exatamente 10 dígitos", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await campo.pressSequentially("1234567890")
      await expect(campo).toHaveValue("1234567890")
    })
    test("TST780 - Inserir número com mais de 10 dígitos", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await campo.pressSequentially("123456789012")
      await expect(campo).toHaveValue("1234567890")
    })
    test.fixme("TST781 - Colar valor maior que 10 dígitos", async ({ page }) => {
      // Esperado: Sistema deve truncar ou impedir excedente
    })
    test("TST782 - Inserir número negativo (ex: -10)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await campo.pressSequentially("-10")
      await expect(campo).toHaveValue("10")
    })
    test("TST783 - Inserir número decimal (ex: 10.5)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await campo.pressSequentially("10.5")
      await expect(campo).toHaveValue("105")
    })
    test("TST784 - Inserir letras (ex: 'abc')", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await campo.pressSequentially("abc")
      await expect(campo).toHaveValue("")
    })
    test.fixme("TST785 - Inserir caracteres especiais (ex: '@#%')", async ({ page }) => {
      // Esperado: Sistema deve bloquear
    })
    test.fixme("TST786 - Inserir valor misto (ex: '10abc')", async ({ page }) => {
      // Esperado: Sistema deve impedir ou limpar entrada inválida
    })
    test("TST787 - Inserir valor '0'", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await campo.pressSequentially("0")
      await expect(campo).toHaveValue("0")
    })
    // BUG REAL — mesmo defeito do TST757, reproduzido também neste campo
    test.fixme("TST788 - Inserir zeros à esquerda (ex: 00020)", async ({ page }) => {
      // Esperado (planilha): Sistema deve aceitar e manter ou normalizar valor
      // Real (bug confirmado): campo colapsa para "0" — ver nota completa no TST757
    })
    test.fixme("TST789 - Inserir apenas espaços", async ({ page }) => {
      // Esperado: Sistema deve limpar ou ignorar
    })
    test.fixme("TST790 - Digitar rapidamente valores inválidos", async ({ page }) => {
      // Esperado: Sistema não deve travar
    })
    test("TST791 - Limpar campo após preenchimento", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await campo.pressSequentially("30")
      await campo.fill("")
      await expect(campo).toHaveValue("")
    })
    test("TST792 - Salvar com campo preenchido", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - Homens").pressSequentially("8")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - Homens")).toHaveValue("8")
    })
    test("TST793 - Salvar com campo vazio", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
    })
    test("TST794 - Reabrir cadastro após salvar", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - Homens").pressSequentially("4")
      await pgr.preencherCadastroValidoESalvar()
      const urlComIdkey = page.url()
      await page.goto(URLS.pgr)
      await page.goto(urlComIdkey)
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - Homens")).toHaveValue("4")
    })
    test("TST795 - Editar valor existente", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - Homens").pressSequentially("6")
      await pgr.preencherCadastroValidoESalvar()
      const campo = page.getByLabel("Expostos - Homens")
      await campo.fill("")
      await campo.pressSequentially("11")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Registro salvo com sucesso").first().waitFor({ state: "visible" })
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - Homens")).toHaveValue("11")
    })
    test("TST796/797 - Validar help do campo e ortografia", async ({ page }) => {
      const helpIcon = page.getByRole("tabpanel", { name: "Referências" })
        .locator("mat-icon", { hasText: "help_outline" })
      expect(await textoTooltipDoIcone(page, helpIcon.nth(2))).toBe("Informe a quantidade de homens expostos neste PGR")
    })
    test.fixme("TST798 - Validar foco e navegação por teclado", async ({ page }) => {
      // Esperado: Campo deve ser acessível via TAB
    })
    test.fixme("TST799 - Validar alinhamento visual", async ({ page }) => {
      // Esperado: Deve seguir padrão da tela
    })
    test("TST800 - Validar comportamento com valores extremos (ex: 9999999999)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - Homens")
      await campo.pressSequentially("9999999999")
      await expect(campo).toHaveValue("9999999999")
    })
    test.fixme("TST801 - Validar comportamento ao fechar sem salvar", async ({ page }) => {
      // Esperado: Alterações não devem persistir
    })
    test.fixme("TST802 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Campo deve estar fiel ao layout e comportamento esperado
    })
  })

  test.describe('Cenários Extras (Consistência com "Expostos mulheres")', () => {
    test("TST803 - Preencher 'Expostos homens' e 'Expostos mulheres' com valores válidos", async ({ page }) => {
      await page.getByLabel("Expostos - Homens").pressSequentially("5")
      await page.getByLabel("Expostos - Mulheres").pressSequentially("7")
      await expect(page.getByLabel("Expostos - Homens")).toHaveValue("5")
      await expect(page.getByLabel("Expostos - Mulheres")).toHaveValue("7")
    })
    test("TST804 - Preencher apenas um dos campos", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - Homens").pressSequentially("5")
      await pgr.preencherCadastroValidoESalvar()
      await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
    })
    test("TST805 - Inserir valores muito discrepantes (ex: 1 homem e 9999999999 mulheres)", async ({ page }) => {
      await page.getByLabel("Expostos - Homens").pressSequentially("1")
      await page.getByLabel("Expostos - Mulheres").pressSequentially("9999999999")
      await expect(page.getByLabel("Expostos - Homens")).toHaveValue("1")
      await expect(page.getByLabel("Expostos - Mulheres")).toHaveValue("9999999999")
    })
    test.fixme("TST806 - Alterar valores de ambos e salvar rapidamente", async ({ page }) => {
      // Esperado: Sistema deve persistir corretamente
    })
    test("TST807 - Limpar um campo e manter outro preenchido", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - Homens").pressSequentially("3")
      await page.getByLabel("Expostos - Mulheres").pressSequentially("4")
      await page.getByLabel("Expostos - Homens").fill("")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - Homens")).toHaveValue("")
      await expect(page.getByLabel("Expostos - Mulheres")).toHaveValue("4")
    })
    test("TST808 - Validar comportamento conjunto em reload da tela", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - Homens").pressSequentially("2")
      await page.getByLabel("Expostos - Mulheres").pressSequentially("6")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - Homens")).toHaveValue("2")
      await expect(page.getByLabel("Expostos - Mulheres")).toHaveValue("6")
    })
  })

  test.describe("Campo Expostos PCDs", () => {
    test("TST809/810 - Acessar aba e visualizar campo 'Expostos - PCDs' em estado inicial", async ({ page }) => {
      const campo = page.getByLabel("Expostos - PCDs")
      await expect(campo).toBeVisible()
      await expect(campo).toBeEnabled()
      await expect(campo).toHaveValue("")
    })
    test("TST811 - Preenchimento com número inteiro válido (ex: 10)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - PCDs")
      await campo.pressSequentially("10")
      await expect(campo).toHaveValue("10")
    })
    test("TST812 - Preenchimento com valor zero (0)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - PCDs")
      await campo.pressSequentially("0")
      await expect(campo).toHaveValue("0")
    })
    test("TST813 - Preenchimento com valor máximo permitido (10 dígitos)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - PCDs")
      await campo.pressSequentially("9999999999")
      await expect(campo).toHaveValue("9999999999")
    })
    test("TST814 - Preenchimento com valor acima de 10 dígitos", async ({ page }) => {
      const campo = page.getByLabel("Expostos - PCDs")
      await campo.pressSequentially("999999999999")
      await expect(campo).toHaveValue("9999999999")
    })
    test("TST815 - Inserção de números negativos (ex: -5)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - PCDs")
      await campo.pressSequentially("-5")
      await expect(campo).toHaveValue("5")
    })
    test("TST816 - Inserção de números decimais (ex: 10.5)", async ({ page }) => {
      const campo = page.getByLabel("Expostos - PCDs")
      await campo.pressSequentially("10.5")
      await expect(campo).toHaveValue("105")
    })
    test("TST817 - Inserção de caracteres alfabéticos (ex: 'abc')", async ({ page }) => {
      const campo = page.getByLabel("Expostos - PCDs")
      await campo.pressSequentially("abc")
      await expect(campo).toHaveValue("")
    })
    test.fixme("TST818 - Inserção de caracteres especiais (ex: @, #, %)", async ({ page }) => {
      // Esperado: Sistema deve bloquear ou limpar automaticamente esses caracteres
    })
    test.fixme("TST819 - Colagem de valor inválido (ex: texto copiado)", async ({ page }) => {
      // Esperado: Sistema deve validar e impedir o salvamento
    })
    test.fixme("TST820 - Colagem de número acima do limite de caracteres", async ({ page }) => {
      // Esperado: Sistema deve truncar ou impedir conforme regra definida
    })
    test("TST821 - Comportamento ao deixar o campo vazio (não obrigatório)", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
    })
    test.fixme("TST822 - Validar se o campo permanece habilitado na edição do PGR", async ({ page }) => {
      // Esperado: Campo deve continuar editável
    })
    test("TST823 - Alteração do valor já salvo (ex: de 5 para 20)", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - PCDs").pressSequentially("5")
      await pgr.preencherCadastroValidoESalvar()
      const campo = page.getByLabel("Expostos - PCDs")
      await campo.fill("")
      await campo.pressSequentially("20")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Registro salvo com sucesso").first().waitFor({ state: "visible" })
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - PCDs")).toHaveValue("20")
    })
    test("TST824 - Remoção do valor (deixar vazio após já ter sido preenchido)", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - PCDs").pressSequentially("15")
      await pgr.preencherCadastroValidoESalvar()
      await page.getByLabel("Expostos - PCDs").fill("")
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByText("Registro salvo com sucesso").first().waitFor({ state: "visible" })
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - PCDs")).toHaveValue("")
    })
    test("TST825/826 - Validar help/tooltip do campo e ortografia", async ({ page }) => {
      const helpIcon = page.getByRole("tabpanel", { name: "Referências" })
        .locator("mat-icon", { hasText: "help_outline" })
      // texto já contém o "de" corretamente — a suspeita do TST826 (baseada na EF) está desatualizada
      expect(await textoTooltipDoIcone(page, helpIcon.nth(3))).toBe("Informe a quantidade de pessoas com deficiência expostas neste PGR")
    })
    test.fixme("TST827 - Validar comportamento em dispositivos com resolução menor", async ({ page }) => {
      // Esperado: Campo deve se ajustar sem quebrar layout
    })
    test.fixme("TST828 - Validar tentativa de salvar formulário com erro nesse campo", async ({ page }) => {
      // Esperado: Sistema deve destacar o campo em vermelho e exibir mensagem clara
      // Nota: campo não é obrigatório na EF — cenário pode não se aplicar
    })
    test.fixme("TST829 - Validar comportamento com grande volume de dados no formulário", async ({ page }) => {
      // Esperado: Campo deve manter performance normal
    })
    test("TST830 - Validar persistência do valor após salvar e reabrir o cadastro", async ({ page, pgr }) => {
      await page.getByLabel("Expostos - PCDs").pressSequentially("9")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Expostos - PCDs")).toHaveValue("9")
    })
    test.fixme("TST831 - Validar comportamento ao duplicar um PGR existente", async ({ page }) => {
      // Esperado: Campo deve copiar o valor corretamente caso o cadastro já tenha sido salvo
    })
    test.fixme("TST832 - Validar integração com relatórios (se o campo for utilizado)", async ({ page }) => {
      // Esperado: Valor deve refletir corretamente nos relatórios
      // Não implementado: exige gerar e inspecionar o arquivo de saída, fora do escopo de UI
    })
    test.fixme("TST833 - Validar impacto quando valor é extremamente alto em relatórios", async ({ page }) => {
      // Esperado: Sistema não deve quebrar layout ou cálculos
    })
    test.fixme("TST834 - Validar comportamento ao salvar simultaneamente em múltiplas abas", async ({ page }) => {
      // Esperado: Sistema deve manter consistência do valor
    })
    test.fixme("TST835 - Validar comportamento ao limpar formulário completo", async ({ page }) => {
      // Esperado: Campo deve ser resetado corretamente
    })
    test.fixme("TST836 - Validar alinhamento visual do campo com outros inputs numéricos", async ({ page }) => {
      // Esperado: Campo deve seguir padrão de layout
    })
    test.fixme("TST837 - Validar cores do campo (normal, foco, erro, desabilitado)", async ({ page }) => {
      // Esperado: Deve seguir padrão visual do sistema
    })
    test.fixme("TST838 - Validar preenchimento com espaços antes/depois (ex: ' 10 ')", async ({ page }) => {
      // Esperado: Sistema deve tratar e salvar corretamente como número
    })
    test.fixme("TST839 - Validar consistência com outros campos de 'Expostos'", async ({ page }) => {
      // Esperado: Sistema não deve permitir inconsistências lógicas (se houver regra)
      // Não implementado: EF não documenta regra de soma/consistência entre os 3 campos
    })
    test.fixme("TST840 - Validar comportamento ao cancelar edição", async ({ page }) => {
      // Esperado: Valor original deve ser mantido
    })
    test.fixme("TST841 - Validar exibição do campo em diferentes navegadores", async ({ page }) => {
      // Esperado: Comportamento deve ser consistente
      // Não implementado: projeto configurado só com Chromium (ver playwright.config.ts)
    })
    test.fixme("TST842 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Campo deve estar idêntico ao mockup
    })
  })

  test.describe("Equipe (Modal + Campo + Botões)", () => {
    test("TST843 - Validar presença da seção 'Equipe'", async ({ page }) => {
      await expect(page.getByRole("tabpanel", { name: "Referências" }).getByText("Equipe", { exact: true })).toBeVisible()
    })
    test("TST844/845 - Validar exibição e ortografia do help da seção", async ({ page }) => {
      // texto existe 2x no DOM (visível + cópia escondida de acessibilidade) — `.toHaveCount` evita depender de qual cópia resolve
      await expect(page.getByText("Adicione os membros da equipe que deverão ser inseridos no documento.")).toHaveCount(1)
    })
    test("TST846/847 - Validar presença e ícone do botão 'Adicionar'", async ({ page }) => {
      const botao = page.getByRole("tabpanel", { name: "Referências" }).getByRole("button", { name: "Adicionar" })
      await expect(botao).toBeVisible()
      await expect(botao.locator("mat-icon", { hasText: "add_circle_outline" })).toBeVisible()
    })
    test("TST848/849 - Clicar em 'Adicionar' e validar título da modal", async ({ page }) => {
      await page.getByRole("tabpanel", { name: "Referências" }).getByRole("button", { name: "Adicionar" }).click()
      await expect(page.getByRole("dialog").getByText("Adicionar equipe")).toBeVisible()
    })
    test.fixme("TST850 - Validar foco inicial ao abrir modal", async ({ page }) => {
      // Esperado: Cursor deve estar no campo "Membro da equipe"
    })
    test.fixme("TST851 - Validar campo multiselect sem digitação", async ({ page }) => {
      // Esperado: Deve exibir opções disponíveis (se houver)
    })
    test.fixme("TST852 - Digitar menos de 3 caracteres no campo", async ({ page }) => {
      // Esperado: Deve retornar resultados (sem limitação antiga de 3 letras)
    })
    test.fixme("TST853 - Buscar por CPF completo", async ({ page }) => {
      // Esperado: Deve localizar corretamente o profissional
    })
    test.fixme("TST854 - Buscar por nome parcial (ex: 'Maria')", async ({ page }) => {
      // Esperado: Deve retornar todos os profissionais correspondentes
    })
    test.fixme("TST855 - Validar exibição do formato das opções", async ({ page }) => {
      // Esperado: Deve exibir "CPF - Nome" (ex: 000.000.000-00 - Maria Lopes)
    })
    test.fixme("TST856 - Validar ordenação das opções", async ({ page }) => {
      // Esperado: Deve estar em ordem crescente por nome
    })
    test.fixme("TST857 - Validar filtro de profissionais", async ({ page }) => {
      // Esperado: Deve listar apenas profissionais com flag "Programas e laudos" marcada
    })
    test.fixme("TST858 - Validar comportamento sem profissionais elegíveis", async ({ page }) => {
      // Esperado: Campo deve aparecer vazio ou com mensagem apropriada
    })
    test.fixme("TST859 - Validar seleção de um único profissional", async ({ page }) => {
      // Esperado: Deve permitir seleção normalmente
    })
    test.fixme("TST860 - Validar seleção de múltiplos profissionais", async ({ page }) => {
      // Esperado: Deve permitir múltiplas seleções
    })
    test.fixme("TST861 - Validar seleção e remoção de item no multiselect", async ({ page }) => {
      // Esperado: Deve permitir remover sem erro
    })
    test.fixme("TST862 - Validar comportamento com apenas 1 opção disponível", async ({ page }) => {
      // Esperado: Deve vir selecionada automaticamente
    })
    test.fixme("TST863 - Validar obrigatoriedade do campo", async ({ page }) => {
      // Esperado: Ao tentar salvar vazio → exibir mensagem [campos_obrigatorios]
    })
    test("TST864 - Validar botão 'Fechar'", async ({ page }) => {
      await page.getByRole("tabpanel", { name: "Referências" }).getByRole("button", { name: "Adicionar" }).click()
      await page.getByRole("dialog").getByRole("button", { name: "Fechar" }).click()
      await expect(page.getByRole("dialog")).toHaveCount(0)
    })
    test.fixme("TST865 - Validar botão 'Salvar' sem preencher campo", async ({ page }) => {
      // Esperado: Deve exibir validação de obrigatoriedade
    })
    test.fixme("TST866 - Validar botão 'Salvar e Adicionar outro' sem preencher", async ({ page }) => {
      // Esperado: Deve exibir validação de obrigatoriedade
    })
    test.fixme("TST867 - Selecionar um profissional e clicar 'Salvar'", async ({ page }) => {
      // Esperado: Deve salvar e fechar modal
    })
    test.fixme("TST868 - Selecionar múltiplos profissionais e clicar 'Salvar'", async ({ page }) => {
      // Esperado: Deve salvar uma linha por profissional
    })
    test.fixme("TST869 - Validar mensagem de sucesso ao salvar", async ({ page }) => {
      // Esperado: Deve exibir [info_sucesso]
    })
    test.fixme("TST870 - Validar persistência após salvar e reabrir", async ({ page }) => {
      // Esperado: Dados devem aparecer no grid
    })
    test.fixme("TST871 - Validar botão 'Salvar e Adicionar outro' com dados válidos", async ({ page }) => {
      // Esperado: Deve salvar e manter modal aberta
    })
    test.fixme("TST872 - Validar limpeza do formulário após 'Salvar e Adicionar outro'", async ({ page }) => {
      // Esperado: Campo deve voltar ao estado inicial
    })
    test.fixme("TST873 - Validar tentativa de adicionar profissional já existente no grid", async ({ page }) => {
      // Esperado: Deve exibir mensagem [profissional_adicionado]
    })
    test.fixme("TST874 - Validar comportamento após erro de duplicidade", async ({ page }) => {
      // Esperado: Dados devem permanecer para edição
    })
    test.fixme("TST875 - Validar tentativa de adicionar mais de 3 profissionais", async ({ page }) => {
      // Esperado: Deve exibir mensagem [limite_atingido]
    })
    test.fixme("TST876 - Validar bloqueio ao atingir limite", async ({ page }) => {
      // Esperado: Não deve permitir inclusão no grid
    })
    test.fixme("TST877 - Validar inclusão de múltiplos profissionais quando já existem 2 no grid", async ({ page }) => {
      // Esperado: Deve permitir apenas até atingir 3
    })
    test.fixme("TST878 - Validar inclusão de múltiplos profissionais que ultrapassem o limite", async ({ page }) => {
      // Esperado: Sistema deve bloquear inclusão excedente
    })
    test.fixme("TST879 - Validar consistência ao salvar múltiplos e atingir limite simultaneamente", async ({ page }) => {
      // Esperado: Deve respeitar limite e não salvar excedentes
    })
    test.fixme("TST880 - Validar botão 'Salvar' em edição (quando houver futuramente)", async ({ page }) => {
      // Esperado: Deve habilitar apenas após alteração
    })
    test.fixme("TST881 - Validar incluir o mesmo profissional mais de uma vez", async ({ page }) => {
      // Esperado: Sistema não deve permitir e exibir mensagem temporizada
    })
    test.fixme("TST882 - Validar comportamento de clicar várias vezes em 'Salvar' rapidamente", async ({ page }) => {
      // Esperado: Deve evitar duplicidade
    })
    test.fixme("TST883 - Validar performance ao buscar profissionais (lista grande)", async ({ page }) => {
      // Esperado: Deve responder sem travamento
    })
    test.fixme("TST884 - Validar comportamento com nomes duplicados (mesmo nome, CPFs diferentes)", async ({ page }) => {
      // Esperado: Deve diferenciar corretamente
      // Nota: confirmado que existem casos reais assim na base ("Adriana
      // Carstens editado" aparece 2x com CPFs distintos na lista de
      // Responsável Técnico) — bom candidato pra reaproveitar o dado real
    })
    test.fixme("TST885 - Validar seleção de profissional com CPF inválido cadastrado", async ({ page }) => {
      // Esperado: Sistema deve exibir mas manter consistência
    })
    test.fixme("TST886 - Validar comportamento ao limpar seleção antes de salvar", async ({ page }) => {
      // Esperado: Deve exigir novo preenchimento
    })
    test.fixme("TST887 - Validar navegação por teclado no multiselect", async ({ page }) => {
      // Esperado: Deve permitir seleção via teclado
    })
    test.fixme("TST888 - Validar scroll na lista de profissionais", async ({ page }) => {
      // Esperado: Deve funcionar corretamente
    })
    test.fixme("TST889 - Validar comportamento com conexão lenta", async ({ page }) => {
      // Esperado: Busca e seleção devem funcionar corretamente
    })
    test.fixme("TST890 - Validar usuário com permissão apenas H1", async ({ page }) => {
      // Esperado: Deve visualizar e cadastrar conforme escopo
    })
    test.fixme("TST891 - Validar usuário com H1 + H2 específica", async ({ page }) => {
      // Esperado: Dados devem respeitar H2
    })
    test.fixme("TST892 - Validar ambiente com H2 obrigatória sem seleção", async ({ page }) => {
      // Esperado: Sistema deve impedir ações gerais
    })
    test.fixme("TST893 - Validar consistência ao abrir múltiplas modais simultaneamente (abas)", async ({ page }) => {
      // Esperado: Não deve gerar inconsistência
    })
    test.fixme("TST894 - Validar atualização concorrente (2 usuários adicionando equipe)", async ({ page }) => {
      // Esperado: Sistema deve respeitar limite de 3
    })
    test("TST895 - Validar cancelamento da modal após preenchimento", async ({ page }) => {
      await page.getByRole("tabpanel", { name: "Referências" }).getByRole("button", { name: "Adicionar" }).click()
      await page.getByLabel("Membro da equipe *").click()
      await page.locator("mat-option").first().click()
      // painel do multiselect fica sobrepondo o botão "Fechar" após selecionar — Escape fecha antes de clicar
      await page.keyboard.press("Escape")
      await page.getByRole("dialog").getByRole("button", { name: "Fechar" }).click()
      // dados não devem persistir no cadastro principal — sem uma linha nova
      // no grid de Equipe
      await expect(page.getByRole("tabpanel", { name: "Referências" }).getByText("Sem registros para listar.")).toBeVisible()
    })
    test.fixme("TST896 - Validar responsividade da modal", async ({ page }) => {
      // Esperado: Layout deve se adaptar
    })
    test.fixme("TST897 - Validar cores dos botões", async ({ page }) => {
      // Esperado: Devem seguir padrão do sistema
    })
    test.fixme("TST898 - Validar alinhamento dos botões", async ({ page }) => {
      // Esperado: Devem estar conforme layout
    })
    test.fixme("TST899 - Validar presença e comportamento de mensagens (erro/sucesso)", async ({ page }) => {
      // Esperado: Devem ser claras e consistentes
    })
    test.fixme("TST900 - Validar tempo de resposta ao salvar", async ({ page }) => {
      // Esperado: Deve ser adequado
    })
    test.fixme("TST901 - Validar comportamento ao pressionar Enter", async ({ page }) => {
      // Esperado: Deve acionar ação padrão (Salvar ou nada, conforme regra)
    })
    test.fixme("TST902 - Validar mockup/modelo anexado no chamado", async ({ page }) => {
      // Esperado: Modal, campo, botões e comportamento devem estar 100% aderentes ao modelo
    })
  })

  test.describe("Grid de equipe", () => {
    test("TST903 - Acessar aba com grid sem profissionais cadastrados", async ({ page }) => {
      await expect(page.getByRole("tabpanel", { name: "Referências" }).getByText("Sem registros para listar.")).toBeVisible()
    })
    test.fixme("TST904 - Validar exibição do grid após inserir um profissional", async ({ page }) => {
      // Esperado: Deve exibir 1 linha corretamente
    })
    test.fixme("TST905 - Validar exibição do campo 'Profissional'", async ({ page }) => {
      // Esperado: Deve apresentar no formato "CPF - Nome"
    })
    test.fixme("TST906 - Validar máscara do CPF exibido", async ({ page }) => {
      // Esperado: CPF deve estar formatado (000.000.000-00)
    })
    test.fixme("TST907 - Validar exibição de nomes longos", async ({ page }) => {
      // Esperado: Nome não deve quebrar layout
    })
    test.fixme("TST908 - Validar múltiplos profissionais no grid", async ({ page }) => {
      // Esperado: Deve listar todos corretamente
    })
    test.fixme("TST909 - Validar ordem de exibição após inserções sequenciais", async ({ page }) => {
      // Esperado: Deve manter ordem de inserção
    })
    test.fixme("TST910 - Inserir profissional A, depois B, depois C", async ({ page }) => {
      // Esperado: Ordem no grid deve ser A → B → C
    })
    test.fixme("TST911 - Inserir múltiplos profissionais em uma única ação", async ({ page }) => {
      // Esperado: Devem ser inseridos respeitando ordem da seleção
    })
    test.fixme("TST912 - Validar que o grid NÃO permite ordenação por coluna", async ({ page }) => {
      // Esperado: Nenhuma coluna deve ser clicável para ordenar
    })
    test.fixme("TST913 - Tentar ordenar via clique no cabeçalho", async ({ page }) => {
      // Esperado: Não deve ocorrer nenhuma mudança
    })
    test.fixme("TST914 - Validar persistência da ordem após salvar e reabrir PGR", async ({ page }) => {
      // Esperado: Ordem deve ser mantida
    })
    test.fixme("TST915 - Validar persistência após reload da página", async ({ page }) => {
      // Esperado: Ordem deve permanecer igual
    })
    test.fixme("TST916 - Validar comportamento ao excluir o primeiro item", async ({ page }) => {
      // Esperado: Demais itens devem subir mantendo ordem
    })
    test.fixme("TST917 - Validar comportamento ao excluir item do meio", async ({ page }) => {
      // Esperado: Ordem restante deve ser mantida sem reordenação indevida
    })
    test.fixme("TST918 - Validar comportamento ao excluir último item", async ({ page }) => {
      // Esperado: Grid deve remover corretamente
    })
    test.fixme("TST919 - Validar exclusão de todos os itens", async ({ page }) => {
      // Esperado: Grid deve ficar vazio
    })
    test.fixme("TST920 - Validar botão de excluir visível", async ({ page }) => {
      // Esperado: Ícone "trash-alt" deve aparecer em cada linha
    })
    test.fixme("TST921 - Validar tooltip do botão excluir", async ({ page }) => {
      // Esperado: Deve exibir "Excluir" ao passar o mouse
    })
    test.fixme("TST922 - Validar clique no botão excluir", async ({ page }) => {
      // Esperado: Deve abrir modal de confirmação
    })
    test.fixme("TST923 - Validar texto da modal de exclusão", async ({ page }) => {
      // Esperado: Deve exibir "Deseja realmente excluir este item?"
    })
    test.fixme("TST924 - Validar presença dos botões da modal", async ({ page }) => {
      // Esperado: Deve conter "Excluir" e "Fechar"
    })
    test.fixme("TST925 - Validar destaque do botão 'Excluir'", async ({ page }) => {
      // Esperado: Deve estar visualmente destacado
    })
    test.fixme("TST926 - Validar botão 'Fechar' da modal", async ({ page }) => {
      // Esperado: Deve fechar sem excluir
    })
    test.fixme("TST927 - Validar exclusão ao clicar em 'Excluir'", async ({ page }) => {
      // Esperado: Item deve ser removido do grid
    })
    test.fixme("TST928 - Validar mensagem após exclusão", async ({ page }) => {
      // Esperado: Deve exibir mensagem [info_excluir]
    })
    test.fixme("TST929 - Validar fechamento automático da modal após exclusão", async ({ page }) => {
      // Esperado: Modal deve fechar automaticamente
    })
    test.fixme("TST930 - Validar exclusão múltipla sequencial", async ({ page }) => {
      // Esperado: Deve permitir excluir vários itens sem erro
    })
    test.fixme("TST931 - Validar comportamento ao excluir e adicionar novamente o mesmo profissional", async ({ page }) => {
      // Esperado: Deve permitir nova inclusão
    })
    test.fixme("TST932 - Validar tentativa de exclusão com clique duplo rápido", async ({ page }) => {
      // Esperado: Deve excluir apenas uma vez
    })
    test.fixme("TST933 - Validar comportamento com conexão lenta ao excluir", async ({ page }) => {
      // Esperado: Sistema deve manter consistência do valor
    })
    test.fixme("TST934 - Validar atualização do grid após exclusão sem refresh", async ({ page }) => {
      // Esperado: Grid deve atualizar dinamicamente
    })
    test.fixme("TST935 - Validar consistência com limite de 3 profissionais", async ({ page }) => {
      // Esperado: Após excluir, deve permitir nova inclusão
    })
    test.fixme("TST936 - Validar exclusão e inclusão em sequência rápida", async ({ page }) => {
      // Esperado: Sistema não deve perder estado
    })
    test.fixme("TST937 - Validar tentativa de exclusão via manipulação de frontend", async ({ page }) => {
      // Esperado: Backend deve garantir integridade
    })
    test.fixme("TST938 - Validar usuário sem permissão de edição", async ({ page }) => {
      // Esperado: Botão excluir não deve estar disponível
    })
    test.fixme("TST939 - Validar comportamento com dois usuários editando simultaneamente", async ({ page }) => {
      // Esperado: Sistema deve manter consistência do valor
    })
    test.fixme("TST940 - Validar exclusão de item já excluído por outro usuário", async ({ page }) => {
      // Esperado: Sistema deve tratar erro corretamente
    })
    test.fixme("TST941 - Validar comportamento ao excluir item e fechar tela sem salvar", async ({ page }) => {
      // Esperado: Deve respeitar regra de persistência
    })
    test.fixme("TST942 - Validar atualização após salvar o PGR", async ({ page }) => {
      // Esperado: Grid deve refletir dados corretos
    })
    test.fixme("TST943 - Validar alinhamento das colunas", async ({ page }) => {
      // Esperado: Deve seguir padrão visual
    })
    test.fixme("TST944 - Validar espaçamento e layout do grid", async ({ page }) => {
      // Esperado: Não deve haver sobreposição
    })
    test.fixme("TST945 - Validar cores dos botões de ação", async ({ page }) => {
      // Esperado: Devem seguir padrão do sistema
    })
    test.fixme("TST946 - Validar acessibilidade (uso via teclado)", async ({ page }) => {
      // Esperado: Deve permitir foco no botão excluir
    })
    test.fixme("TST947 - Validar navegação por tab entre linhas", async ({ page }) => {
      // Esperado: Deve funcionar corretamente
    })
    test.fixme("TST948 - Validar comportamento com muitos caracteres especiais no nome", async ({ page }) => {
      // Esperado: Não deve quebrar layout
    })
    test.fixme("TST949 - Validar encoding de caracteres (acentos)", async ({ page }) => {
      // Esperado: Deve exibir corretamente
    })
    test.fixme("TST950 - Validar performance com múltiplas inclusões/exclusões", async ({ page }) => {
      // Esperado: Deve responder adequadamente
    })
    test.fixme("TST951 - Validar comportamento ao limpar todos e adicionar novamente", async ({ page }) => {
      // Esperado: Deve funcionar sem inconsistência
    })
    test.fixme("TST952 - Validar comportamento ao excluir item enquanto modal de inclusão está aberta em outra aba", async ({ page }) => {
      // Esperado: Deve manter consistência
    })
    test.fixme("TST953 - Validar mockup/modelo anexado no chamado", async ({ page }) => {
      // Esperado: Grid, botões, ordem, layout e modal devem estar 100% aderentes ao modelo
    })
  })

  test.describe("Configurações gerais", () => {
    test("TST954 - Acessar aba 'Referências' e validar seção 'Configurações gerais'", async ({ page }) => {
      await expect(page.getByRole("tabpanel", { name: "Referências" }).getByText("Configurações Gerais")).toBeVisible()
    })
    test("TST955 - Validar presença de todos os campos", async ({ page }) => {
      // EF documenta um 7º componente ("Incluir AEP e/ou AET") não implementado neste ambiente — ver EXTRA4
      await expect(page.getByLabel("Modelo de documento *")).toBeVisible()
      await expect(page.getByPlaceholder("Início")).toBeVisible()
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).toBeVisible()
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo da empresa em todas as páginas" })).toBeVisible()
      await expect(page.getByRole("checkbox", { name: /Incluir data de realização na capa do programa/ })).toBeVisible()
      await expect(page.getByRole("checkbox", { name: "Incluir histórico de revisões" })).toBeVisible()
    })
    test("TST956 - Validar ordem dos campos na tela", async ({ page }) => {
      const panelText = await page.getByRole("tabpanel", { name: "Referências" }).innerText()
      const posModelo = panelText.indexOf("Modelo de documento")
      const posVigencia = panelText.indexOf("Vigência do programa")
      const posLogoCapa = panelText.indexOf("Incluir logotipo na capa")
      const posHistorico = panelText.indexOf("Incluir histórico de revisões")
      expect(posModelo).toBeLessThan(posVigencia)
      expect(posVigencia).toBeLessThan(posLogoCapa)
      expect(posLogoCapa).toBeLessThan(posHistorico)
    })
    test.fixme("TST957 - Validar responsividade da seção", async ({ page }) => {
      // Esperado: Campos devem se ajustar corretamente em diferentes resoluções
    })
    test("TST958 - Validar campo 'Modelo de documento' visível", async ({ page }) => {
      await expect(page.getByLabel("Modelo de documento *")).toBeEnabled()
    })
    test.fixme("TST959 - Validar carregamento das opções do modelo", async ({ page }) => {
      // Esperado: Deve listar apenas modelos ativos com flag PGR
      // Não implementado: exige inspecionar o cadastro de cada modelo
      // listado pra confirmar a flag "PGR" marcada
    })
    test.fixme("TST960 - Validar filtro por abrangência do documento", async ({ page }) => {
      // Esperado: Deve exibir apenas modelos compatíveis
      // Ver grupo "Achados fora da planilha" — regra de abrangência
      // hierárquica (modal "catalogomodelo" da EF) não coberta por nenhum
      // cenário da planilha
    })
    test("TST961 - Validar exibição do formato das opções", async ({ page }) => {
      await page.getByLabel("Modelo de documento *").click()
      const opcoes = await page.locator("mat-option").allTextContents()
      expect(opcoes.length).toBeGreaterThan(0)
      // formato "código - descrição" — confirmado com "APOLLUS-PGR - Modelo
      // Software Apollus - PGR" / "PGR - PGR corporativo" no ambiente real
      for (const o of opcoes) {
        expect(o.trim()).toMatch(/ - /)
      }
    })
    test.fixme("TST962 - Validar ordenação das opções", async ({ page }) => {
      // Esperado: Deve estar em ordem crescente de código
      // Não implementado: amostra observada mistura letras minúsculas/
      // maiúsculas/símbolos e não ficou claro se segue ordenação de "código"
      // (campo de negócio) ou só ordenação de string — precisa confirmar
      // contra o cadastro de modelos
    })
    test.fixme("TST963 - Validar comportamento com apenas um modelo disponível", async ({ page }) => {
      // Esperado: Deve vir automaticamente selecionado
    })
    test.fixme("TST964 - Validar comportamento sem modelos disponíveis", async ({ page }) => {
      // Esperado: Campo deve ficar vazio ou exibir mensagem apropriada
    })
    test.fixme("TST965 - Validar busca por código no select", async ({ page }) => {
      // Esperado: Deve localizar corretamente
    })
    test.fixme("TST966 - Validar busca por descrição", async ({ page }) => {
      // Esperado: Deve retornar corretamente
    })
    test("TST967 - Validar obrigatoriedade do campo 'Modelo de documento'", async ({ page }) => {
      await expect(page.getByText("Modelo de documento *")).toBeVisible()
    })
    test("TST968 - Validar persistência do modelo selecionado", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      const valorSalvo = await page.getByLabel("Modelo de documento *").inputValue()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByLabel("Modelo de documento *")).toHaveValue(valorSalvo)
    })
    test("TST969 - Validar troca de modelo após já selecionado", async ({ page }) => {
      await page.getByLabel("Modelo de documento *").click()
      const primeiro = await page.locator("mat-option").first().textContent()
      await page.locator("mat-option").first().click()
      await page.getByLabel("Modelo de documento *").click()
      await page.locator("mat-option").nth(1).click()
      const novoValor = await page.getByLabel("Modelo de documento *").inputValue()
      expect(novoValor).not.toBe(primeiro?.trim())
    })
    test.fixme("TST970 - Validar edição no cadastro do modelo", async ({ page }) => {
      // Esperado: Sistema deve exibir alteração e gerar o arquivo com sucesso
      // Não implementado: exige editar o cadastro do modelo em outra tela
    })
    test("TST971 - Validar campo 'Vigência do Programa' vazio (obrigatório)", async ({ page }) => {
      await expect(page.getByPlaceholder("Início")).toHaveValue("")
      await expect(page.getByRole("tabpanel", { name: "Referências" }).getByText("Vigência do programa *")).toBeVisible()
    })
    test("TST972 - Validar preenchimento com data válida", async ({ page }) => {
      await page.getByPlaceholder("Início").fill("01/01/2026")
      await page.keyboard.press("Tab")
      await page.keyboard.type("31/12/2026")
      await expect(page.getByPlaceholder("Início")).toHaveValue("01/01/2026")
    })
    test.fixme("TST973 - Validar data início maior que fim", async ({ page }) => {
      // Esperado: Deve bloquear e exibir mensagem de alerta
    })
    test.fixme("TST974 - Validar data fim menor que início", async ({ page }) => {
      // Esperado: Deve bloquear e exibir mensagem de alerta
    })
    test.fixme("TST975 - Validar preenchimento apenas da data início", async ({ page }) => {
      // Esperado: Deve validar conforme regra (não inconsistente)
    })
    test.fixme("TST976 - Validar preenchimento apenas da data fim", async ({ page }) => {
      // Esperado: Deve validar conforme regra (não inconsistente)
    })
    test.fixme("TST977 - Validar inserção manual de data inválida (ex: 32/13/2026)", async ({ page }) => {
      // Esperado: Deve impedir, sinalizando o campo em vermelho
    })
    test.fixme("TST978 - Validar seleção via calendário", async ({ page }) => {
      // Esperado: Deve funcionar corretamente
    })
    test.fixme("TST979 - Validar navegação por teclado no calendário", async ({ page }) => {
      // Esperado: Deve permitir
    })
    test("TST980 - Validar persistência da vigência após salvar", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByPlaceholder("Início")).toHaveValue("01/01/2026")
    })
    test.fixme("TST981 - Validar alteração de vigência após salvar", async ({ page, pgr }) => {
      // Esperado: Deve atualizar corretamente
      // Instável: `getByPlaceholder("Início")` leu o valor antigo após
      // reload em 2 rodadas seguidas, mesmo a tela mostrando o valor novo
      // — coincide com o layout renderizando diferente (Expostos como
      // botões, não inputs inline), possível instabilidade de responsivo
      // ainda não isolada. Repro: pgr.preencherCadastroValidoESalvar();
      // trocar "Início"/"Fim", Salvar, reload, abrirAba("Referências").
    })
    test("TST982 - Validar checkbox 'Incluir logotipo na capa' (estado inicial desmarcado)", async ({ page }) => {
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).not.toBeChecked()
    })
    test("TST983 - Marcar checkbox 'Incluir logotipo na capa'", async ({ page, pgr }) => {
      await pgr.clicarCheckboxMaterial("Incluir logotipo na capa")
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).toBeChecked()
    })
    test("TST984 - Validar persistência do checkbox após salvar", async ({ page, pgr }) => {
      await pgr.clicarCheckboxMaterial("Incluir logotipo na capa")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).toBeChecked()
    })
    test("TST985 - Validar checkbox 'Incluir logotipo da empresa em todas as páginas' (estado inicial desmarcado)", async ({ page }) => {
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo da empresa em todas as páginas" })).not.toBeChecked()
    })
    test("TST986 - Validar seleção e desmarcação do checkbox", async ({ page, pgr }) => {
      const checkbox = page.getByRole("checkbox", { name: "Incluir logotipo da empresa em todas as páginas" })
      await pgr.clicarCheckboxMaterial("Incluir logotipo da empresa em todas as páginas")
      await expect(checkbox).toBeChecked()
      await pgr.clicarCheckboxMaterial("Incluir logotipo da empresa em todas as páginas")
      await expect(checkbox).not.toBeChecked()
    })
    test("TST987 - Validar checkbox 'Incluir data de realização na capa do programa' (estado inicial desmarcado)", async ({ page }) => {
      await expect(page.getByRole("checkbox", { name: /Incluir data de realização na capa do programa/ })).not.toBeChecked()
    })
    test("TST988 - Validar comportamento de múltiplos checkboxes marcados", async ({ page, pgr }) => {
      await pgr.clicarCheckboxMaterial("Incluir logotipo na capa")
      await pgr.clicarCheckboxMaterial("Incluir logotipo da empresa em todas as páginas")
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).toBeChecked()
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo da empresa em todas as páginas" })).toBeChecked()
    })
    test("TST989 - Validar checkbox 'Incluir histórico de revisões' sem dados (desabilitado)", async ({ page }) => {
      const checkbox = page.getByRole("checkbox", { name: "Incluir histórico de revisões" })
      await expect(checkbox).toBeDisabled()
      await expect(checkbox).not.toBeChecked()
    })
    test("TST990 - Validar tooltip/help do histórico de revisões", async ({ page }) => {
      const helpIcon = page.getByRole("tabpanel", { name: "Referências" }).locator("mat-icon", { hasText: "help_outline" }).first()
      const texto = await textoTooltipDoIcone(page, helpIcon)
      expect(texto).toContain("Para selecionar essa opção é necessário possuir ao menos um histórico de revisão")
    })
    test.fixme("TST991 - Adicionar item no histórico de revisões", async ({ page }) => {
      // Esperado: Checkbox deve ser habilitado
      // Não implementado: exige abrir a modal "Histórico de Revisões" do
      // cabeçalho e adicionar uma revisão válida antes
    })
    test.fixme("TST992 - Validar habilitação após adicionar histórico", async ({ page }) => {
      // Esperado: Deve permitir marcação
    })
    test.fixme("TST993 - Marcar checkbox de histórico", async ({ page }) => {
      // Esperado: Deve refletir no estado do formulário
    })
    test.fixme("TST994 - Remover/cancelar histórico existente", async ({ page }) => {
      // Esperado: Checkbox deve voltar a ficar desabilitado
    })
    test.fixme("TST995 - Validar persistência do histórico marcado após salvar", async ({ page }) => {
      // Esperado: Deve manter valor após salvar
    })
    test.fixme("TST996 - Validar impacto no documento gerado (histórico incluído)", async ({ page }) => {
      // Esperado: Deve incluir histórico no PGR
      // Não implementado: exige gerar e inspecionar o arquivo de saída
    })
    test.fixme("TST997 - Validar impacto no documento quando não marcado", async ({ page }) => {
      // Esperado: Não deve incluir histórico
    })
    test.fixme("TST998 - Validar impacto dos checkboxes no documento final", async ({ page }) => {
      // Esperado: Deve refletir corretamente (ex: logotipo, data)
    })
    test.fixme("TST999 - Validar comportamento com todos checkboxes marcados", async ({ page }) => {
      // Esperado: Documento deve incluir todos os elementos
    })
    test.fixme("TST1000 - Validar comportamento com nenhum checkbox marcado", async ({ page }) => {
      // Esperado: Documento deve ser gerado sem elementos adicionais
    })
    test("TST1001 - Validar carregamento com dados já salvos", async ({ page, pgr }) => {
      await pgr.clicarCheckboxMaterial("Incluir logotipo na capa")
      await page.getByLabel("ART").fill("ART-1001")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).toBeChecked()
      await expect(page.getByLabel("ART")).toHaveValue("ART-1001")
    })
    test.fixme("TST1002 - Validar comportamento com dados corrompidos (ex: modelo inexistente)", async ({ page }) => {
      // Esperado: Modelo não deve mais ser exibido, mas não deve ocorrer erro
      // ao gerar o arquivo; deve exibir o campo em branco e sinalizar obrigatoriedade
    })
    test("TST1003 - Validar consistência ao salvar múltiplas alterações", async ({ page, pgr }) => {
      await pgr.clicarCheckboxMaterial("Incluir logotipo na capa")
      await pgr.clicarCheckboxMaterial("Incluir data de realização na capa do programa")
      await page.getByLabel("Observações").fill("multi-alteração")
      await pgr.preencherCadastroValidoESalvar()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).toBeChecked()
      await expect(page.getByRole("checkbox", { name: /Incluir data de realização na capa do programa/ })).toBeChecked()
      await expect(page.getByLabel("Observações")).toHaveValue("multi-alteração")
    })
    test.fixme("TST1004 - Validar comportamento ao cancelar edição", async ({ page }) => {
      // Esperado: Deve manter dados anteriores
    })
    test("TST1005 - Validar mensagens de sucesso", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await expect(page.getByText("Registro salvo com sucesso").first()).toBeVisible()
    })
    test.fixme("TST1006 - Validar alinhamento visual dos componentes", async ({ page }) => {
      // Esperado: Deve seguir padrão da tela
    })
    test.fixme("TST1007 - Validar cores dos checkboxes (marcado/desmarcado)", async ({ page }) => {
      // Esperado: Deve seguir padrão visual
    })
    test("TST1008 - Validar clique rápido repetido nos checkboxes", async ({ page, pgr }) => {
      for (let i = 0; i < 6; i++) {
        await pgr.clicarCheckboxMaterial("Incluir logotipo na capa")
      }
      // 6 cliques (par) volta ao estado original (desmarcado)
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).not.toBeChecked()
    })
    test.fixme("TST1009 - Validar performance ao salvar com todos campos preenchidos", async ({ page }) => {
      // Esperado: Deve ser adequada
    })
    test("TST1010 - Validar comportamento ao atualizar página sem salvar", async ({ page, pgr }) => {
      await pgr.preencherCadastroValidoESalvar()
      await pgr.clicarCheckboxMaterial("Incluir logotipo na capa")
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).toBeChecked()
      await page.reload()
      await pgr.abrirAba("Referências")
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).not.toBeChecked()
    })
    test("TST1011 - Validar comportamento ao salvar e reabrir tela", async ({ page, pgr }) => {
      await pgr.clicarCheckboxMaterial("Incluir logotipo na capa")
      await pgr.preencherCadastroValidoESalvar()
      const urlComIdkey = page.url()
      await page.goto(URLS.pgr)
      await page.goto(urlComIdkey)
      await pgr.abrirAba("Referências")
      await expect(page.getByRole("checkbox", { name: "Incluir logotipo na capa" })).toBeChecked()
    })
    test.fixme("TST1012 - Validar mockup anexado no chamado", async ({ page }) => {
      // Esperado: Todos os campos, ordem, comportamento e estados devem estar 100% conforme o modelo
    })
  })

  // Cenários fora da planilha original, achados comparando a EF com o comportamento real
  test.describe("Achados fora da planilha", () => {
    test.fixme("EXTRA1 - Ícone de assistente de IA no campo Observações", async ({ page }) => {
      // ícone "auto_awesome" (revisar/corrigir texto via IA) não documentado em nenhum lugar da EF
    })
    test.fixme("EXTRA2 - Modal 'Gravar/Limpar Configuração' do campo Modelo de documento", async ({ page }) => {
      // EF documenta essa modal (bloqueio de configuração pelo perfil Corporativo); nenhum cenário testa; não aparece neste ambiente
    })
    test.fixme("EXTRA3 - Regras de abrangência hierárquica do catálogo de Modelo de documento", async ({ page }) => {
      // EF documenta regras de abrangência (hierarquia 1/2) sem cenário dedicado na planilha
    })
    test("EXTRA4 - Item '07. Incluir AEP e/ou AET' da EF não está implementado/visível", async ({ page }) => {
      // EF documenta um 7º componente que TST955 já exclui da contagem de 6 — confirmado que não existe no DOM
      const checkbox = page.getByRole("checkbox", { name: /Incluir AEP e\/ou AET/ })
      await expect(checkbox).toHaveCount(0)
    })
    test.fixme("EXTRA5 - Consistência entre Responsável Técnico e múltiplas linhas do GRID de registro conselho", async ({ page }) => {
      // EF diz que profissional com 2+ linhas de registro conselho deve aparecer 1x por linha — sem cenário na planilha
    })
    test.fixme("EXTRA6 - BUG: zeros à esquerda também colapsam o campo 'Expostos - PCDs'", async ({ page }) => {
      // mesmo bug do TST757 — a planilha só tinha esse cenário pra Mulheres/Homens
    })
  })
})
