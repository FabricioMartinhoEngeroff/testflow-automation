// LTCAT > aba Anexos > Botões do grid (TST1209-TST1221): editar e excluir por linha.
import { test, expect } from "@support"
import {
  abrirEdicaoAnexo,
  avisoAnexos,
  excluirAnexo,
  incluirAnexo,
  MSG_ANEXOS,
} from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

test.describe("LTCAT - Anexos - botões do grid", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
    await ltcatCadastroPage.abrirAba("Anexos")
  })

  test.describe("Editar", () => {
    test("TST1209 - Editar aparece em todas as linhas, com tooltip 'Editar'", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(120000)
      for (const d of ["Um", "Dois", "Três"]) await incluirAnexo(page, a, m, d)
      for (let i = 0; i < 3; i++) {
        const icone = a.botaoEditar(i)
        await expect(icone).toBeVisible()
        const id = await icone.getAttribute("aria-describedby")
        await expect(page.locator(`#${id}`)).toHaveText("Editar")
      }
    })

    test("TST1210 - clicar em Editar abre a modal com os dados preenchidos", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Dados da edição", "imagem.png")
      await abrirEdicaoAnexo(a, m)
      await expect(m.descricao).toHaveValue("Dados da edição")
      await expect(m.nomeDoArquivo).toContainText(/imagem.*\.png/i)
    })

    test("TST1211 - editar e salvar atualiza o grid", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Antes")
      await abrirEdicaoAnexo(a, m)
      await m.descricao.fill("Depois")
      await m.botaoSalvar.click()
      await expect(m.tituloEdicao).toHaveCount(0)
      expect(await a.descricoes()).toEqual(["Depois"])
      await expect(a.linhasAnexo).toHaveCount(1)
    })
  })

  test.describe("Excluir", () => {
    test("TST1212 - Excluir aparece em todas as linhas, com tooltip 'Excluir'", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(120000)
      for (const d of ["Um", "Dois", "Três"]) await incluirAnexo(page, a, m, d)
      for (let i = 0; i < 3; i++) {
        const icone = a.botaoExcluir(i)
        await expect(icone).toBeVisible()
        const id = await icone.getAttribute("aria-describedby")
        await expect(page.locator(`#${id}`)).toHaveText("Excluir")
      }
    })

    test("TST1213 - clicar em Excluir abre a modal de confirmação", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Confirmar")
      await a.botaoExcluir(0).click()
      await expect(a.popupExclusao).toBeVisible()
    })

    test("TST1214 - texto da modal de exclusão", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Texto")
      await a.botaoExcluir(0).click()
      await expect(a.popupExclusao).toContainText("Deseja realmente excluir este item?")
    })

    test("TST1215 - botão Excluir da confirmação está em destaque", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Destaque")
      await a.botaoExcluir(0).click()
      await expect(a.popupExclusao.getByRole("button", { name: "Excluir" })).toHaveClass(/mat-primary/)
      await expect(a.popupExclusao.getByRole("button", { name: "Fechar" })).toHaveClass(/mat-secondary/)
    })

    test("TST1216 - Fechar na confirmação não exclui", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Não exclui")
      await a.botaoExcluir(0).click()
      await a.popupExclusao.getByRole("button", { name: "Fechar" }).click()
      await expect(a.popupExclusao).toHaveCount(0)
      expect(await a.descricoes()).toEqual(["Não exclui"])
    })

    test("TST1217 - confirmar remove o item e emite [info_excluir]", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Vai sair")
      await excluirAnexo(a, 0)
      await avisoAnexos(page, MSG_ANEXOS.excluido)
      await expect(a.linhasAnexo).toHaveCount(0)
    })

    test("TST1218 - o item some do grid na hora, sem recarregar", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(120000)
      for (const d of ["Fica", "Some"]) await incluirAnexo(page, a, m, d)
      await a.botaoExcluir(1).click()
      await a.popupExclusao.getByRole("button", { name: "Excluir" }).click()
      // sem polling longo: o grid atualiza junto com o fechamento da confirmação
      await expect(a.linhasAnexo).toHaveCount(1, { timeout: 2000 })
      expect(await a.descricoes()).toEqual(["Fica"])
    })

    test("TST1219 - exclusão sequencial de vários itens", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(150000)
      for (const d of ["A", "B", "C", "D"]) await incluirAnexo(page, a, m, d)
      await excluirAnexo(a, 0)
      expect(await a.descricoes()).toEqual(["B", "C", "D"])
      await excluirAnexo(a, 1)
      expect(await a.descricoes()).toEqual(["B", "D"])
      await excluirAnexo(a, 1)
      expect(await a.descricoes()).toEqual(["B"])
    })

    test("TST1220 - excluir o último item deixa o grid vazio", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Único")
      await excluirAnexo(a, 0)
      await expect(a.linhasAnexo).toHaveCount(0)
      await expect(a.semRegistros).toBeVisible()
    })

    test("TST1221 - excluir e incluir em sequência mantém a consistência", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(150000)
      for (const d of ["Primeiro", "Segundo"]) await incluirAnexo(page, a, m, d)
      await excluirAnexo(a, 0)
      await incluirAnexo(page, a, m, "Terceiro")
      expect(await a.descricoes()).toEqual(["Segundo", "Terceiro"])
      await excluirAnexo(a, 1)
      await incluirAnexo(page, a, m, "Quarto")
      expect(await a.descricoes()).toEqual(["Segundo", "Quarto"])
      await expect(a.semRegistros).toHaveCount(0)
    })
  })
})
