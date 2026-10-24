// Exploração: quando a modal de anexo pede confirmação ao clicar em "Fechar"? (LTCAT novo, nada é salvo)
import { test } from "@support"
import { arquivoDeTeste, incluirAnexo } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

test("confirmação ao fechar", async ({ login, ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
  test.setTimeout(300000)
  await login.entrar()
  await c.abrir()
  await c.abrirAba("Anexos")

  const confirmacao = page.getByRole("button", { name: "Sair sem salvar" })
  const fechar = async (rotulo: string) => {
    await m.botaoFechar.click()
    await page.waitForTimeout(1200)
    const pediu = await confirmacao.isVisible().catch(() => false)
    console.log(`${rotulo}: ${pediu ? "PEDE confirmação" : "fecha direto"}`)
    if (pediu) await confirmacao.click()
    await page.waitForTimeout(500)
  }

  // inclusão
  await a.abrirModalAdicionar()
  await fechar("inclusão sem alterar nada")

  await a.abrirModalAdicionar()
  await m.anexar(arquivoDeTeste("minimo.pdf"))
  await page.waitForTimeout(2500)
  await fechar("inclusão só com arquivo")

  await a.abrirModalAdicionar()
  await m.descricao.fill("só descrição")
  await fechar("inclusão só com descrição")

  await a.abrirModalAdicionar()
  await m.anexar(arquivoDeTeste("minimo.pdf"))
  await page.waitForTimeout(2500)
  await m.descricao.fill("arquivo e descrição")
  await fechar("inclusão com arquivo e descrição")

  // edição
  await incluirAnexo(a, m, "Para editar")
  await expectEdit(a, m, page)
  await fechar("edição sem alterar nada")

  await expectEdit(a, m, page)
  await m.descricao.fill("Para editar - alterada")
  await fechar("edição alterando a descrição")

  await expectEdit(a, m, page)
  await m.descricao.fill("Para editar - alterada")
  await m.descricao.fill("Para editar")
  await fechar("edição alterando e voltando ao valor original")
})

async function expectEdit(a: import("@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexos").LtcatAnexosPage, m: import("@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexoModal").LtcatAnexoModal, page: import("@playwright/test").Page) {
  for (let i = 0; i < 5; i++) {
    await a.botaoEditar(0).click()
    if (await m.tituloEdicao.isVisible({ timeout: 1500 }).catch(() => false)) return
    await page.waitForTimeout(300)
  }
}
