// Exploração: arrastos seguidos na grade de anexos. O 2º arrasto (subir a linha 4 para a 1) do TST1205 não acontecia.
// Compara o arrasto rápido do helper com um arrasto "humano" (pausas entre os movimentos do mouse).
import type { Page } from "@playwright/test"
import { test } from "@support"
import type { LtcatAnexosPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexos"
import {
  arrastarAnexo,
  incluirAnexosEmLote,
  mover,
  nomesDeAnexo,
} from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

const SEQUENCIAS: [number, number][] = [[0, 3], [4, 1], [5, 0], [2, 4]]

// movimento em passos pequenos com pausa entre eles, como uma pessoa arrastando
const arrastarHumano = async (page: Page, a: LtcatAnexosPage, de: number, para: number) => {
  const alca = a.linhasAnexo.nth(de).locator("mat-icon", { hasText: "open_with" })
  await alca.scrollIntoViewIfNeeded()
  const o = (await alca.boundingBox())!
  const d = (await a.linhasAnexo.nth(para).boundingBox())!
  const x = o.x + o.width / 2
  const y0 = o.y + o.height / 2
  const y1 = d.y + d.height / 2
  await page.mouse.move(x, y0)
  await page.mouse.down()
  const passos = 30
  for (let i = 1; i <= passos; i++) {
    await page.mouse.move(x, y0 + ((y1 - y0) * i) / passos)
    await page.waitForTimeout(25)
  }
  await page.waitForTimeout(200)
  await page.mouse.up()
  await page.waitForTimeout(800)
  await page.mouse.move(640, 650)
}

test("arrastos seguidos", async ({ login, ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
  test.setTimeout(400000)
  await login.entrar()
  await c.abrir()
  await c.abrirAba("Anexos")
  await incluirAnexosEmLote(page, a, m, nomesDeAnexo(6))

  const variantes: [string, typeof arrastarAnexo | typeof arrastarHumano][] = [
    ["helper rápido", arrastarAnexo],
    ["humano", arrastarHumano],
  ]
  for (const [nome, arrastar] of variantes) {
    console.log(`--- ${nome} ---`)
    for (const [de, para] of SEQUENCIAS) {
      const antes = await a.descricoes()
      await arrastar(page, a, de, para)
      await page.waitForTimeout(800)
      const depois = await a.descricoes()
      const previsto = mover(antes, de, para)
      const ok = JSON.stringify(depois) === JSON.stringify(previsto)
      const mudou = JSON.stringify(depois) !== JSON.stringify(antes)
      console.log(`${de}->${para}: ${ok ? "OK" : mudou ? "MUDOU DIFERENTE" : "NÃO MUDOU"} | ${depois.map((d) => d.slice(-3)).join(",")}`)
    }
  }
})
