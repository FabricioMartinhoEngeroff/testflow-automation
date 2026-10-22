// Exploração: depois de reordenar os anexos por arrastar, o ícone Editar de cada linha abre a modal certa?
// (TST1231 falhou ao editar a linha 1 depois de arrastar a linha 2 para o topo.)
import { test } from "../support"
import {
  arrastarAnexo,
  incluirAnexosEmLote,
  nomesDeAnexo,
} from "../support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

test("editar depois de reordenar", async ({ login, ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
  test.setTimeout(300000)
  await login.entrar()
  await c.abrir()
  await c.abrirAba("Anexos")
  await incluirAnexosEmLote(page, a, m, nomesDeAnexo(3))
  console.log("inicial:", await a.descricoes())

  await arrastarAnexo(page, a, 2, 0)
  await page.waitForTimeout(1000)
  console.log("depois do arrasto:", await a.descricoes())

  for (const linha of [0, 1, 2]) {
    // move o mouse para longe antes, para o tooltip do "Ordenar" sumir
    await page.mouse.move(640, 600)
    await page.waitForTimeout(600)
    await a.botaoEditar(linha).click()
    await page.waitForTimeout(2500)
    const abriu = await m.tituloEdicao.isVisible().catch(() => false)
    const desc = abriu ? await m.descricao.inputValue() : "-"
    console.log(`editar linha ${linha}: modal ${abriu ? "abriu" : "NÃO abriu"} | descrição na modal: ${desc}`)
    if (abriu) {
      await m.botaoFechar.click()
      await page.waitForTimeout(800)
    }
  }
})
