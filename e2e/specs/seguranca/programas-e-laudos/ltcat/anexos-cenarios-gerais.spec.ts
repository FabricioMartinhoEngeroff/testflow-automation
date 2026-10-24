// LTCAT > aba Anexos > Cenários gerais (TST1227-TST1237): combinações de salvar, editar, reordenar e excluir.
import { test, expect } from "@support"
import { ltcatValido } from "@support/data/ltcat"
import {
  abrirEdicaoAnexo,
  arquivoDeTeste,
  arrastarAnexo as arrastar,
  avisoAnexos,
  excluirAnexo,
  incluirAnexo,
  incluirAnexosEmLote,
  MSG_ANEXOS,
  mover,
  nomesDeAnexo as nomes,
  salvarLtcat,
} from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

test.describe("LTCAT - Anexos - cenários gerais", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
    await ltcatCadastroPage.abrirAba("Anexos")
  })

  test("TST1227 - clicar várias vezes em Salvar não duplica o anexo", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    await a.abrirModalAdicionar()
    await m.anexar(arquivoDeTeste("minimo.pdf"))
    await m.descricao.fill("Clique rápido")
    await m.botaoSalvar.click()
    await m.botaoSalvar.click({ timeout: 1000 }).catch(() => {})
    await m.botaoSalvar.click({ timeout: 1000 }).catch(() => {})
    await page.waitForTimeout(1500)
    await expect(a.linhasAnexo.filter({ hasText: "Clique rápido" })).toHaveCount(1)
  })

  test("TST1228 - editar o anexo e não salvar não altera os dados", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    await incluirAnexo(a, m, "Original")
    await abrirEdicaoAnexo(a, m)
    await m.descricao.fill("Alteração descartada")
    await m.botaoFechar.click()
    await page.getByRole("button", { name: "Sair sem salvar" }).click()
    expect(await a.descricoes()).toEqual(["Original"])
  })

  test("TST1229 - reordenar e excluir no mesmo fluxo mantém a consistência", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(180000)
    let esperado = nomes(4)
    await incluirAnexosEmLote(page, a, m, esperado)
    await arrastar(page, a, 0, 2)
    esperado = mover(esperado, 0, 2)
    await expect.poll(() => a.descricoes()).toEqual(esperado)

    await excluirAnexo(a, 1)
    esperado = esperado.filter((_, i) => i !== 1)
    expect(await a.descricoes()).toEqual(esperado)

    await arrastar(page, a, 2, 0)
    esperado = mover(esperado, 2, 0)
    await expect.poll(() => a.descricoes()).toEqual(esperado)
  })

  // Comentado: dois usuários ao mesmo tempo exige duas sessões logadas e a EF não define o tratamento do conflito.
  // test.fixme("TST1230 - excluir item enquanto outro usuário edita", async () => {})

  test("TST1231 - incluir, reordenar e editar sem salvar o LTCAT não corrompe o estado", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(180000)
    const inicial = nomes(3)
    await incluirAnexosEmLote(page, a, m, inicial)
    await arrastar(page, a, 2, 0)
    let esperado = mover(inicial, 2, 0)
    await expect.poll(() => a.descricoes()).toEqual(esperado)

    // o item editado é o que está na linha 1 depois de reordenar
    await abrirEdicaoAnexo(a, m, 1)
    await m.descricao.fill("Editado")
    await m.botaoSalvar.click()
    await expect(m.tituloEdicao).toHaveCount(0)
    esperado = esperado.map((d, i) => (i === 1 ? "Editado" : d))
    expect(await a.descricoes()).toEqual(esperado)
    await expect(a.linhasAnexo).toHaveCount(3)
  })

  test("TST1232 - alterar um anexo e reordenar sem salvar mantém o estado consistente", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(180000)
    const inicial = nomes(3)
    await incluirAnexosEmLote(page, a, m, inicial)
    await abrirEdicaoAnexo(a, m, 0)
    await m.descricao.fill("Alterado")
    await m.botaoSalvar.click()
    await expect(m.tituloEdicao).toHaveCount(0)

    await arrastar(page, a, 0, 2)
    await expect.poll(() => a.descricoes()).toEqual([inicial[1], inicial[2], "Alterado"])
  })

  test("TST1233 - baixa o arquivo e, ao excluir, a linha e o ícone de download saem do grid", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    await incluirAnexo(a, m, "Excluído")
    // antes de excluir o download funciona
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      a.linhasAnexo.first().locator("td.cdk-column-anexo mat-icon", { hasText: "download" }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^minimo.*\.pdf$/i)

    // o download é um blob: do navegador (não dá para consultar o endereço depois);
    // o que o usuário vê é a linha e o ícone de download sumirem
    await excluirAnexo(a, 0)
    await expect(a.linhasAnexo).toHaveCount(0)
    await expect(a.tabela.locator("mat-icon", { hasText: "download" })).toHaveCount(0)
  })

  test("TST1234 - alterar o arquivo e cancelar mantém o arquivo anterior", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    await incluirAnexo(a, m, "Mantém arquivo")
    await abrirEdicaoAnexo(a, m)
    await m.botaoLimparArquivo.click()
    await page.getByRole("button", { name: "Excluir" }).click()
    await m.anexar(arquivoDeTeste("imagem.png"))
    await m.botaoFechar.click()
    await page.getByRole("button", { name: "Sair sem salvar" }).click()
    await expect(a.linhasAnexo.first()).toContainText(/minimo.*\.pdf/i)
    await expect(a.linhasAnexo.first()).not.toContainText(/imagem/i)
  })

  test("TST1235 - dois uploads com o mesmo nome de arquivo ficam como itens distintos", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(120000)
    await incluirAnexo(a, m, "Primeiro")
    await incluirAnexo(a, m, "Segundo")
    expect(await a.descricoes()).toEqual(["Primeiro", "Segundo"])
    // o servidor acrescenta sufixo aleatório, então os nomes exibidos não colidem
    const arquivos = await a.linhasAnexo.locator("td.cdk-column-anexo span").allInnerTexts()
    expect(new Set(arquivos.map((n) => n.trim())).size).toBe(2)
  })

  // cria 1 LTCAT novo no ambiente de homologação (sem rollback)
  test("TST1236 - reordenar e salvar o LTCAT estando em outra aba mantém a ordem", async ({ ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(300000)
    const inicial = nomes(4)
    await c.abrirAba("Referências")
    await c.preencherObrigatorios(ltcatValido)
    await c.preencherConfiguracoesObrigatorias()
    await c.abrirAba("Anexos")
    await incluirAnexosEmLote(page, a, m, inicial)
    await arrastar(page, a, 3, 0)
    const esperado = mover(inicial, 3, 0)
    await expect.poll(() => a.descricoes()).toEqual(esperado)

    await c.abrirAba("Referências")
    await salvarLtcat(c, page)
    await c.abrirAba("Anexos")
    expect(await a.descricoes()).toEqual(esperado)

    await page.reload()
    await c.abrirAba("Anexos")
    expect(await a.descricoes()).toEqual(esperado)
  })
  // TST1237 (mockup, conferência visual) foi descartado.
})
