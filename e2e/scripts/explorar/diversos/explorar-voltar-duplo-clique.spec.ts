// Exploração temporária do TST1399: um duplo clique real no Voltar (com alteração) sai sem salvar? Mede por intervalo entre os 2 cliques.
import { test } from "@support"
import { ltcatValido } from "@support/data/ltcat"

const INTERVALOS_MS = [0, 100, 200, 300, 500, 800]
const TENTATIVAS = 3

test("explorar duplo clique no Voltar", async ({ login, ltcatCadastroPage: c, page }) => {
  test.setTimeout(600000)
  await login.entrar()

  const tentar = async (intervalo: number) => {
    await c.abrir()
    await c.selecionarOpcao(c.regiao, ltcatValido.regiao)
    await page.keyboard.press("Escape")
    const caixa = (await c.botaoVoltar.boundingBox())!
    const [x, y] = [caixa.x + caixa.width / 2, caixa.y + caixa.height / 2]
    // intervalo 0 = dblclick nativo do navegador; os outros = dois cliques no mesmo ponto
    if (intervalo === 0) await page.mouse.dblclick(x, y)
    else {
      await page.mouse.click(x, y)
      await page.waitForTimeout(intervalo)
      await page.mouse.click(x, y)
    }
    await page.waitForTimeout(1500)
    const saiu = !(await c.titulo.isVisible())
    if (!saiu) await c.botaoConfirmacaoSaida("Sair sem salvar").click().catch(() => {})
    return saiu
  }

  // controle: com 1 clique só a confirmação tem que abrir, senão o script não vale
  for (let i = 0; i < TENTATIVAS; i++) {
    await c.abrir()
    await c.selecionarOpcao(c.regiao, ltcatValido.regiao)
    await page.keyboard.press("Escape")
    await c.botaoVoltar.click()
    await page.waitForTimeout(1500)
    console.log(`controle 1 clique: confirmação abriu = ${await c.confirmacaoSaida.isVisible()} | ainda no cadastro = ${await c.titulo.isVisible()}`)
    await c.botaoConfirmacaoSaida("Sair sem salvar").click().catch(() => {})
  }

  for (const intervalo of INTERVALOS_MS) {
    const resultados: boolean[] = []
    for (let i = 0; i < TENTATIVAS; i++) resultados.push(await tentar(intervalo))
    console.log(`intervalo ${intervalo}ms: saiu sem perguntar em ${resultados.filter(Boolean).length}/${TENTATIVAS}`)
  }
})
