// Exploração temporária: mesmo LTCAT em duas abas, uma salva primeiro e a outra (desatualizada) tenta salvar depois.
// Limpa no final: remove os colaboradores "Concorrência" e salva.
import { test, expect } from "@support"
import { URLS } from "@support/urls"
import { LtcatCadastroPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro"
import { LtcatColaboradoresPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradores"
import { LtcatColaboradorModal } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradorModal"
import { excluirColaborador, incluirColaborador } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradoresFluxos"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"

test("explorar salvar em duas abas", async ({ login, page, context }) => {
  test.setTimeout(240000)
  await login.entrar()
  const url = `${URLS.ltcatCadastro}?idkey=${IDKEY}`
  const outra = await context.newPage()
  const abas = [page, outra].map((p) => ({ p, c: new LtcatCadastroPage(p), a: new LtcatColaboradoresPage(p), m: new LtcatColaboradorModal(p) }))
  for (const { p, c, a } of abas) {
    await p.goto(url)
    await c.abrirAba("Colaboradores")
    await expect(a.linhasColaborador.first()).toBeVisible()
  }
  const [A, B] = abas

  await incluirColaborador(B.a, B.m, "Concorrência B", "Cargo B")
  await B.c.salvar()
  await B.p.waitForTimeout(3000)
  console.log("B toasts:", await B.p.locator("apls-toast").allTextContents())

  await incluirColaborador(A.a, A.m, "Concorrência A", "Cargo A")
  await A.p.waitForTimeout(1500)
  await A.c.salvar()
  await A.p.waitForTimeout(3000)
  for (const t of await A.p.locator("apls-toast").all()) {
    console.log("A toast:", await t.textContent())
    console.log("A toast cores:", await t.evaluate((e) => [...e.querySelectorAll("*")].map((x) => getComputedStyle(x).backgroundColor).filter((c) => c !== "rgba(0, 0, 0, 0)").join(" ")))
  }
  console.log("A diálogos:", await A.p.getByRole("dialog").allTextContents())
  console.log("A url:", A.p.url())
  await A.p.screenshot({ path: "test-results/explorar-duas-abas-A.png" })

  // conferência e limpeza numa aba recarregada
  await A.p.reload()
  await A.c.abrirAba("Colaboradores")
  await expect(A.a.linhasColaborador.first()).toBeVisible()
  console.log("após reload: B", await A.a.celula("Concorrência B").count(), "A", await A.a.celula("Concorrência A").count())
  let limpou = false
  for (let i = (await A.a.linhasColaborador.count()) - 1; i >= 0; i--) {
    if (/Concorrência/.test((await A.a.linhasColaborador.nth(i).textContent()) ?? "")) {
      await excluirColaborador(A.p, A.a, i)
      limpou = true
    }
  }
  if (limpou) {
    await A.c.salvar()
    await expect(A.c.mensagemSalvoComSucesso).toBeVisible({ timeout: 20000 })
  }
  console.log("limpeza:", limpou ? "feita" : "nada a limpar")
})
