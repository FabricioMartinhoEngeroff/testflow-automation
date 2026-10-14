// Script de carga: cria 5 LTCATs válidos (Curitiba, vigência 01/10 a 31/10/2026),
// alternando o fator de troca q3/q5. Os textos levam o número do cadastro
// ("Carga LTCAT 1/5") para identificá-los na lista depois.
// Rodar com: npm run test:e2e:scripts -- criar-5-ltcats
import { test, expect } from "../support"
import { ltcatValido } from "../support/data/ltcat"

const TOTAL = 5

test.describe("criar 5 LTCATs", () => {
  test.setTimeout(120000)

  for (let n = 1; n <= TOTAL; n++) {
    test(`LTCAT ${n}/${TOTAL}`, async ({ login, ltcatCadastroPage: cadastro, page }) => {
      await login.entrar()
      await cadastro.abrir()
      await cadastro.preencherObrigatorios({
        ...ltcatValido,
        avaliacaoRealizadaEm: `Carga LTCAT ${n}/${TOTAL}`,
        condicoesOperacionais: `Condições operacionais da carga LTCAT ${n}/${TOTAL}`,
      })
      await cadastro.preencherConfiguracoesObrigatorias(n % 2 === 0 ? "q3" : "q5")
      await cadastro.salvar()
      await expect(cadastro.mensagemSalvoComSucesso).toBeVisible()
      console.log(`LTCAT ${n}/${TOTAL} salvo:`, page.url())
    })
  }
})
