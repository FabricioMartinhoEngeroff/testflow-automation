// Script de carga: cria 10 LTCATs válidos, cada um com uma Unidade diferente
// da região 71 - CURITIBA. Os textos levam o número e a unidade para
// identificá-los na lista depois.
// Rodar com: npm run test:e2e:scripts -- criar-10-ltcats-unidades
import { test, expect } from "../support"
import { ltcatValido } from "../support/data/ltcat"

const UNIDADES = ["711001", "711005", "711019", "711021", "711039", "711040", "711042", "711052", "711053", "711066"]

test.describe("criar 10 LTCATs com unidades diferentes", () => {
  test.setTimeout(120000)

  UNIDADES.forEach((unidade, i) => {
    const n = i + 1
    test(`LTCAT ${n}/${UNIDADES.length} - unidade ${unidade}`, async ({ login, ltcatCadastroPage: cadastro, page }) => {
      await login.entrar()
      await cadastro.abrir()
      await cadastro.preencherObrigatorios({
        ...ltcatValido,
        unidade,
        avaliacaoRealizadaEm: `Carga unidade ${unidade} (${n}/${UNIDADES.length})`,
        condicoesOperacionais: `Condições operacionais da carga unidade ${unidade}`,
      })
      await cadastro.preencherConfiguracoesObrigatorias(n % 2 === 0 ? "q3" : "q5")
      await cadastro.salvar()
      await expect(cadastro.mensagemSalvoComSucesso).toBeVisible()
      console.log(`LTCAT ${n} unidade ${unidade} salvo:`, page.url())
    })
  })
})
