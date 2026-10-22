// LTCAT > aba Anexos > Ordenação (TST1201-TST1208): ordem de inserção e reordenação por arrastar (ícone "Ordenar").
// Os anexos entram em lote pela modal ("Salvar e adicionar outro", sem fechar e reabrir a cada um).
import type { Page } from "@playwright/test"
import { test, expect } from "../../../../../support"
import { ltcatValido } from "../../../../../support/data/ltcat"
import {
  arrastarAnexo as arrastar,
  incluirAnexosEmLote,
  mover,
  nomesDeAnexo as nomes,
  salvarLtcat,
} from "../../../../../support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

test.describe("LTCAT - Anexos - Ordenação", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
    await ltcatCadastroPage.abrirAba("Anexos")
  })

  test("TST1201 - anexos inseridos em sequência seguem a ordem de inserção", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(180000)
    const esperado = nomes(10)
    await incluirAnexosEmLote(page, a, m, esperado)
    expect(await a.descricoes()).toEqual(esperado)
  })

  test("TST1202 - soltar o item em nova posição atualiza a ordem visual", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(180000)
    const inicial = nomes(5)
    await incluirAnexosEmLote(page, a, m, inicial)
    await arrastar(page, a, 0, 2)
    await expect.poll(() => a.descricoes()).toEqual(mover(inicial, 0, 2))
  })

  test("TST1205 - reordenar várias vezes mantém a consistência", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(240000)
    let esperado = nomes(6)
    await incluirAnexosEmLote(page, a, m, esperado)
    for (const [de, para] of [[0, 3], [4, 1], [5, 0], [2, 4]]) {
      const antes = esperado
      esperado = mover(esperado, de, para)
      // às vezes o arrasto simulado não é reconhecido e a grade fica intacta: repete só nesse caso.
      // Se a ordem mudar para algo diferente do esperado, falha na hora.
      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        await arrastar(page, a, de, para)
        const atual = await a.descricoes()
        if (JSON.stringify(atual) !== JSON.stringify(antes)) break
      }
      await expect.poll(() => a.descricoes()).toEqual(esperado)
    }
  })

  test("TST1206 - reordenar rápido várias linhas não quebra nem perde itens", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(240000)
    const inicial = nomes(8)
    await incluirAnexosEmLote(page, a, m, inicial)
    for (const [de, para] of [[0, 4], [7, 2], [3, 6], [1, 5], [6, 0], [2, 7]]) await arrastar(page, a, de, para)

    // sem esperar entre os arrastos o resultado exato depende do tempo; o que não pode mudar é o conjunto
    await expect(a.linhasAnexo).toHaveCount(inicial.length)
    const final = await a.descricoes()
    expect([...final].sort()).toEqual(inicial)
    await expect(page.locator("apls-toast")).toHaveCount(0)
  })

  test("TST1208 - reordenar com 100 anexos mantém a ordem correta e a performance", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.setTimeout(900000)
    let esperado = nomes(100)
    await incluirAnexosEmLote(page, a, m, esperado)
    expect(await a.descricoes()).toEqual(esperado)

    for (const [de, para] of [[2, 6], [50, 47], [97, 94]]) {
      const inicio = Date.now()
      await arrastar(page, a, de, para)
      esperado = mover(esperado, de, para)
      await expect.poll(() => a.descricoes()).toEqual(esperado)
      expect(Date.now() - inicio, `arrasto ${de}->${para}`).toBeLessThan(10000)
    }
    await expect(a.linhasAnexo).toHaveCount(100)
  })

  // BUG (a confirmar com o time): a grade tem altura fixa e rolagem própria. Com ~50 anexos, ao arrastar uma linha
  // para fora da parte visível a lista não rola sozinha (sem autoscroll) e a linha é solta na primeira posição VISÍVEL
  // (~41), não na 1. Girar a roda durante o arrasto rola a lista, mas a posição de soltura continua errada.
  // Remover o test.fail quando corrigirem.
  test("TST1208 - [bug] arrastar a última linha para a primeira com 50 anexos", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    test.fail(true, "a grade não rola sozinha durante o arrasto: a linha não chega à primeira posição")
    test.setTimeout(900000)
    const lista = nomes(50)
    await incluirAnexosEmLote(page, a, m, lista)

    const contenedor = page.locator("apollus-ngx-ivy-ltcat-aba-anexos .apls-page-table")
    const caixa = (await contenedor.boundingBox())!
    await contenedor.evaluate((el) => (el.scrollTop = el.scrollHeight))
    await page.waitForTimeout(500)
    const alca = a.linhasAnexo.nth(49).locator("mat-icon", { hasText: "open_with" })
    const origem = (await alca.boundingBox())!
    const x = origem.x + origem.width / 2
    const yTopo = caixa.y + 8

    await page.mouse.move(x, origem.y + origem.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 30; i++) {
      await page.mouse.move(x, origem.y + ((yTopo - origem.y) * i) / 30)
      await page.waitForTimeout(25)
    }
    // segura o ponteiro na borda de cima, como uma pessoa esperando a lista rolar
    for (let t = 0; t < 40; t++) {
      await page.mouse.move(x, yTopo + (t % 2))
      await page.waitForTimeout(150)
    }
    await page.mouse.up()
    await page.waitForTimeout(1000)

    expect((await a.descricoes())[0]).toBe(lista[49])
  })

  // cada teste abaixo cria 1 LTCAT novo no ambiente de homologação (sem rollback)
  test.describe("Persistência (salva o LTCAT)", () => {
    test("TST1203/TST1204 - ordem reordenada persiste ao salvar e ao reabrir o cadastro", async ({ ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(300000)
      const inicial = nomes(5)
      await c.abrirAba("Referências")
      await c.preencherObrigatorios(ltcatValido)
      await c.preencherConfiguracoesObrigatorias()
      await c.abrirAba("Anexos")
      await incluirAnexosEmLote(page, a, m, inicial)
      await arrastar(page, a, 4, 1)
      const esperado = mover(inicial, 4, 1)
      await expect.poll(() => a.descricoes()).toEqual(esperado)

      await salvarLtcat(c, page)
      // logo depois de salvar a grade é recarregada e fica vazia por instantes
      await expect.poll(() => a.descricoes()).toEqual(esperado)

      // reabre pela URL, como um acesso novo ao cadastro
      const url = page.url()
      await page.goto(url)
      await c.abrirAba("Anexos")
      expect(await a.descricoes()).toEqual(esperado)
    })

    test("TST1207 - reordenar e sair sem salvar volta à ordem anterior", async ({ ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(300000)
      const inicial = nomes(4)
      await c.abrirAba("Referências")
      await c.preencherObrigatorios(ltcatValido)
      await c.preencherConfiguracoesObrigatorias()
      await c.abrirAba("Anexos")
      await incluirAnexosEmLote(page, a, m, inicial)
      await salvarLtcat(c, page)
      const url = page.url()

      await arrastar(page, a, 0, 3)
      await expect.poll(() => a.descricoes()).toEqual(mover(inicial, 0, 3))
      await c.botaoVoltar.click()
      await page.getByRole("button", { name: "Sair sem salvar" }).click()

      await page.goto(url)
      await c.abrirAba("Anexos")
      expect(await a.descricoes()).toEqual(inicial)
    })
  })
})
