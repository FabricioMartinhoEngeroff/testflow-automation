// diferente do Vitest (que a gente usava describe/test direto sem importar),
// aqui é outro test runner — o do próprio Playwright — por isso o import
import { test, expect } from "@playwright/test"
import { login } from "../../support/login"
import { abrirNovoCadastroPgr } from "../../support/pgr"

// um arquivo por FUNCIONALIDADE (não por cenário) — igual a aula fez com
// "Criação" agrupando vários testes de todo. Assim, quando formos cobrindo
// mais cenários da planilha real, cada campo/tela vira 1 arquivo com N testes
// dentro, em vez de 650 arquivos de 1 teste cada
test.describe("Cabeçalho (E2E)", () => {
  // beforeEach roda antes de CADA teste deste describe — evita repetir o
  // login em todo "test(...)" que a gente for adicionando aqui dentro.
  // Depois do login cai no "Painel de Indicadores" (dashboard), não direto
  // no cadastro de PGR — por isso o segundo passo, abrindo um cadastro novo
  test.beforeEach(async ({ page }) => {
    await login(page)
    await abrirNovoCadastroPgr(page)
  })

  test.describe("Campo Data Base", () => {
    test("TST244 - Tentar salvar sem preencher a Data Base", async ({ page }) => {
      // Descoberta rodando contra o ambiente real (2026-07-23): o botão
      // "Salvar" NÃO é clicável e depois mostra erro — ele fica DESABILITADO
      // desde o início, enquanto qualquer campo obrigatório (Região,
      // Responsável técnico, Modelo de documento, Vigência do programa,
      // Data base) não estiver preenchido. Com o formulário vazio, isso já
      // cobre a intenção do cenário: "tentar salvar sem preencher a Data
      // Base" resulta em não conseguir salvar de jeito nenhum.
      await expect(page.getByRole("button", { name: "Salvar" })).toBeDisabled()
    })

    test("TST245 - Inserir uma data válida manualmente", async ({ page }) => {
      // Descoberta (2026-07-23): o botão "Salvar" só habilita quando o
      // formulário está "sujo" (alterado) E válido — testar clicando nele
      // exigiria preencher TODOS os outros campos obrigatórios, o que foge
      // do escopo deste teste (que é só sobre o campo Data Base). Por isso
      // testamos o campo isoladamente: preenche e confirma que o valor foi
      // aceito, sem depender do Salvar.
      const campoDataBase = page.getByLabel("Data Base")
      await campoDataBase.fill("15/04/2026")
      await expect(campoDataBase).toHaveValue("15/04/2026")
    })

    test("TST248 - Inserir texto não numérico no campo", async ({ page }) => {
      // AÇÃO: cenário pede um valor claramente inválido (texto em vez de data)
      const campoDataBase = page.getByLabel("Data Base")
      await campoDataBase.fill("abc")

      // ASSERÇÃO: resultado esperado é "bloquear entrada inválida" — TODO:
      // ainda não sabemos se o campo tem máscara que recusa letras (ficando
      // vazio/parcial) ou se aceita e só reclama depois. Rodamos headed pra
      // ver o comportamento real e ajustar esta asserção com base nisso.
      await expect(campoDataBase).not.toHaveValue("abc")
    })
  })
})
